import type { ColumnId } from "./pipeline/CandidateTable";
import { PIPELINE_COLUMN_IDS } from "./pipeline/CandidateTable";

const KEY = "cp.pipelineColumns.v1";

export function loadVisibleColumns(): Set<ColumnId> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set(PIPELINE_COLUMN_IDS);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set(PIPELINE_COLUMN_IDS);
    const valid = parsed.filter((id): id is ColumnId =>
      PIPELINE_COLUMN_IDS.includes(id as ColumnId),
    );
    return new Set(valid);
  } catch {
    return new Set(PIPELINE_COLUMN_IDS);
  }
}

export function saveVisibleColumns(columns: Set<ColumnId>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...columns]));
  } catch {
    // Private mode / blocked storage should not break the shell.
  }
}
