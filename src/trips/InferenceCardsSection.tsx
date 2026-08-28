import { useState, type JSX } from "react";
import { EditableField } from "../EditableField";
import { SparkleIcon } from "../shared/icons";
import { useBuildPhase } from "../shared/useBuildPhase";
import { deriveInferenceCards, updateInferenceCard } from "../tripInference";
import type { JobDraft, Trip } from "../types";

const BUILD_PHASES = [
  "Reading your notes…",
  "Structuring the role…",
  "Building your role…",
] as const;

export type InferenceCardsSectionProps = {
  trip: Trip;
  draft: JobDraft;
  onChange: (patch: Partial<Trip>) => void;
};

export function InferenceCardsSection({
  trip,
  draft,
  onChange,
}: InferenceCardsSectionProps): JSX.Element {
  const [analysing, setAnalysing] = useState(false);
  const buildPhase = useBuildPhase(analysing);

  const hasContent = trip.inferenceCards.some((c) => c.content.trim() !== "");

  async function onGenerate() {
    if (analysing || trip.inferenceCardsLocked) return;
    setAnalysing(true);
    await new Promise((r) => setTimeout(r, 1800));
    onChange({ inferenceCards: deriveInferenceCards(draft) });
    setAnalysing(false);
  }

  return (
    <section className="trip-card">
      <div className="trip-card-head">
        <h2>Inference cards</h2>
        <p>
          What the system understood about the role — locked before anything
          downstream is built.
        </p>
      </div>
      <div className="trip-card-body">
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
            disabled={trip.inferenceCardsLocked}
            aria-disabled={trip.inferenceCardsLocked}
            onClick={onGenerate}
          >
            <SparkleIcon />
            {hasContent ? "Regenerate inference cards" : "Generate inference cards"}
          </button>
        )}

        <div className="inference-cards-grid">
          {trip.inferenceCards.map((card) => (
            <div className="inference-card" key={card.id}>
              <h3>{card.title}</h3>
              <EditableField
                label={card.title}
                display={<p>{card.content || "Not generated yet."}</p>}
              >
                <textarea
                  value={card.content}
                  onChange={(e) =>
                    onChange({
                      inferenceCards: updateInferenceCard(
                        trip.inferenceCards,
                        card.id,
                        e.target.value,
                      ),
                    })
                  }
                />
              </EditableField>
            </div>
          ))}
        </div>

        <div className="trip-lock-row">
          {trip.inferenceCardsLocked ? (
            <>
              <span>Locked ✓</span>
              <button
                type="button"
                className="btn ghost"
                onClick={() => onChange({ inferenceCardsLocked: false })}
              >
                Unlock to edit
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn primary"
              onClick={() => onChange({ inferenceCardsLocked: true })}
            >
              Lock cards
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
