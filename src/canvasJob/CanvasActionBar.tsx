import { motion } from "framer-motion";

export function CanvasActionBar({
  visible,
  onRecord,
  onAskAI,
  onFitView,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: {
  visible: boolean;
  onRecord: () => void;
  onAskAI: () => void;
  onFitView: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}) {
  return (
    <motion.div
      className="canvas-action-bar"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16 }}
      transition={{ duration: 0.18 }}
      style={{ x: "-50%", pointerEvents: visible ? "auto" : "none" }}
    >
      <button type="button" className="canvas-action-btn" onClick={onRecord}>
        <MicIcon />
        Record
      </button>
      <button type="button" className="canvas-action-btn" onClick={onAskAI}>
        <SparkleIcon />
        Ask AI
      </button>
      <div className="canvas-action-divider" aria-hidden="true" />
      <div className="canvas-zoom-group" role="group" aria-label="Zoom controls">
        <button
          type="button"
          className="canvas-action-btn canvas-action-btn-icon"
          onClick={onZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOutIcon />
        </button>
        <button
          type="button"
          className="canvas-zoom-level"
          onClick={onZoomReset}
          title="Reset zoom to 100%"
          aria-label="Reset zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          className="canvas-action-btn canvas-action-btn-icon"
          onClick={onZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomInIcon />
        </button>
      </div>
      <div className="canvas-action-divider" aria-hidden="true" />
      <button type="button" className="canvas-action-btn canvas-action-btn-icon" onClick={onFitView} title="Fit view" aria-label="Fit view">
        <FitIcon />
      </button>
      <button
        type="button"
        className="canvas-action-btn canvas-action-btn-icon canvas-action-btn-disabled"
        disabled
        title="Add step — coming soon"
        aria-label="Add step — coming soon"
      >
        <PlusIcon />
      </button>
    </motion.div>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="6" y="2" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 8a4 4 0 0 0 8 0M8 12v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2l1.2 3.6L13 7l-3.8 1.4L8 12l-1.2-3.6L3 7l3.8-1.4L8 2Z" fill="currentColor" />
    </svg>
  );
}

function FitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 5V2h3M14 5V2h-3M2 11v3h3M14 11v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13.5 13.5 10.5 10.5M5 7h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13.5 13.5 10.5 10.5M7 5v4M5 7h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
