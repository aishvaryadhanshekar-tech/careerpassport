import { useState } from "react";
import {
  STANDARD_FIELD_IDS,
  STANDARD_FIELD_META,
} from "./applicationCatalog";
import {
  removedStandardIds,
  reorderStandardFields,
  restoreStandardField,
  setStandardFieldRequirement,
} from "./applicationForm";
import { SegmentedControl } from "./SegmentedControl";
import type {
  ApplicationConfig,
  StandardFieldId,
  StandardFieldRequirement,
} from "./types";

const REQUIREMENT_OPTIONS: { value: StandardFieldRequirement; label: string }[] = [
  { value: "skipped", label: "Skip" },
  { value: "optional", label: "Ask" },
  { value: "mandatory", label: "Require" },
];

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
            const skipped = field.required === "skipped";
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
                <div className={skipped ? "field-copy skipped" : "field-copy"}>
                  <strong>
                    {mandatory ? "* " : ""}
                    {meta.label}
                  </strong>
                </div>
                <SegmentedControl
                  value={field.required}
                  options={REQUIREMENT_OPTIONS}
                  ariaLabel={`${meta.label} requirement`}
                  onChange={(requirement) =>
                    onChange(
                      setStandardFieldRequirement(config, field.id, requirement),
                    )
                  }
                />
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
