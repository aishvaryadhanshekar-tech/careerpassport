import { useEffect, useId, useRef, useState, type JSX } from "react";
import { useDictation } from "../shared/useDictation";
import { SparkleIcon } from "../shared/icons";
import type { CanvasGlobalAssistantProps } from "./aiBuild/contract";
import { TEMPLATE_BLURB, TEMPLATE_ROLES } from "./aiBuild/intake";
import "./canvas-global-assistant.css";

const MicIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3m-4 0h8"/></svg>;
const ClipIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 11.5-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.5 3.5 0 0 1 5 5l-8.6 8.6a2 2 0 0 1-2.8-2.8l7.9-7.9"/></svg>;
const GridIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>;

/** One assistant line: the ✦ avatar and name open a consecutive run of assistant messages. */
function AssistantLine({ text, first }: { text: string; first: boolean }): JSX.Element {
  return <div className={`canvas-assistant-msg canvas-assistant-msg-assistant${first ? " canvas-assistant-msg-first" : ""}`}>
    {first && <span className="canvas-assistant-avatar" aria-hidden="true"><SparkleIcon /></span>}
    <div className="canvas-assistant-msg-body">
      {first && <span className="canvas-assistant-name" aria-hidden="true">Hiring assistant</span>}
      <p><span className="canvas-global-sr-only">Assistant: </span>{text}</p>
    </div>
  </div>;
}

/**
 * The hiring assistant, docked as the canvas's left column; collapses to a floating pill over the canvas.
 * History scrolls above one composer card: the intake's four ways to start, or the current step (`dock`) above the textarea.
 */
