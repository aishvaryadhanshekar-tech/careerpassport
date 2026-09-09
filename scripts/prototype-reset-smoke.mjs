import { expect } from '@playwright/test';

export async function runPrototypeResetAudit(context, base = 'http://127.0.0.1:5173', persistent = false) {
  const page = await context.newPage();
  try {
    await page.goto(base);
    await expect(page.locator('.jobs-table tbody tr')).toHaveCount(7);
    const seeded = await page.evaluate(async () => {
      const jobs = await import('/src/jobsStore.ts');
      return jobs.listJobs().map(job => ({ id: job.id, title: job.title }));
    });
    for (const job of seeded) {
      await page.goto(`${base}/jobs/${job.id}`);
      await expect(page.locator('.jd-title')).toContainText(job.title);
      await expect(page.locator('.jd-not-found')).toHaveCount(0);
    }
    await page.evaluate(async () => {
      const jobs = await import('/src/jobsStore.ts');
      const { createDraft } = await import('/src/types/index.ts');
      const { demoService } = await import('/src/demo/service.ts');
      const draft = createDraft(); draft.fields.designation.value = 'Temporary refresh audit job';
      jobs.upsertJobFromDraft('refresh-audit-job', draft);
      demoService().loadDemo('refresh-audit-project');
      localStorage.setItem('cp.review.columns', '["test"]');
      localStorage.setItem('unrelated-audit', 'keep');
      sessionStorage.setItem('unrelated-audit', 'keep');
    });
    await page.goto(`${base}/jobs/refresh-audit-job/canvas`);
    await expect(page.locator('.funnel-header h1')).toContainText('Temporary refresh audit job');
    await page.reload();
    if (persistent) {
      await expect(page.locator('.funnel-header h1')).toContainText('Temporary refresh audit job');
      expect(await page.evaluate(() => localStorage.getItem('cp.demo.v1.project.refresh-audit-project'))).toBeTruthy();
    } else {
      await expect(page).toHaveURL(`${base}/`);
      await expect(page.locator('.jobs-table tbody tr')).toHaveCount(7);
      expect(await page.evaluate(() => ({
        project: localStorage.getItem('cp.demo.v1.project.refresh-audit-project'),
        preference: localStorage.getItem('cp.review.columns'),
        current: sessionStorage.getItem('cp.session.cp.currentJobId'),
        foreignLocal: localStorage.getItem('unrelated-audit'),
        foreignSession: sessionStorage.getItem('unrelated-audit'),
      }))).toEqual({ project: null, preference: null, current: null, foreignLocal: 'keep', foreignSession: 'keep' });
      await page.reload();
      await expect(page.locator('.jobs-table tbody tr')).toHaveCount(7);
    }
    await page.goto(base);
    for (const width of [1512, 390]) {
      await page.setViewportSize({ width, height: 982 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `/tmp/mock-jobs-${persistent ? 'persistent' : 'reset'}-${width}.png` });
    }
    console.log(`PASS: seven sample detail pages, normal navigation, ${persistent ? 'flag-off persistence' : 'refresh reset, stale-draft removal, repeat reset and unrelated storage preservation'}.`);
  } finally { await page.close(); }
}
