import { tabKeyboard } from "../shared/tabKeyboard";
import { useId, type ReactNode } from "react";
import type { DemoProject } from "../demo/types";
import type { HiringOperations } from "./types";

export type PanelProps = {
  jobId: string;
  project: DemoProject;
  ops: HiringOperations;
  run: (action: () => unknown, message?: string) => void;
};
export function Field({
  label,
  value,
  onChange,
  options,
  suggestions,
  type = "text",
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options?: readonly string[];
  suggestions?: readonly string[];
  type?: string;
  wide?: boolean;
}) {
  const id = useId();
  return (
    <label className={`hire-field ${wide ? "hire-wide" : ""}`}>
      <span>{label}</span>
      {options ? (
        <select
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {options.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          aria-label={label}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          aria-label={label}
          list={suggestions ? id : undefined}
          type={type}
          min={type === "number" ? 0 : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}{" "}
      {suggestions && (
        <datalist id={id}>
          {suggestions.map((v) => (
            <option value={v} key={v} />
          ))}
        </datalist>
      )}
    </label>
  );
}
export function Tabs({
  values,
  active,
  onChange,
}: {
  values: string[];
  active: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="hire-tabs" role="tablist" onKeyDown={tabKeyboard}>
      {values.map((v) => (
        <button
          key={v}
          role="tab"
          type="button"
          tabIndex={active === v ? 0 : -1}
          aria-selected={active === v}
          className={active === v ? "is-active" : ""}
          onClick={() => onChange(v)}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="hire-empty">{children}</div>;
}
export async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    throw new Error(
      "Clipboard unavailable. Select and copy the displayed text.",
    );
  }
}
