import { createDraft } from "../types";
import { describe, expect, it } from 'vitest';
import { demoDraft } from '../demo/fixtures';
import { node } from './funnelModel';
import { migratePipelineTrips } from './pipelineTrips';

describe('pipeline trip migration', () => {
  it('preserves content and node identity and is idempotent', () => {
    const draft = demoDraft();
    const legacy = { ...node('trip', 'Original work sample', 'pipeline', 'legacy'), description: 'Explain a payment reconciliation.', duration: 45, position: {x:17,y:55} };
    const result = migratePipelineTrips([legacy], draft);
    expect(result.nodes[0]).toMatchObject(legacy);
    const trip = result.draft.trips.find(t => t.id === result.nodes[0].tripId)!;
    expect(trip.spine).toBe(legacy.description);
    expect(trip.stages[0].durationMinutes).toBe(45);
    expect(draft.trips).toHaveLength(0);
    expect(migratePipelineTrips(result.nodes,result.draft)).toEqual(result);
  });
  it('keeps existing full trip identity and questions', () => {
    const first = migratePipelineTrips([node('trip','Original','pipeline','a')],demoDraft());
    first.draft.trips[0].stages[0].spokenInstructions = 'User edited';
    const next = migratePipelineTrips(first.nodes,first.draft);
    expect(next.draft).toBe(first.draft);
    expect(next.draft.trips[0].stages[0].spokenInstructions).toBe('User edited');
  });
});

it('leaves a dropped Trip placeholder without generated Trip content',()=>{
 const draft=createDraft();
 const placeholder={...node('trip','New trip',null,'placeholder'),manual:true,placeholder:true};
 const result=migratePipelineTrips([placeholder],draft);
 expect(result.nodes[0]).toEqual(placeholder);
 expect(result.draft.trips).toHaveLength(0);
});
