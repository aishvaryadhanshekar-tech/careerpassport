import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { persistableDraft } from "./applyAnalysis";
import { seedApplication } from "./seedApplication";
import { loadDraft, saveDraft, STORAGE_KEY } from "./storage";
import { createDraft } from "./types";

const mem = new Map<string, string>();

beforeAll(() => {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
    },
  });
});

describe("application persistence", () => {
  beforeEach(() => {
    sessionStorage.clear();
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
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    expect(loadDraft().application).toBeNull();
  });
});
