import { motion } from "framer-motion";
import type { CanvasNudge } from "./canvasStatus";

export function CanvasAINudge({ nudge, visible }: { nudge: CanvasNudge; visible: boolean }) {
  return (
    <motion.div
      className={`canvas-ai-nudge canvas-ai-nudge-${nudge.tone}`}
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -8 }}
      transition={{ duration: 0.2 }}
      style={{ x: "-50%", pointerEvents: "none" }}
      aria-live="polite"
    >
      <span className="canvas-ai-nudge-icon">
        <SparkleIcon />
      </span>
      <span>{nudge.message}</span>
    </motion.div>
  );
}

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2l1.2 3.6L13 7l-3.8 1.4L8 12l-1.2-3.6L3 7l3.8-1.4L8 2Z" fill="currentColor" />
    </svg>
  );
}
