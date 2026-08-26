import {
  DEFAULT_QUALITATIVE_GRADES,
  type EvaluationCriterion,
  type EvalImportance,
  type EvalType,
} from "./types";

let seq = 0;
function nextId(): string {
  seq += 1;
  return `criterion-${Date.now()}-${seq}`;
}

export function addCriterion(list: EvaluationCriterion[]): EvaluationCriterion[] {
  return [
    ...list,
    {
      id: nextId(),
      label: "",
      type: "qualitative",
      importance: "important",
      grades: [...DEFAULT_QUALITATIVE_GRADES],
    },
  ];
}

export function removeCriterion(
  list: EvaluationCriterion[],
  id: string,
): EvaluationCriterion[] {
  return list.filter((item) => item.id !== id);
}

export function updateCriterion(
  list: EvaluationCriterion[],
  id: string,
  patch: Partial<EvaluationCriterion>,
): EvaluationCriterion[] {
  return list.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export function setCriterionType(
  list: EvaluationCriterion[],
  id: string,
  type: EvalType,
): EvaluationCriterion[] {
  return list.map((item) => {
    if (item.id !== id) return item;
    if (type === "qualitative" && !item.grades) {
      return { ...item, type, grades: [...DEFAULT_QUALITATIVE_GRADES] };
    }
    return { ...item, type };
  });
}

export function setCriterionImportance(
  list: EvaluationCriterion[],
  id: string,
  importance: EvalImportance,
): EvaluationCriterion[] {
  return updateCriterion(list, id, { importance });
}

export function addGrade(
  list: EvaluationCriterion[],
  id: string,
  grade: string,
): EvaluationCriterion[] {
  const trimmed = grade.trim();
  if (!trimmed) return list;
  return list.map((item) => {
    if (item.id !== id) return item;
    const grades = item.grades ?? [];
    if (grades.some((g) => g.toLowerCase() === trimmed.toLowerCase())) return item;
    return { ...item, grades: [...grades, trimmed] };
  });
}

export function removeGrade(
  list: EvaluationCriterion[],
  id: string,
  grade: string,
): EvaluationCriterion[] {
  return list.map((item) =>
    item.id === id
      ? { ...item, grades: (item.grades ?? []).filter((g) => g !== grade) }
      : item,
  );
}
