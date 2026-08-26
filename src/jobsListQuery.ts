import type { JobRecord } from "./jobsStore";

export type JobSort = "updated" | "title" | "location";

export function filterJobs(jobs: readonly JobRecord[], query: string): JobRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...jobs];
  return jobs.filter((job) =>
    [job.title, job.location, job.workMode].some((value) =>
      value.toLowerCase().includes(q),
    ),
  );
}

export function sortJobs(jobs: readonly JobRecord[], sort: JobSort): JobRecord[] {
  const copy = [...jobs];
  if (sort === "updated") {
    return copy.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  return copy.sort((a, b) =>
    a[sort].localeCompare(b[sort], undefined, { sensitivity: "base" }),
  );
}

export function queryJobs(
  jobs: readonly JobRecord[],
  query: string,
  sort: JobSort,
): JobRecord[] {
  return sortJobs(filterJobs(jobs, query), sort);
}
