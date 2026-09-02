import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CanvasNudge } from "./canvasStatus";

type Message = { role: "user" | "ai"; text: string };

// Deterministic, keyword-based canned reply — same "no real backend" philosophy as the rest of
// the app's mocked AI (extractJobFields.ts, tripAIBuild.ts). Not a chat model.
function reply(question: string, nudge: CanvasNudge): string {
  const q = question.toLowerCase();
  if (q.includes("missing") || q.includes("left") || q.includes("next")) {
    return nudge.message;
  }
  if (q.includes("publish")) {
    return "Once Job Details and the Application form are done, the Publish node unlocks so you can review and go live.";
  }
  if (q.includes("application") || q.includes("question")) {
    return "Open the Application node to add standard fields or custom questions — there's a live mobile/desktop preview alongside the editor.";
  }
  return "I can help with what's next on this canvas — try asking \"what's missing?\" or \"how do I publish?\".";
}

export function CanvasAskAI({
  open,
  nudge,
  onClose,
}: {
  open: boolean;
  nudge: CanvasNudge;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  function submit() {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }, { role: "ai", text: reply(text, nudge) }]);
    setInput("");
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="canvas-ask-ai"
          initial={{ opacity: 0, x: "-50%", y: 12, scale: 0.98 }}
          animate={{ opacity: 1, x: "-50%", y: 0, scale: 1 }}
          exit={{ opacity: 0, x: "-50%", y: 12, scale: 0.98 }}
          transition={{ duration: 0.16 }}
        >
          <header className="canvas-ask-ai-head">
            <span>Ask AI</span>
            <button type="button" aria-label="Close" onClick={onClose} className="canvas-panel-close">
              ×
            </button>
          </header>
          <div className="canvas-ask-ai-messages">
            {messages.length === 0 ? (
              <p className="canvas-ask-ai-hint">{nudge.message}</p>
            ) : (
              messages.map((m, i) => (
                <p key={i} className={`canvas-ask-ai-msg canvas-ask-ai-msg-${m.role}`}>
                  {m.text}
                </p>
              ))
            )}
          </div>
          <form
            className="canvas-ask-ai-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this job..."
              aria-label="Ask AI"
            />
            <button type="submit" className="btn primary btn-sm">
              Send
            </button>
          </form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
