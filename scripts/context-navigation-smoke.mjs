import {expect} from '@playwright/test';
export async function runContextNavigation(page){
 await page.setViewportSize({width:1512,height:982});
 const panel=page.locator('.funnel-inspector');
 const close=page.getByRole('button',{name:'Close detail panel',exact:true});if(await close.count())await close.click();
 for(const [id,tool,title] of [['prospects','Private prospect pool','Prospects'],['applied','Candidate review','Applied'],['job','Role & hiring settings ↗','Job configuration']]){
  await page.locator(`.react-flow__node[data-id="${id}"] .fn-main`).evaluate(el=>el.click());
  await expect(panel).toBeVisible();await page.waitForTimeout(350);
  const viewport=await page.locator('.react-flow__viewport').evaluate(el=>el.style.transform);
  await page.getByRole('button',{name:tool,exact:true}).click();
  const breadcrumbs=page.getByRole('navigation',{name:'Detail navigation'});
  await expect(breadcrumbs.getByRole('button',{name:title,exact:true})).toBeVisible();
  await expect(breadcrumbs.locator('[aria-current="page"]')).not.toBeEmpty();
  await breadcrumbs.getByRole('button',{name:'Back to originating node'}).click();
  await expect(panel.locator('header h2')).toHaveText(title);
  await expect(breadcrumbs).toHaveCount(0);
  await expect(async()=>expect(await page.locator('.react-flow__viewport').evaluate(el=>el.style.transform)).toBe(viewport)).toPass();
  await page.getByRole('button',{name:'Close detail panel',exact:true}).click();
 }
 await page.locator('.react-flow__node[data-id="prospects"] .fn-main').evaluate(el=>el.click());
 await page.getByRole('button',{name:'Expand detail view',exact:true}).click();
 await page.getByRole('button',{name:'Private prospect pool',exact:true}).click();
 for(const width of [1512,390,320]){
  await page.setViewportSize({width,height:982});
  const nav=page.getByRole('navigation',{name:'Detail navigation'});
  await expect(async()=>expect(await nav.evaluate(el=>el.scrollWidth-el.clientWidth)).toBeLessThanOrEqual(1)).toPass();
  await page.screenshot({path:`/tmp/pipeline-back-navigation-${width}.png`,fullPage:true});
 }
 await page.getByRole('button',{name:'Back to originating node'}).click();
 await expect(panel).toHaveClass(/pipeline-expanded/);
 await page.getByRole('button',{name:'Private prospect pool',exact:true}).click();
 await page.getByRole('navigation',{name:'Detail navigation'}).getByRole('button',{name:'Pipeline',exact:true}).click();
 await expect(panel).toHaveCount(0);
 await page.setViewportSize({width:1512,height:982});
 console.log('PASS: contextual back from prospects, candidate review and settings; origin viewport, expanded state, Pipeline breadcrumb and narrow layouts.');
}
