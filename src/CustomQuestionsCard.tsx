import { useRef, useState } from "react";
import {
  addQuestion,
  addQuestionOption,
  addSection,
  duplicateItem,
  removeQuestion,
  removeQuestionOption,
  reorderItems,
  setQuestionImage,
  setQuestionRequirement,
  setQuestionType,
  setSectionDescription,
  setSectionTitle,
  updateQuestionOption,
  updateQuestionPrompt,
} from "./applicationForm";
import { Switch } from "./ContextCard";
import type {
  ApplicationConfig,
  ApplicationItem,
  CustomQuestion,
  CustomQuestionType,
  SectionBreak,
} from "./types";

const TYPE_LABELS: Record<CustomQuestionType, string> = {
  short_answer: "Short answer",
  paragraph: "Paragraph",
  multiple_choice: "Multiple choice",
  checkboxes: "Checkboxes",
  dropdown: "Dropdown",
};

const OPTION_TYPES: CustomQuestionType[] = [
  "multiple_choice",
  "checkboxes",
  "dropdown",
];

export function CustomQuestionsCard({
  config,
  onChange,
}: {
  config: ApplicationConfig;
  onChange: (next: ApplicationConfig) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const sectionCount = config.items.filter(
    (item) => item.kind === "section",
  ).length;

  return (
    <section className="app-card" data-editor-anchor="questions">
      <header className="app-card-head">
        <h2>Questions</h2>
        <button
          type="button"
          className="text-add"
          onClick={() => onChange(addQuestion(config))}
        >
          + Add
        </button>
      </header>
      <div className="app-card-body">
        {config.items.map((item, index) => {
          let sectionNumber = 0;
          if (item.kind === "section") {
            sectionNumber =
              config.items
                .slice(0, index + 1)
                .filter((entry) => entry.kind === "section").length + 1;
          }
          return (
            <div
              key={item.id}
              className="qblock-wrap"
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex === null) return;
                onChange(reorderItems(config, dragIndex, index));
                setDragIndex(null);
              }}
            >
              {item.kind === "section" ? (
                <SectionBlock
                  section={item}
                  sectionNumber={sectionNumber}
                  sectionTotal={sectionCount + 1}
                  onChange={onChange}
                  config={config}
                />
              ) : (
                <QuestionBlock question={item} config={config} onChange={onChange} />
              )}
              <QBlockToolbar
                item={item}
                config={config}
                onChange={onChange}
              />
            </div>
          );
        })}
        <button
          type="button"
          className="text-add add-another"
          onClick={() => onChange(addQuestion(config))}
        >
          + Add another
        </button>
      </div>
    </section>
  );
}

function QBlockToolbar({
  item,
  config,
  onChange,
}: {
  item: ApplicationItem;
  config: ApplicationConfig;
  onChange: (next: ApplicationConfig) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function onImageChosen(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(setQuestionImage(config, item.id, reader.result));
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="qblock-toolbar" role="group" aria-label="Add to form">
      <button
        type="button"
        title="Add question"
        aria-label="Add question"
        onClick={() => onChange(addQuestion(config, item.id))}
      >
        <PlusIcon />
      </button>
      {item.kind === "question" ? (
        <>
          <button
            type="button"
            title="Add image"
            aria-label="Add image"
            onClick={() => fileRef.current?.click()}
          >
            <ImageIcon />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImageChosen(file);
              e.target.value = "";
            }}
          />
        </>
      ) : null}
      <button
        type="button"
        title="Add section"
        aria-label="Add section"
        onClick={() => onChange(addSection(config, item.id))}
      >
        <SectionIcon />
      </button>
    </div>
  );
}

function QuestionBlock({
  question,
  config,
  onChange,
}: {
  question: CustomQuestion;
  config: ApplicationConfig;
  onChange: (next: ApplicationConfig) => void;
}) {
  const showOptions = OPTION_TYPES.includes(question.type);

  return (
    <div className="question-block">
      <div className="question-top">
        <span className="drag-handle" aria-hidden="true">
          ⋮⋮
        </span>
        <input
          className="question-prompt"
          value={question.prompt}
          placeholder="Question"
          aria-label="Question"
          onChange={(e) =>
            onChange(updateQuestionPrompt(config, question.id, e.target.value))
          }
        />
        <select
          className="type-select"
          value={question.type}
          aria-label="Question type"
          onChange={(e) =>
            onChange(
              setQuestionType(
                config,
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
            onClick={() => onChange(setQuestionImage(config, question.id, undefined))}
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
                      config,
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
                  onChange(removeQuestionOption(config, question.id, optionIndex))
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
              onClick={() => onChange(addQuestionOption(config, question.id))}
            >
              + Add option
            </button>
          </li>
        </ul>
      ) : null}

      <div className="question-footer">
        <button
          type="button"
          className="footer-icon"
          title="Duplicate"
          aria-label="Duplicate question"
          onClick={() => onChange(duplicateItem(config, question.id))}
        >
          <DuplicateIcon />
        </button>
        <button
          type="button"
          className="footer-icon"
          title="Delete"
          aria-label="Delete question"
          onClick={() => onChange(removeQuestion(config, question.id))}
        >
          <TrashIcon />
        </button>
        <span className="footer-divider" aria-hidden="true" />
        <Switch
          checked={question.required === "mandatory"}
          label="Required"
          onToggle={() =>
            onChange(
              setQuestionRequirement(
                config,
                question.id,
                question.required === "mandatory" ? "optional" : "mandatory",
              ),
            )
          }
        />
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  sectionNumber,
  sectionTotal,
  config,
  onChange,
}: {
  section: SectionBreak;
  sectionNumber: number;
  sectionTotal: number;
  config: ApplicationConfig;
  onChange: (next: ApplicationConfig) => void;
}) {
  return (
    <div className="section-block">
      <p className="section-badge">
        Section {sectionNumber} of {sectionTotal}
      </p>
      <input
        className="section-title"
        value={section.title}
        placeholder="Section title"
        aria-label="Section title"
        onChange={(e) => onChange(setSectionTitle(config, section.id, e.target.value))}
      />
      <input
        className="section-description"
        value={section.description}
        placeholder="Description (optional)"
        aria-label="Section description"
        onChange={(e) =>
          onChange(setSectionDescription(config, section.id, e.target.value))
        }
      />
      <div className="question-footer">
        <button
          type="button"
          className="footer-icon"
          title="Duplicate"
          aria-label="Duplicate section"
          onClick={() => onChange(duplicateItem(config, section.id))}
        >
          <DuplicateIcon />
        </button>
        <button
          type="button"
          className="footer-icon"
          title="Delete"
          aria-label="Delete section"
          onClick={() => onChange(removeQuestion(config, section.id))}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" />
      <path
        d="M4.5 16.5 9 12l3 3 3.5-4L19.5 16.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5" width="17" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3.5" y="13" width="17" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
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
