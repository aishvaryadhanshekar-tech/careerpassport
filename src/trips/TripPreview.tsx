import { useState } from "react";
import { DeviceFrame } from "../shared/DeviceFrame";
import { DeviceToggle } from "../shared/DeviceToggle";
import { STAGE_TYPE_META } from "../tripStages";
import type { CustomQuestion, Trip } from "../types";

/**
 * Candidate-facing preview of the current trip, mirroring the pattern
 * ApplicationPreview.tsx uses for the Applications "create job" flow: a
 * controlled mobile/desktop toggle above a device frame, both composed from
 * the shared src/shared/DeviceToggle + src/shared/DeviceFrame pieces so this
 * stays visually consistent without duplicating that chrome.
 *
 * Shows the trip's spine (scenario) as an intro, then each round (stage) as
 * a tab with its instructions and questions rendered the way a candidate
 * would see them.
 */
export function TripPreview({
  trip,
  mode,
  onMode,
}: {
  trip: Trip;
  mode: "mobile" | "desktop";
  onMode: (mode: "mobile" | "desktop") => void;
}) {
  return (
    <aside className="preview-pane">
      <div className="preview-toolbar">
        <DeviceToggle mode={mode} onMode={onMode} />
      </div>
      <DeviceFrame mode={mode}>
        <TripPreviewScreen trip={trip} />
      </DeviceFrame>
    </aside>
  );
}

function TripPreviewScreen({ trip }: { trip: Trip }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeStage = trip.stages.find((s) => s.id === activeId) ?? trip.stages[0] ?? null;

  return (
    <div className="preview-screen">
      <header className="preview-job" id="preview-job">
        <p className="preview-brand">Career Passport</p>
        <h3>{trip.title || "Untitled trip"}</h3>
      </header>
      <div className="preview-body">
        {trip.spine ? (
          <section className="preview-copy preview-section-card">
            <h4 className="preview-eyebrow">Scenario</h4>
            <p>{trip.spine}</p>
          </section>
        ) : null}

        {trip.stages.length === 0 ? (
          <p className="trip-rounds-empty">No rounds yet.</p>
        ) : (
          <>
            <div className="preview-tabbar" role="tablist" aria-label="Trip rounds">
              {trip.stages.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  role="tab"
                  aria-selected={stage.id === activeStage?.id}
                  className={`preview-tab-btn${stage.id === activeStage?.id ? " active" : ""}`}
                  onClick={() => setActiveId(stage.id)}
                >
                  {STAGE_TYPE_META[stage.type].label}
                </button>
              ))}
            </div>

            {activeStage ? (
              <section className="preview-fields preview-section-card" role="tabpanel">
                <p className="preview-eyebrow">
                  {STAGE_TYPE_META[activeStage.type].label} · {activeStage.durationMinutes}m
                </p>
                {activeStage.spokenInstructions ? (
                  <p>{activeStage.spokenInstructions}</p>
                ) : null}
                {activeStage.items.length === 0 ? (
                  <p className="trip-rounds-empty">No questions in this round yet.</p>
                ) : (
                  activeStage.items.map((question, index) => (
                    <QuestionPreviewField key={question.id} question={question} index={index} />
                  ))
                )}
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function QuestionPreviewField({
  question,
  index,
}: {
  question: CustomQuestion;
  index: number;
}) {
  return (
    <div className="preview-field">
      <span>
        {index + 1}. {question.prompt || "Question"}
      </span>
      {question.type === "paragraph" ? (
        <textarea rows={3} />
      ) : question.type === "short_answer" ? (
        <input type="text" />
      ) : question.type === "date" ? (
        <input type="date" />
      ) : question.type === "time" ? (
        <input type="time" />
      ) : question.type === "dropdown" ? (
        <select defaultValue="">
          <option value="" disabled>
            Choose
          </option>
          {question.options
            .filter((o) => o.trim())
            .map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
        </select>
      ) : (
        <ul className="preview-options">
          {question.options
            .filter((o) => o.trim())
            .map((option) => (
              <li key={option}>
                <label>
                  <input
                    type={question.type === "multiple_choice" ? "radio" : "checkbox"}
                    name={question.type === "multiple_choice" ? question.id : undefined}
                  />{" "}
                  {option}
                </label>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
