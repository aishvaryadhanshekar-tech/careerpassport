import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ReactFlowInstance } from "@xyflow/react";
import type { JobDraft } from "../../types";
import type { FunnelNode } from "../funnelModel";
import { layoutPipeline } from "../pipelineModel";
import type { CanvasChatMessage } from "../CanvasNodeAssistant";
import {
  ANALYSING_MS,
  BRIEF_HUB_ID,
  DRAFT_FILL_MS,
  DRAFT_STEP_MS,
  STAGGER_MS,
  briefSections,
  type BuildPhase,
  type PipelineScope,
  type ProfileProposal,
  type StageProposal,
} from "./buildPhase";
import { briefHub, buildProfileProposal, inferRole, proposeStages, stageNodesFor } from "./aiBuildFixtures";
import { INTAKE_STEPS, INTAKE_WELCOME, TEMPLATE_BLURB, applyIntake, composeBrief, type IntakeAnswers } from "./intake";
import { readDocuments } from "./mockJd";

type Deps = {
  items: FunnelNode[];
  setItems: Dispatch<SetStateAction<FunnelNode[]>>;
  draft: JobDraft;
  setDraft: Dispatch<SetStateAction<JobDraft>>;
  /** Expands (true) the docked assistant; the flow never collapses it. */
  setGlobalOpen: (open: boolean) => void;
  setGlobalPrompt: Dispatch<SetStateAction<string>>;
  setGlobalMessages: Dispatch<SetStateAction<CanvasChatMessage[]>>;
  flow: { current: ReactFlowInstance | null };
  /** The workspace shares one camera timer; the flow must not race it. */
  clearCenterTimer: () => void;
  /** Select a canvas node and open its inspector; null clears the selection. */
  select: (id: string | null) => void;
};

/** How the person is describing the role: the question steps, a pasted JD, or a template. */
export type IntakeMode = "questions" | "jd" | "templates";

type Intake = { mode: IntakeMode; step: number; answers: IntakeAnswers };

const FRESH_INTAKE: Intake = { mode: "questions", step: 0, answers: {} };

const HOW_FAR = "How far should I build the pipeline?";
const WHICH_STAGES = "Which stages should I create?";

/** Entrance animation length, kept in sync with `fn-node-in` in funnel.css. */
const ENTER_MS = 320;
/** Card footprint for framing nodes React Flow has not measured yet. */
const CARD = { width: 260, height: 140 };

