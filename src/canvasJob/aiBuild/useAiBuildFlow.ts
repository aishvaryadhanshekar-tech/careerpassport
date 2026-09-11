import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ReactFlowInstance } from "@xyflow/react";
import type { JobDraft } from "../../types";
import type { FunnelNode } from "../funnelModel";
import type { CanvasChatMessage } from "../CanvasNodeAssistant";
import {
  ANALYSING_MS,
  BRIEF_GENERATION_MS,
  BRIEF_HUB_ID,
  DRAFT_STEP_MS,
  STAGGER_MS,
  briefGenerationAt,
  briefReviewed,
  nextUnreviewed,
  withSectionReviewed,
  type BriefGeneration,
  type BriefSectionKey,
  type BuildPhase,
  type IntakeView,
  type PipelineScope,
  type ProfileProposal,
  type StageProposal,
} from "./buildPhase";
import { briefHub, buildProfileProposal, inferRole, proposeStages, stageNodesFor } from "./aiBuildFixtures";
import { INTAKE_WELCOME, TEMPLATE_BLURB } from "./intake";
import { readDocuments, withDocumentText, withoutDocumentText } from "./mockJd";

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

const HOW_FAR = "How far should I build the pipeline?";
const WHICH_STAGES = "Which stages should I create?";
const BRIEF_READY_MESSAGE = "Your role brief is ready — review each section, then generate the pipeline.";

/** Entrance animation length, kept in sync with `fn-node-in` in funnel.css. */
const ENTER_MS = 320;

