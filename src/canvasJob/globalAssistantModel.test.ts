import { describe, expect, it } from "vitest";
import { createDraft } from "../types";
import { baseFunnel, templateFunnel } from "./funnelModel";
import { globalDemoReply } from "./globalAssistantModel";

describe("global assistant scripted demo", () => {
  it("previews an illustrative pipeline without changing nodes, links, positions or role fields", () => {
    const draft = createDraft();
    draft.fields.designation = { value: "Designer", source: "user" };
    const items = templateFunnel("Designer");
    items[0].position = { x: 75, y: 300 };
    items[0].collapsed = true;
    const before = structuredClone({ items, draft });
    const reply = globalDemoReply("Build a hiring pipeline", items, draft);
    expect(reply).toContain("Portfolio walkthrough");
    expect(reply).toContain("Design review");
    expect({ items, draft }).toEqual(before);
    expect(globalDemoReply("Build a hiring pipeline", items, draft)).toBe(reply);
  });

  it("reviews the whole canvas including hidden descendants", () => {
    const draft = createDraft();
    const items = templateFunnel("Engineer");
    items[0].collapsed = true;
    const reply = globalDemoReply("Review the whole journey", items, draft);
    expect(reply).toContain(`${items.length} nodes, 3 hiring stages and 2 interview rounds`);
    expect(reply).toContain("Job title, Role type, Location, Basic requirements");
    expect(reply).toContain("Prospects, Pipeline, Interview process");
  });

  it("acknowledges a role description without extracting or saving it", () => {
    const draft = createDraft();
    const items = baseFunnel();
    const before = structuredClone({ items, draft });
    const reply = globalDemoReply("Senior designer, Remote, full-time", items, draft);
    expect(reply).toContain("location, experience level and must-have skills");
    expect({ items, draft }).toEqual(before);
  });

  it("offers useful follow-up prompts and accurately describes an empty journey", () => {
    const draft = createDraft();
    const items = baseFunnel();
    const reply = globalDemoReply("Hello", items, draft);
    expect(globalDemoReply("Review workflow", items, draft)).toContain("1 node, 0 hiring stages and 0 interview rounds");
    expect(reply).toContain("Build pipeline");
    expect(reply).toContain("Review workflow");
    expect(globalDemoReply("Check the journey", items, draft)).toContain("There are no hiring stages");
  });
});
