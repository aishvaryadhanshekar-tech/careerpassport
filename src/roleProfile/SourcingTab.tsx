import { EditableField } from "../EditableField";
import { PointList, TagInput } from "../formControls";
import { INDUSTRY_SUGGESTIONS, type JobDraft, type JobPreviewFields, type RoleProfileFields } from "../types";
import { MOCK, orMock } from "./mock";
import { TabEditControls } from "./TabEditControls";

export function SourcingTab({
  draft,
  onPreview,
  onRoleProfile,
  editing,
  onEdit,
  onDiscard,
  onSave,
}: {
  draft: JobDraft;
  onPreview: (patch: Partial<JobPreviewFields>) => void;
  onRoleProfile: (patch: Partial<RoleProfileFields>) => void;
  editing: boolean;
  onEdit: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <div className="jd-cards">
      <section className="app-card">
        <header className="app-card-head">
          <h2>Sourcing playbook</h2>
          <div className="app-card-head-actions">
            <TabEditControls
              editing={editing}
              onEdit={onEdit}
              onDiscard={onDiscard}
              onSave={onSave}
              label="Sourcing playbook"
            />
          </div>
        </header>
        <div className="app-card-body role-profile-fields">
          <EditableField
            label="Target companies"
            display={<p>{orMock(draft.preview.targetCompanies, MOCK.targetCompanies)}</p>}
            editing={editing}
          >
            <PointList
              id="rp-target-companies"
              value={draft.preview.targetCompanies}
              onChange={(next) => onPreview({ targetCompanies: next })}
            />
          </EditableField>

          <EditableField
            label="Target sectors"
            display={<p>{orMock(draft.preview.industrySectors, MOCK.industrySectors)}</p>}
            editing={editing}
          >
            <TagInput
              id="rp-target-sectors"
              value={draft.preview.industrySectors}
              suggestions={INDUSTRY_SUGGESTIONS}
              onChange={(next) => onPreview({ industrySectors: next })}
            />
          </EditableField>

          <EditableField
            label="Avoid look-alikes"
            display={<p>{orMock(draft.roleProfile.avoidLookalikes, MOCK.avoidLookalikes)}</p>}
            editing={editing}
          >
            <PointList
              id="rp-avoid-lookalikes"
              value={draft.roleProfile.avoidLookalikes}
              onChange={(next) => onRoleProfile({ avoidLookalikes: next })}
            />
          </EditableField>
        </div>
      </section>
    </div>
  );
}
