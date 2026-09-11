import type { JSX, ReactNode } from "react";
import "./assistant-flow.css";
import type { AssistantDockProps } from "./contract";
import { PipelineChoice } from "./PipelineChoice";
import { StageChecklist } from "./StageChecklist";

const TASKS = [
  { label: "Review workflow", prompt: "Review the entire hiring workflow. Identify missing steps, duplicated work, and opportunities to improve the candidate experience." },
  { label: "Build pipeline", prompt: "Build a hiring pipeline for this role with an application, candidate review, assessment, and interview stages." },
  { label: "Describe role", prompt: "Help me define this role: job title, location, responsibilities, and the experience a candidate needs." },
];

function Heading({ children }: { children: ReactNode }): JSX.Element {
  return <p className="assistant-dock-question">{children}</p>;
}

/**
 * The step after the intake, shown at the top of the assistant's composer card. The intake itself
 * lives in the composer (see ComposerIntake); busy phases show the composer's spinner line instead.
 */
export function AssistantDock(props: AssistantDockProps): JSX.Element | null {
  const { phase } = props;

  if (phase === "reviewing") {
    const { reviewed, total } = props.brief;
    const all = reviewed >= total;
    return (
      <>
        <Heading>Review the role brief</Heading>
        <div className="assistant-dock-progress">
          <div className="assistant-dock-meter" aria-hidden="true"><span style={{ width: `${total ? (reviewed / total) * 100 : 0}%` }} /></div>
          <small>{reviewed} of {total} sections reviewed</small>
        </div>
        <div className="ai-build-actions">
          {all ? (
            <button type="button" className="ai-build-primary" onClick={props.onGenerate}>Generate pipeline →</button>
          ) : (
            <>
              <button type="button" className="ai-build-ghost" onClick={props.onGenerate}>Skip review</button>
              <button type="button" className="ai-build-primary" onClick={props.onReviewBrief}>Review role brief</button>
            </>
          )}
        </div>
      </>
    );
  }

  if (phase === "choosing") {
    return (
      <>
        <Heading>How far should I build the pipeline?</Heading>
        <PipelineChoice onChoose={props.onChooseScope} />
      </>
    );
  }

  if (phase === "stages") {
    return (
      <>
        <Heading>Which stages should I create?</Heading>
        <StageChecklist
          stages={props.stages}
          onToggle={props.onToggleStage}
          onRename={props.onRenameStage}
          onConfirm={props.onConfirmStages}
          onBack={props.onBack}
        />
      </>
    );
  }

  if ((phase !== "done" && phase !== "off") || !props.showTasks) return null;
  return (
    <div className="assistant-dock-chips" aria-label="Suggested tasks">
      {TASKS.map((task) => (
        <button key={task.label} type="button" onClick={() => props.onTask(task.prompt)}>{task.label}</button>
      ))}
    </div>
  );
}
