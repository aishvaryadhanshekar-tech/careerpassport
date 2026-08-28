import { type JSX, useState } from "react";
import { EditableField } from "../EditableField";
import { addStageItem, removeStageItem, reorderStageItems, updateStageItem } from "../tripStages";
import type { Stage } from "../types";

export type RapidFireEditorProps = {
  stage: Stage;
  onChange: (patch: Partial<Stage>) => void;
};

export function RapidFireEditor({ stage, onChange }: RapidFireEditorProps): JSX.Element {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  return (
    <div className="stage-editor">
      <p>Statements the candidate marks serious or joking.</p>
      <EditableField
        label="Spoken instructions (optional)"
        display={<p>{stage.spokenInstructions || "None"}</p>}
      >
        <textarea
          value={stage.spokenInstructions}
          onChange={(e) => onChange({ spokenInstructions: e.target.value })}
        />
      </EditableField>
      <div className="stage-editor-items">
        {stage.items.map((item, index) => (
          <div
            key={item.id}
            className="stage-item-row"
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex === null) return;
              onChange({ items: reorderStageItems(stage, dragIndex, index).items });
              setDragIndex(null);
            }}
          >
            <span className="drag-handle" aria-hidden="true">
              ⋮⋮
            </span>
            <input
              value={item.text}
              placeholder="Statement"
              aria-label="Statement"
              onChange={(e) =>
                onChange({ items: updateStageItem(stage, item.id, { text: e.target.value }).items })
              }
            />
            <select
              aria-label="Serious or joking"
              value={item.answer ?? "serious"}
              onChange={(e) =>
                onChange({
                  items: updateStageItem(stage, item.id, {
                    answer: e.target.value as "serious" | "joking",
                  }).items,
                })
              }
            >
              <option value="serious">Serious</option>
              <option value="joking">Joking</option>
            </select>
            <button
              type="button"
              aria-label="Remove statement"
              onClick={() => onChange({ items: removeStageItem(stage, item.id).items })}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="stage-item-add-btn"
        onClick={() => onChange({ items: addStageItem(stage).items })}
      >
        + Add statement
      </button>
    </div>
  );
}
