import { useEffect, useState, type ReactNode } from "react";

export function EditableField({
  label,
  display,
  children,
  editing: editingProp,
}: {
  label: string;
  display: ReactNode;
  children: ReactNode;
  /**
   * When provided, this field's edit state follows the parent (e.g. a
   * per-tab "edit all" toggle). The field's own pencil button still works
   * for fine-grained toggling, but re-syncs to this prop whenever it
   * changes.
   */
  editing?: boolean;
}) {
  const [editing, setEditing] = useState(editingProp ?? false);

  useEffect(() => {
    if (editingProp !== undefined) setEditing(editingProp);
  }, [editingProp]);

  return (
    <div className="editable-field">
      <div className="editable-field-head">
        <span className="editable-field-label">{label}</span>
        <button
          type="button"
          className="editable-field-pencil"
          aria-label={editing ? `Done editing ${label}` : `Edit ${label}`}
          aria-pressed={editing}
          onClick={() => setEditing((v) => !v)}
        >
          <PencilIcon />
        </button>
      </div>
      {editing ? (
        <div className="editable-field-control">{children}</div>
      ) : (
        <div className="editable-field-display">{display}</div>
      )}
    </div>
  );
}

export function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M11.3 2.3a1.4 1.4 0 0 1 2 2L5 12.6l-2.7.7.7-2.7 8.3-8.3Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8.5 6.2 11.7 13 4.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
