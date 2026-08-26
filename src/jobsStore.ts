import { persistableDraft } from "./applyAnalysis";
import { uid } from "./files";
import { memoryStorage } from "./memoryStore";
import { STORAGE_KEY, saveDraft } from "./storage";
import { createDraft, type JobDraft } from "./types";

export const JOBS_KEY = "cp.jobs.v1";
export const CURRENT_JOB_ID_KEY = "cp.currentJobId";

export type JobRecord = {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: "Draft";
  title: string;
  location: string;
  workMode: string;
  salaryLabel: string;
  snapshot: ReturnType<typeof persistableDraft>;
};

function readList(): JobRecord[] {
  try {
    const raw = memoryStorage.getItem(JOBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JobRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(jobs: JobRecord[]) {
  memoryStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

export function listJobs(): JobRecord[] {
  return readList().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getCurrentJobId(): string | null {
  return memoryStorage.getItem(CURRENT_JOB_ID_KEY);
}

export function startNewJob(): string {
  const id = uid();
  memoryStorage.setItem(CURRENT_JOB_ID_KEY, id);
  saveDraft(createDraft());
  return id;
}

export function openJob(id: string): boolean {
  const job = readList().find((j) => j.id === id);
  if (!job) return false;
  memoryStorage.setItem(CURRENT_JOB_ID_KEY, id);
  memoryStorage.setItem(STORAGE_KEY, JSON.stringify(job.snapshot));
  return true;
}

export function salaryLabel(draft: JobDraft): string {
  const amount = draft.fields.salary.value.trim();
  if (!amount) return "—";
  const bits = [amount];
  if (draft.salaryCurrency) bits.push(draft.salaryCurrency);
  if (draft.salaryPeriod) bits.push(draft.salaryPeriod.toLowerCase());
  return bits.join(" · ");
}

export function upsertJobFromDraft(id: string, draft: JobDraft): JobRecord {
  const now = Date.now();
  const existing = readList().find((j) => j.id === id);
  const record: JobRecord = {
    id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    status: "Draft",
    title: draft.fields.designation.value.trim() || "Untitled job",
    location: draft.fields.location.value.trim() || "—",
    workMode: draft.fields.workMode.value.trim() || "—",
    salaryLabel: salaryLabel(draft),
    snapshot: persistableDraft(draft),
  };
  writeList([record, ...readList().filter((j) => j.id !== id)]);
  memoryStorage.setItem(CURRENT_JOB_ID_KEY, id);
  return record;
}

export function deleteJobs(ids: string[]) {
  const drop = new Set(ids);
  writeList(readList().filter((job) => !drop.has(job.id)));
  const current = memoryStorage.getItem(CURRENT_JOB_ID_KEY);
  if (current && drop.has(current)) {
    memoryStorage.removeItem(CURRENT_JOB_ID_KEY);
    memoryStorage.removeItem(STORAGE_KEY);
  }
}

export function formatUpdated(ts: number): string {
  const delta = Date.now() - ts;
  if (delta < 45_000) return "Just now";
  if (delta < 3_600_000) return `${Math.max(1, Math.round(delta / 60_000))}m ago`;
  if (delta < 86_400_000)
    return `${Math.max(1, Math.round(delta / 3_600_000))}h ago`;
  return new Date(ts).toLocaleDateString();
}
