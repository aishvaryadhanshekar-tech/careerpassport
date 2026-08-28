import { useLayoutEffect, useRef } from "react";
import {
  addGridColumn,
  addGridRow,
  addQuestionOption,
  duplicateItem,
  removeGridColumn,
  removeGridRow,
  removeQuestion,
  removeQuestionOption,
  setFileUploadRule,
  setQuestionImage,
  setQuestionRequirement,
  setQuestionType,
  setRatingIcon,
  setRatingMax,
  setRequireResponsePerRow,
  setScaleLabel,
  setScaleRange,
  setSectionDescription,
  setSectionTitle,
  updateGridColumn,
  updateGridRow,
  updateQuestionOption,
  updateQuestionPrompt,
} from "./applicationForm";
import { Switch } from "./ContextCard";
import type {
  ApplicationItem,
  CustomQuestion,
  CustomQuestionType,
  SectionBreak,
} from "./types";

export const TYPE_LABELS: Record<CustomQuestionType, string> = {
  short_answer: "Short answer",
  paragraph: "Paragraph",
  multiple_choice: "Multiple choice",
  checkboxes: "Checkboxes",
  dropdown: "Dropdown",
  file_upload: "File upload",
  linear_scale: "Linear scale",
  rating: "Rating",
  multiple_choice_grid: "Multiple choice grid",
  checkbox_grid: "Checkbox grid",
  date: "Date",
  time: "Time",
};

const OPTION_TYPES: CustomQuestionType[] = [
  "multiple_choice",
  "checkboxes",
  "dropdown",
];

const GRID_TYPES: CustomQuestionType[] = ["multiple_choice_grid", "checkbox_grid"];

const FILE_SIZE_OPTIONS = [1, 5, 10, 50, 100, 1024];
const SCALE_TOP_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const RATING_MAX_OPTIONS = [3, 4, 5, 7, 10];

