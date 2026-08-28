import { STANDARD_FIELD_META } from "./applicationCatalog";
import { uid } from "./files";
import type {
  ApplicationConfig,
  ApplicationItem,
  CustomQuestion,
  CustomQuestionType,
  FieldRequirement,
  SectionBreak,
  StandardFieldId,
  StandardFieldRequirement,
} from "./types";

function move<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice();
  const [item] = next.splice(from, 1);
  if (item === undefined) return items;
  next.splice(to, 0, item);
  return next;
}

function isQuestion(item: ApplicationItem): item is CustomQuestion {
  return item.kind === "question";
}

function insertAfter(
  items: ApplicationItem[],
  afterId: string | undefined,
  item: ApplicationItem,
): ApplicationItem[] {
  if (!afterId) return [...items, item];
  const index = items.findIndex((existing) => existing.id === afterId);
  if (index === -1) return [...items, item];
  const next = items.slice();
  next.splice(index + 1, 0, item);
  return next;
}

function mapQuestion(
  config: ApplicationConfig,
  id: string,
  update: (question: CustomQuestion) => CustomQuestion,
): ApplicationConfig {
  return {
    ...config,
    items: config.items.map((item) =>
      isQuestion(item) && item.id === id ? update(item) : item,
    ),
  };
}

export function setStandardFieldRequirement(
  config: ApplicationConfig,
  id: StandardFieldId,
  requirement: StandardFieldRequirement,
): ApplicationConfig {
  return {
    ...config,
    standardOrder: config.standardOrder.map((field) =>
      field.id === id ? { ...field, required: requirement } : field,
    ),
  };
}

export function removeStandardField(
  config: ApplicationConfig,
  id: StandardFieldId,
): ApplicationConfig {
  return {
    ...config,
    standardOrder: config.standardOrder.filter((field) => field.id !== id),
  };
}

export function restoreStandardField(
  config: ApplicationConfig,
  id: StandardFieldId,
): ApplicationConfig {
  if (config.standardOrder.some((field) => field.id === id)) return config;
  return {
    ...config,
    standardOrder: [
      ...config.standardOrder,
      { id, required: STANDARD_FIELD_META[id].defaultRequired },
    ],
  };
}

export function reorderStandardFields(
  config: ApplicationConfig,
  from: number,
  to: number,
): ApplicationConfig {
  return { ...config, standardOrder: move(config.standardOrder, from, to) };
}

export function toggleContextShown(
  config: ApplicationConfig,
  key: "company" | "role",
): ApplicationConfig {
  return {
    ...config,
    context: {
      ...config.context,
      [key]: { ...config.context[key], shown: !config.context[key].shown },
    },
  };
}

export function setContextText(
  config: ApplicationConfig,
  key: "company" | "role",
  text: string,
): ApplicationConfig {
  return {
    ...config,
    context: {
      ...config.context,
      [key]: { ...config.context[key], text },
    },
  };
}

export function addQuestion(
  config: ApplicationConfig,
  afterId?: string,
): ApplicationConfig {
  const question: CustomQuestion = {
    id: uid(),
    kind: "question",
    prompt: "",
    type: "short_answer",
    required: "optional",
    options: [],
  };
  return { ...config, items: insertAfter(config.items, afterId, question) };
}

export function addSection(
  config: ApplicationConfig,
  afterId?: string,
): ApplicationConfig {
  const sectionCount = config.items.filter(
    (item) => item.kind === "section",
  ).length;
  const section: SectionBreak = {
    id: uid(),
    kind: "section",
    title: `Section ${sectionCount + 2}`,
    description: "",
  };
  return { ...config, items: insertAfter(config.items, afterId, section) };
}

export function removeQuestion(
  config: ApplicationConfig,
  id: string,
): ApplicationConfig {
  return {
    ...config,
    items: config.items.filter((item) => item.id !== id),
  };
}

export function duplicateItem(
  config: ApplicationConfig,
  id: string,
): ApplicationConfig {
  const item = config.items.find((entry) => entry.id === id);
  if (!item) return config;
  const clone: ApplicationItem = { ...item, id: uid() };
  return { ...config, items: insertAfter(config.items, id, clone) };
}

