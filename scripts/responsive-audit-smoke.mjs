import { expect } from '@playwright/test';

export async function runResponsiveAudit(page) {
  const nodes = await page.locator('.react-flow__node').evaluateAll(nodes => nodes.map(n => ({ id: n.dataset.id, title: n.querySelector('.fn-main')?.getAttribute('aria-label') })).filter(n => n.title));
  for (const width of [1512, 1024, 780, 390]) {
    await page.setViewportSize({ width, height: 982 });
    for (const node of nodes) {
      // Select each rendered node even when outside the panned viewport, then inspect its panel.
      await page.locator('.react-flow__node').filter({ has: page.locator(`.fn-main[aria-label=${JSON.stringify(node.title)}]`) }).first().locator('.fn-main').evaluate(button => button.click());
      const panel = page.locator('.funnel-inspector');
      await expect(panel).toBeVisible();
      await expect(async () => {
        const issues = await panel.evaluate(panel => {
          const r = panel.getBoundingClientRect();
          const scroll = panel.querySelector('.funnel-inspector-scroll');
          return { left: r.left, right: r.right, width: r.width, overflow: scroll.scrollWidth - scroll.clientWidth };
        });
        expect(issues.left, `${width}: ${node.title} left`).toBeGreaterThanOrEqual(0);
        expect(issues.right, `${width}: ${node.title} right`).toBeLessThanOrEqual(width + 1);
        expect(issues.width, `${width}: ${node.title} min width`).toBeGreaterThanOrEqual(Math.min(340, width - 70));
        expect(issues.overflow, `${width}: ${node.title} overflow`).toBeLessThanOrEqual(1);
      }).toPass({ timeout: 1500 });
      if (width === 1512 || width === 390) {
        const tabs = await panel.getByRole('tablist').first().getByRole('tab').allTextContents();
        for (const tab of tabs) {
          await panel.getByRole('tablist').first().getByRole('tab', { name: tab, exact: true }).click();
          await expect(async () => {
            const overflow = await panel.locator('.funnel-inspector-scroll').evaluate(el => el.scrollWidth - el.clientWidth);
            expect(overflow, `${width}: ${node.title} / ${tab} overflow`).toBeLessThanOrEqual(1);
          }).toPass({ timeout: 1500 });
        }
        if (['Application form', 'Role & hiring settings'].includes(node.title)) {
          await page.screenshot({ path: `/tmp/careerpassport-panel-${node.id}-${width}.png`, fullPage: true });
        }
      }
    }
    await page.getByRole('button', { name: /^Ask AI about / }).click();
    await expect(page.locator('.funnel-inspector')).toBeVisible();
    await expect(page.getByLabel('AI request')).toBeInViewport();
    await expect(async () => {
      const box = await page.locator('.canvas-node-assistant').boundingBox();
      expect(box.width).toBeLessThanOrEqual(320);
      const toolbar = await page.locator('.canvas-global-trigger').boundingBox();
      if (toolbar) {
        const overlaps = box.x < toolbar.x + toolbar.width && box.x + box.width > toolbar.x && box.y < toolbar.y + toolbar.height && box.y + box.height > toolbar.y;
        expect(overlaps, 'Node chat must not overlap the global AI toolbar').toBe(false);
      }
    }).toPass();
    await page.screenshot({ path: `/tmp/careerpassport-responsive-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Close AI chat' }).click();
  }
  console.log(`PASS: ${nodes.length} node panels at 1512, 1024, 780 and 390px; compact chat and details coexist.`);
}