export function CanvasGlobalAssistant({ collapsed, onToggleCollapsed, messages, prompt, onPromptChange, onSubmit, dock, busy = false, busyLabel, context, placeholder, attachments, hasAttachments = false, onAttach, focusSignal = 0, intake }: CanvasGlobalAssistantProps): JSX.Element {
  const panelId = useId();
  const panel = useRef<HTMLElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const collapseButton = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const templateList = useRef<HTMLDivElement>(null);
  const history = useRef<HTMLDivElement>(null);
  const collapsedRef = useRef(collapsed);
  collapsedRef.current = collapsed;
  const speech = useDictation({ value: prompt, onChange: onPromptChange });
  const stopSpeech = useRef(speech.stopRecording);
  stopSpeech.current = speech.stopRecording;
  const [seen, setSeen] = useState(messages.length);
  const unread = collapsed && messages.length > seen;
  const view = intake?.view;
  const lastView = useRef(view);

  useEffect(() => {
    if (!collapsed) setSeen(messages.length);
  }, [collapsed, messages.length]);

  useEffect(() => {
    if (collapsed) stopSpeech.current();
  }, [collapsed]);

  useEffect(() => {
    if (focusSignal && !collapsed) (input.current ?? collapseButton.current)?.focus();
    // Focus follows an explicit request only, never every expand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignal]);

  useEffect(() => {
    if (!collapsed && history.current) history.current.scrollTop = history.current.scrollHeight;
  }, [messages, collapsed]);

  // Opening or closing the template list removes the focused button, so move focus with it.
  useEffect(() => {
    const was = lastView.current;
    lastView.current = view;
    if (view === was || collapsed) return;
    const active = document.activeElement;
    if (active && active !== document.body && !panel.current?.contains(active)) return;
    if (view === "templates") templateList.current?.querySelector("button")?.focus();
    else if (was === "templates") input.current?.focus();
  }, [view, collapsed]);

  function collapse() {
    speech.stopRecording();
    onToggleCollapsed();
    requestAnimationFrame(() => pill.current?.focus());
  }

  function expand() {
    onToggleCollapsed();
    requestAnimationFrame(() => (input.current ?? collapseButton.current)?.focus());
  }

  async function dictate() {
    if (speech.recording) speech.stopRecording();
    else {
      await speech.startRecording();
      // Permission may finish after the user has collapsed the panel.
      if (collapsedRef.current) stopSpeech.current();
    }
  }

  function generate() {
    if (!intake || intake.cta.disabled || busy) return;
    speech.stopRecording();
    intake.cta.onClick();
  }

  if (collapsed) {
    return <aside className="canvas-assistant canvas-assistant-collapsed" aria-label="Hiring assistant">
      <button ref={pill} type="button" className={`canvas-assistant-pill${unread ? " canvas-assistant-pill-unread" : ""}`} aria-label={unread ? "Open hiring assistant (new message)" : "Open hiring assistant"} aria-expanded={false} title="Hiring assistant" onClick={expand}>
        <span className="canvas-assistant-pill-mark" aria-hidden="true"><SparkleIcon /></span>
        {unread && <span className="canvas-assistant-unread" aria-hidden="true" />}
      </button>
    </aside>;
  }

  const textarea = <textarea ref={input} rows={4} value={prompt} aria-label="Message the hiring assistant" disabled={busy}
    placeholder={placeholder ?? (intake ? "Type or paste what you know about the role…" : "Ask about your workflow…")}
    aria-keyshortcuts={intake ? "Meta+Enter Control+Enter" : undefined}
    onChange={(event) => onPromptChange(event.target.value)}
    onKeyDown={(event) => {
      if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
      // Intake: Enter is a new line; ⌘/Ctrl+Enter generates the brief. Otherwise Enter sends.
      if (intake) {
        if (event.metaKey || event.ctrlKey) { event.preventDefault(); generate(); }
        return;
      }
      if (!event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
    }} />;
  const dictationUnavailable = speech.micBlocked || speech.micFailed || speech.noSpeechApi;

  return <aside ref={panel} id={panelId} className="canvas-assistant canvas-assistant-panel" aria-label="Hiring assistant"
    onKeyDown={(event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      if (context) context.onClear();
      else if (intake?.view === "templates") intake.onCloseTemplates();
      else collapse();
    }}>
    <header className="canvas-assistant-header">
      <span className="canvas-global-mark" aria-hidden="true"><SparkleIcon /></span>
      <div className="canvas-assistant-heading">
        <strong>Hiring assistant</strong>
        <small>Draft a role · build your pipeline</small>
      </div>
      <button ref={collapseButton} type="button" aria-label="Collapse hiring assistant" aria-expanded aria-controls={panelId} onClick={collapse}>«</button>
    </header>
    <div ref={history} className="canvas-assistant-history" role="log" aria-label="Conversation" aria-live="polite">
      <div className="canvas-assistant-thread">
        {messages.length === 0 && <AssistantLine first text={context ? `Ask me to change ${context.title} — I'll suggest edits you can accept or dismiss.` : "Ask me to review the workflow or change anything on the canvas."} />}
        {messages.map((message, index) => message.role === "user"
          ? <p key={index} className="canvas-assistant-msg canvas-assistant-msg-user"><span className="canvas-global-sr-only">You: </span>{message.text}</p>
          : <AssistantLine key={index} text={message.text} first={messages[index - 1]?.role !== "assistant"} />)}
      </div>
    </div>
    <div className="canvas-assistant-footer">
      <div className={`canvas-assistant-card${busy ? " canvas-assistant-card-busy" : ""}`} aria-busy={busy}>
        {context && <div className="canvas-assistant-context">
          <span>Talking about <strong>{context.title}</strong></span>
          <button type="button" aria-label="Back to the whole-canvas conversation" onClick={context.onClear}>×</button>
        </div>}
        {intake ? !hasAttachments && <p className="canvas-assistant-question">{intake.question}</p>
          : dock && <div className="canvas-assistant-prompt">{dock}</div>}
        <form className="canvas-assistant-form" onSubmit={(event) => {
          event.preventDefault();
          if (intake) { generate(); return; }
          if (!busy && (prompt.trim() || hasAttachments)) { speech.stopRecording(); onSubmit(); }
        }}>
          {busy ? <p className="canvas-assistant-busy" role="status">
            <span className="canvas-assistant-busy-mark" aria-hidden="true"><SparkleIcon /></span>
            <span>{busyLabel || "Working on it…"}</span>
          </p>
          : intake?.view === "templates" ? <div ref={templateList} className="canvas-assistant-options canvas-assistant-templates" role="group" aria-label="Role templates">
            {TEMPLATE_ROLES.map((role) => <button key={role} type="button" className="canvas-assistant-option canvas-assistant-template" onClick={() => intake.onTemplate(role)}>
              <span className="canvas-assistant-template-mark" aria-hidden="true"><GridIcon /></span>
              <span className="canvas-assistant-template-text"><strong>{role}</strong><small>{TEMPLATE_BLURB}</small></span>
            </button>)}
          </div>
          // An attached JD fills the text box, so the ways to describe the role step aside.
          : intake && hasAttachments ? <div className="canvas-assistant-document">{attachments}{textarea}</div>
          : intake ? <ol className="canvas-assistant-options" aria-label="Ways to describe the role">
            <li>
              <label className="canvas-assistant-option canvas-assistant-option-active">
                <span className="canvas-assistant-badge" aria-hidden="true">1</span>
                {textarea}
              </label>
            </li>
            <li>
              <button type="button" className={`canvas-assistant-option${speech.recording ? " canvas-assistant-option-recording" : ""}`} aria-pressed={speech.recording} onClick={() => void dictate()}>
                <span className="canvas-assistant-badge" aria-hidden="true">2</span>
                <span className="canvas-assistant-option-text">{speech.recording
                  ? <><span className="canvas-assistant-rec-dot" aria-hidden="true" />Listening… tap to stop</>
                  : <><MicIcon />Record by speaking</>}</span>
              </button>
            </li>
            <li>
              <button type="button" className="canvas-assistant-option" onClick={intake.onUpload}>
                <span className="canvas-assistant-badge" aria-hidden="true">3</span>
                <span className="canvas-assistant-option-text"><ClipIcon />Upload a job description</span>
              </button>
            </li>
            <li>
              <button type="button" className="canvas-assistant-option" onClick={intake.onOpenTemplates}>
                <span className="canvas-assistant-badge" aria-hidden="true">4</span>
                <span className="canvas-assistant-option-text"><GridIcon />Start from a template</span>
              </button>
            </li>
          </ol>
          : textarea}
          {attachments && (!intake || !hasAttachments) && <div className="canvas-assistant-attachments">{attachments}</div>}
          {speech.interim && <p className="canvas-global-status">{speech.interim}</p>}
          {dictationUnavailable && <p className="canvas-global-status" role="status">Dictation is unavailable. You can type instead.</p>}
          <div className="canvas-assistant-actions">
            {intake ? <>
              {intake.view === "templates" && !busy && <button type="button" className="canvas-assistant-back" onClick={intake.onCloseTemplates}>← Back</button>}
              <span className="canvas-assistant-spacer" />
              <button type="submit" className="canvas-assistant-cta" disabled={busy || intake.cta.disabled} title="⌘/Ctrl + Enter">
                <SparkleIcon />{intake.cta.label}
              </button>
            </> : <>
              {onAttach && <button type="button" className="canvas-assistant-icon" aria-label="Attach a document" title="Attach a document" disabled={busy} onClick={onAttach}><ClipIcon /></button>}
              <span className="canvas-assistant-spacer" />
              <button type="button" className={`canvas-assistant-icon${speech.recording ? " canvas-global-recording" : ""}`} aria-label={speech.recording ? "Stop dictation" : "Dictate a message"} aria-pressed={speech.recording} disabled={busy} onClick={() => void dictate()}><MicIcon /></button>
              <button className="canvas-assistant-send" type="submit" aria-label="Send message" disabled={busy || (!prompt.trim() && !hasAttachments)}>↑</button>
            </>}
          </div>
        </form>
      </div>
    </div>
  </aside>;
}
