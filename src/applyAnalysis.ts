import type { Extraction, JobDraft } from "./types";

export function applyExtraction(
  draft: JobDraft,
  extraction: Extraction | null,
): JobDraft {
  const fields = { ...draft.fields };
  const flags = { ...draft.flags };
  let salaryCurrency = draft.salaryCurrency;
  let salaryPeriod = draft.salaryPeriod;

  if (extraction) {
    for (const [id, next] of Object.entries(extraction.fields)) {
      const key = id as keyof typeof fields;
      const current = fields[key];
      if (!current) continue;
      if (current.source === "user") continue;
      if (current.value.trim() !== "") continue;
      if (typeof next !== "string" || next.trim() === "") continue;
      fields[key] = { value: next, source: "extracted" };
    }

    if (salaryCurrency === null && extraction.salaryCurrency) {
      salaryCurrency = extraction.salaryCurrency;
    }
    if (
      salaryPeriod === "Per year" &&
      extraction.salaryPeriod &&
      extraction.salaryPeriod !== "Per year"
    ) {
      salaryPeriod = extraction.salaryPeriod;
    }
    if (salaryPeriod === "Per year" && extraction.salaryPeriod === "Per year") {
      salaryPeriod = "Per year";
    }

    for (const [id, on] of Object.entries(extraction.flags)) {
      if (on) flags[id as keyof typeof flags] = true;
    }
  }

  const anyFlag = Object.values(flags).some(Boolean);
  let flagsPromptShown = draft.flagsPromptShown;
  if (!anyFlag && !flagsPromptShown) flagsPromptShown = true;

  return {
    ...draft,
    fields,
    flags,
    salaryCurrency,
    salaryPeriod,
    analysedOnce: true,
    flagsPromptShown,
  };
}

export function persistableDraft(draft: JobDraft) {
  return {
    transcript: draft.transcript,
    clips: draft.clips.map(({ id, createdAt, durationMs }) => ({
      id,
      createdAt,
      durationMs,
    })),
    attachments: draft.attachments.map(
      ({ id, name, mime, sizeBytes, kind }) => ({
        id,
        name,
        mime,
        sizeBytes,
        kind,
      }),
    ),
    fields: draft.fields,
    salaryCurrency: draft.salaryCurrency,
    salaryPeriod: draft.salaryPeriod,
    flags: draft.flags,
    flagsPromptShown: draft.flagsPromptShown,
    analysedOnce: draft.analysedOnce,
    application: draft.application ?? null,
    preview: draft.preview,
    previewGenerated: draft.previewGenerated,
  };
}

