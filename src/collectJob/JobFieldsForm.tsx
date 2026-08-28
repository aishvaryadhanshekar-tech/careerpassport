import { ChoiceRow, PointList, SalaryInput, TagInput } from "../formControls";
import {
  COMPANY_TYPE_OPTIONS,
  COVERAGE_LABELS,
  EXPERIENCE_TYPE_OPTIONS,
  FLAG_IDS,
  FLAG_LABELS,
  INDUSTRY_SUGGESTIONS,
  LOCATION_SUGGESTIONS,
  WORK_MODE_OPTIONS,
  type CoverageId,
  type Currency,
  type FlagId,
  type JobDraft,
} from "../types";

// Fields that live in the form but are not coverage fields: they carry no
// FieldState, don't count towards coverage, and write straight to the draft's
// preview slice.
const EXTRA_FIELD_IDS = ["expectedSkills"] as const;

type ExtraFieldId = (typeof EXTRA_FIELD_IDS)[number];

type FormFieldId = CoverageId | ExtraFieldId;

const EXTRA_FIELD_LABELS: Record<ExtraFieldId, string> = {
  expectedSkills: "Skills expected",
};

function isExtraField(id: FormFieldId): id is ExtraFieldId {
  return (EXTRA_FIELD_IDS as readonly string[]).includes(id);
}

const FORM_SECTIONS: { title: string; fields: FormFieldId[] }[] = [
  {
    title: "Role",
    fields: [
      "designation",
      "experienceYears",
      "workMode",
      "experienceType",
      "salary",
    ],
  },
  {
    title: "Company & location",
    fields: ["location", "industryType", "companyType"],
  },
  {
    title: "Requirements",
    fields: ["mustHaves", "redFlags", "expectedSkills", "searchStrategy"],
  },
];

const WIDE_FIELDS = new Set<CoverageId>(["searchStrategy"]);

const POINT_FIELDS = new Set<CoverageId>(["mustHaves", "redFlags"]);

const TAG_FIELDS: Partial<Record<CoverageId, readonly string[]>> = {
  location: LOCATION_SUGGESTIONS,
  industryType: INDUSTRY_SUGGESTIONS,
};

const CHOICE_FIELDS: Partial<Record<CoverageId, readonly string[]>> = {
  workMode: WORK_MODE_OPTIONS,
  experienceType: EXPERIENCE_TYPE_OPTIONS,
};

const SELECT_FIELDS: Partial<Record<CoverageId, readonly string[]>> = {
  companyType: COMPANY_TYPE_OPTIONS,
};

export function FlagsChoice({
  draft,
  onFlag,
}: {
  draft: JobDraft;
  onFlag: (id: FlagId, value: boolean) => void;
}) {
  const selected = FLAG_IDS.filter((id) => draft.flags[id]).map(
    (id) => FLAG_LABELS[id],
  );
  return (
    <ChoiceRow
      options={FLAG_IDS.map((id) => FLAG_LABELS[id])}
      value={selected}
      ariaLabel="Select to apply"
      onSelect={(label) => {
        const id = FLAG_IDS.find((item) => FLAG_LABELS[item] === label);
        if (id) onFlag(id, !draft.flags[id]);
      }}
    />
  );
}

export function FieldGrid({
  ids,
  draft,
  missingIds,
  onField,
  onCurrency,
  onExpectedSkills,
}: {
  ids: readonly CoverageId[];
  draft: JobDraft;
  missingIds: CoverageId[];
  onField: (id: CoverageId, value: string) => void;
  onCurrency: (v: Currency | null) => void;
  onExpectedSkills: (value: string) => void;
}) {
  if (ids.length === 0) return null;

  function renderField(id: FormFieldId) {
    if (isExtraField(id)) {
      return (
        <ExtraFieldControl
          key={id}
          id={id}
          draft={draft}
          onChange={onExpectedSkills}
        />
      );
    }
    return (
      <FieldControl
        key={id}
        id={id}
        draft={draft}
        missing={missingIds.includes(id)}
        onField={onField}
        onCurrency={onCurrency}
      />
    );
  }

  return (
    <>
      {FORM_SECTIONS.map((section) => {
        const visible = section.fields.filter((id) =>
          isExtraField(id) ? true : ids.includes(id),
        );
        if (visible.length === 0) return null;
        return (
          <section className="form-section" key={section.title}>
            <h3 className="form-section-title">{section.title}</h3>
            <div className="form-section-grid">
              {visible.map(renderField)}
            </div>
          </section>
        );
      })}
    </>
  );
}

const EXTRA_FIELD_INPUT_IDS: Record<ExtraFieldId, string> = {
  expectedSkills: "cj-skills-expected",
};

function ExtraFieldControl({
  id,
  draft,
  onChange,
}: {
  id: ExtraFieldId;
  draft: JobDraft;
  onChange: (value: string) => void;
}) {
  const inputId = EXTRA_FIELD_INPUT_IDS[id];
  return (
    <div className="field">
      <label htmlFor={inputId}>{EXTRA_FIELD_LABELS[id]}</label>
      <PointList id={inputId} value={draft.preview[id]} onChange={onChange} />
    </div>
  );
}

function FieldControl({
  id,
  draft,
  missing,
  onField,
  onCurrency,
}: {
  id: CoverageId;
  draft: JobDraft;
  missing: boolean;
  onField: (id: CoverageId, value: string) => void;
  onCurrency: (v: Currency | null) => void;
}) {
  const inputId = `field-${id}`;
  const value = draft.fields[id].value;
  const choiceOptions = CHOICE_FIELDS[id];
  const selectOptions = SELECT_FIELDS[id];
  let control;
  if (id === "salary") {
    control = (
      <SalaryInput
        id={inputId}
        value={value}
        currency={draft.salaryCurrency}
        onChange={(next) => onField(id, next)}
        onCurrency={onCurrency}
      />
    );
  } else if (id === "searchStrategy") {
    control = (
      <textarea
        id={inputId}
        className="pill-input area-input"
        value={value}
        onChange={(e) => onField(id, e.target.value)}
      />
    );
  } else if (POINT_FIELDS.has(id)) {
    control = (
      <PointList
        id={inputId}
        value={value}
        onChange={(next) => onField(id, next)}
      />
    );
  } else if (id in TAG_FIELDS) {
    control = (
      <TagInput
        id={inputId}
        value={value}
        suggestions={TAG_FIELDS[id] ?? []}
        variant="dropdown"
        onChange={(next) => onField(id, next)}
      />
    );
  } else if (selectOptions) {
    control = (
      <select
        id={inputId}
        className={`pill-select select-icon${value ? "" : " is-placeholder"}`}
        value={value}
        onChange={(e) => onField(id, e.target.value)}
      >
        <option value="" disabled>
          Select…
        </option>
        {selectOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  } else if (choiceOptions) {
    control = (
      <ChoiceRow
        id={inputId}
        options={choiceOptions}
        value={value}
        ariaLabel={COVERAGE_LABELS[id]}
        onSelect={(option) => onField(id, option)}
      />
    );
  } else {
    control = (
      <input
        id={inputId}
        className="pill-input"
        value={value}
        onChange={(e) => onField(id, e.target.value)}
      />
    );
  }
  return (
    <div
      className={`field${WIDE_FIELDS.has(id) ? " field-wide" : ""}${missing ? " field-missing" : ""}`}
    >
      <label htmlFor={inputId}>{COVERAGE_LABELS[id]}</label>
      {control}
    </div>
  );
}