export function updateQuestionPrompt(
  config: ApplicationConfig,
  id: string,
  prompt: string,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({ ...question, prompt }));
}

const CHOICE_TYPES: CustomQuestionType[] = ["multiple_choice", "checkboxes", "dropdown"];
const GRID_TYPES: CustomQuestionType[] = ["multiple_choice_grid", "checkbox_grid"];

export function setQuestionType(
  config: ApplicationConfig,
  id: string,
  type: CustomQuestionType,
): ApplicationConfig {
  const isChoice = CHOICE_TYPES.includes(type);
  const isGrid = GRID_TYPES.includes(type);
  return mapQuestion(config, id, (question) => {
    const next: CustomQuestion = {
      ...question,
      type,
      options: isChoice ? (question.options.length ? question.options : ["", ""]) : [],
      rows: undefined,
      columns: undefined,
      requireResponsePerRow: undefined,
      scaleMin: undefined,
      scaleMax: undefined,
      scaleMinLabel: undefined,
      scaleMaxLabel: undefined,
      ratingMax: undefined,
      ratingIcon: undefined,
      restrictFileTypes: undefined,
      allowedFileTypes: undefined,
      maxFiles: undefined,
      maxFileSizeMb: undefined,
    };
    if (isGrid) {
      next.rows = question.rows?.length ? question.rows : [""];
      next.columns = question.columns?.length ? question.columns : [""];
      next.requireResponsePerRow = question.requireResponsePerRow ?? false;
    } else if (type === "linear_scale") {
      next.scaleMin = question.scaleMin ?? 1;
      next.scaleMax = question.scaleMax ?? 5;
      next.scaleMinLabel = question.scaleMinLabel ?? "";
      next.scaleMaxLabel = question.scaleMaxLabel ?? "";
    } else if (type === "rating") {
      next.ratingMax = question.ratingMax ?? 5;
      next.ratingIcon = question.ratingIcon ?? "star";
    } else if (type === "file_upload") {
      next.restrictFileTypes = question.restrictFileTypes ?? false;
      next.allowedFileTypes = question.allowedFileTypes ?? [];
      next.maxFiles = question.maxFiles ?? 1;
      next.maxFileSizeMb = question.maxFileSizeMb ?? 10;
    }
    return next;
  });
}

export function setQuestionRequirement(
  config: ApplicationConfig,
  id: string,
  requirement: FieldRequirement,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({
    ...question,
    required: requirement,
  }));
}

export function setQuestionImage(
  config: ApplicationConfig,
  id: string,
  imageUrl: string | undefined,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({ ...question, imageUrl }));
}

export function setSectionTitle(
  config: ApplicationConfig,
  id: string,
  title: string,
): ApplicationConfig {
  return {
    ...config,
    items: config.items.map((item) =>
      item.kind === "section" && item.id === id ? { ...item, title } : item,
    ),
  };
}

export function setSectionDescription(
  config: ApplicationConfig,
  id: string,
  description: string,
): ApplicationConfig {
  return {
    ...config,
    items: config.items.map((item) =>
      item.kind === "section" && item.id === id
        ? { ...item, description }
        : item,
    ),
  };
}

export function reorderItems(
  config: ApplicationConfig,
  from: number,
  to: number,
): ApplicationConfig {
  return { ...config, items: move(config.items, from, to) };
}

export function addQuestionOption(
  config: ApplicationConfig,
  id: string,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({
    ...question,
    options: [...question.options, ""],
  }));
}

export function updateQuestionOption(
  config: ApplicationConfig,
  id: string,
  optionIndex: number,
  text: string,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({
    ...question,
    options: question.options.map((option, index) =>
      index === optionIndex ? text : option,
    ),
  }));
}

export function removeQuestionOption(
  config: ApplicationConfig,
  id: string,
  optionIndex: number,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({
    ...question,
    options: question.options.filter((_, index) => index !== optionIndex),
  }));
}

