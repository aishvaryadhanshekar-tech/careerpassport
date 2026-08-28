import { useState, type KeyboardEvent } from "react";
import { EVAL_IMPORTANCE, EVAL_IMPORTANCE_LABELS, type EvalImportance } from "../types";
import { ImportanceBadge } from "./shared";
import { useCloseOnOutsideClick } from "./useCloseOnOutsideClick";

export function ImportanceDropdown({
  importance,
  onChange,
}: {
  importance: EvalImportance;
  onChange: (importance: EvalImportance) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => EVAL_IMPORTANCE.indexOf(importance));
  const rootRef = useCloseOnOutsideClick(open, () => setOpen(false));

  function select(value: EvalImportance) {
    onChange(value);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) {
        setActiveIndex(EVAL_IMPORTANCE.indexOf(importance));
        setOpen(true);
      } else {
        select(EVAL_IMPORTANCE[activeIndex]);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setActiveIndex(EVAL_IMPORTANCE.indexOf(importance));
        setOpen(true);
        return;
      }
      setActiveIndex((i) => Math.min(i + 1, EVAL_IMPORTANCE.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
  }

  return (
    <div className="importance-dropdown" ref={rootRef}>
      <button
        type="button"
        className={`importance-dropdown-trigger importance-${importance.replace(/_/g, "-")}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Importance"
        onClick={() => {
          setActiveIndex(EVAL_IMPORTANCE.indexOf(importance));
          setOpen((o) => !o);
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="importance-dropdown-trigger-label">{EVAL_IMPORTANCE_LABELS[importance]}</span>
        <span className="importance-dropdown-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <ul className="importance-dropdown-menu" role="listbox" aria-label="Importance options">
          {EVAL_IMPORTANCE.map((option, index) => (
            <li
              key={option}
              role="option"
              aria-selected={option === importance}
              className={`importance-dropdown-option${index === activeIndex ? " active" : ""}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => select(option)}
            >
              <ImportanceBadge importance={option} />
              {option === importance ? (
                <span className="importance-dropdown-check" aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
