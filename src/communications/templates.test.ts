import { describe, expect, it, beforeEach } from "vitest";
import { getBoard, sendMessage } from "../candidatesStore";
import { memoryStorage } from "../memoryStore";
import {
  DEFAULT_PIPELINE_STAGES,
  renderTemplate,
  type TemplateValues,
} from "../types";
import {
  MESSAGE_TEMPLATES,
  scopedStageIds,
  templateById,
  templatesForStage,
} from "./templates";

const VALUES: TemplateValues = {
  candidate_name: "Priya Nair",
  job_title: "Senior Backend Engineer",
  company: "Conte",
  sender_name: "Alex Smith",
  stage: "Applied",
};

describe("renderTemplate", () => {
  it("fills known tokens", () => {
    expect(renderTemplate("Hi {{candidate_name}}, re {{job_title}}", VALUES)).toBe(
      "Hi Priya Nair, re Senior Backend Engineer",
    );
  });

  it("leaves unknown tokens visible rather than blanking them", () => {
    expect(renderTemplate("Hi {{nope}}", VALUES)).toBe("Hi {{nope}}");
  });

  it("fills every token in the shipped templates", () => {
    for (const template of MESSAGE_TEMPLATES) {
      const rendered = renderTemplate(template.body, VALUES);
      expect(rendered, `${template.id} left a token unfilled`).not.toMatch(/\{\{/);
    }
  });
});

describe("templatesForStage", () => {
  it("offers the stage's own templates before the stage-agnostic ones", () => {
    const applied = templatesForStage("applied");
    expect(applied.length).toBeGreaterThan(1);
    expect(applied[0].scope).not.toBe("all");
    expect(applied[applied.length - 1].scope).toBe("all");
  });

  it("gives every default stage something to send", () => {
    for (const stage of DEFAULT_PIPELINE_STAGES) {
      expect(templatesForStage(stage.id).length, stage.id).toBeGreaterThan(0);
    }
  });

  it("offers a rejection at the applied stage and an offer at the offered stage", () => {
    expect(templatesForStage("applied").some((t) => t.intent === "reject")).toBe(true);
    expect(templatesForStage("offered").some((t) => t.intent === "offer")).toBe(true);
  });

  it("does not offer the offer template to a candidate who just applied", () => {
    expect(templatesForStage("applied").some((t) => t.intent === "offer")).toBe(false);
  });

  it("falls back to the stage-agnostic set for a custom stage", () => {
    const custom = templatesForStage("stage-made-up-by-a-recruiter");
    expect(custom.length).toBeGreaterThan(0);
    expect(custom.every((t) => t.scope === "all")).toBe(true);
  });

  it("only scopes to stages that exist", () => {
    const known = new Set(DEFAULT_PIPELINE_STAGES.map((s) => s.id));
    for (const id of scopedStageIds()) expect(known.has(id), id).toBe(true);
  });

  it("templateById round-trips", () => {
    expect(templateById(MESSAGE_TEMPLATES[0].id)?.name).toBe(MESSAGE_TEMPLATES[0].name);
    expect(templateById("nope")).toBeNull();
  });

  it("has unique template ids", () => {
    const ids = MESSAGE_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("sendMessage", () => {
  beforeEach(() => {
    memoryStorage.clear();
  });

  it("files the rendered message and logs it on the timeline", () => {
    const board = getBoard("job-1");
    const candidate = board.candidates[0];
    const template = templatesForStage(candidate.stageId)[0];

    const next = sendMessage("job-1", candidate.id, template, VALUES);
    const updated = next.candidates.find((c) => c.id === candidate.id)!;

    expect(updated.messages).toHaveLength(1);
    expect(updated.messages![0].templateId).toBe(template.id);
    expect(updated.messages![0].body).not.toMatch(/\{\{/);
    expect(updated.messages![0].body).toContain(VALUES.candidate_name);
    expect(updated.timeline.at(-1)?.label).toContain(template.name);
  });

  it("leaves every other candidate untouched", () => {
    const board = getBoard("job-1");
    const [first, second] = board.candidates;
    const template = templatesForStage(first.stageId)[0];

    const next = sendMessage("job-1", first.id, template, VALUES);
    const other = next.candidates.find((c) => c.id === second.id)!;

    expect(other.messages ?? []).toHaveLength(0);
  });

  it("appends rather than replacing on a second send", () => {
    const board = getBoard("job-1");
    const candidate = board.candidates[0];
    const [a, b] = templatesForStage(candidate.stageId);

    sendMessage("job-1", candidate.id, a, VALUES);
    const next = sendMessage("job-1", candidate.id, b, VALUES);

    expect(next.candidates.find((c) => c.id === candidate.id)!.messages).toHaveLength(2);
  });
});