export function addGridRow(config: ApplicationConfig, id: string): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({
    ...question,
    rows: [...(question.rows ?? []), ""],
  }));
}

export function updateGridRow(
  config: ApplicationConfig,
  id: string,
  rowIndex: number,
  text: string,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({
    ...question,
    rows: (question.rows ?? []).map((row, index) => (index === rowIndex ? text : row)),
  }));
}

export function removeGridRow(
  config: ApplicationConfig,
  id: string,
  rowIndex: number,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({
    ...question,
    rows: (question.rows ?? []).filter((_, index) => index !== rowIndex),
  }));
}

export function addGridColumn(config: ApplicationConfig, id: string): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({
    ...question,
    columns: [...(question.columns ?? []), ""],
  }));
}

export function updateGridColumn(
  config: ApplicationConfig,
  id: string,
  columnIndex: number,
  text: string,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({
    ...question,
    columns: (question.columns ?? []).map((column, index) =>
      index === columnIndex ? text : column,
    ),
  }));
}

export function removeGridColumn(
  config: ApplicationConfig,
  id: string,
  columnIndex: number,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({
    ...question,
    columns: (question.columns ?? []).filter((_, index) => index !== columnIndex),
  }));
}

export function setRequireResponsePerRow(
  config: ApplicationConfig,
  id: string,
  requireResponsePerRow: boolean,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({ ...question, requireResponsePerRow }));
}

export function setScaleRange(
  config: ApplicationConfig,
  id: string,
  scaleMin: number,
  scaleMax: number,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({ ...question, scaleMin, scaleMax }));
}

export function setScaleLabel(
  config: ApplicationConfig,
  id: string,
  which: "min" | "max",
  label: string,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({
    ...question,
    ...(which === "min" ? { scaleMinLabel: label } : { scaleMaxLabel: label }),
  }));
}

export function setRatingMax(
  config: ApplicationConfig,
  id: string,
  ratingMax: number,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({ ...question, ratingMax }));
}

export function setRatingIcon(
  config: ApplicationConfig,
  id: string,
  ratingIcon: "star" | "heart" | "thumb",
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({ ...question, ratingIcon }));
}

export function setFileUploadRule(
  config: ApplicationConfig,
  id: string,
  rule: Partial<
    Pick<
      CustomQuestion,
      "restrictFileTypes" | "allowedFileTypes" | "maxFiles" | "maxFileSizeMb"
    >
  >,
): ApplicationConfig {
  return mapQuestion(config, id, (question) => ({ ...question, ...rule }));
}

export function mandatoryCount(config: ApplicationConfig): number {
  const fields = config.standardOrder.filter(
    (field) => field.required === "mandatory",
  ).length;
  const questions = config.items.filter(
    (item) => isQuestion(item) && item.required === "mandatory",
  ).length;
  return fields + questions;
}

export function estimateApplicationOverview(
  config: ApplicationConfig,
): { totalItems: number; estimatedMinutes: number } {
  const activeFields = config.standardOrder.filter(
    (field) => field.required !== "skipped",
  );
  const questions = config.items.filter(isQuestion);
  const fieldMinutes = activeFields.length * 0.5;
  const questionMinutes = questions.reduce((sum, question) => {
    if (question.type === "short_answer" || question.type === "paragraph") return sum + 1.5;
    if (GRID_TYPES.includes(question.type) || question.type === "file_upload") return sum + 1;
    if (
      question.type === "linear_scale" ||
      question.type === "rating" ||
      question.type === "date" ||
      question.type === "time"
    ) {
      return sum + 0.5;
    }
    return sum + 0.75;
  }, 0);
  const totalItems = activeFields.length + questions.length;
  const estimatedMinutes = Math.max(
    1,
    Math.round(fieldMinutes + questionMinutes),
  );
  return { totalItems, estimatedMinutes };
}

export function removedStandardIds(
  config: ApplicationConfig,
): StandardFieldId[] {
  const present = new Set(config.standardOrder.map((field) => field.id));
  return (
    Object.keys(STANDARD_FIELD_META) as StandardFieldId[]
  ).filter((id) => !present.has(id));
}
