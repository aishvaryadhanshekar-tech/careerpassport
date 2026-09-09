import { useState } from "react";
import { Field } from "./shared";
export type Condition = { field: string; operator: string; value: string };
export function matches(
  values: Record<string, unknown>,
  query: string,
  conditions: Condition[],
) {
  if (
    query &&
    !Object.values(values).join(" ").toLowerCase().includes(query.toLowerCase())
  )
    return false;
  return conditions.every((c) => {
    const value = String(values[c.field] ?? "").toLowerCase(),
      wanted = c.value.toLowerCase();
    if (c.operator === "Is") return value === wanted;
    if (c.operator === "Is not") return value !== wanted;
    if (c.operator === "Greater than") return Number(value) > Number(wanted);
    if (c.operator === "Less than") return Number(value) < Number(wanted);
    if (c.operator === "After date")
      return Number(value) >= new Date(c.value).getTime();
    if (c.operator === "Before date")
      return Number(value) < new Date(c.value).getTime() + 86400000;
    if (c.operator === "Is set") return Boolean(value);
    return value.includes(wanted);
  });
}
export function DataFilters({
  scope,
  fields,
  conditions,
  onChange,
}: {
  scope: string;
  fields: string[];
  conditions: Condition[];
  onChange: (v: Condition[]) => void;
}) {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState<Record<string, Condition[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`cp.filters.${scope}`) || "{}");
    } catch {
      return {};
    }
  });
  function save() {
    const next = { ...saved, [name]: conditions };
    localStorage.setItem(`cp.filters.${scope}`, JSON.stringify(next));
    setSaved(next);
    setName("");
  }
  return (
    <details className="hire-filter">
      <summary>
        Advanced filters {conditions.length > 0 ? `(${conditions.length})` : ""}
      </summary>
      {conditions.map((c, i) => (
        <div className="hire-condition" key={i}>
          <Field
            label="Where"
            value={c.field}
            options={fields}
            onChange={(v) =>
              onChange(
                conditions.map((x, j) => (j === i ? { ...x, field: v } : x)),
              )
            }
          />
          <Field
            label="Operator"
            value={c.operator}
            options={[
              "Contains",
              "Is",
              "Is not",
              "Greater than",
              "Less than",
              "After date",
              "Before date",
              "Is set",
            ]}
            onChange={(v) =>
              onChange(
                conditions.map((x, j) => (j === i ? { ...x, operator: v } : x)),
              )
            }
          />
          <Field
            label="Value"
            value={c.value}
            onChange={(v) =>
              onChange(
                conditions.map((x, j) => (j === i ? { ...x, value: v } : x)),
              )
            }
          />
          <button
            aria-label={`Remove filter ${i + 1}`}
            onClick={() => onChange(conditions.filter((_, j) => i !== j))}
          >
            ×
          </button>
        </div>
      ))}
      <div className="hire-actions">
        <button
          onClick={() =>
            onChange([
              ...conditions,
              { field: fields[0], operator: "Contains", value: "" },
            ])
          }
        >
          ＋ Condition
        </button>
        <button onClick={() => onChange([])}>Clear filters</button>
      </div>
      <div className="hire-actions">
        <input
          aria-label="Filter name"
          placeholder="Name this view"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button disabled={!name.trim()} onClick={save}>
          Save filter
        </button>
        <select
          aria-label="Saved filters"
          value=""
          onChange={(e) => onChange(saved[e.target.value] || [])}
        >
          <option value="">Saved filters</option>
          {Object.keys(saved).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
    </details>
  );
}
