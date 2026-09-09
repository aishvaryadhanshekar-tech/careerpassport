import { expect } from '@playwright/test';

// Read-only route coverage, using the isolated smoke context's existing data.
export async function runScreenAudit(page) {
  const originalUrl = page.url();
  const originalViewport = page.viewportSize();
  const origin = new URL(originalUrl).origin;
  const stored = await page.evaluate(() => {
    const read = key => sessionStorage.getItem(`cp.session.${key}`) ?? localStorage.getItem(key);
    const jobs = JSON.parse(read('cp.jobs.v1') ?? '[]');
    const currentId = read('cp.currentJobId');
    const job = jobs.find(item => item.id === currentId) ?? jobs[0];
    const tripJob = jobs.find(item => item.snapshot?.trips?.length);
    return { jobId: job?.id, tripJobId: tripJob?.id, tripId: tripJob?.snapshot?.trips?.[0]?.id };
  });
  expect(stored.jobId, 'Screen audit needs a saved job from the smoke setup').toBeTruthy();
  const jobPath = `/jobs/${encodeURIComponent(stored.jobId)}`;
  const routes = [
    ['jobs', '/'],
    ['settings', '/settings'],
    ['create-job', '/create-job'],
    ['role-profile', '/role-profile'],
    ['application-editor', '/step-2'],
    ['publish-preview', '/step-3'],
    ['job-overview', jobPath],
    ['pipeline', `${jobPath}/pipeline`],
    ['prospects', `${jobPath}/prospects`],
    ['communications', `${jobPath}/communications`],
    ['trips', `${jobPath}/trips`],
  ];
  if (stored.tripId) {
    routes.push(['trip-builder', `/jobs/${encodeURIComponent(stored.tripJobId)}/trips/${encodeURIComponent(stored.tripId)}`]);
  }
  const screenshots = [];
  const layoutIssues = [];
  try {
    await page.setViewportSize({ width: 1512, height: 982 });
    await page.emulateMedia({ colorScheme: 'dark' });
    for (const width of [1512, 1024, 780, 390, 320]) {
    await page.setViewportSize({ width, height: 982 });
    for (const [name, path] of routes) {
      await page.goto(`${origin}${path}`);
      const content = page.locator('.layout-content');
      await expect(content, `${name} main content`).toBeVisible();
      await expect.poll(async () => (await content.innerText()).trim().length, {
        message: `${name} should render meaningful content`,
      }).toBeGreaterThan(20);
      await expect(page.locator('.jd-not-found')).toHaveCount(0);
      await expect(page.locator('html'), `${name} remains light with dark OS preference`).toHaveCSS('color-scheme', 'light');
      await expect(page.locator('.sidenav-profile-btn'), `${name} account stays within the viewport`).toBeInViewport();
      const overflow = await content.evaluate(el => ({ page: document.documentElement.scrollWidth - innerWidth, content: el.scrollWidth - el.clientWidth, offenders: [...el.querySelectorAll('*')].filter(n => { const r=n.getBoundingClientRect(); return r.width && r.right > innerWidth + 2 && getComputedStyle(n).position !== 'fixed'; }).slice(0, 8).map(n=>n.className) }));
      if (overflow.page > 1 || overflow.content > 1) layoutIssues.push(`${width}px ${name}: ${JSON.stringify(overflow)}`);
      const screenshot = `/tmp/careerpassport-screen-${name}-${width}.png`;
      await page.screenshot({ path: screenshot, fullPage: true });
      screenshots.push(screenshot);
    }
    }
    // Account controls now live at the bottom of the desktop rail. Verify both
    // popover anchors, including the collapsed rail and the mobile top bar.
    for (const width of [1512, 390, 320]) {
      await page.setViewportSize({ width, height: 982 });
      await page.goto(`${origin}/settings`);
      for (const collapsed of [false, true]) {
        const toggle = page.locator('.sidenav-toggle');
        if ((await toggle.getAttribute('aria-expanded') === 'false') !== collapsed) await toggle.click();
        await page.locator('.sidenav-profile-btn').click();
        const menu = page.locator('.sidenav-profile-panel');
        await expect(menu).toBeVisible();
        const box = await menu.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
        expect(box.y + box.height).toBeLessThanOrEqual(983);
        await page.screenshot({ path: `/tmp/reference-account-${width}-${collapsed ? 'collapsed' : 'expanded'}.png` });
        await menu.getByRole('link', { name: 'Settings', exact: true }).click();
        await page.keyboard.press('Escape');
        await expect(menu).toHaveCount(0);
      }
      await page.locator('.sidenav-toggle').click();
    }
  } finally {
    await page.emulateMedia({ colorScheme: null });
    if (originalViewport) await page.setViewportSize(originalViewport);
    await page.goto(originalUrl);
  }
  expect(layoutIssues, 'Screens must not overflow horizontally').toEqual([]);
  console.log(`Screen audit passed: ${screenshots.length} route/width combinations without page overflow, in light mode with a dark OS preference.`);
  return screenshots;
}
