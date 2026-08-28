import { useState } from "react";
import {
  addPoint,
  addTag,
  filterSuggestions,
  removePoint,
  removeTag,
  splitPoints,
  splitTags,
  withExtraChoice,
} from "./formControlUtils";
import { CURRENCIES, type Currency } from "./types";

export function TagInput({
  id,
  value,
  suggestions = [],
  onChange,
  placeholder,
  variant = "tags",
}: {
  id: string;
  value: string;
  suggestions?: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** "dropdown" gives the same tag/free-text behavior a select-like look: a
   * bordered box with a chevron and a "Select" placeholder, for fields that
   * are conceptually a pick-from-a-list even though multiple/custom values
   * are still allowed. */
  variant?: "tags" | "dropdown";
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const tags = splitTags(value);
  const matches = filterSuggestions(suggestions, query, tags);
  const resolvedPlaceholder = placeholder ?? (variant === "dropdown" ? "Select" : "Type and press Enter");

  function commit(raw: string) {
    const next = addTag(value, raw);
    if (next !== value) onChange(next);
    setQuery("");
  }

  return (
    <div className={`tag-input${variant === "dropdown" ? " tag-input-dropdown" : ""}`}>
      {tags.map((tag) => (
        <span className="tag-chip" key={tag}>
          {tag}
          <button
            type="button"
            className="tag-chip-x"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(removeTag(value, tag))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        className="tag-input-field"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit(query);
          } else if (e.key === "Backspace" && query === "" && tags.length > 0) {
            onChange(removeTag(value, tags.at(-1) ?? ""));
          }
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (query.trim()) commit(query);
          setOpen(false);
        }}
        placeholder={tags.length === 0 ? resolvedPlaceholder : ""}
        autoComplete="off"
      />
      {variant === "dropdown" ? (
        <span className="tag-input-caret" aria-hidden="true">
          ▾
        </span>
      ) : null}
      {open && matches.length > 0 ? (
        <ul className="tag-suggestions" role="listbox">
          {matches.map((item) => (
            <li key={item} role="option">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(item)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function PointList({
  id,
  value,
  onChange,
  placeholder = "Type and press Enter",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const points = splitPoints(value);

  function commit(raw: string) {
    const next = addPoint(value, raw);
    if (next !== value) onChange(next);
    setQuery("");
  }

  return (
    <div className="point-list">
      {points.length > 0 ? (
        <ol className="point-list-items">
          {points.map((point, index) => (
            <li className="point-list-item" key={`${index}-${point}`}>
              <span className="point-list-index">{index + 1}.</span>
              <span className="point-list-text">{point}</span>
              <button
                type="button"
                className="point-list-x"
                aria-label={`Remove ${point}`}
                onClick={() => onChange(removePoint(value, point))}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      <input
        id={id}
        className="point-list-field"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(query);
          }
        }}
        onBlur={() => {
          if (query.trim()) commit(query);
        }}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}

export function SalaryInput({
  id,
  value,
  currency,
  onChange,
  onCurrency,
}: {
  id: string;
  value: string;
  currency: Currency | null;
  onChange: (value: string) => void;
  onCurrency: (currency: Currency) => void;
}) {
  return (
    <div className="salary-input">
      <select
        className={`salary-input-currency select-icon${currency ? "" : " is-placeholder"}`}
        value={currency ?? ""}
        aria-label="CTC currency"
        onChange={(e) => onCurrency(e.target.value as Currency)}
      >
        <option value="" disabled>
          Select
        </option>
        {CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
      <input
        id={id}
        className="salary-input-amount"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function ChoiceRow({
  id,
  options,
  value,
  onSelect,
  ariaLabel,
}: {
  id?: string;
  options: readonly string[];
  value: string | readonly string[] | null;
  onSelect: (option: string) => void;
  ariaLabel?: string;
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const shown = selected.reduce<string[]>(
    (opts, item) => withExtraChoice(opts, item),
    [...options],
  );

  return (
    <div
      id={id}
      className="choice-row"
      role="group"
      aria-label={ariaLabel}
      tabIndex={id ? -1 : undefined}
    >
      {shown.map((option) => {
        const isOn = selected.some(
          (item) => item.toLowerCase() === option.toLowerCase(),
        );
        return (
          <button
            type="button"
            key={option}
            className={`choice-badge${isOn ? " selected" : ""}`}
            aria-pressed={isOn}
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
