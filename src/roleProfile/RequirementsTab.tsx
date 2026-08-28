import { EditableField } from "../EditableField";
import { PointList } from "../formControls";
import type { JobDraft, JobPreviewFields } from "../types";
import { MOCK, orMock } from "./mock";
import { MustHaveRedFlagTable } from "./shared";
import { TabEditControls } from "./TabEditControls";

export function RequirementsTab({
  draft,
  onPreview,
  onField,
  editing,
  onEdit,
  onDiscard,
  onSave,
}: {
  draft: JobDraft;
  onPreview: (patch: Partial<JobPreviewFields>) => void;
  onField: (id: "mustHaves" | "redFlags", value: string) => void;
  editing: boolean;
  onEdit: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <div className="jd-cards">
      <section className="app-card">
        <header className="app-card-head">
          <h2>Requirements</h2>
          <div className="app-card-head-actions">
            <TabEditControls editing={editing} onEdit={onEdit} onDiscard={onDiscard} onSave={onSave} label="Requirements" />
          </div>
        </header>
        <div className="app-card-body role-profile-fields">
          <EditableField
            label="Skills expected"
            display={<p>{orMock(draft.preview.expectedSkills, MOCK.expectedSkills)}</p>}
            editing={editing}
          >
            <PointList
              id="rp-skills-expected"
              value={draft.preview.expectedSkills}
              onChange={(next) => onPreview({ expectedSkills: next })}
            />
          </EditableField>

          <EditableField
            label="Must haves & red flags"
            display={
              <MustHaveRedFlagTable
                mustHaves={orMock(draft.fields.mustHaves.value, MOCK.mustHaves)}
                redFlags={orMock(draft.fields.redFlags.value, MOCK.redFlags)}
              />
            }
            editing={editing}
          >
            <div className="req-edit-group">
              <span className="req-edit-sublabel">Must haves</span>
              <PointList
                id="rp-must-haves"
                value={draft.fields.mustHaves.value}
                onChange={(next) => onField("mustHaves", next)}
              />
              <span className="req-edit-sublabel">Red flags</span>
              <PointList
                id="rp-red-flags"
                value={draft.fields.redFlags.value}
                onChange={(next) => onField("redFlags", next)}
              />
            </div>
          </EditableField>
        </div>
      </section>
    </div>
  );
}
