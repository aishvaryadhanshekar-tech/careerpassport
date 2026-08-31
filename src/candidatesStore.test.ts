import { beforeEach, describe, expect, it } from "vitest";
import {
  addNote,
  addStage,
  bulkMoveCandidates,
  bulkSendMessage,
  countsByStage,
  getBoard,
  getCandidate,
  moveCandidate,
  parseMentions,
  removeStage,
  renameStage,
  sendMessage,
  setRating,
  setTripStatus,
  toggleTag,
} from "./candidatesStore";
import { memoryStorage } from "./memoryStore";
import { ARCHIVE_STAGE_ID, flagForScore, type MessageTemplate, type TemplateValues } from "./types";

const JOB = "job-1";

beforeEach(() => {
  memoryStorage.clear();
});

describe("getBoard", () => {
  it("seeds default stages and candidates on first access", () => {
    const board = getBoard(JOB);
    expect(board.stages.map((s) => s.id)).toEqual([
      "applied",
      "screened",
      "submitted",
      "interviewing",
      "offered",
      "archive",
    ]);
    expect(board.candidates.length).toBe(8);
  });

  it("returns the same board on subsequent access", () => {
    const first = getBoard(JOB);
    moveCandidate(JOB, first.candidates[0].id, "screened");
    expect(getBoard(JOB).candidates[0].stageId).toBe("screened");
  });

  it("keeps boards separate per job", () => {
    moveCandidate(JOB, "cand-priya", "offered");
    expect(getCandidate("job-2", "cand-priya")?.stageId).toBe("applied");
  });
});

describe("moveCandidate", () => {
  it("moves the candidate and records a timeline event", () => {
    const before = getCandidate(JOB, "cand-priya")!;
    moveCandidate(JOB, "cand-priya", "screened");
    const after = getCandidate(JOB, "cand-priya")!;
    expect(after.stageId).toBe("screened");
    expect(after.timeline.length).toBe(before.timeline.length + 1);
    const last = after.timeline[after.timeline.length - 1];
    expect(last.label).toBe("Moved to Screened");
    expect(last.detail).toBe("Applied → Screened");
  });

  it("is a no-op when the candidate is already in that stage", () => {
    const before = getCandidate(JOB, "cand-priya")!;
    moveCandidate(JOB, "cand-priya", "applied");
    const after = getCandidate(JOB, "cand-priya")!;
    expect(after.timeline.length).toBe(before.timeline.length);
  });

  it("ignores an unknown stage", () => {
    moveCandidate(JOB, "cand-priya", "nope");
    expect(getCandidate(JOB, "cand-priya")?.stageId).toBe("applied");
  });
});

describe("stages", () => {
  it("inserts a new stage before Archive", () => {
    const board = addStage(JOB, "Client Debrief");
    const ids = board.stages.map((s) => s.id);
    expect(ids[ids.length - 1]).toBe(ARCHIVE_STAGE_ID);
    expect(board.stages[board.stages.length - 2].label).toBe("Client Debrief");
    expect(board.stages[board.stages.length - 2].removable).toBe(true);
  });

  it("ignores a blank stage label", () => {
    const before = getBoard(JOB).stages.length;
    expect(addStage(JOB, "   ").stages.length).toBe(before);
  });

  it("will not remove a default stage", () => {
    const board = removeStage(JOB, "applied");
    expect(board.stages.some((s) => s.id === "applied")).toBe(true);
  });

  it("relocates candidates when a custom stage is removed", () => {
    const added = addStage(JOB, "Client Debrief");
    const custom = added.stages.find((s) => s.label === "Client Debrief")!;
    moveCandidate(JOB, "cand-priya", custom.id);
    expect(getCandidate(JOB, "cand-priya")?.stageId).toBe(custom.id);

    removeStage(JOB, custom.id);
    const moved = getCandidate(JOB, "cand-priya")!;
    expect(moved.stageId).toBe("applied");
    expect(moved.timeline[moved.timeline.length - 1].label).toBe("Stage removed");
  });

  it("renames a stage", () => {
    const board = renameStage(JOB, "screened", "Phone Screen");
    expect(board.stages.find((s) => s.id === "screened")?.label).toBe("Phone Screen");
  });
});

describe("trip status", () => {
  it("records sent time and a timeline event", () => {
    setTripStatus(JOB, "cand-priya", "sent");
    const c = getCandidate(JOB, "cand-priya")!;
    expect(c.tripStatus).toBe("sent");
    expect(typeof c.tripSentAt).toBe("number");
    expect(c.timeline[c.timeline.length - 1].label).toBe("Trip sent");
  });

  it("assigns a score and a matching flag on completion", () => {
    setTripStatus(JOB, "cand-priya", "completed");
    const c = getCandidate(JOB, "cand-priya")!;
    expect(c.tripScore).toBeGreaterThanOrEqual(45);
    expect(c.tripScore).toBeLessThanOrEqual(95);
    expect(c.aiFlag).toBe(flagForScore(c.tripScore!));
  });

  it("gives the same candidate the same score every time", () => {
    setTripStatus(JOB, "cand-priya", "completed");
    const first = getCandidate(JOB, "cand-priya")!.tripScore;
    memoryStorage.clear();
    setTripStatus(JOB, "cand-priya", "completed");
    expect(getCandidate(JOB, "cand-priya")!.tripScore).toBe(first);
  });
});

describe("flagForScore", () => {
  it("uses 75 and 55 as the boundaries", () => {
    expect(flagForScore(75)).toBe("recommended");
    expect(flagForScore(74)).toBe("borderline");
    expect(flagForScore(55)).toBe("borderline");
    expect(flagForScore(54)).toBe("hold");
  });
});

