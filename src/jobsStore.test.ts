import { describe, expect, it, beforeEach } from "vitest";
import { createDraft } from "./types";
import { memoryStorage } from "./memoryStore";
import { STORAGE_KEY } from "./storage";
import {
  JOBS_KEY,
  CURRENT_JOB_ID_KEY,
  deleteJobs,
  listJobs,
  upsertJobFromDraft,
  startNewJob,
} from "./jobsStore";

describe("jobsStore", () => {
  beforeEach(() => {
    memoryStorage.clear();
  });

  it("starts empty", () => {
    expect(listJobs()).toEqual([]);
  });

  it("adds a job from a completed draft and lists it first", () => {
    const draft = createDraft();
    draft.fields.designation.value = "Senior backend engineer";
    draft.fields.location.value = "Bangalore";
    draft.fields.workMode.value = "Hybrid";
    draft.fields.salary.value = "₹45–60L";
    draft.salaryCurrency = "INR";
    draft.salaryPeriod = "Per year";

    const id = startNewJob();
    upsertJobFromDraft(id, draft);

    const jobs = listJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe(id);
    expect(jobs[0].title).toBe("Senior backend engineer");
    expect(jobs[0].location).toBe("Bangalore");
    expect(jobs[0].workMode).toBe("Hybrid");
    expect(jobs[0].salaryLabel).toContain("45");
    expect(jobs[0].status).toBe("Draft");
  });

  it("updates the same job on a second upsert instead of duplicating", () => {
    const draft = createDraft();
    draft.fields.designation.value = "PM";
    const id = startNewJob();
    upsertJobFromDraft(id, draft);
    draft.fields.designation.value = "Senior PM";
    upsertJobFromDraft(id, draft);
    expect(listJobs()).toHaveLength(1);
    expect(listJobs()[0].title).toBe("Senior PM");
  });

  it("startNewJob issues a fresh id", () => {
    const a = startNewJob();
    const b = startNewJob();
    expect(a).not.toBe(b);
    expect(memoryStorage.getItem(CURRENT_JOB_ID_KEY)).toBe(b);
  });

  it("deleteJobs removes the given jobs and keeps the rest", () => {
    const draft = createDraft();
    draft.fields.designation.value = "PM";
    const keep = startNewJob();
    upsertJobFromDraft(keep, draft);
    draft.fields.designation.value = "Designer";
    const drop = startNewJob();
    upsertJobFromDraft(drop, draft);

    deleteJobs([drop]);

    const jobs = listJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe(keep);
  });

  it("deleteJobs of the current job clears the current id and draft", () => {
    const draft = createDraft();
    draft.fields.designation.value = "PM";
    const id = startNewJob();
    upsertJobFromDraft(id, draft);
    expect(memoryStorage.getItem(CURRENT_JOB_ID_KEY)).toBe(id);
    expect(memoryStorage.getItem(STORAGE_KEY)).toBeTruthy();

    deleteJobs([id]);

    expect(listJobs()).toEqual([]);
    expect(memoryStorage.getItem(CURRENT_JOB_ID_KEY)).toBeNull();
    expect(memoryStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("deleteJobs of a different job leaves the current draft in place", () => {
    const draft = createDraft();
    draft.fields.designation.value = "Keep";
    const current = startNewJob();
    upsertJobFromDraft(current, draft);
    draft.fields.designation.value = "Drop";
    const drop = startNewJob();
    upsertJobFromDraft(drop, draft);
    memoryStorage.setItem(CURRENT_JOB_ID_KEY, current);

    deleteJobs([drop]);

    expect(memoryStorage.getItem(CURRENT_JOB_ID_KEY)).toBe(current);
    expect(memoryStorage.getItem(STORAGE_KEY)).toBeTruthy();
  });
});

describe("jobsStore keys", () => {
  it("uses stable storage keys", () => {
    expect(JOBS_KEY).toBe("cp.jobs.v1");
  });
});