export function useAiBuildFlow(deps: Deps) {
  const [phase, setPhase] = useState<BuildPhase>("off");
  const [focusNode, setFocusNode] = useState<string | null>(null);
  // "Build with AI" mounts the canvas for the first time, so the camera must wait for React Flow.
  const [focusNonce, setFocusNonce] = useState(0);
  const [enteringIds, setEnteringIds] = useState<Record<string, number>>({});
  const [proposal, setProposal] = useState<ProfileProposal | null>(null);
  const [stages, setStages] = useState<StageProposal[]>([]);
  const [scope, setScope] = useState<PipelineScope>("full");
  const [documentError, setDocumentError] = useState("");
  /** The uploaded JD markdown last put into the composer, so removing the file can take it back out. */
  const [documentBrief, setDocumentBrief] = useState("");
  const [intakeView, setIntakeView] = useState<IntakeView>("open");
  /** The generating animation's current step; null when no brief is being generated. */
  const [generation, setGeneration] = useState<BriefGeneration | null>(null);
  /** The Role brief section open in the inspector. */
  const [briefTab, setBriefTab] = useState<BriefSectionKey>("summary");

  const timers = useRef<number[]>([]);
  /** Timers for the brief animation, kept apart so a restart only cancels its own steps. */
  const generationTimers = useRef<number[]>([]);
  const latest = useRef(deps);
  latest.current = deps;

  const after = useCallback((ms: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, ms));
  }, []);

  const cancelGeneration = useCallback(() => {
    generationTimers.current.forEach((id) => window.clearTimeout(id));
    generationTimers.current = [];
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      generationTimers.current.forEach((id) => window.clearTimeout(id));
      generationTimers.current = [];
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

  /** "Build with AI": the assistant welcomes the person and the composer offers the ways to describe the role. */
  const begin = useCallback(() => {
    cancelGeneration();
    setPhase("intro");
    setFocusNode("job");
    setProposal(null);
    setStages([]);
    setGeneration(null);
    setBriefTab("summary");
    setDocumentError("");
    setDocumentBrief("");
    setIntakeView("open");
    latest.current.setGlobalOpen(true);
    latest.current.setGlobalPrompt("");
    latest.current.setGlobalMessages([{ role: "assistant", text: INTAKE_WELCOME }]);
  }, [cancelGeneration]);

  const noteTyping = useCallback(() => {
    setPhase((current) => (current === "intro" ? "collecting" : current));
  }, []);

  const openTemplates = useCallback(() => setIntakeView("templates"), []);
  const closeTemplates = useCallback(() => setIntakeView("open"), []);

  /** The uploaded JD lands in the composer as editable markdown, after anything already typed. */
  const ingestDocuments = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const result = await readDocuments(files);
    setDocumentError(result.error ?? "");
    if (!result.markdown) return;
    setIntakeView("open");
    setDocumentBrief((current) => withDocumentText(current, result.markdown));
    latest.current.setGlobalPrompt((current) => withDocumentText(current, result.markdown));
    setPhase((current) => (current === "intro" ? "collecting" : current));
  }, []);

  /** Removing the uploaded JD takes its text back out of the composer, unless it has been edited. */
  const clearDocumentBrief = useCallback(() => {
    latest.current.setGlobalPrompt((current) => withoutDocumentText(current, documentBrief));
    setDocumentBrief("");
  }, [documentBrief]);

  /**
   * "Generate role brief": reads `message`, then fills the Role brief card section by section.
   * The animation is driven by `briefGenerationAt(elapsed)` at 0, ANALYSING_MS and every
   * DRAFT_STEP_MS after, and ends in the review phase at BRIEF_GENERATION_MS.
   * `opts.echo` is what the history shows as sent (defaults to `message`).
   */
  const generateBrief = useCallback(
    (message: string, opts: { echo?: string } = {}) => {
      const text = message.trim();
      if (!text) return;
      const { setGlobalPrompt, setItems } = latest.current;
      cancelGeneration();
      const step = (elapsed: number, run: () => void) => {
        generationTimers.current.push(window.setTimeout(run, elapsed));
      };

      record({ role: "user", text: opts.echo ?? text });
      setGlobalPrompt("");
      setIntakeView("open");
      setProposal(null);
      setBriefTab("summary");
      setPhase("analysing");
      setGeneration(briefGenerationAt(0));
      // The card lands straight away so the canvas visibly starts working while the brief is read.
      setItems((all) => [
        ...all.filter((item) => item.id !== BRIEF_HUB_ID && item.parent !== BRIEF_HUB_ID),
        briefHub(),
      ]);
      reveal([BRIEF_HUB_ID]);
      setFocusNode(BRIEF_HUB_ID);

      step(ANALYSING_MS, () => {
        const next = buildProfileProposal(text, latest.current.draft);
        setProposal(next);
        latest.current.setDraft(next.draft);
        latest.current.setItems((all) =>
          all.map((item) => (item.id === BRIEF_HUB_ID ? { ...next.hub, position: item.position } : item)),
        );
        setGeneration(briefGenerationAt(ANALYSING_MS));
        // A manual interaction may have ended the guided flow; the brief still finishes filling in.
        setPhase((current) => (current === "analysing" ? "drafting" : current));
      });

      for (let elapsed = ANALYSING_MS + DRAFT_STEP_MS; elapsed < BRIEF_GENERATION_MS; elapsed += DRAFT_STEP_MS) {
        const at = elapsed;
        step(at, () => setGeneration(briefGenerationAt(at)));
      }

      step(BRIEF_GENERATION_MS, () => {
        generationTimers.current = [];
        setGeneration(null);
        setPhase((current) => (current === "analysing" || current === "drafting" ? "reviewing" : current));
        record({ role: "assistant", text: BRIEF_READY_MESSAGE });
      });
    },
    [cancelGeneration, record, reveal],
  );

  /** Opens the Role brief inspector on `key`, or the first section still to review. */
  const openBrief = useCallback((key?: BriefSectionKey) => {
    const { items, select } = latest.current;
    setBriefTab(key ?? nextUnreviewed(briefReviewed(items)) ?? "summary");
    select(BRIEF_HUB_ID);
  }, []);

  /** Ticks a section off and moves to the next one still to check; stays put once all are done. */
  const markReviewed = useCallback((key: BriefSectionKey) => {
    const { items, setItems } = latest.current;
    setItems((all) => withSectionReviewed(all, key));
    const next = nextUnreviewed(briefReviewed(withSectionReviewed(items, key)), key);
    setBriefTab(next ?? key);
  }, []);

  /** The workspace has laid the template out; the guided flow ends with a note of what was loaded. */
  const finishWithTemplate = useCallback(
    (role: string) => {
      cancelGeneration();
      setGeneration(null);
      setPhase("done");
      setFocusNode(null);
      setStages([]);
      setIntakeView("open");
      latest.current.setGlobalPrompt("");
      record(
        { role: "user", text: `Use the ${role} template` },
        { role: "assistant", text: `Loaded the ${role} template — ${TEMPLATE_BLURB.toLowerCase()}. Everything stays editable.` },
      );
    },
    [cancelGeneration, record],
  );

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
        // Frame the top of the new pipeline at a readable zoom; fitting every round would shrink it to specks.
        after(80, () =>
          latest.current.flow.current?.fitView({
            nodes: ["job", BRIEF_HUB_ID, "prospects", "application"].map((id) => ({ id })),
            padding: 0.25,
            maxZoom: 1,
            duration: 500,
          }),
        );
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

  return {
    phase,
    focusNode,
    focusNonce,
    refocus,
    enteringIds,
    proposal,
    stages,
    documentError,
    documentBrief,
    intakeView,
    generation,
    briefTab,
    setBriefTab,
    begin,
    noteTyping,
    ingestDocuments,
    clearDocumentBrief,
    generateBrief,
    openTemplates,
    closeTemplates,
    openBrief,
    markReviewed,
    finishWithTemplate,
    requestGenerate,
    choose,
    toggleStage,
    renameStage,
    confirmStages,
    backToChoice,
    leave,
  };
}

export type AiBuildFlow = ReturnType<typeof useAiBuildFlow>;
