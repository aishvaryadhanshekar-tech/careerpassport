import type { JobDraft, Trip } from '../types';
import { deriveInferenceCards } from '../tripInference';
import type { FunnelNode } from './funnelModel';

/** Keep original node identities and published data; only bridge the editable draft. */
export function migratePipelineTrips(nodes: FunnelNode[], draft: JobDraft): { nodes: FunnelNode[]; draft: JobDraft } {
  const trips = [...draft.trips];
  const linked = nodes.map(n => {
    if (n.kind !== 'trip' || n.placeholder) return n;
    const id = n.tripId || (trips.some(t => t.id === n.id) ? n.id : `pipeline-trip-${n.id}`);
    if (!trips.some(t => t.id === id)) {
      const stage = nodes.find(p => p.id === n.parent);
      const trip: Trip = {
        id, title: n.title, status: 'draft', createdAt: 0, updatedAt: 0,
        inferenceCards: deriveInferenceCards(draft), inferenceCardsLocked: false,
        spine: n.description, spineGenerated: false, aiPrefilled: false, difficulty: 'medium',
        pipelineStageId: stage?.stageKey || n.parent,
        stages: [{ id: `${id}-content`, type: 'case_study', spokenInstructions: n.description,
          durationMinutes: n.duration, items: n.description ? [{ id: `${id}-response`, kind: 'question',
            prompt: n.description, type: 'paragraph', required: 'mandatory', options: [] }] : [] }],
      };
      trips.push(trip);
    }
    return n.tripId === id ? n : { ...n, tripId: id };
  });
  return { nodes: linked, draft: trips.length === draft.trips.length ? draft : { ...draft, trips } };
}
