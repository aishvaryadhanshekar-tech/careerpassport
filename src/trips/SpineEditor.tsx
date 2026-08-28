import { useState, type JSX } from "react";
import { EditableField } from "../EditableField";
import { SparkleIcon } from "../shared/icons";
import { useBuildPhase } from "../shared/useBuildPhase";
import { generateSpine } from "../tripSpine";
import type { JobDraft, Trip } from "../types";

const BUILD_PHASES = [
  "Reading your notes…",
  "Structuring the role…",
  "Building your role…",
] as const;

export type SpineEditorProps = {
  trip: Trip;
  draft: JobDraft;
  disabled: boolean;
  onChange: (patch: Partial<Trip>) => void;
};

export function SpineEditor({
  trip,
  draft,
  disabled,
  onChange,
}: SpineEditorProps): JSX.Element {
  const [analysing, setAnalysing] = useState(false);
  const buildPhase = useBuildPhase(analysing);

  async function onGenerate() {
    if (analysing || disabled) return;
    setAnalysing(true);
    await new Promise((r) => setTimeout(r, 1800));
    onChange({ spine: generateSpine(trip.inferenceCards, draft), spineGenerated: true });
    setAnalysing(false);
  }

  return (
    <section className="trip-card">
      <div className="trip-card-head">
        <h2>Spine</h2>
        <p>
          The scenario the whole trip sits inside — not a description of the
          candidate, a situation they're dropped into.
        </p>
      </div>
      <div className="trip-card-body">
        {disabled ? (
          <p className="trip-section-locked-note">
            Lock your inference cards above to generate the spine.
          </p>
        ) : (
          <>
            {analysing ? (
              <span className="build-loading" aria-live="polite">
                <SparkleIcon />
                <span className="build-loading-text">
                  {BUILD_PHASES[buildPhase % BUILD_PHASES.length]}
                </span>
              </span>
            ) : (
              <button
                type="button"
                className="trip-generate-btn btn primary"
                onClick={onGenerate}
              >
                <SparkleIcon />
                {trip.spineGenerated ? "Regenerate spine" : "Generate spine"}
              </button>
            )}

            <EditableField
              label="Scenario"
              display={<p>{trip.spine || "Not generated yet."}</p>}
            >
              <textarea
                value={trip.spine}
                onChange={(e) => onChange({ spine: e.target.value })}
              />
            </EditableField>
          </>
        )}
      </div>
    </section>
  );
}
