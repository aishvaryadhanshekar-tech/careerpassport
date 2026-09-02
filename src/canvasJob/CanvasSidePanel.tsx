import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export function CanvasSidePanel({
  open,
  title,
  onClose,
  onAnimationComplete,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onAnimationComplete?: () => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      className="canvas-job-panel-col"
      initial={false}
      animate={{ width: open ? "42%" : "0%" }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={onAnimationComplete}
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            className="canvas-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-label={title}
          >
            <header className="canvas-panel-head">
              <h2>{title}</h2>
              <button type="button" className="canvas-panel-close" aria-label="Close" onClick={onClose}>
                <CloseIcon />
              </button>
            </header>
            <div className="canvas-panel-body">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4.5 4.5 13.5 13.5M13.5 4.5 4.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
