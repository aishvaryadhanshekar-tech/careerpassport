import { describe, expect, it } from "vitest";
import { filterJobs, queryJobs, sortJobs, type JobSort } from "./jobsListQuery";
import type { JobRecord } from "./jobsStore";

function job(
  overrides: Partial<JobRecord> & Pick<JobRecord, "id" | "title">,
): JobRecord {
  return {
    createdAt: 0,
    updatedAt: 0,
    status: "Draft",
    location: "—",
    workMode: "—",
    salaryLabel: "—",
    publishDestinations: { internal: true, marketplace: false },
    snapshot: {} as JobRecord["snapshot"],
    ...overrides,
  };
}

const pm = job({
  id: "1",
  title: "Senior PM",
  location: "Bangalore",
  workMode: "Hybrid",
  updatedAt: 30,
});
const eng = job({
  id: "2",
  title: "Backend engineer",
  location: "Remote",
  workMode: "WFH",
  updatedAt: 90,
});
const design = job({
  id: "3",
  title: "Designer",
  location: "Mumbai",
  workMode: "WFO",
  updatedAt: 10,
});

const jobs = [pm, eng, design];

describe("filterJobs", () => {
  it("returns all jobs when the query is empty or whitespace", () => {
    expect(filterJobs(jobs, "")).toEqual(jobs);
    expect(filterJobs(jobs, "   ")).toEqual(jobs);
  });

  it("matches title, location, or work mode, case-insensitively", () => {
    expect(filterJobs(jobs, "pm").map((j) => j.id)).toEqual(["1"]);
    expect(filterJobs(jobs, "REMOTE").map((j) => j.id)).toEqual(["2"]);
    expect(filterJobs(jobs, "wfo").map((j) => j.id)).toEqual(["3"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterJobs(jobs, "android")).toEqual([]);
  });
});

describe("sortJobs", () => {
  it("sorts by last updated, newest first", () => {
    expect(sortJobs(jobs, "updated").map((j) => j.id)).toEqual(["2", "1", "3"]);
  });

  it("sorts by title A–Z", () => {
    expect(sortJobs(jobs, "title").map((j) => j.id)).toEqual(["2", "3", "1"]);
  });

  it("sorts by location A–Z", () => {
    expect(sortJobs(jobs, "location").map((j) => j.id)).toEqual(["1", "3", "2"]);
  });
});

describe("queryJobs", () => {
  it("filters first, then applies the chosen sort", () => {
    const sort: JobSort = "title";
    expect(queryJobs(jobs, "w", sort).map((j) => j.id)).toEqual(["2", "3"]);
  });
});
