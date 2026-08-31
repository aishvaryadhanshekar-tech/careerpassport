import { useEffect, useRef, useState, type JSX } from "react";
import {
  AI_FLAG_LABELS,
  AI_FLAG_SHORT_LABELS,
  type Candidate,
  type PipelineStage,
} from "../types";
import type { CandidateFilters } from "./pipelineFilters";

function originLabel(candidate: Candidate): string {
  return candidate.origin.kind === "applied"
    ? "Application submitted"
    : `Submitted by ${candidate.origin.by}`;
}

function formatAppliedDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function stopRow(e: React.SyntheticEvent) {
  e.stopPropagation();
}

/** Marks the verdict as AI-produced. Mirrors CandidateCard's SparkleIcon so the table's AI
 * flag reads the same way as the kanban card's. */
function SparkleIcon(): JSX.Element {
  return (
    <svg
      className="candidate-verdict-star"
      width="11"
      height="11"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 1c.5 3.1 1.2 4.5 2.4 5.3C11.4 7 12.9 7.5 15 8c-3.1.5-4.5 1.2-5.3 2.4C9 11.4 8.5 12.9 8 15c-.5-3.1-1.2-4.5-2.4-5.3C4.6 9 3.1 8.5 1 8c3.1-.5 4.5-1.2 5.3-2.4C7 4.6 7.5 3.1 8 1Z" />
    </svg>
  );
}

function tripStatusLabel(candidate: Candidate): string {
  if (candidate.tripStatus === "completed") {
    return typeof candidate.tripScore === "number"
      ? `Score: ${candidate.tripScore}`
      : "Completed";
  }
  if (candidate.tripStatus === "sent") return "Trip sent";
  return "Not sent";
}

