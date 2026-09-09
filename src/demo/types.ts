import type { Viewport } from '@xyflow/react';
import type { Candidate, JobDraft, Trip } from '../types';
import type { FunnelNode } from '../canvasJob/funnelModel';
import type { HiringOperations } from '../hiring/types';

export type Configuration = {
  nodes: FunnelNode[]; draft: JobDraft; started: boolean; published: boolean; viewport?: Viewport;
};
export type Revision = { id: string; number: number; at: number; nodes: FunnelNode[]; draft: JobDraft };
export type DemoCandidate = Candidate & {
  revisionId: string | null;
  answers: Record<string, string>;
  stageEnteredAt: number;
  visit: number;
};
export type Assignment = {
  id: string; candidateId: string; nodeId: string; title: string; instructions: string;
  duration: number; status: 'assigned' | 'completed'; score?: number; tripId?: string; tripSnapshot?: Trip; answers?: Record<string,string>; expiresAt?: number;
};
export type Delivery = {
  id: string; candidateId: string; recipient: string; nodeId: string; name: string;
  subject: string; body: string; dueAt: number; sentAt?: number; status: 'scheduled' | 'delivered';
  eventKey: string;
};
export type DemoProject = {
  schemaVersion: 1; id: string; updatedAt: number; clock: number;
  configuration: Configuration;
  candidates: Record<string, DemoCandidate>;
  assignments: Record<string, Assignment>;
  deliveries: Record<string, Delivery>;
  revisions: Record<string, Revision>;
  liveRevisionId: string | null;
  connections: Record<string, boolean>;
  operations?: HiringOperations;
};
