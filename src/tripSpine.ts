import type { InferenceCard, JobDraft } from "./types";

function cardContent(cards: InferenceCard[], id: InferenceCard["id"]): string {
  return cards.find((card) => card.id === id)?.content.trim() ?? "";
}

export function generateSpine(cards: InferenceCard[], draft: JobDraft): string {
  const designation = draft.fields.designation.value.trim() || "the new hire";
  const department = draft.roleProfile.department.value.trim();
  const idealCandidate = cardContent(cards, "idealCandidate");

  const roleBit = department
    ? `You've just joined as ${designation.toLowerCase()} in ${department}, and a real situation has just landed on your desk.`
    : `You've just joined as ${designation.toLowerCase()}, and a real situation has just landed on your desk.`;

  const sentences = [
    roleBit,
    idealCandidate
      ? `Leadership expects someone who is ${idealCandidate.toLowerCase().replace(/\.$/, "")}.`
      : "",
  ].filter(Boolean);

  return sentences.join(" ");
}
