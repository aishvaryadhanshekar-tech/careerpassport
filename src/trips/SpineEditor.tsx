import { useEffect, useState, type JSX } from "react";
import { EditableField } from "../EditableField";
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
  const [buildPhase, setBuildPhase] = useState(0);

  useEffect(() => {
    if (!analysing) {
      setBuildPhase(0);
      return;
    }
    const id = window.setInterval(() => {
      setBuildPhase((p) => p + 1);
    }, 850);
    return () => window.clearInterval(id);
  }, [analysing]);

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

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5 9.3 5 12.8 6.3 9.3 7.6 8 11.1 6.7 7.6 3.2 6.3 6.7 5 8 1.5Z"
        fill="currentColor"
      />
      <path
        d="M13 9.5 13.6 11.1 15.2 11.7 13.6 12.3 13 13.9 12.4 12.3 10.8 11.7 12.4 11.1 13 9.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
