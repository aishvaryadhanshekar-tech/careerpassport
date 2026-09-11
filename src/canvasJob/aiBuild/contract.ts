/**
 * Shared prop contracts for the hiring assistant v3 work. Each component owns its implementation;
 * these types are what the workspace wires against, so the streams compile independently.
 */
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { JobDraft } from "../../types";
import type { CanvasChatMessage } from "../CanvasNodeAssistant";
import type { BriefSectionKey, BuildPhase, IntakeView, PipelineScope, StageProposal } from "./buildPhase";

/**
 * The open intake shown in the composer card while the role is being described.
 * Option 1 (type) is the textarea; option 2 (record) toggles the assistant's own dictation;
 * option 3 calls `onUpload`; option 4 calls `onOpenTemplates` and the template list opens in the card.
 * Once a job description is attached its markdown fills the textarea, and the question and options step aside.
 * While `intake` is set, the composer never calls `onSubmit`: ⌘/Ctrl+Enter and the CTA both call `cta.onClick`,
 * and plain Enter adds a new line.
 */
export type ComposerIntake = {
  /** Top line of the composer card. */
  question: string;
  view: IntakeView;
  /** "Generate role brief". */
  cta: { label: string; disabled: boolean; onClick: () => void };
  onUpload: () => void;
  onOpenTemplates: () => void;
  onCloseTemplates: () => void;
  onTemplate: (role: string) => void;
};

/**
 * DOM contract. Expanded: `<aside class="canvas-assistant canvas-assistant-panel">`.
 * Collapsed: `<aside class="canvas-assistant canvas-assistant-collapsed">` holding one button labelled
 * "Open hiring assistant" (" (new message)" appended when unread), absolutely positioned at the top left of
 * `.funnel-body` and taking no layout width. Keep the labels "Message the hiring assistant" and "Send message".
 */
export type CanvasGlobalAssistantProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  messages: CanvasChatMessage[];
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  /** The current step (review, pipeline choice, stages, node suggestions), shown at the top of the composer card. */
  dock?: ReactNode;
  busy?: boolean;
  /** Spinner line inside the composer card while busy. */
  busyLabel?: string | null;
  context?: { title: string; onClear: () => void };
  placeholder?: string;
  attachments?: ReactNode;
  hasAttachments?: boolean;
  onAttach?: () => void;
  focusSignal?: number;
  /** Set during intro/collecting: renders the numbered options and the "Generate role brief" CTA. */
  intake?: ComposerIntake;
};

/** The step the assistant is on after the intake. Returns null during intro, collecting and busy phases. */
export type AssistantDockProps = {
  phase: BuildPhase;
  stages: StageProposal[];
  brief: { reviewed: number; total: number };
  showTasks: boolean;
  onTask: (prompt: string) => void;
  /** Opens the inspector on the first unreviewed section. */
  onReviewBrief: () => void;
  onGenerate: () => void;
  onChooseScope: (scope: PipelineScope) => void;
  onToggleStage: (id: string, included: boolean) => void;
  onRenameStage: (id: string, title: string) => void;
  onConfirmStages: () => void;
  onBack: () => void;
};

/** The Role brief inspector: one panel, four tabs. */
export type BriefInspectorProps = {
  draft: JobDraft;
  setDraft: Dispatch<SetStateAction<JobDraft>>;
  tab: BriefSectionKey;
  onTab: (key: BriefSectionKey) => void;
  reviewed: readonly BriefSectionKey[];
  canGenerate: boolean;
  /** Ticks the section; the workspace then advances to the next unreviewed tab. */
  onReviewed: (key: BriefSectionKey) => void;
  onGenerate: () => void;
};
