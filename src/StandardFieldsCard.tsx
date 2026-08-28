import { useState } from "react";
import {
  STANDARD_FIELD_IDS,
  STANDARD_FIELD_META,
} from "./applicationCatalog";
import {
  removeStandardField,
  removedStandardIds,
  reorderStandardFields,
  restoreStandardField,
  setStandardFieldRequirement,
} from "./applicationForm";
import { Switch } from "./ContextCard";
import type { ApplicationConfig, StandardFieldId } from "./types";

export function StandardFieldsCard({
  config,
  onChange,
}: {
  config: ApplicationConfig;
  onChange: (next: ApplicationConfig) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const removed = removedStandardIds(config);

  return (
    <section className="app-card" data-editor-anchor="fields">
      <header className="app-card-head">
        <h2>Application fields</h2>
      </header>
      <div className="app-card-body">
        <ul className="field-list">
          {config.standardOrder.map((field, index) => {
            const meta = STANDARD_FIELD_META[field.id];
            const mandatory = field.required === "mandatory";
            return (
              <li
                key={field.id}
                className="field-row"
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex === null) return;
                  onChange(reorderStandardFields(config, dragIndex, index));
                  setDragIndex(null);
                }}
              >
                <span className="drag-handle" aria-hidden="true">
                  ⋮⋮
                </span>
                <div className="field-copy">
                  <strong>{meta.label}</strong>
                </div>
                <div className="field-required">
                  <Switch
                    checked={mandatory}
                    label="Required"
                    onToggle={() =>
                      onChange(
                        setStandardFieldRequirement(
                          config,
                          field.id,
                          mandatory ? "optional" : "mandatory",
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className="icon-x"
                    aria-label={`Remove ${meta.label}`}
                    title="Remove field"
                    onClick={() => onChange(removeStandardField(config, field.id))}
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {removed.length > 0 ? (
          <div className="add-field">
            <label>
              + Add field
              <select
                value=""
                onChange={(e) => {
                  const id = e.target.value as StandardFieldId;
                  if (!id) return;
                  onChange(restoreStandardField(config, id));
                }}
              >
                <option value="">Choose a field</option>
                {removed.map((id) => (
                  <option key={id} value={id}>
                    {STANDARD_FIELD_META[id].label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </div>
    </section>
  );
}

void STANDARD_FIELD_IDS;
