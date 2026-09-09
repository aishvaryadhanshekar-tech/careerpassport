import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useDictation } from "../shared/useDictation";
import "./canvas-global-assistant.css";

const tasks = [
  { label: "Describe role", prompt: "Help me define this role: job title, location, responsibilities, and the experience a candidate needs." },
  { label: "Build pipeline", prompt: "Build a hiring pipeline for this role with an application, candidate review, assessment, and interview stages." },
  { label: "Review workflow", prompt: "Review the entire hiring workflow. Identify missing steps, duplicated work, and opportunities to improve the candidate experience." },
];

export function CanvasGlobalAssistant({ open, onOpen, onClose, messages, prompt, onPromptChange, model, onModelChange, onSubmit, children, toolbar, attachments, hasAttachments = false, isStarting = false }: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  messages: { role: "user" | "assistant"; text: string }[];
  prompt: string;
  onPromptChange: (value: string) => void;
  model: string;
  onModelChange: (value: string) => void;
  onSubmit: () => void;
  children?: ReactNode;
  toolbar?: ReactNode;
  attachments?: ReactNode;
  hasAttachments?: boolean;
  isStarting?: boolean;
}) {
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const speech = useDictation({ value: prompt, onChange: onPromptChange });
  const stopSpeech = useRef(speech.stopRecording);
  stopSpeech.current = speech.stopRecording;
  const [maxHeight, setMaxHeight] = useState(420);

  useEffect(() => {
    const surface = root.current?.parentElement;
    if (!surface) return;
    const observer = new ResizeObserver(([entry]) => {
      setMaxHeight(Math.max(90, Math.min(420, entry.contentRect.height - 134)));
    });
    observer.observe(surface);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (open) input.current?.focus();
    else stopSpeech.current();
  }, [open]);

  useEffect(() => {
    if (open && content.current) content.current.scrollTop = content.current.scrollHeight;
  }, [messages, children, open]);

  function close() {
    speech.stopRecording();
    onClose();
    trigger.current?.focus();
  }

  async function dictate() {
    if (speech.recording) speech.stopRecording();
    else {
      await speech.startRecording();
      // Permission may finish after the user has dismissed the composer.
      if (!openRef.current) stopSpeech.current();
    }
  }

  return <div ref={root} className="canvas-global-assistant nodrag nopan nowheel"
    onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        event.stopPropagation();
        close();
      }
    }}>
    {open && <section id={panelId} className="canvas-global-panel" style={{ maxHeight }} aria-label="Canvas AI assistant">
      <header className="canvas-global-header">
        <div><strong>Canvas assistant</strong></div>
        <button type="button" aria-label="Close canvas AI assistant" onClick={close}>×</button>
      </header>
      <div ref={content} className="canvas-global-content">

        {messages.length > 0 && <div className="canvas-global-log" role="log" aria-label="Canvas conversation" aria-live="polite">
          {messages.map((message, index) => <div key={index} className={`canvas-global-message canvas-global-message-${message.role}`}><small className="canvas-global-sr-only">{message.role === "user" ? "You" : "Assistant"}</small><p>{message.text}</p></div>)}
        </div>}
        {children && <div className="canvas-global-proposal">{children}</div>}
      </div>
      <form className="canvas-global-form" onSubmit={(event) => { event.preventDefault(); if (prompt.trim() || hasAttachments) { speech.stopRecording(); onSubmit(); } }}>
        {attachments}
        <div className="canvas-global-tasks" aria-label="Suggested tasks">
          {tasks.map((task) => <button key={task.label} type="button" onClick={() => { onPromptChange(task.prompt); input.current?.focus(); }}>{task.label}</button>)}
        </div>
        <div className="canvas-global-composer">
          <textarea ref={input} rows={2} value={prompt} aria-label="Canvas AI request" placeholder={isStarting ? "What role are you hiring for?" : "Ask about your workflow…"} onChange={(event) => onPromptChange(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
          <div className="canvas-global-composer-actions">
            <button type="button" className={speech.recording ? "canvas-global-recording" : undefined} aria-label={speech.recording ? "Stop dictation" : "Dictate canvas request"} aria-pressed={speech.recording} onClick={() => void dictate()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3m-4 0h8"/></svg>
            </button>
            <button className="canvas-global-send" type="submit" aria-label="Send canvas request" disabled={!prompt.trim() && !hasAttachments}>↑</button>
          </div>
        </div>
        {speech.interim && <p className="canvas-global-status">{speech.interim}</p>}
        {(speech.micBlocked || speech.micFailed || speech.noSpeechApi) && <p className="canvas-global-status" role="status">Dictation is unavailable. You can type your request.</p>}
        <div className="canvas-global-options"><label><span className="canvas-global-sr-only">AI model</span><select aria-label="AI model" value={model || "Claude"} onChange={(event) => onModelChange(event.target.value)}><option value="Claude">Claude</option><option value="GPT">GPT</option><option value="Gemini">Gemini</option></select></label><span>Demo · review before applying</span></div>
      </form>
    </section>}
    <div className="canvas-authoring-toolbar" role="toolbar" aria-label="Pipeline tools">{toolbar}<button ref={trigger} type="button" className={`canvas-global-trigger${open ? " canvas-global-active" : ""}`} aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={open ? close : onOpen}><span aria-hidden="true">✦</span> Ask AI</button></div>
  </div>;
}
