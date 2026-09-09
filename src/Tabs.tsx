import { tabKeyboard } from "./shared/tabKeyboard";
import { useEffect, useRef, type ReactNode } from "react";

export type TabItem = {
  id: string;
  label: string;
};

export function Tabs({
  tabs,
  active,
  onChange,
  ariaLabel,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // Tab bars that don't fit their container scroll horizontally rather than wrapping
  // (see .job-pagetabs); activating a clipped tab — by click, keyboard, or route change —
  // should still bring it into view.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  return (
    <div className="tabs" role="tablist" onKeyDown={tabKeyboard} aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={active === tab.id ? activeRef : undefined}
          type="button"
          role="tab"
          tabIndex={active === tab.id ? 0 : -1}
          id={`tab-${tab.id}`}
          aria-selected={active === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          className={`tab-btn${active === tab.id ? " active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({
  id,
  active,
  children,
}: {
  id: string;
  active: boolean;
  children: ReactNode;
}) {
  if (!active) return null;
  return (
    <div role="tabpanel" id={`tabpanel-${id}`} aria-labelledby={`tab-${id}`}>
      {children}
    </div>
  );
}