export function useAiBuildFlow(deps: Deps) {
  const [phase, setPhase] = useState<BuildPhase>("off");
  const [focusNode, setFocusNode] = useState<string | null>(null);
  // "Build with AI" mounts the canvas for the first time, so the camera must wait for React Flow.
  const [focusNonce, setFocusNonce] = useState(0);
  const [enteringIds, setEnteringIds] = useState<Record<string, number>>({});
  /** Brief nodes still showing as skeletons. */
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [proposal, setProposal] = useState<ProfileProposal | null>(null);
  const [stages, setStages] = useState<StageProposal[]>([]);
  const [scope, setScope] = useState<PipelineScope>("full");
  const [documentError, setDocumentError] = useState("");
  const [intake, setIntake] = useState<Intake>(FRESH_INTAKE);

  const timers = useRef<number[]>([]);
  const latest = useRef(deps);
  latest.current = deps;

  const after = useCallback((ms: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, ms));
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    },
    [],
  );

  /** Adds to the conversation history; the dock above the composer shows what's asked now. */
  const record = useCallback((...messages: CanvasChatMessage[]) => {
    latest.current.setGlobalMessages((history) => [...history, ...messages]);
  }, []);

  /** Reveal nodes with a stagger, then drop the metadata so it never replays. */
  const reveal = useCallback(
    (ids: string[]) => {
      const map: Record<string, number> = {};
      ids.forEach((id, index) => (map[id] = index));
      setEnteringIds(map);
      after(ENTER_MS + ids.length * STAGGER_MS + 80, () => setEnteringIds({}));
    },
    [after],
  );

  /** Frame the hub and where its sections will land before they exist, so the camera never chases them. */
  const frameBrief = useCallback((sections: FunnelNode[]) => {
    const { items, flow, clearCenterTimer } = latest.current;
    const ids = new Set([BRIEF_HUB_ID, ...sections.map((section) => section.id)]);
    const laid = layoutPipeline([
      ...items.filter((item) => !ids.has(item.id) || item.id === BRIEF_HUB_ID),
      ...sections,
    ]).filter((item) => ids.has(item.id));
    if (!laid.length || !flow.current) return;
    const xs = laid.map((item) => item.position.x);
    const ys = laid.map((item) => item.position.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    clearCenterTimer();
    void flow.current.fitBounds(
      { x, y, width: Math.max(...xs) + CARD.width - x, height: Math.max(...ys) + CARD.height - y },
      { padding: 0.25, duration: 500 },
    );
  }, []);

  const begin = useCallback(() => {
    setPhase("intro");
    setFocusNode("job");
    setProposal(null);
    setStages([]);
    setPendingIds([]);
    setDocumentError("");
    setIntake(FRESH_INTAKE);
    latest.current.setGlobalOpen(true);
    latest.current.setGlobalPrompt("");
    latest.current.setGlobalMessages([{ role: "assistant", text: INTAKE_WELCOME }]);
  }, []);

  const noteTyping = useCallback(() => {
    setPhase((current) => (current === "intro" ? "collecting" : current));
  }, []);

  /** Uploaded documents land in the composer as markdown the user can edit. */
  const ingestDocuments = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const result = await readDocuments(files);
    setDocumentError(result.error ?? "");
    if (!result.markdown) return;
    // A JD answers every question at once, so the next send drafts from it directly.
    setIntake((current) => ({ ...current, mode: "jd" }));
    latest.current.setGlobalPrompt((current) =>
      current.trim() ? `${current.trim()}\n\n${result.markdown}` : result.markdown,
    );
    setPhase((current) => (current === "intro" ? "collecting" : current));
  }, []);

  /**
   * Drafts the role brief from `message`. `options.draft` is the draft just written by the
   * intake, before state catches up; `options.echo` is what the history shows as sent, or
   * false when the intake has already recorded the answer.
   */
  const submit = useCallback(
    (message: string, options: { draft?: JobDraft; echo?: string | false } = {}) => {
      const { setGlobalPrompt, setItems } = latest.current;
      if (options.echo !== false) record({ role: "user", text: options.echo ?? message });
      setGlobalPrompt("");
      setPhase("analysing");
      // The hub lands straight away so the canvas visibly starts working while the brief is read.
      setItems((all) => [
        ...all.filter((item) => item.id !== BRIEF_HUB_ID && item.parent !== BRIEF_HUB_ID),
        briefHub(),
      ]);
      setPendingIds([BRIEF_HUB_ID]);
      reveal([BRIEF_HUB_ID]);
      setFocusNode(BRIEF_HUB_ID);

      after(ANALYSING_MS, () => {
        const next = buildProfileProposal(message, options.draft ?? latest.current.draft);
        setProposal(next);
        latest.current.setDraft(next.draft);
        latest.current.setItems((all) => all.map((item) => (item.id === BRIEF_HUB_ID ? next.hub : item)));
        setPendingIds([]);
        setFocusNode(null);
        setPhase("drafting");
        frameBrief(next.sections);

        // Sections arrive one at a time, each a skeleton first, so the drafting reads as real work.
        next.sections.forEach((section, index) => {
          after(index * DRAFT_STEP_MS, () => {
            latest.current.setItems((all) => [...all.filter((item) => item.id !== section.id), section]);
            setPendingIds((ids) => [...ids, section.id]);
            reveal([section.id]);
          });
          after(index * DRAFT_STEP_MS + DRAFT_FILL_MS, () =>
            setPendingIds((ids) => ids.filter((id) => id !== section.id)),
          );
        });

        after(next.sections.length * DRAFT_STEP_MS, () => {
          setPhase("reviewing");
          record({ role: "assistant", text: `Your role brief for ${next.role} is ready — four sections on the canvas.` });
          // Review opens on the first section so the person lands in an editor, not on a blank canvas.
          latest.current.select(next.sections[0]?.id ?? BRIEF_HUB_ID);
        });
      });
    },
    [after, frameBrief, record, reveal],
  );

  /** Records one intake answer; the last one drafts the brief from everything answered. */
  const answer = useCallback(
    (text: string) => {
      const step = INTAKE_STEPS[intake.step];
      if (!step) return;
      const reply = text.trim();
      const answers = { ...intake.answers, [step.key]: reply };
      setIntake({ ...intake, step: intake.step + 1, answers });
      latest.current.setGlobalPrompt("");
      record({ role: "assistant", text: step.question }, { role: "user", text: reply });
      if (INTAKE_STEPS[intake.step + 1]) {
        setPhase("collecting");
        return;
      }
      const draft = applyIntake(answers, latest.current.draft);
      latest.current.setDraft(draft);
      submit(composeBrief(answers), { draft, echo: false });
    },
    [intake, record, submit],
  );

  const openTemplates = useCallback(() => setIntake((current) => ({ ...current, mode: "templates" })), []);
  const openJd = useCallback(() => setIntake((current) => ({ ...current, mode: "jd" })), []);
  const backToQuestions = useCallback(() => setIntake((current) => ({ ...current, mode: "questions" })), []);

  /** The workspace has laid the template out; the guided flow ends with a note of what was loaded. */
  const finishWithTemplate = useCallback(
    (role: string) => {
      setPhase("done");
      setFocusNode(null);
      setPendingIds([]);
      setStages([]);
      setIntake(FRESH_INTAKE);
      latest.current.setGlobalPrompt("");
      record(
        { role: "user", text: `Use the ${role} template` },
        { role: "assistant", text: `Loaded the ${role} template — ${TEMPLATE_BLURB.toLowerCase()}. Everything stays editable.` },
      );
    },
    [record],
  );

  /** Tick a section off and move straight to the next one still to check. */
  const markReviewed = useCallback((id: string) => {
    const { items, setItems, select } = latest.current;
    setItems((all) => all.map((item) => (item.id === id ? { ...item, reviewed: true } : item)));
    const order = briefSections(items);
    const at = order.findIndex((item) => item.id === id);
    const next = [...order.slice(at + 1), ...order.slice(0, Math.max(at, 0))].find((item) => !item.reviewed);
    select(next ? next.id : BRIEF_HUB_ID);
  }, []);

  /** The Role brief hands off to the "how far should I build?" question in the dock. */
  const requestGenerate = useCallback(() => {
    latest.current.select(null);
    latest.current.setGlobalOpen(true);
    setFocusNode(BRIEF_HUB_ID);
    setPhase("choosing");
  }, []);

  const generate = useCallback(
    (chosen: StageProposal[], chosenScope: PipelineScope, role: string) => {
      setPhase("generating");
      const { draft, setItems } = latest.current;
      const added = stageNodesFor(chosen, role, draft);
      const fresh = added.filter((item) => !latest.current.items.some((n) => n.id === item.id));
      // One commit: appending node-by-node re-runs the layout and makes siblings jump.
      setItems((all) => [...all, ...fresh]);
      reveal(fresh.map((n) => n.id));
      latest.current.clearCenterTimer();
      setFocusNode(null);
      after(ENTER_MS + fresh.length * STAGGER_MS + 160, () => {
        setPhase("done");
        // The brief has done its job; fold it away. It stays one click from expanding again.
        latest.current.setItems((all) =>
          all.map((item) => (item.id === BRIEF_HUB_ID ? { ...item, collapsed: true } : item)),
        );
        after(80, () => latest.current.flow.current?.fitView({ padding: 0.2, duration: 500 }));
        record({
          role: "assistant",
          text:
            chosenScope === "full"
              ? "Your draft pipeline is on the canvas. Select a stage to configure it, or ask me for changes."
              : "The application step is on the canvas. Add interview rounds whenever you're ready.",
        });
      });
    },
    [after, record, reveal],
  );

  const choose = useCallback(
    (chosenScope: PipelineScope) => {
      setScope(chosenScope);
      const role = proposal?.role ?? inferRole("", latest.current.draft);
      const proposed = proposeStages(role, chosenScope);
      if (chosenScope === "application") {
        record({ role: "assistant", text: HOW_FAR }, { role: "user", text: "Just the application" });
        generate(proposed, chosenScope, role);
        return;
      }
      setStages(proposed);
      setPhase("stages");
    },
    [generate, proposal, record],
  );

  const toggleStage = useCallback((id: string) => {
    setStages((all) =>
      all.map((stage) =>
        stage.id === id && !stage.required ? { ...stage, included: !stage.included } : stage,
      ),
    );
  }, []);

  const renameStage = useCallback((id: string, title: string) => {
    setStages((all) => all.map((stage) => (stage.id === id ? { ...stage, title } : stage)));
  }, []);

  const confirmStages = useCallback(() => {
    const role = proposal?.role ?? inferRole("", latest.current.draft);
    const chosen = stages.filter((stage) => stage.included);
    // Recorded here rather than on the choice, so going Back never leaves a stale answer behind.
    record(
      { role: "assistant", text: HOW_FAR },
      { role: "user", text: "Entire pipeline" },
      { role: "assistant", text: WHICH_STAGES },
      { role: "user", text: chosen.map((stage) => stage.title).join(", ") },
    );
    generate(chosen, scope, role);
  }, [generate, proposal, record, scope, stages]);

  const backToChoice = useCallback(() => setPhase("choosing"), []);

  /** Any manual canvas interaction ends the guided flow. */
  const leave = useCallback(() => {
    setPhase((current) => (current === "off" ? current : "done"));
    setFocusNode(null);
  }, []);

  const refocus = useCallback(() => setFocusNonce((n) => n + 1), []);

  /** The intake question awaiting an answer, if the assistant is still asking. */
  const question =
    (phase === "intro" || phase === "collecting") && intake.mode === "questions" ? INTAKE_STEPS[intake.step] : undefined;

  return {
    phase,
    focusNode,
    focusNonce,
    refocus,
    enteringIds,
    pendingIds,
    proposal,
    stages,
    documentError,
    question,
    intakeMode: intake.mode,
    begin,
    noteTyping,
    ingestDocuments,
    submit,
    answer,
    openTemplates,
    openJd,
    backToQuestions,
    finishWithTemplate,
    markReviewed,
    requestGenerate,
    choose,
    toggleStage,
    renameStage,
    confirmStages,
    backToChoice,
    leave,
  };
}