describe("ratings, tags and notes", () => {
  it("clamps ratings to 1-5 and replaces rather than appends", () => {
    setRating(JOB, "cand-priya", "crit-1", 9);
    expect(getCandidate(JOB, "cand-priya")!.ratings).toEqual([
      { criterionId: "crit-1", rating: 5 },
    ]);
    setRating(JOB, "cand-priya", "crit-1", 0);
    expect(getCandidate(JOB, "cand-priya")!.ratings).toEqual([
      { criterionId: "crit-1", rating: 1 },
    ]);
  });

  it("toggles a tag on and off", () => {
    toggleTag(JOB, "cand-priya", "Culture add");
    expect(getCandidate(JOB, "cand-priya")!.tags).toContain("Culture add");
    toggleTag(JOB, "cand-priya", "Culture add");
    expect(getCandidate(JOB, "cand-priya")!.tags).not.toContain("Culture add");
  });

  it("stores notes and extracts @mentions", () => {
    addNote(JOB, "cand-priya", "Chase the reference @Meera Iyer", "Alex Smith");
    const c = getCandidate(JOB, "cand-priya")!;
    expect(c.notes).toHaveLength(1);
    expect(c.notes[0].mentions).toEqual(["Meera Iyer"]);
    expect(c.timeline[c.timeline.length - 1].label).toBe("Note added with follow-up");
  });

  it("ignores an empty note", () => {
    addNote(JOB, "cand-priya", "   ", "Alex Smith");
    expect(getCandidate(JOB, "cand-priya")!.notes).toHaveLength(0);
  });
});

describe("parseMentions", () => {
  it("finds names and de-duplicates", () => {
    expect(parseMentions("@Alex Smith and @Alex Smith again")).toEqual(["Alex Smith"]);
  });
  it("returns empty when there are none", () => {
    expect(parseMentions("no mentions here")).toEqual([]);
  });
});

describe("bulkMoveCandidates", () => {
  it("moves every listed candidate and records a timeline event each", () => {
    const before = getCandidate(JOB, "cand-priya")!;
    bulkMoveCandidates(JOB, ["cand-priya", "cand-arjun"], "screened");
    const priya = getCandidate(JOB, "cand-priya")!;
    expect(priya.stageId).toBe("screened");
    expect(priya.timeline.length).toBe(before.timeline.length + 1);
    expect(getCandidate(JOB, "cand-arjun")?.stageId).toBe("screened");
  });

  it("skips candidates already in the target stage", () => {
    const before = getCandidate(JOB, "cand-priya")!;
    bulkMoveCandidates(JOB, ["cand-priya"], "applied");
    expect(getCandidate(JOB, "cand-priya")!.timeline.length).toBe(before.timeline.length);
  });

  it("ignores an unknown stage", () => {
    bulkMoveCandidates(JOB, ["cand-priya"], "nope");
    expect(getCandidate(JOB, "cand-priya")?.stageId).toBe("applied");
  });

  it("leaves unlisted candidates untouched", () => {
    bulkMoveCandidates(JOB, ["cand-priya"], "screened");
    expect(getCandidate(JOB, "cand-arjun")?.stageId).toBe("applied");
  });
});

describe("bulkSendMessage", () => {
  const TEMPLATE: MessageTemplate = {
    id: "tpl-test",
    name: "Test template",
    channel: "email",
    intent: "acknowledge",
    scope: "all",
    blurb: "",
    subject: "Hi {{candidate_name}}",
    body: "You are at {{stage}}",
  };

  function valuesFor(candidate: { name: string; stageId: string }): TemplateValues {
    return {
      candidate_name: candidate.name,
      job_title: "Engineer",
      company: "Acme",
      sender_name: "Alex Smith",
      stage: candidate.stageId,
    };
  }

  it("records a message and timeline event for every listed candidate", () => {
    bulkSendMessage(JOB, ["cand-priya", "cand-arjun"], TEMPLATE, valuesFor);
    const priya = getCandidate(JOB, "cand-priya")!;
    const arjun = getCandidate(JOB, "cand-arjun")!;
    expect(priya.messages).toHaveLength(1);
    expect(arjun.messages).toHaveLength(1);
    expect(priya.timeline[priya.timeline.length - 1].label).toBe('Sent “Test template”');
  });

  it("renders per-candidate values, not a shared value", () => {
    bulkSendMessage(JOB, ["cand-priya", "cand-arjun"], TEMPLATE, valuesFor);
    const priya = getCandidate(JOB, "cand-priya")!;
    const arjun = getCandidate(JOB, "cand-arjun")!;
    expect(priya.messages![0].subject).toContain(priya.name);
    expect(arjun.messages![0].subject).toContain(arjun.name);
  });

  it("renders the same way sendMessage does for a single candidate", () => {
    const candidate = getCandidate(JOB, "cand-priya")!;
    sendMessage(JOB, "cand-priya", TEMPLATE, valuesFor(candidate));
    const viaSingle = getCandidate(JOB, "cand-priya")!.messages![0];

    bulkSendMessage(JOB, ["cand-arjun"], TEMPLATE, valuesFor);
    const arjun = getCandidate(JOB, "cand-arjun")!;
    const viaBulk = arjun.messages![0];

    expect(viaSingle.subject).toBe(`Hi ${candidate.name}`);
    expect(viaBulk.subject).toBe(`Hi ${arjun.name}`);
    expect(viaBulk.body).toBe(`You are at ${arjun.stageId}`);
  });
});

describe("countsByStage", () => {
  it("counts every stage including empty ones", () => {
    const counts = countsByStage(getBoard(JOB));
    expect(counts.applied).toBe(3);
    expect(counts.screened).toBe(2);
    expect(counts.submitted).toBe(1);
    expect(counts.interviewing).toBe(1);
    expect(counts.offered).toBe(1);
    expect(counts.archive).toBe(0);
  });
});
