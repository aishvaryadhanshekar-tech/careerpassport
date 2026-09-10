import type { JSX } from "react";
import type { StageProposal } from "./buildPhase";

export type StageChecklistProps = {
  stages: StageProposal[];
  onToggle: (id: string, included: boolean) => void;
  onRename: (id: string, title: string) => void;
  onConfirm: () => void;
  onBack: () => void;
};

/** One compact row per proposed stage: include it, rename it. Details sit in the row's tooltip. */
export function StageChecklist({ stages, onToggle, onRename, onConfirm, onBack }: StageChecklistProps): JSX.Element {
  const included = stages.filter((stage) => stage.included).length;

  return (
    <div className="ai-build-stages">
      <ul className="ai-build-stage-list">
        {stages.map((stage) => (
          <li key={stage.id} className="ai-build-stage" title={stage.detail}>
            <input
              type="checkbox"
              className="ai-build-stage-check"
              checked={stage.included}
              disabled={stage.required}
              aria-label={stage.required ? `${stage.title} (always included)` : `Include ${stage.title}`}
              onChange={(event) => onToggle(stage.id, event.target.checked)}
            />
            <input
              type="text"
              className="ai-build-stage-title"
              aria-label={`Name for ${stage.title}`}
              value={stage.title}
              onChange={(event) => onRename(stage.id, event.target.value)}
            />
          </li>
        ))}
      </ul>

      <div className="ai-build-actions">
        <button type="button" className="ai-build-ghost" onClick={onBack}>
          Back
        </button>
        <button type="button" className="ai-build-primary" onClick={onConfirm} disabled={included === 0}>
          {`Create ${included} ${included === 1 ? "stage" : "stages"}`}
        </button>
      </div>
    </div>
  );
}
