import type { InferenceCard, JobDraft } from "./types";

function cardContent(cards: InferenceCard[], id: InferenceCard["id"]): string {
  return cards.find((card) => card.id === id)?.content.trim() ?? "";
}

export function generateSpine(cards: InferenceCard[], draft: JobDraft): string {
  const designation = draft.fields.designation.value.trim() || "the new hire";
  const department = draft.roleProfile.department.value.trim();
  const idealCandidate = cardContent(cards, "idealCandidate");
  const redFlags = cardContent(cards, "redFlags");

  const roleBit = department
    ? `You've just joined as ${designation.toLowerCase()} in ${department}.`
    : `You've just joined as ${designation.toLowerCase()}.`;

  const sentences = [
    roleBit,
    "You're ten days in.",
    idealCandidate
      ? `Leadership expects someone who is ${idealCandidate.toLowerCase().replace(/\.$/, "")}.`
      : "Leadership is watching closely to see how you settle in.",
    "A real situation has just landed on your desk, and how you handle it in the next stretch will shape how the team sees you.",
    redFlags
      ? `Everyone is quietly watching for signs of ${redFlags.toLowerCase().replace(/\.$/, "")}.`
      : "Everyone is quietly watching for how you think, not just what you know.",
  ];

  return sentences.join(" ");
}
