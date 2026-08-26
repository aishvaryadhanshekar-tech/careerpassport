import { beforeEach, describe, expect, it } from "vitest";
import { persistableDraft } from "./applyAnalysis";
import { memoryStorage } from "./memoryStore";
import { seedApplication } from "./seedApplication";
import { loadDraft, saveDraft, STORAGE_KEY } from "./storage";
import { createDraft } from "./types";

describe("application persistence", () => {
  beforeEach(() => {
    memoryStorage.clear();
  });

  it("round-trips application config", () => {
    const draft = createDraft();
    draft.application = seedApplication(draft);
    saveDraft(draft);
    const loaded = loadDraft();
    expect(loaded.application).toEqual(draft.application);
  });

  it("loads old snapshots without application as null", () => {
    const draft = createDraft();
    const snapshot = persistableDraft(draft) as Record<string, unknown>;
    delete snapshot.application;
    memoryStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    expect(loadDraft().application).toBeNull();
  });
});
