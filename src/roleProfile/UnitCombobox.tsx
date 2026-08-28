import { useState } from "react";
import { UNIT_SUGGESTIONS } from "../types";
import { useCloseOnOutsideClick } from "./useCloseOnOutsideClick";

export function UnitCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (unit: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const rootRef = useCloseOnOutsideClick(open, () => {
    setOpen(false);
    setCustomMode(false);
  });

  function selectUnit(unit: string) {
    onChange(unit);
    setOpen(false);
    setCustomMode(false);
  }

  function commitCustom() {
    const trimmed = customValue.trim();
    if (trimmed) {
      onChange(trimmed);
    }
    setCustomValue("");
    setCustomMode(false);
    setOpen(false);
  }

  return (
    <div className="unit-combobox" ref={rootRef}>
      <button
        type="button"
        className="pill-input unit-combobox-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Unit"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="unit-combobox-value">{value || "Unit"}</span>
        <span className="importance-dropdown-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <ul className="importance-dropdown-menu unit-combobox-menu" role="listbox" aria-label="Unit options">
          {UNIT_SUGGESTIONS.map((unit) => (
            <li
              key={unit}
              role="option"
              aria-selected={unit === value}
              className={`importance-dropdown-option${unit === value ? " active" : ""}`}
              onClick={() => selectUnit(unit)}
            >
              {unit}
              {unit === value ? (
                <span className="importance-dropdown-check" aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </li>
          ))}
          <li className="importance-dropdown-option unit-combobox-custom-option">
            {customMode ? (
              <input
                autoFocus
                className="unit-combobox-custom-input"
                placeholder="Custom unit"
                aria-label="Custom unit"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitCustom();
                  }
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setCustomMode(false);
                  }
                }}
                onBlur={commitCustom}
              />
            ) : (
              <button
                type="button"
                className="unit-combobox-add"
                onClick={() => setCustomMode(true)}
              >
                + Add custom unit…
              </button>
            )}
          </li>
        </ul>
      ) : null}
    </div>
  );
}
