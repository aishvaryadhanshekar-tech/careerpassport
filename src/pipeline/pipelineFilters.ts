import type { Candidate } from "../types";

export type CandidateFilters = {
  query: string;
  stageIds: string[];
  tags: string[];
  dateFrom?: number;
  dateTo?: number;
};

export const EMPTY_CANDIDATE_FILTERS: CandidateFilters = {
  query: "",
  stageIds: [],
  tags: [],
};

export function filterCandidates(
  candidates: readonly Candidate[],
  filters: CandidateFilters,
): Candidate[] {
  const q = filters.query.trim().toLowerCase();
  return candidates.filter((candidate) => {
    if (q && !`${candidate.name} ${candidate.email}`.toLowerCase().includes(q)) return false;
    if (filters.stageIds.length > 0 && !filters.stageIds.includes(candidate.stageId)) {
      return false;
    }
    if (filters.tags.length > 0 && !filters.tags.some((tag) => candidate.tags.includes(tag))) {
      return false;
    }
    if (filters.dateFrom !== undefined && candidate.appliedAt < filters.dateFrom) return false;
    if (filters.dateTo !== undefined && candidate.appliedAt > filters.dateTo) return false;
    return true;
  });
}
