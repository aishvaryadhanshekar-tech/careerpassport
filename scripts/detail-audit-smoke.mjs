import { expect } from '@playwright/test';

export async function runDetailAudit(context, base) {
  const page = await context.newPage();
  try {
    await page.goto(`${base}/settings`);
    await page.evaluate(async () => { const { startNewJob } = await import('/src/jobsStore.ts'); startNewJob(); });
    await page.goto(`${base}/create-job-canvas`);
    for (const width of [1512, 780, 390, 320]) {
      await page.setViewportSize({ width, height: 982 });
      const choices = page.locator('.funnel-start-options').first();
      await expect(choices.locator(':scope > button')).toHaveCount(2);
      const geometry = await choices.evaluate(el => {
        const cards = [...el.querySelectorAll(':scope > button')].map(n => n.getBoundingClientRect());
        const area = el.closest('.funnel-start').getBoundingClientRect();
        return { areaCenter: area.x + area.width / 2, cardsCenter: (Math.min(...cards.map(r=>r.left)) + Math.max(...cards.map(r=>r.right))) / 2 };
      });
      expect(Math.abs(geometry.areaCenter - geometry.cardsCenter), `New-job choices centered at ${width}px`).toBeLessThan(4);
      await page.screenshot({ path: `/tmp/detail-fixed-entry-${width}.png` });
    }
    await page.setViewportSize({ width: 1512, height: 982 });
    await page.getByRole('button', { name: 'Build with AI', exact: false }).click();
    await page.getByRole('button', { name: 'Close canvas AI assistant' }).click();
    await page.getByRole('button', { name: 'Workspace tools and demo options' }).click();
    await page.getByRole('button', { name: 'Load sample demo', exact: true }).click();
    await page.getByRole('button', { name: 'Workspace tools and demo options' }).click();
    await page.locator('.react-flow__node[data-id="job"] .fn-main').evaluate(el=>el.click());
    await page.getByRole('button', { name: 'Role & hiring settings ↗', exact: true }).click();
    const tabs = page.locator('.hire-tabs').first();
    for (const name of ['Role & comp', 'Requirements', 'Job description', 'Sourcing brief', 'Visibility & posting', 'Lifecycle', 'Evaluation & playbook']) {
      await tabs.getByRole('tab', { name, exact: true }).click();
      await expect(tabs.getByRole('tab', { name, exact: true })).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('.funnel-inspector-scroll')).not.toBeEmpty();
    }
    for (const width of [1512, 390, 320]) {
      await page.setViewportSize({ width, height: 982 });
      const selected = tabs.getByRole('tab', { selected: true });
      await selected.focus();
      await page.keyboard.press('Home');
      await expect(tabs.getByRole('tab').first()).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('End');
      await expect(tabs.getByRole('tab').last()).toHaveAttribute('aria-selected', 'true');
      const tabStyle = await selected.evaluate(el=>({ radius: getComputedStyle(el).borderRadius, top: getComputedStyle(el).borderTopWidth }));
      expect(tabStyle).toEqual({ radius: '0px', top: '0px' });
      expect(await page.locator('.funnel-inspector').evaluate(el=>el.scrollWidth-el.clientWidth)).toBeLessThanOrEqual(1);
      await page.screenshot({ path: `/tmp/detail-fixed-tabs-${width}.png` });
    }
    console.log('PASS: centered choices, seven setup tabs, keyboard navigation and responsive tab affordances.');
  } finally { await page.close(); }
}
