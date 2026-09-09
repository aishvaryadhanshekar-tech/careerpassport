import { describe, expect, it } from "vitest";
import { getBoard } from "./candidatesStore";
import { SEEDED_JOB_ID, seedJobExamples } from "./seedJobs";

describe("seedJobExamples", () => {
  const jobs = seedJobExamples();

  it("gives every demo job at least one multi-round Trip, with real question content", () => {
    for (const job of jobs) {
      expect(job.draft.trips.length).toBeGreaterThan(0);
      const totalRounds = job.draft.trips.reduce((sum, t) => sum + t.stages.length, 0);
      expect(totalRounds).toBeGreaterThanOrEqual(3);
      for (const trip of job.draft.trips) {
        for (const stage of trip.stages) {
          expect(stage.items.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("varies both the number of Trips per job and which stage each lands on", () => {
    const tripCounts = jobs.map((job) => job.draft.trips.length);
    expect(new Set(tripCounts).size).toBeGreaterThan(1);
    const stageSets = jobs.map((job) =>
      new Set(job.draft.trips.map((t) => t.pipelineStageId)).size,
    );
    // At least one job spreads its Trips across more than one pipeline stage.
    expect(stageSets.some((count) => count > 1)).toBe(true);
  });

  it("does not reuse the same round-type combination across jobs", () => {
    const signatures = jobs.map((job) =>
      job.draft.trips.map((t) => t.stages.map((s) => s.type).join("+")).join(" | "),
    );
    expect(new Set(signatures).size).toBe(signatures.length);
  });

  it("gives each additional-role demo job its own candidate roster", () => {
    const nonFlagship = jobs.filter((job) => job.id !== SEEDED_JOB_ID);
    const rosters = nonFlagship.map((job) => getBoard(job.id).candidates.map((c) => c.id).join(","));
    expect(new Set(rosters).size).toBe(rosters.length);
    for (const job of nonFlagship) {
      const board = getBoard(job.id);
      expect(board.candidates.length).toBeGreaterThan(0);
      for (const candidate of board.candidates) {
        expect(board.stages.some((s) => s.id === candidate.stageId)).toBe(true);
      }
    }
  });

  it("keeps the flagship job's own dedicated roster", () => {
    const board = getBoard(SEEDED_JOB_ID);
    expect(board.candidates.length).toBeGreaterThan(0);
  });
});