export function CandidateTable({
  candidates,
  stages,
  selected,
  onToggleOne,
  onToggleAll,
  onOpen,
}: {
  candidates: Candidate[];
  stages: PipelineStage[];
  selected: Set<string>;
  onToggleOne: (id: string, on: boolean) => void;
  onToggleAll: (on: boolean) => void;
  onOpen: (candidateId: string) => void;
}): JSX.Element {
  const stageById = new Map(stages.map((s) => [s.id, s]));
  const allSelected = candidates.length > 0 && candidates.every((c) => selected.has(c.id));
  const someSelected = candidates.some((c) => selected.has(c.id)) && !allSelected;

  if (candidates.length === 0) {
    return (
      <div className="candidate-table-empty">
        <p>No candidates match</p>
      </div>
    );
  }

  return (
    <div className="candidate-table-wrap">
      <table className="candidate-table">
        <thead>
          <tr>
            <th className="candidate-table-check">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={(e) => onToggleAll(e.target.checked)}
                aria-label="Select all candidates"
              />
            </th>
            <th>Name</th>
            <th>Stage</th>
            <th>Location</th>
            <th>Origin</th>
            <th>Applied</th>
            <th>Trip</th>
            <th>Tags</th>
            <th>AI</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => {
            const stage = stageById.get(candidate.stageId);
            return (
              <tr
                key={candidate.id}
                tabIndex={0}
                className={selected.has(candidate.id) ? "is-selected" : ""}
                onClick={() => onOpen(candidate.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(candidate.id);
                  }
                }}
              >
                <td className="candidate-table-check" onClick={stopRow} onKeyDown={stopRow}>
                  <input
                    type="checkbox"
                    checked={selected.has(candidate.id)}
                    onChange={(e) => onToggleOne(candidate.id, e.target.checked)}
                    aria-label={`Select ${candidate.name}`}
                  />
                </td>
                <td>
                  <b>{candidate.name}</b>
                  <div className="candidate-table-sub">{candidate.email}</div>
                </td>
                <td>
                  <span className="candidate-table-stage">
                    {stage ? stage.label : candidate.stageId}
                  </span>
                </td>
                <td>{candidate.location}</td>
                <td>{originLabel(candidate)}</td>
                <td className="num">{formatAppliedDate(candidate.appliedAt)}</td>
                <td>{tripStatusLabel(candidate)}</td>
                <td>
                  {candidate.tags.length > 0 ? (
                    <div className="candidate-table-tags">
                      {candidate.tags.map((tag) => (
                        <span key={tag} className="candidate-table-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </td>
                <td>
                  {candidate.aiFlag ? (
                    <span
                      className={`candidate-verdict verdict-${candidate.aiFlag}`}
                      title={AI_FLAG_LABELS[candidate.aiFlag]}
                    >
                      <SparkleIcon />
                      {AI_FLAG_SHORT_LABELS[candidate.aiFlag]}
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function toDateInputValue(ts: number | undefined): string {
  if (ts === undefined) return "";
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fromDateInputValue(value: string, endOfDay: boolean): number | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Checkbox list used inside the consolidated Filters popover for both the Stage and Tags
 * sections. Pure rendering helper — no popover/open-state of its own. */
function FilterCheckboxList({
  options,
  selectedValues,
  onToggle,
}: {
  options: { id: string; label: string }[];
  selectedValues: string[];
  onToggle: (id: string) => void;
}): JSX.Element {
  if (options.length === 0) {
    return <span className="candidate-filter-popover-empty">None available</span>;
  }
  return (
    <>
      {options.map((opt) => (
        <label key={opt.id} className="candidate-filter-popover-item">
          <input
            type="checkbox"
            checked={selectedValues.includes(opt.id)}
            onChange={() => onToggle(opt.id)}
          />
          {opt.label}
        </label>
      ))}
    </>
  );
}

export function CandidateFilterBar({
  filters,
  onChange,
  stages,
  availableTags,
}: {
  filters: CandidateFilters;
  onChange: (next: CandidateFilters) => void;
  stages: PipelineStage[];
  availableTags: string[];
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggleStage(id: string) {
    if (filters.stageIds.includes(id)) {
      onChange({ ...filters, stageIds: filters.stageIds.filter((v) => v !== id) });
    } else {
      onChange({ ...filters, stageIds: [...filters.stageIds, id] });
    }
  }

  function toggleTag(id: string) {
    if (filters.tags.includes(id)) {
      onChange({ ...filters, tags: filters.tags.filter((v) => v !== id) });
    } else {
      onChange({ ...filters, tags: [...filters.tags, id] });
    }
  }

  function clearAll() {
    onChange({ ...filters, stageIds: [], tags: [], dateFrom: undefined, dateTo: undefined });
  }

  const activeCount =
    filters.stageIds.length +
    filters.tags.length +
    (filters.dateFrom !== undefined ? 1 : 0) +
    (filters.dateTo !== undefined ? 1 : 0);
  const filtersLabel = activeCount > 0 ? `Filters (${activeCount})` : "Filters";

  return (
    <div className="candidate-filter-bar">
      <input
        type="search"
        className="candidate-filter-search"
        placeholder="Search name or email"
        value={filters.query}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
        aria-label="Search candidates by name or email"
      />

      <div className="candidate-filter-multiselect" ref={wrapRef}>
        <button
          type="button"
          className={`candidate-filter-btn${activeCount > 0 ? " is-active" : ""}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {filtersLabel}
          {activeCount > 0 ? (
            <span className="candidate-filter-count">{activeCount}</span>
          ) : null}
          <span className="candidate-filter-caret" aria-hidden="true">
            ▾
          </span>
        </button>
        {open ? (
          <div className="candidate-filter-popover" role="menu">
            <div className="candidate-filter-popover-section">
              <div className="candidate-filter-popover-section-title">Stage</div>
              <FilterCheckboxList
                options={stages.map((s) => ({ id: s.id, label: s.label }))}
                selectedValues={filters.stageIds}
                onToggle={toggleStage}
              />
            </div>

            <div className="candidate-filter-popover-section">
              <div className="candidate-filter-popover-section-title">Tags</div>
              <FilterCheckboxList
                options={availableTags.map((t) => ({ id: t, label: t }))}
                selectedValues={filters.tags}
                onToggle={toggleTag}
              />
            </div>

            <div className="candidate-filter-popover-section">
              <div className="candidate-filter-popover-section-title">Applied date</div>
              <div className="candidate-filter-dates">
                <label className="candidate-filter-date-field">
                  <span>From</span>
                  <input
                    type="date"
                    value={toDateInputValue(filters.dateFrom)}
                    onChange={(e) =>
                      onChange({
                        ...filters,
                        dateFrom: fromDateInputValue(e.target.value, false),
                      })
                    }
                  />
                </label>
                <label className="candidate-filter-date-field">
                  <span>To</span>
                  <input
                    type="date"
                    value={toDateInputValue(filters.dateTo)}
                    onChange={(e) =>
                      onChange({ ...filters, dateTo: fromDateInputValue(e.target.value, true) })
                    }
                  />
                </label>
              </div>
            </div>

            <button
              type="button"
              className="candidate-filter-popover-clear"
              onClick={clearAll}
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
