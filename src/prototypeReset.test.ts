import { beforeEach, describe, expect, it } from 'vitest';
import { memoryStorage } from './memoryStore';
import { resetPrototypeOnRefresh } from './prototypeReset';

function storage(): Storage {
  const values = new Map<string, string>();
  return { get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); },
    removeItem: key => { values.delete(key); }, clear: () => values.clear() };
}

describe('prototype refresh reset', () => {
  beforeEach(() => memoryStorage.clear());
  it('clears all prototype data from both stores and memory, preserving unrelated data', () => {
    const local = storage(), session = storage();
    for (const store of [local, session]) {
      for (const key of ['cp.jobs.v1', 'cp.session.cp.jobDraft.v1', 'cp.demo.v1.project.old', 'cp.funnel.old', 'cp.review.columns']) store.setItem(key, 'old');
      store.setItem('another-app', 'keep');
    }
    memoryStorage.setItem('cp.currentJobId', 'old');
    expect(resetPrototypeOnRefresh(true, 'reload', [local, session])).toBe(true);
    expect(memoryStorage.getItem('cp.currentJobId')).toBeNull();
    for (const store of [local, session]) { expect(store.length).toBe(1); expect(store.getItem('another-app')).toBe('keep'); }
  });
  it.each(['navigate', 'back_forward', undefined])('preserves state for navigation type %s', type => {
    const local = storage(); local.setItem('cp.demo.v1.project.old', 'keep');
    expect(resetPrototypeOnRefresh(true, type, [local])).toBe(false);
    expect(local.getItem('cp.demo.v1.project.old')).toBe('keep');
  });
  it('preserves saved work on reload when disabled', () => {
    const local = storage(); local.setItem('cp.jobs.v1', 'keep');
    memoryStorage.setItem('cp.currentJobId', 'keep');
    expect(resetPrototypeOnRefresh(false, 'reload', [local])).toBe(false);
    expect(local.getItem('cp.jobs.v1')).toBe('keep');
    expect(memoryStorage.getItem('cp.currentJobId')).toBe('keep');
  });
  it('allows unavailable storage and repeat resets', () => {
    expect(resetPrototypeOnRefresh(true, 'reload', [null])).toBe(true);
    expect(resetPrototypeOnRefresh(true, 'reload', [null])).toBe(true);
  });
});
