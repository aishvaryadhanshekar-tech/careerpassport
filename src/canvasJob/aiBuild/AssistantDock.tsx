import type { JSX, ReactNode } from "react";
import { SparkleIcon } from "../../shared/icons";
import type { BuildPhase, PipelineScope, StageProposal } from "./buildPhase";
import { JD_LINK, JD_PROMPT, TEMPLATE_BLURB, TEMPLATE_LINK, TEMPLATE_ROLES, type IntakeStep } from "./intake";
import { PipelineChoice } from "./PipelineChoice";
import { StageChecklist } from "./StageChecklist";
import type { IntakeMode } from "./useAiBuildFlow";

const STATUS: Partial<Record<BuildPhase, string>> = {
  analysing: "Reading your role…",
  drafting: "Drafting the role brief…",
  generating: "Building your pipeline…",
};

const TASKS = [
  { label: "Review workflow", prompt: "Review the entire hiring workflow. Identify missing steps, duplicated work, and opportunities to improve the candidate experience." },
  { label: "Build pipeline", prompt: "Build a hiring pipeline for this role with an application, candidate review, assessment, and interview stages." },
  { label: "Describe role", prompt: "Help me define this role: job title, location, responsibilities, and the experience a candidate needs." },
];

export type AssistantDockProps = {
  phase: BuildPhase;
  intakeMode: IntakeMode;
  question?: IntakeStep;
  stages: StageProposal[];
  brief: { reviewed: number; total: number };
  /** Offer starter tasks (an idle job with nothing said yet). */
  showTasks: boolean;
  onTask: (prompt: string) => void;
  onAnswer: (text: string) => void;
  onOpenTemplates: () => void;
  onOpenJd: () => void;
  onBackToQuestions: () => void;
  onTemplate: (role: string) => void;
  onGenerate: () => void;
  onChooseScope: (scope: PipelineScope) => void;
  onToggleStage: (id: string, included: boolean) => void;
  onRenameStage: (id: string, title: string) => void;
  onConfirmStages: () => void;
  onBack: () => void;
};

function Question({ children }: { children: ReactNode }): JSX.Element {
  return (
    <p className="assistant-dock-question">
      <span className="assistant-dock-mark" aria-hidden="true"><SparkleIcon /></span>
      <span>{children}</span>
    </p>
  );
}

/** What the assistant is asking right now, pinned directly above the composer. */
export function AssistantDock(props: AssistantDockProps): JSX.Element | null {
  const { phase } = props;
  const status = STATUS[phase];
  if (status) {
    return (
      <p className="assistant-dock-status" role="status">
        <span className="assistant-dock-mark assistant-dock-pulse" aria-hidden="true"><SparkleIcon /></span>
        {status}
      </p>
    );
  }

  if (phase === "intro" || phase === "collecting") {
    if (props.intakeMode === "templates") {
      return (
        <>
          <Question>Pick a template to start from</Question>
          <div className="assistant-dock-options">
            {TEMPLATE_ROLES.map((role) => (
              <button key={role} type="button" className="assistant-dock-option" onClick={() => props.onTemplate(role)}>
                <strong>{role}</strong>
                <span>{TEMPLATE_BLURB}</span>
              </button>
            ))}
          </div>
          <div className="assistant-dock-links">
            <button type="button" onClick={props.onBackToQuestions}>← Back to questions</button>
          </div>
        </>
      );
    }
    if (props.intakeMode === "jd") {
      return (
        <>
          <Question>{JD_PROMPT}</Question>
          <div className="assistant-dock-links">
            <button type="button" onClick={props.onBackToQuestions}>← Answer questions instead</button>
          </div>
        </>
      );
    }
    const question = props.question;
    if (!question) return null;
    return (
      <>
        <Question>{question.question}</Question>
        <div className="assistant-dock-chips" aria-label="Suggested answers">
          {question.chips.map((chip) => (
            <button key={chip} type="button" onClick={() => props.onAnswer(chip)}>{chip}</button>
          ))}
        </div>
        {question.key === "role" && (
          <div className="assistant-dock-links">
            <span>or</span>
            <button type="button" onClick={props.onOpenTemplates}>{TEMPLATE_LINK}</button>
            <button type="button" onClick={props.onOpenJd}>{JD_LINK}</button>
          </div>
        )}
      </>
    );
  }

  if (phase === "reviewing") {
    const { reviewed, total } = props.brief;
    const all = reviewed === total;
    return (
      <>
        <Question>Review the role brief</Question>
        <div className="assistant-dock-progress">
          <div className="assistant-dock-meter" aria-hidden="true"><span style={{ width: `${(reviewed / total) * 100}%` }} /></div>
          <small>{reviewed} of {total} sections checked — edit them in the panel on the right</small>
        </div>
        <div className="ai-build-actions">
          {!all && <button type="button" className="ai-build-ghost" onClick={props.onGenerate}>Skip review</button>}
          <button type="button" className="ai-build-primary" disabled={!all} onClick={props.onGenerate}>Generate pipeline</button>
        </div>
      </>
    );
  }

  if (phase === "choosing") {
    return (
      <>
        <Question>How far should I build the pipeline?</Question>
        <PipelineChoice onChoose={props.onChooseScope} />
      </>
    );
  }

  if (phase === "stages") {
    return (
      <>
        <Question>Which stages should I create?</Question>
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

  if (!props.showTasks) return null;
  return (
    <div className="assistant-dock-chips" aria-label="Suggested tasks">
      {TASKS.map((task) => (
        <button key={task.label} type="button" onClick={() => props.onTask(task.prompt)}>{task.label}</button>
      ))}
    </div>
  );
}
