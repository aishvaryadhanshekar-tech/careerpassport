import { CheckIcon, PencilIcon } from "../EditableField";

export function TabEditToggle({
  editing,
  onToggle,
  label,
}: {
  editing: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`tab-edit-toggle${editing ? " active" : ""}`}
      aria-pressed={editing}
      aria-label={editing ? `Done editing ${label}` : `Edit ${label}`}
      title={editing ? "Done editing" : "Edit"}
      onClick={onToggle}
    >
      {editing ? <CheckIcon /> : <PencilIcon />}
    </button>
  );
}

export function TabEditControls({
  editing,
  onEdit,
  onDiscard,
  onSave,
  label,
}: {
  editing: boolean;
  onEdit: () => void;
  onDiscard: () => void;
  onSave: () => void;
  label: string;
}) {
  if (!editing) {
    return (
      <button type="button" className="tab-edit-toggle" aria-label={`Edit ${label}`} title="Edit" onClick={onEdit}>
        <PencilIcon />
      </button>
    );
  }
  return (
    <div className="tab-edit-actions">
      <button type="button" className="btn ghost btn-sm" onClick={onDiscard}>
        Discard
      </button>
      <button type="button" className="btn primary btn-sm" onClick={onSave}>
        Save
      </button>
    </div>
  );
}
