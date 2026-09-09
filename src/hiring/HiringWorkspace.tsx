import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { JobDraft } from "../types";
import type { Capability } from "./types";
import { demoService } from "../demo/service";
import { operations } from "./service";
import { SetupPanel } from "./SetupPanel";
import { BriefPanel } from "./BriefPanel";
import { ProspectsPanel } from "./ProspectsPanel";
import { ReviewPanel } from "./ReviewPanel";
import { MessagesPanel } from "./MessagesPanel";
import { AssessmentsPanel } from "./AssessmentsPanel";
import {
  ActivityPanel,
  ClientPanel,
  TasksPanel,
  TeamPanel,
} from "./CoordinationPanels";
import { Empty } from "./shared";
import "./hiring.css";

export function HiringWorkspace({
  jobId,
  capability,
  draft,
  setDraft,
}: {
  jobId: string;
  capability: Capability;
  draft: JobDraft;
  setDraft: Dispatch<SetStateAction<JobDraft>>;
}) {
  const [, refresh] = useState(0);
  const [notice, setNotice] = useState(""),
    [error, setError] = useState(false),
    [candidateId, setCandidateId] = useState("");
  useEffect(() => demoService().subscribe(() => refresh((v) => v + 1)), []);
  const project = demoService().get(jobId);
  function run(action: () => unknown, message = "") {
    try {
      const result = action();
      if (result instanceof Promise) {
        void result
          .then(() => {
            setError(false);
            setNotice(message);
          })
          .catch((e) => {
            setError(true);
            setNotice(
              e instanceof Error
                ? e.message
                : "Unable to complete this action.",
            );
          });
      } else {
        setError(false);
        setNotice(message);
        refresh((v) => v + 1);
      }
    } catch (e) {
      setError(true);
      setNotice(
        e instanceof Error ? e.message : "Unable to complete this action.",
      );
    }
  }
  if (!project)
    return <Empty>Save the role first to initialize its demo workspace.</Empty>;
  const props = { jobId, project, ops: operations(project), run };
  return (
    <div className="hiring-workspace">
      <div className="hire-demo-label">
        <span /> DEMO WORKSPACE <small>Local data · no external sends</small>
      </div>
      {notice && (
        <div
          className={error ? "hire-error" : "hire-notice"}
          role={error ? "alert" : "status"}
        >
          <span>{notice}</span>
          <button
            aria-label="Dismiss workspace message"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}
      {candidateId ? (
        <>
          <button onClick={() => setCandidateId("")}>
            ← Back to action queue
          </button>
          <ReviewPanel {...props} initialCandidate={candidateId} />
        </>
      ) : (
        <>
          {capability === "setup" && (
            <SetupPanel {...props} draft={draft} setDraft={setDraft} />
          )}
          {capability === "brief" && <BriefPanel {...props} draft={draft} />}
          {capability === "prospects" && <ProspectsPanel {...props} />}
          {capability === "review" && <ReviewPanel {...props} />}
          {capability === "messages" && <MessagesPanel {...props} />}
          {capability === "assessments" && <AssessmentsPanel {...props} />}
          {capability === "team" && <TeamPanel {...props} />}
          {capability === "tasks" && (
            <TasksPanel {...props} onCandidate={setCandidateId} />
          )}
          {capability === "client" && <ClientPanel {...props} />}
          {capability === "activity" && <ActivityPanel {...props} />}
        </>
      )}
    </div>
  );
}
