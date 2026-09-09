import { useEffect, useRef, useState, type JSX, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  MESSAGE_CHANNEL_LABELS,
  MESSAGE_INTENT_LABELS,
  renderTemplate,
  type MessageTemplate,
  type TemplateValues,
} from "../types";
import { templatesForStage } from "./templates";
import "./communications.css";

/**
 * The card's "Message" action: a popover of the templates that apply to the candidate's
 * current stage, then a preview of the rendered message before it goes.
 *
 * Templates come from `templatesForStage` rather than a prop so every caller — card,
 * drawer, anything later — offers the same contextual set without re-deriving it.
 */
export function SendMessageMenu({
  stageId,
  values,
  buttonClassName,
  iconOnly = false,
  onSend,
}: {
  stageId: string;
  values: TemplateValues;
  buttonClassName: string;
  /** Drops the visible label; the accessible name comes from aria-label instead. */
  iconOnly?: boolean;
  onSend: (template: MessageTemplate) => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<MessageTemplate | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const templates = templatesForStage(stageId);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // TRP-08: initial focus + arrow-key navigation for the template choice step, since role="menu"
  // alone doesn't supply either. The nested preview/form step drops the menu role entirely
  // (arbitrary form content isn't valid inside role="menu") and instead gets its own focus.
  useEffect(() => {
    if (!open) return;
    const target = preview
      ? menuRef.current?.querySelector<HTMLButtonElement>(".msg-preview-back")
      : menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    target?.focus();
  }, [open, preview]);

  function onMenuKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (preview) return;
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
    if (!items.length) return;
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    let destination: number | null = null;
    if (e.key === "ArrowDown") destination = (index + 1 + items.length) % items.length;
    else if (e.key === "ArrowUp") destination = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") destination = 0;
    else if (e.key === "End") destination = items.length - 1;
    if (destination === null) return;
    e.preventDefault();
    items[destination]?.focus();
  }

  function close() {
    setOpen(false);
    setPreview(null);
    triggerRef.current?.focus();
  }

  return (
    <div className="msg-menu-wrap" ref={wrapRef} onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        className={buttonClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={iconOnly ? `Message ${values.candidate_name}` : undefined}
        title={iconOnly ? "Message" : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
          setPreview(null);
        }}
      >
        <MailIcon />
        {iconOnly ? null : "Message"}
      </button>

      {open ? (
        <div
          className="msg-menu"
          ref={menuRef}
          role={preview ? undefined : "menu"}
          aria-label={preview ? undefined : "Templates for this stage"}
          onKeyDown={onMenuKeyDown}
        >
          {preview ? (
            <div className="msg-preview">
              <button
                type="button"
                className="msg-preview-back"
                onClick={() => setPreview(null)}
              >
                ← All templates
              </button>
              <p className="msg-preview-name">{preview.name}</p>
              <p className="msg-preview-meta">
                {MESSAGE_CHANNEL_LABELS[preview.channel]} ·{" "}
                {MESSAGE_INTENT_LABELS[preview.intent]}
              </p>
              {preview.subject ? (
                <p className="msg-preview-subject">
                  {renderTemplate(preview.subject, values)}
                </p>
              ) : null}
              <pre className="msg-preview-body">
                {renderTemplate(preview.body, values)}
              </pre>
              <div className="msg-preview-actions">
                <button type="button" className="btn" onClick={close}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    onSend(preview);
                    close();
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <>
              <span className="msg-menu-label">Templates for this stage</span>
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  role="menuitem"
                  className={`msg-menu-item intent-${template.intent}`}
                  onClick={() => setPreview(template)}
                >
                  <span className="msg-menu-item-top">
                    <span className="msg-menu-item-name">{template.name}</span>
                    <span className="msg-channel-chip">
                      {MESSAGE_CHANNEL_LABELS[template.channel]}
                    </span>
                  </span>
                  <span className="msg-menu-item-blurb">{template.blurb}</span>
                </button>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MailIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="1.75"
        y="3.25"
        width="12.5"
        height="9.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="m2.5 4.5 5.5 4 5.5-4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
