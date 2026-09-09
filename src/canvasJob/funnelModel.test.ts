import { describe, expect, it } from 'vitest';
import { createDraft } from '../types';
import { baseFunnel, expandFunnel, layoutFunnel, node, publishErrors, removeBranch, resetFunnelLayout, templateFunnel, visibleNodes } from './funnelModel';

describe('hiring funnel hierarchy', () => {
  it('starts with only the role and adds stages without duplicating existing nodes', () => {
    expect(baseFunnel()).toHaveLength(1);
    const full = expandFunnel(baseFunnel());
    expect(full.filter(n => n.kind === 'stage').map(n => n.title)).toEqual(['Prospects', 'Pipeline', 'Interview process']);
    expect(expandFunnel(full)).toBe(full);
  });
  it('collapses all descendants without losing configuration', () => {
    const nodes = templateFunnel('Designer');
    const collapsed = nodes.map(n => n.id === 'interview' ? { ...n, collapsed: true } : n);
    expect(visibleNodes(collapsed).some(n => n.kind === 'round')).toBe(false);
    expect(collapsed.length).toBe(nodes.length);
    expect(visibleNodes(collapsed).some(n => n.id === 'pipeline')).toBe(true);
  });
  it('removes a round and its nested trips/messages without deleting other rounds', () => {
    const nodes = templateFunnel('Engineer');
    const round = nodes.find(n => n.kind === 'round')!;
    const remaining = removeBranch(nodes, round.id);
    expect(remaining.some(n => n.id === round.id || n.parent === round.id)).toBe(false);
    expect(remaining.filter(n => n.kind === 'round')).toHaveLength(1);
  });
  it('keeps the pipeline vertical with each section below the previous section descendants', () => {
    const nodes = templateFunnel('Designer');
    nodes.push(node('capability', 'Hiring team', 'job', 'team'));
    const nested = nodes.find(n => n.kind === 'trip' && n.parent !== 'pipeline')!;
    nodes.push(node('communication', 'Follow-up', nested.id, 'follow-up'));
    const layout = layoutFunnel(nodes);
    for (const item of layout) {
      const parent = layout.find(n => n.id === item.parent);
      if (parent) expect(item.position.y - parent.position.y).toBeGreaterThanOrEqual(230);
      for (const other of layout.filter(n => n.id !== item.id)) {
        expect(Math.abs(item.position.y - other.position.y)).toBeGreaterThanOrEqual(230);
      }
    }
    expect(layout.find(n => n.id === 'job')!.position).toEqual({ x: 0, y: 0 });
    const stages = layout.filter(n => n.kind === 'stage');
    expect(stages.every(n => n.position.x === 0)).toBe(true);
    for (let i = 1; i < stages.length; i++) {
      const previousSection = layout.filter(n => n.parent === stages[i - 1].id);
      expect(stages[i].position.y).toBeGreaterThan(
        Math.max(stages[i - 1].position.y, ...previousSection.map(n => n.position.y)),
      );
    }
    expect(layout.find(n => n.id === 'application')!.position.x).toBe(70);
    expect(new Set(layout.map(n => `${n.position.x}:${n.position.y}`)).size).toBe(layout.length);
    expect(Math.max(...layout.map(n => n.position.x))).toBeLessThanOrEqual(210);
  });
  it('keeps manual positions and lets unpositioned descendants follow a moved parent', () => {
    const nodes = templateFunnel('Engineer');
    const before = layoutFunnel(nodes);
    const original = before.find(n => n.id === 'interview')!.position;
    const moved = nodes.map(n => n.id === 'interview'
      ? { ...n, position: { x: original.x + 80, y: original.y + 45 } }
      : n);
    const round = moved.find(n => n.kind === 'round')!;
    const pinnedChild = moved.find(n => n.parent === round.id)!;
    pinnedChild.position = { x: -500, y: 1000 };
    const after = layoutFunnel(moved);
    const originalRound = before.find(n => n.id === round.id)!.position;
    expect(after.find(n => n.id === round.id)!.position).toEqual({ x: originalRound.x + 80, y: originalRound.y + 45 });
    expect(after.find(n => n.id === pinnedChild.id)!.position).toEqual(pinnedChild.position);
    expect(layoutFunnel(moved.map(n => ({ ...n, collapsed: n.id === 'interview' }))).find(n => n.id === 'pipeline')!.position).toEqual(after.find(n => n.id === 'pipeline')!.position);
    expect(layoutFunnel(moved.map(n => ({ ...n, collapsed: false })))).toEqual(after);
  });
  it('accepts older saves and ignores invalid saved coordinates', () => {
    const nodes = expandFunnel(baseFunnel());
    expect(layoutFunnel(nodes.map(n => ({ ...n, position: { x: NaN, y: Infinity } })))).toEqual(layoutFunnel(nodes));
  });
  it('resets manual positions without changing connections, configuration, or collapsed state', () => {
    const original = templateFunnel('Designer').map(n => ({
      ...n,
      collapsed: n.id === 'interview',
    }));
    const positioned = original.map((n, i) => ({
      ...n,
      position: { x: i * -90, y: 1200 + i * 37 },
    }));
    const snapshot = structuredClone(positioned);
    const reset = resetFunnelLayout(positioned);
    expect(reset).toEqual(original);
    expect(reset.every(n => !('position' in n))).toBe(true);
    expect(positioned).toEqual(snapshot);
    expect(layoutFunnel(reset)).toEqual(layoutFunnel(original));
    // Previously hidden, pinned descendants also return to their default layout.
    expect(layoutFunnel(reset.map(n => ({ ...n, collapsed: false })))).toEqual(
      layoutFunnel(original.map(n => ({ ...n, collapsed: false }))),
    );
    expect(resetFunnelLayout(reset)).toEqual(reset);
  });
  it('validates the spec-required role fields before publication', () => {
    const draft = createDraft();
    expect(publishErrors(draft)).toEqual(['Job title', 'Role type', 'Location', 'Basic requirements']);
    for (const key of ['designation', 'experienceType', 'location', 'mustHaves'] as const) draft.fields[key] = { value: 'Provided', source: 'user' };
    expect(publishErrors(draft)).toEqual([]);
  });
});
