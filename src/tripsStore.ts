import { DEFAULT_ROUND_TYPES } from "./tripAIBuild";
import { uid } from "./files";
import { deriveInferenceCards } from "./tripInference";
import { DEFAULT_DURATION_BY_TYPE } from "./tripStages";
import type { Difficulty, JobDraft, Stage, Trip } from "./types";

function emptyStages(): Stage[] {
  return DEFAULT_ROUND_TYPES.map((type) => ({
    id: uid(),
    type,
    spokenInstructions: "",
    items: [],
    durationMinutes: DEFAULT_DURATION_BY_TYPE[type],
  }));
}

export function createTrip(draft: JobDraft): { draft: JobDraft; tripId: string } {
  const now = Date.now();
  const trip: Trip = {
    id: uid(),
    title: "Untitled trip",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    inferenceCards: deriveInferenceCards(draft),
    inferenceCardsLocked: false,
    spine: "",
    spineGenerated: false,
    stages: emptyStages(),
    aiPrefilled: false,
    difficulty: "medium",
    pipelineStageId: null,
  };
  return {
    draft: { ...draft, trips: [...draft.trips, trip] },
    tripId: trip.id,
  };
}

export function createTripShellForAI(
  draft: JobDraft,
  opts: { difficulty: Difficulty; pipelineStageId: string },
): { draft: JobDraft; tripId: string } {
  const now = Date.now();
  const trip: Trip = {
    id: uid(),
    title: "Untitled trip",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    inferenceCards: deriveInferenceCards(draft),
    inferenceCardsLocked: false,
    spine: "",
    spineGenerated: false,
    stages: [],
    aiPrefilled: true,
    difficulty: opts.difficulty,
    pipelineStageId: opts.pipelineStageId,
  };
  return {
    draft: { ...draft, trips: [...draft.trips, trip] },
    tripId: trip.id,
  };
}

export function getTrip(draft: JobDraft, tripId: string): Trip | null {
  return draft.trips.find((trip) => trip.id === tripId) ?? null;
}

export function updateTrip(draft: JobDraft, tripId: string, patch: Partial<Trip>): JobDraft {
  return {
    ...draft,
    trips: draft.trips.map((trip) =>
      trip.id === tripId ? { ...trip, ...patch, updatedAt: Date.now() } : trip,
    ),
  };
}

export function publishTrip(draft: JobDraft, tripId: string): JobDraft {
  return updateTrip(draft, tripId, { status: "published" });
}

export function duplicateTrip(draft: JobDraft, tripId: string): { draft: JobDraft; tripId: string } {
  const source = getTrip(draft, tripId);
  if (!source) return { draft, tripId };
  const now = Date.now();
  const clone: Trip = {
    ...source,
    id: uid(),
    title: `${source.title} (copy)`,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  return {
    draft: { ...draft, trips: [...draft.trips, clone] },
    tripId: clone.id,
  };
}
