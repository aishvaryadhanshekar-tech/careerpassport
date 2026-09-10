import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useDictation } from "../shared/useDictation";
import { SparkleIcon } from "../shared/icons";
import "./canvas-global-assistant.css";

/**
 * The hiring assistant, docked as the canvas's left column; collapses to a slim rail.
 * History scrolls above; `dock` — what's being asked right now — sits pinned on the composer.
 */
export function CanvasGlobalAssistant({ collapsed, onToggleCollapsed, messages, prompt, onPromptChange, onSubmit, dock, busy = false, context, placeholder, attachments, hasAttachments = false, onAttach, focusSignal = 0 }: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  messages: { role: "user" | "assistant"; text: string }[];
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  /** The current question or action, pinned directly above the composer. */
  dock?: ReactNode;
  /** The assistant is working; the composer waits and the dock shows the status. */
  busy?: boolean;
  /** Set while the conversation is about one canvas node rather than the whole workflow. */
  context?: { title: string; onClear: () => void };
  placeholder?: string;
  /** Attached-file chips, shown inside the composer. */
  attachments?: ReactNode;
  hasAttachments?: boolean;
  onAttach?: () => void;
  /** Bump to move focus into the composer (for example after a node's AI button). */
  focusSignal?: number;
}) {
  const panelId = useId();
  const rail = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const history = useRef<HTMLDivElement>(null);
  const collapsedRef = useRef(collapsed);
  collapsedRef.current = collapsed;
  const speech = useDictation({ value: prompt, onChange: onPromptChange });
  const stopSpeech = useRef(speech.stopRecording);
  stopSpeech.current = speech.stopRecording;
  const [seen, setSeen] = useState(messages.length);
  const unread = collapsed && messages.length > seen;

  useEffect(() => {
    if (!collapsed) setSeen(messages.length);
  }, [collapsed, messages.length]);

  useEffect(() => {
    if (collapsed) stopSpeech.current();
  }, [collapsed]);

  useEffect(() => {
    if (focusSignal && !collapsed) input.current?.focus();
    // Focus follows an explicit request only, never every expand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignal]);

  useEffect(() => {
    if (!collapsed && history.current) history.current.scrollTop = history.current.scrollHeight;
  }, [messages, collapsed]);

  function collapse() {
    speech.stopRecording();
    onToggleCollapsed();
    requestAnimationFrame(() => rail.current?.focus());
  }

  function expand() {
    onToggleCollapsed();
    requestAnimationFrame(() => input.current?.focus());
  }

  async function dictate() {
    if (speech.recording) speech.stopRecording();
    else {
      await speech.startRecording();
      // Permission may finish after the user has collapsed the panel.
      if (collapsedRef.current) stopSpeech.current();
    }
  }

  if (collapsed) {
    return <aside className="canvas-assistant canvas-assistant-rail" aria-label="Hiring assistant">
      <button ref={rail} type="button" className="canvas-assistant-expand" aria-label={unread ? "Open hiring assistant (new message)" : "Open hiring assistant"} aria-expanded={false} onClick={expand}>
        <span className="canvas-global-mark" aria-hidden="true"><SparkleIcon /></span>
        {unread && <span className="canvas-assistant-unread" aria-hidden="true" />}
      </button>
    </aside>;
  }

  return <aside id={panelId} className="canvas-assistant canvas-assistant-panel" aria-label="Hiring assistant"
    onKeyDown={(event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      if (context) context.onClear();
      else collapse();
    }}>
    <header className="canvas-assistant-header">
      <span className="canvas-global-mark" aria-hidden="true"><SparkleIcon /></span>
      <strong>Hiring assistant</strong>
      <button type="button" aria-label="Collapse hiring assistant" aria-expanded aria-controls={panelId} onClick={collapse}>«</button>
    </header>
    <div ref={history} className="canvas-assistant-history" role="log" aria-label="Conversation" aria-live="polite">
      <div className="canvas-assistant-thread">
        {messages.length === 0 && <p className="canvas-assistant-msg canvas-assistant-msg-assistant">{context ? `Ask me to change ${context.title} — I'll suggest edits you can accept or dismiss.` : "Ask me to review the workflow or change anything on the canvas."}</p>}
        {messages.map((message, index) => <p key={index} className={`canvas-assistant-msg canvas-assistant-msg-${message.role}`}><span className="canvas-global-sr-only">{message.role === "user" ? "You: " : "Assistant: "}</span>{message.text}</p>)}
      </div>
    </div>
    <div className="canvas-assistant-dock">
      {context && <div className="canvas-assistant-context">
        <span>Talking about <strong>{context.title}</strong></span>
        <button type="button" aria-label="Back to the whole-canvas conversation" onClick={context.onClear}>×</button>
      </div>}
      {dock && <div className="canvas-assistant-prompt">{dock}</div>}
      <form onSubmit={(event) => { event.preventDefault(); if (!busy && (prompt.trim() || hasAttachments)) { speech.stopRecording(); onSubmit(); } }}>
        <div className={`canvas-assistant-composer${busy ? " canvas-assistant-composer-busy" : ""}`}>
          {attachments}
          <textarea ref={input} rows={2} value={prompt} aria-label="Message the hiring assistant" placeholder={placeholder ?? "Ask about your workflow…"} disabled={busy} onChange={(event) => onPromptChange(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
          <div className="canvas-assistant-composer-actions">
            {onAttach && <button type="button" aria-label="Attach a document" title="Attach a document" disabled={busy} onClick={onAttach}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 11.5-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.5 3.5 0 0 1 5 5l-8.6 8.6a2 2 0 0 1-2.8-2.8l7.9-7.9"/></svg>
            </button>}
            <span className="canvas-assistant-spacer" />
            <button type="button" className={speech.recording ? "canvas-global-recording" : undefined} aria-label={speech.recording ? "Stop dictation" : "Dictate a message"} aria-pressed={speech.recording} disabled={busy} onClick={() => void dictate()}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3m-4 0h8"/></svg>
            </button>
            <button className="canvas-assistant-send" type="submit" aria-label="Send message" disabled={busy || (!prompt.trim() && !hasAttachments)}>↑</button>
          </div>
        </div>
        {speech.interim && <p className="canvas-global-status">{speech.interim}</p>}
        {(speech.micBlocked || speech.micFailed || speech.noSpeechApi) && <p className="canvas-global-status" role="status">Dictation is unavailable. You can type instead.</p>}
      </form>
    </div>
  </aside>;
}
