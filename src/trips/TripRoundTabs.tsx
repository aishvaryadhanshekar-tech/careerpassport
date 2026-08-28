import { useState, type JSX } from "react";
import { SparkleIcon } from "../shared/icons";
import { useBuildPhase } from "../shared/useBuildPhase";
import { rewriteRoundQuestions } from "../tripAIBuild";
import { addStage, STAGE_TYPE_META } from "../tripStages";
import { DIFFICULTIES, DIFFICULTY_LABELS } from "../types";
import type { CustomQuestion, Difficulty, JobDraft, Stage, StageType, Trip } from "../types";
import { RoundQuestionsCard } from "./RoundQuestionsCard";

const BUILD_PHASES = [
  "Reading your notes…",
  "Structuring the round…",
  "Writing questions…",
] as const;

export type TripRoundTabsProps = {
  trip: Trip;
  draft: JobDraft;
  onChange: (patch: Partial<Trip>) => void;
};

/**
 * Right column of the redesigned TripBuilderPage — a tab per round
 * (trip.stages), each showing that round's questions via RoundQuestionsCard
 * plus a per-round "Rewrite with AI" action. Replaces the old
 * StagePicker + StageList flow (and the per-type RapidFireEditor /
 * PickAndDefendEditor editors) now that every round is a uniform
 * CustomQuestion[] list.
 */
export function TripRoundTabs({ trip, draft, onChange }: TripRoundTabsProps): JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rewritingId, setRewritingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const buildPhase = useBuildPhase(rewritingId !== null);

  const activeStage = trip.stages.find((s) => s.id === activeId) ?? trip.stages[0] ?? null;

  function updateStageItems(stageId: string, items: CustomQuestion[]) {
    onChange({
      stages: trip.stages.map((stage) => (stage.id === stageId ? { ...stage, items } : stage)),
    });
  }

  function updateStageDuration(stageId: string, durationMinutes: number) {
    onChange({
      stages: trip.stages.map((stage) =>
        stage.id === stageId ? { ...stage, durationMinutes } : stage,
      ),
    });
  }

  function onAddStage(type: StageType) {
    const nextStages = addStage(trip.stages, type);
    onChange({ stages: nextStages });
    const newStage = nextStages[nextStages.length - 1];
    if (newStage) {
      setActiveId(newStage.id);
    }
    setAddOpen(false);
  }

  async function onRewrite(stage: Stage) {
    if (rewritingId) return;
    setRewritingId(stage.id);
    await new Promise((r) => setTimeout(r, 1800));
    const items = rewriteRoundQuestions(stage, trip.inferenceCards, draft, trip.difficulty);
    updateStageItems(stage.id, items);
    setRewritingId(null);
  }

  if (!activeStage) {
    return <p className="trip-rounds-empty">No rounds yet.</p>;
  }

  const isRewriting = rewritingId === activeStage.id;

  return (
    <div className="trip-round-tabs">
      <div className="trip-round-tab-bar" role="tablist">
        {trip.stages.map((stage) => (
          <button
            key={stage.id}
            type="button"
            role="tab"
            aria-selected={stage.id === activeStage.id}
            className={`trip-round-tab${stage.id === activeStage.id ? " active" : ""}`}
            onClick={() => setActiveId(stage.id)}
          >
            {STAGE_TYPE_META[stage.type].label}
            <span className="trip-round-tab-duration">{stage.durationMinutes}m</span>
          </button>
        ))}
        <button
          type="button"
          className="trip-round-tab trip-round-tab-add"
          onClick={() => setAddOpen((v) => !v)}
        >
          + Add lever
        </button>
      </div>

      {addOpen && (
        <div className="stage-picker-grid">
          {Object.entries(STAGE_TYPE_META).map(([type, meta]) => {
            if (!meta.live) {
              return (
                <div key={type} className="stage-picker-card disabled-stage-card">
                  <span className="stage-picker-card-label">{meta.label}</span>
                  <span className="stage-picker-card-blurb">{meta.blurb}</span>
                </div>
              );
            }
            return (
              <button
                key={type}
                type="button"
                className="stage-picker-card"
                onClick={() => onAddStage(type as StageType)}
              >
                <span className="stage-picker-card-label">{meta.label}</span>
                <span className="stage-picker-card-blurb">{meta.blurb}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="trip-round-tab-panel" role="tabpanel">
        <p className="trip-round-tab-blurb">{STAGE_TYPE_META[activeStage.type].blurb}</p>

        <label className="trip-round-duration-field">
          <span>Time limit (minutes)</span>
          <input
            type="number"
            min={1}
            className="trip-round-duration-input"
            value={activeStage.durationMinutes}
            onChange={(e) =>
              updateStageDuration(activeStage.id, Math.max(1, Number(e.target.value) || 1))
            }
          />
        </label>

        <div className="trip-round-rewrite-row">
          {isRewriting ? (
            <span className="build-loading" aria-live="polite">
              <SparkleIcon />
              <span className="build-loading-text">
                {BUILD_PHASES[buildPhase % BUILD_PHASES.length]}
              </span>
            </span>
          ) : (
            <>
              <select
                className="pill-select select-icon"
                aria-label="Difficulty"
                value={trip.difficulty}
                onChange={(e) => onChange({ difficulty: e.target.value as Difficulty })}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {DIFFICULTY_LABELS[d]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="trip-generate-btn btn ghost"
                onClick={() => onRewrite(activeStage)}
              >
                <SparkleIcon />
                Rewrite with AI
              </button>
            </>
          )}
        </div>

        <RoundQuestionsCard
          questions={activeStage.items}
          onChange={(next) => updateStageItems(activeStage.id, next)}
        />
      </div>
    </div>
  );
}
