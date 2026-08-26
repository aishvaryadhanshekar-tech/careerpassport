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

export function setQuestionType(
  config: ApplicationConfig,
  id: string,
  type: CustomQuestionType,
): ApplicationConfig {
  const isChoice =
    type === "multiple_choice" || type === "checkboxes" || type === "dropdown";
  return mapQuestion(config, id, (question) => ({
    ...question,
    type,
    options: isChoice ? (question.options.length ? question.options : ["", ""]) : [],
  }));
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
  const questionMinutes = questions.reduce(
    (sum, question) =>
      sum +
      (question.type === "short_answer" || question.type === "paragraph"
        ? 1.5
        : 0.75),
    0,
  );
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
