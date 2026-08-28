import { type JSX } from "react";
import { EditableField } from "../EditableField";
import type { Stage } from "../types";

export type DoADemoEditorProps = {
  stage: Stage;
  onChange: (patch: Partial<Stage>) => void;
};

export function DoADemoEditor({ stage, onChange }: DoADemoEditorProps): JSX.Element {
  return (
    <div className="stage-editor">
      <p>
        The candidate presses record; screen and video are captured while they work through a
        situation.
      </p>
      <EditableField
        label="Prompt / spoken instructions"
        display={<p>{stage.spokenInstructions || "Not set yet."}</p>}
      >
        <textarea
          value={stage.spokenInstructions}
          onChange={(e) => onChange({ spokenInstructions: e.target.value })}
        />
      </EditableField>
    </div>
  );
}
