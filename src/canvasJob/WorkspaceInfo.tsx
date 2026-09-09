import { useEffect, useRef, useState, type ReactNode } from "react";

export function WorkspaceInfo({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return <div className="workspace-info" ref={root}>
    <button ref={trigger} type="button" className="workspace-info-trigger"
      aria-label="Workspace tools and demo options" aria-expanded={open}
      aria-controls="workspace-info-options" onClick={() => setOpen(!open)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><circle cx="12" cy="7.5" r=".8" fill="currentColor" stroke="none" />
      </svg>
    </button>
    <section id="workspace-info-options" className="workspace-info-popover" aria-label="Workspace tools" hidden={!open}>
      <strong>Workspace tools</strong>
      {children}
    </section>
  </div>;
}
