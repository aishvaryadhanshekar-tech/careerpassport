import { type JSX, useState } from "react";
import { addStageItem, removeStageItem, reorderStageItems, updateStageItem } from "../tripStages";
import type { Stage } from "../types";

export type PickAndDefendEditorProps = {
  stage: Stage;
  onChange: (patch: Partial<Stage>) => void;
};

export function PickAndDefendEditor({ stage, onChange }: PickAndDefendEditorProps): JSX.Element {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  return (
    <div className="stage-editor">
      <p>Options the candidate chooses between and defends their pick.</p>
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
              placeholder="Option"
              aria-label="Option"
              onChange={(e) =>
                onChange({ items: updateStageItem(stage, item.id, { text: e.target.value }).items })
              }
            />
            <button
              type="button"
              aria-label="Remove option"
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
        + Add option
      </button>
    </div>
  );
}
