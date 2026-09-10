import type { JSX } from "react";
import type { PipelineScope } from "./buildPhase";

export type PipelineChoiceProps = {
  onChoose: (scope: PipelineScope) => void;
};

/** The two build scopes; the assistant dock supplies the question above them. */
export function PipelineChoice({ onChoose }: PipelineChoiceProps): JSX.Element {
  return (
    <div className="ai-build-choices" role="group" aria-label="How much of the pipeline to build">
      <button type="button" className="ai-build-choice ai-build-choice-primary" onClick={() => onChoose("full")}>
        <span className="ai-build-choice-title">Entire draft pipeline</span>
        <span className="ai-build-choice-blurb">Application → screening → interviews → offer.</span>
      </button>
      <button type="button" className="ai-build-choice" onClick={() => onChoose("application")}>
        <span className="ai-build-choice-title">Just the application</span>
        <span className="ai-build-choice-blurb">Add interview rounds yourself later.</span>
      </button>
    </div>
  );
}