export function QuestionBlock({
  question,
  items,
  onChange,
}: {
  question: CustomQuestion;
  items: ApplicationItem[];
  onChange: (next: ApplicationItem[]) => void;
}) {
  const showOptions = OPTION_TYPES.includes(question.type);
  const showGrid = GRID_TYPES.includes(question.type);
  const showScale = question.type === "linear_scale";
  const showRating = question.type === "rating";
  const showFileUpload = question.type === "file_upload";
  const showDate = question.type === "date";
  const showTime = question.type === "time";

  return (
    <div className="question-block">
      <div className="question-top">
        <span className="drag-handle" aria-hidden="true">
          ⋮⋮
        </span>
        <AutoGrowTextarea
          className="question-prompt"
          value={question.prompt}
          placeholder="Question"
          aria-label="Question"
          onValueChange={(value) =>
            onChange(updateQuestionPrompt(items, question.id, value))
          }
        />
        <select
          className="type-select"
          value={question.type}
          aria-label="Question type"
          onChange={(e) =>
            onChange(
              setQuestionType(
                items,
                question.id,
                e.target.value as CustomQuestionType,
              ),
            )
          }
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {question.imageUrl ? (
        <div className="question-image">
          <img src={question.imageUrl} alt="" />
          <button
            type="button"
            className="icon-x"
            aria-label="Remove image"
            onClick={() => onChange(setQuestionImage(items, question.id, undefined))}
          >
            ×
          </button>
        </div>
      ) : null}

      {question.type === "short_answer" ? (
        <div className="answer-preview short">Short answer text</div>
      ) : null}
      {question.type === "paragraph" ? (
        <div className="answer-preview paragraph">Long answer text</div>
      ) : null}
      {showDate ? (
        <div className="answer-preview date-time-preview">
          <CalendarIcon />
          Month, day, year
        </div>
      ) : null}
      {showTime ? (
        <div className="answer-preview date-time-preview">
          <ClockIcon />
          Time
        </div>
      ) : null}

      {showOptions ? (
        <ul className={`option-list ${question.type}`}>
          {question.options.map((option, optionIndex) => (
            <li key={`${question.id}-${optionIndex}`}>
              <span className="option-bullet" aria-hidden="true">
                {question.type === "dropdown"
                  ? `${optionIndex + 1}.`
                  : question.type === "checkboxes"
                    ? "▢"
                    : "○"}
              </span>
              <input
                value={option}
                placeholder={`Option ${optionIndex + 1}`}
                aria-label={`Option ${optionIndex + 1}`}
                onChange={(e) =>
                  onChange(
                    updateQuestionOption(
                      items,
                      question.id,
                      optionIndex,
                      e.target.value,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="icon-x"
                aria-label={`Remove option ${optionIndex + 1}`}
                onClick={() =>
                  onChange(removeQuestionOption(items, question.id, optionIndex))
                }
              >
                ×
              </button>
            </li>
          ))}
          <li>
            <span className="option-bullet" aria-hidden="true" />
            <button
              type="button"
              className="text-add"
              onClick={() => onChange(addQuestionOption(items, question.id))}
            >
              + Add option
            </button>
          </li>
        </ul>
      ) : null}

      {showScale ? (
        <div className="scale-editor">
          <div className="scale-row">
            <select
              className="type-select"
              aria-label="Scale minimum"
              value={question.scaleMin ?? 1}
              onChange={(e) =>
                onChange(
                  setScaleRange(
                    items,
                    question.id,
                    Number(e.target.value),
                    question.scaleMax ?? 5,
                  ),
                )
              }
            >
              {[0, 1].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <span>to</span>
            <select
              className="type-select"
              aria-label="Scale maximum"
              value={question.scaleMax ?? 5}
              onChange={(e) =>
                onChange(
                  setScaleRange(
                    items,
                    question.id,
                    question.scaleMin ?? 1,
                    Number(e.target.value),
                  ),
                )
              }
            >
              {SCALE_TOP_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="scale-labels">
            <label className="scale-label-row">
              <span>{question.scaleMin ?? 1}</span>
              <input
                placeholder="Label (optional)"
                aria-label="Minimum label"
                value={question.scaleMinLabel ?? ""}
                onChange={(e) =>
                  onChange(setScaleLabel(items, question.id, "min", e.target.value))
                }
              />
            </label>
            <label className="scale-label-row">
              <span>{question.scaleMax ?? 5}</span>
              <input
                placeholder="Label (optional)"
                aria-label="Maximum label"
                value={question.scaleMaxLabel ?? ""}
                onChange={(e) =>
                  onChange(setScaleLabel(items, question.id, "max", e.target.value))
                }
              />
            </label>
          </div>
        </div>
      ) : null}

      {showRating ? (
        <div className="rating-editor">
          <div className="rating-row">
            <select
              className="type-select"
              aria-label="Number of rating icons"
              value={question.ratingMax ?? 5}
              onChange={(e) =>
                onChange(setRatingMax(items, question.id, Number(e.target.value)))
              }
            >
              {RATING_MAX_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              className="type-select"
              aria-label="Rating icon"
              value={question.ratingIcon ?? "star"}
              onChange={(e) =>
                onChange(
                  setRatingIcon(
                    items,
                    question.id,
                    e.target.value as "star" | "heart" | "thumb",
                  ),
                )
              }
            >
              <option value="star">Star</option>
              <option value="heart">Heart</option>
              <option value="thumb">Thumb</option>
            </select>
          </div>
          <div className="rating-preview" aria-hidden="true">
            {Array.from({ length: question.ratingMax ?? 5 }).map((_, index) => (
              <RatingGlyph key={index} icon={question.ratingIcon ?? "star"} />
            ))}
          </div>
        </div>
      ) : null}

      {showFileUpload ? (
        <div className="file-upload-editor">
          <div className="file-rule-row">
            <span>Allow only specific file types</span>
            <Switch
              checked={question.restrictFileTypes ?? false}
              ariaLabel="Allow only specific file types"
              onToggle={() =>
                onChange(
                  setFileUploadRule(items, question.id, {
                    restrictFileTypes: !(question.restrictFileTypes ?? false),
                  }),
                )
              }
            />
          </div>
          <div className="file-rule-row">
            <span>Maximum number of files</span>
            <select
              className="type-select"
              aria-label="Maximum number of files"
              value={question.maxFiles ?? 1}
              onChange={(e) =>
                onChange(
                  setFileUploadRule(items, question.id, {
                    maxFiles: Number(e.target.value),
                  }),
                )
              }
            >
              {[1, 2, 3, 5, 10].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="file-rule-row">
            <span>Maximum file size</span>
            <select
              className="type-select"
              aria-label="Maximum file size"
              value={question.maxFileSizeMb ?? 10}
              onChange={(e) =>
                onChange(
                  setFileUploadRule(items, question.id, {
                    maxFileSizeMb: Number(e.target.value),
                  }),
                )
              }
            >
              {FILE_SIZE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value >= 1024 ? "1 GB" : `${value} MB`}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {showGrid ? (
        <div className="grid-editor">
          <div className="grid-editor-col">
            <p className="grid-editor-label">Rows</p>
            {(question.rows ?? []).map((row, rowIndex) => (
              <div className="grid-editor-item" key={`row-${rowIndex}`}>
                <input
                  value={row}
                  placeholder={`Row ${rowIndex + 1}`}
                  aria-label={`Row ${rowIndex + 1}`}
                  onChange={(e) =>
                    onChange(updateGridRow(items, question.id, rowIndex, e.target.value))
                  }
                />
                <button
                  type="button"
                  className="icon-x"
                  aria-label={`Remove row ${rowIndex + 1}`}
                  onClick={() => onChange(removeGridRow(items, question.id, rowIndex))}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-add"
              onClick={() => onChange(addGridRow(items, question.id))}
            >
              + Add row
            </button>
          </div>
          <div className="grid-editor-col">
            <p className="grid-editor-label">Columns</p>
            {(question.columns ?? []).map((column, columnIndex) => (
              <div className="grid-editor-item" key={`col-${columnIndex}`}>
                <input
                  value={column}
                  placeholder={`Column ${columnIndex + 1}`}
                  aria-label={`Column ${columnIndex + 1}`}
                  onChange={(e) =>
                    onChange(
                      updateGridColumn(items, question.id, columnIndex, e.target.value),
                    )
                  }
                />
                <button
                  type="button"
                  className="icon-x"
                  aria-label={`Remove column ${columnIndex + 1}`}
                  onClick={() => onChange(removeGridColumn(items, question.id, columnIndex))}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-add"
              onClick={() => onChange(addGridColumn(items, question.id))}
            >
              + Add column
            </button>
          </div>
        </div>
      ) : null}

      <div className="question-footer">
        <button
          type="button"
          className="footer-icon"
          title="Duplicate"
          aria-label="Duplicate question"
          onClick={() => onChange(duplicateItem(items, question.id))}
        >
          <DuplicateIcon />
        </button>
        <button
          type="button"
          className="footer-icon"
          title="Delete"
          aria-label="Delete question"
          onClick={() => onChange(removeQuestion(items, question.id))}
        >
          <TrashIcon />
        </button>
        <span className="footer-divider" aria-hidden="true" />
        {showGrid ? (
          <Switch
            checked={question.requireResponsePerRow ?? false}
            label="Require a response in each row"
            onToggle={() =>
              onChange(
                setRequireResponsePerRow(
                  items,
                  question.id,
                  !(question.requireResponsePerRow ?? false),
                ),
              )
            }
          />
        ) : (
          <Switch
            checked={question.required === "mandatory"}
            label="Required"
            onToggle={() =>
              onChange(
                setQuestionRequirement(
                  items,
                  question.id,
                  question.required === "mandatory" ? "optional" : "mandatory",
                ),
              )
            }
          />
        )}
      </div>
    </div>
  );
}

export function SectionBlock({
  section,
  sectionNumber,
  sectionTotal,
  items,
  onChange,
}: {
  section: SectionBreak;
  sectionNumber: number;
  sectionTotal: number;
  items: ApplicationItem[];
  onChange: (next: ApplicationItem[]) => void;
}) {
  return (
    <div className="section-block">
      <p className="section-badge">
        Section {sectionNumber} of {sectionTotal}
      </p>
      <AutoGrowTextarea
        className="section-title"
        value={section.title}
        placeholder="Section title"
        aria-label="Section title"
        onValueChange={(value) => onChange(setSectionTitle(items, section.id, value))}
      />
      <AutoGrowTextarea
        className="section-description"
        value={section.description}
        placeholder="Description (optional)"
        aria-label="Section description"
        onValueChange={(value) =>
          onChange(setSectionDescription(items, section.id, value))
        }
      />
      <div className="question-footer">
        <button
          type="button"
          className="footer-icon"
          title="Duplicate"
          aria-label="Duplicate section"
          onClick={() => onChange(duplicateItem(items, section.id))}
        >
          <DuplicateIcon />
        </button>
        <button
          type="button"
          className="footer-icon"
          title="Delete"
          aria-label="Delete section"
          onClick={() => onChange(removeQuestion(items, section.id))}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

/* Single-line-feel textarea that grows with its content, so long prompts wrap
 * instead of scrolling out of view inside a fixed-width input. */
function AutoGrowTextarea({
  className,
  value,
  placeholder,
  ariaLabel,
  onValueChange,
  "aria-label": ariaLabelProp,
}: {
  className: string;
  value: string;
  placeholder: string;
  ariaLabel?: string;
  onValueChange: (value: string) => void;
  "aria-label"?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      className={`autogrow ${className}`}
      rows={1}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabelProp ?? ariaLabel}
      onChange={(e) => onValueChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
    />
  );
}

function RatingGlyph({ icon }: { icon: "star" | "heart" | "thumb" }) {
  if (icon === "heart") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 20s-7-4.35-9.5-8.5C.7 8 2.4 4.5 6 4.5c2 0 3.4 1.1 4 2.3.6-1.2 2-2.3 4-2.3 3.6 0 5.3 3.5 3.5 7C19 15.65 12 20 12 20Z" />
      </svg>
    );
  }
  if (icon === "thumb") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm0 0 4.5-7a2 2 0 0 1 3.6 1.7L14 9h4a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 16.8 20H7" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        strokeLinejoin="round"
        d="M12 3.5 14.5 9l6 .8-4.3 4.1 1 6-5.2-2.8L7 20l1-6-4.3-4.1 6-.8Z"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="8.5" y="8.5" width="11" height="11" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M15.5 8.5V6.6A1.6 1.6 0 0 0 13.9 5H6.6A1.6 1.6 0 0 0 5 6.6v7.3a1.6 1.6 0 0 0 1.6 1.6h1.9"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 7h14M9.5 7V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7M7 7l.8 12a1.6 1.6 0 0 0 1.6 1.5h5.2a1.6 1.6 0 0 0 1.6-1.5L17 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
