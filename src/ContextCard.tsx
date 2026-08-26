import type { ApplicationConfig } from "./types";
import { setContextText, toggleContextShown } from "./applicationForm";
import type { PreviewAnchor } from "./previewScroll";

export function ContextCard({
  config,
  onChange,
}: {
  config: ApplicationConfig;
  onChange: (next: ApplicationConfig) => void;
}) {
  return (
    <section className="app-card">
      <header className="app-card-head">
        <h2>Job details</h2>
      </header>
      <div className="app-card-body">
        <ContextBlock
          title="Company"
          anchor="company"
          shown={config.context.company.shown}
          text={config.context.company.text}
          onToggle={() => onChange(toggleContextShown(config, "company"))}
          onText={(text) => onChange(setContextText(config, "company", text))}
        />
        <ContextBlock
          title="Role"
          anchor="role"
          shown={config.context.role.shown}
          text={config.context.role.text}
          onToggle={() => onChange(toggleContextShown(config, "role"))}
          onText={(text) => onChange(setContextText(config, "role", text))}
        />
      </div>
    </section>
  );
}

function ContextBlock({
  title,
  anchor,
  shown,
  text,
  onToggle,
  onText,
}: {
  title: string;
  anchor: Extract<PreviewAnchor, "company" | "role">;
  shown: boolean;
  text: string;
  onToggle: () => void;
  onText: (text: string) => void;
}) {
  return (
    <div className="context-block" data-editor-anchor={anchor}>
      <div className="context-block-head">
        <h3>{title}</h3>
        <Switch
          checked={shown}
          ariaLabel={`Show ${title}`}
          onToggle={onToggle}
        />
      </div>
      {shown ? (
        <textarea
          className="context-text"
          rows={4}
          value={text}
          onChange={(e) => onText(e.target.value)}
          aria-label={title}
        />
      ) : null}
    </div>
  );
}

export function Switch({
  checked,
  label,
  ariaLabel,
  onToggle,
}: {
  checked: boolean;
  label?: string;
  ariaLabel?: string;
  onToggle: () => void;
}) {
  return (
    <label className="switch-wrap">
      {label ? <span>{label}</span> : null}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ? undefined : ariaLabel}
        className={checked ? "switch on" : "switch"}
        onClick={onToggle}
      >
        <span className="switch-knob" />
      </button>
    </label>
  );
}
