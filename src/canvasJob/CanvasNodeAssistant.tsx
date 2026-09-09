import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import { useDictation } from "../shared/useDictation";
import type { FunnelNode } from "./funnelModel";

export type CanvasChatMessage = { role: "user" | "assistant"; text: string };

/** Screen-sized controls anchored to the selected node as the canvas moves. */
export function CanvasNodeAssistant({ item, position, open, onOpen, onClose, children }: {
  item: FunnelNode; position: { x: number; y: number }; open: boolean;
  onOpen: () => void; onClose: () => void; children: ReactNode;
}) {
  const { x, y, zoom } = useViewport();
  const flow = useReactFlow();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [size, setSize] = useState({ width: 900, height: 600 });
  useEffect(() => {
    const surface = root.current?.closest(".react-flow");
    if (!surface) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(surface);
    return () => observer.disconnect();
  }, []);
  const nodeWidth = flow.getNode(item.id)?.measured?.width ?? (["job", "stage"].includes(item.kind) ? 280 : 240);
  const width = open ? Math.min(320, size.width - 24) : 28;
  // Reserve the bottom toolbar rows so the floating prompt never covers Ask AI or reset.
  const toolbarSpace = size.width <= 600 ? 130 : 68;
  const chatBottom = Math.max(100, size.height - toolbarSpace);
  const right = x + (position.x + nodeWidth) * zoom + 12;
  let left = Math.max(12, Math.min(right, size.width - width - 12));
  let top = Math.max(12, Math.min(y + position.y * zoom + 12, chatBottom - (open ? 160 : 28)));
  if (open && right + width > size.width - 12) {
    const before = x + position.x * zoom - width - 12;
    if (before >= 12) left = before;
    else {
      // When a node and composer cannot fit side by side, use the space below it.
      const nodeHeight = flow.getNode(item.id)?.measured?.height ?? 120;
      const below = y + (position.y + nodeHeight) * zoom + 10;
      top = Math.max(12, Math.min(below, chatBottom - 160));
    }
  }
  return <div ref={root} className="canvas-node-assistant nodrag nopan nowheel"
    style={{ left, top, width, maxHeight: Math.max(80, Math.min(340, chatBottom - top)) }}
    onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        event.stopPropagation();
        onClose();
        trigger.current?.focus();
      }
    }}>
    <button ref={trigger} className="canvas-assistant-trigger" aria-label={`Ask AI about ${item.title}`}
      aria-expanded={open} aria-controls={open ? "canvas-node-chat" : undefined}
      onClick={open ? onClose : onOpen}>✦</button>
    {open && children}
  </div>;
}

/**
 * One-shot "build the starting pipeline by hand" affordance, anchored directly below the Job
 * configuration node — the manual counterpart to the AI-drafted pipeline in the canvas assistant.
 * Disappears once any stage exists (see FunnelCanvas), since it's only for the empty-canvas case.
 */
export function AddPipelineButton({ item, position, onClick }: {
  item: FunnelNode; position: { x: number; y: number }; onClick: () => void;
}) {
  const { x, y, zoom } = useViewport();
  const flow = useReactFlow();
  const nodeWidth = flow.getNode(item.id)?.measured?.width ?? 280;
  const nodeHeight = flow.getNode(item.id)?.measured?.height ?? 160;
  const left = x + position.x * zoom;
  const top = y + (position.y + nodeHeight) * zoom + 12;
  return (
    <button
      type="button"
      className="canvas-add-pipeline nodrag nopan"
      style={{ left, top, minWidth: nodeWidth * zoom }}
      onClick={onClick}
    >
      + Add pipeline manually
    </button>
  );
}

export function CanvasNodeChat({ item, prompt, setPrompt, messages, onSend, onClose, children }: {
  item: FunnelNode; prompt: string; setPrompt: (value: string) => void;
  messages: CanvasChatMessage[]; onSend: () => void; onClose: () => void; children: ReactNode;
}) {
  const speech = useDictation({ value: prompt, onChange: setPrompt });
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => { log.current?.parentElement?.scrollTo({ top: log.current.parentElement.scrollHeight }); }, [messages]);
  return <section id="canvas-node-chat" className="canvas-node-chat" aria-label={`AI chat about ${item.title}`}>
    <header><div><strong>{item.title}</strong><small>Demo</small></div>
      <button aria-label="Close AI chat" onClick={onClose}>×</button></header>
    <div className="canvas-chat-content">
    {messages.length > 0 && <div ref={log} className="canvas-chat-log" role="log" aria-label="Conversation" aria-live="polite">
      {messages.map((message, index) => <p key={index} className={`canvas-chat-${message.role}`}><small className="sr-only">{message.role === "user" ? "You" : "Assistant"}</small>{message.text}</p>)}
    </div>}
    {children && <div className="canvas-chat-proposal">{children}</div>}
    </div>
    <form className="canvas-chat-composer" onSubmit={(event) => { event.preventDefault(); if (prompt.trim()) { speech.stopRecording(); onSend(); } }}>
      <textarea autoFocus aria-label="AI request" placeholder="Describe your idea…" rows={1} value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
      <button type="button" className={speech.recording ? "is-recording" : ""} aria-label={speech.recording ? "Stop dictation" : "Dictate request"}
        onClick={() => speech.recording ? speech.stopRecording() : void speech.startRecording()}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3m-4 0h8"/></svg>
      </button>
      {prompt.trim() && <button type="submit" aria-label="Send message">↑</button>}
    </form>
    {speech.interim && <p className="canvas-chat-hint">{speech.interim}</p>}
    {(speech.micBlocked || speech.micFailed || speech.noSpeechApi) && <p className="canvas-chat-hint" role="status">Dictation is unavailable. You can type your request.</p>}
  </section>;
}
