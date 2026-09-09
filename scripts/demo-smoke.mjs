import { runPrototypeResetAudit } from './prototype-reset-smoke.mjs';
import {runImpeccableUIAudit} from './impeccable-ui-smoke.mjs';
import {chromium,expect} from '@playwright/test';
import {runScreenAudit} from './screen-audit-smoke.mjs';
import {runContextNavigation} from './context-navigation-smoke.mjs';
import {runNodeInteractionAudit} from './node-interaction-smoke.mjs';
import {runDirectConnections} from './direct-connections-smoke.mjs';
const base=process.argv.find(arg=>arg.startsWith("--base="))?.slice(7) || "http://127.0.0.1:5173";
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1512,height:982},colorScheme:'dark'});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
const close=async()=>{const b=page.getByRole('button',{name:'Close detail panel',exact:true});if(await b.count())await b.click();};
const select=async id=>{await page.locator(`.react-flow__node[data-id="${id}"] .fn-main`).evaluate(el=>el.click());await expect(page.locator('.funnel-inspector')).toBeVisible();};
const drag=async(from,to)=>{const a=await from.boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:20});await page.mouse.up();};
try{
 if(process.argv.includes("--reset-only")){await runPrototypeResetAudit(context, process.argv.find(arg=>arg.startsWith("--base="))?.slice(7), process.argv.includes("--persistent"));await browser.close();process.exit(0);}
 if(process.argv.includes("--impeccable-only")){await runImpeccableUIAudit(context,base);await browser.close();process.exit(0);}
 await page.goto(`${base}/create-job-canvas`);
 await expect(page.locator('.funnel-start-options>button')).toHaveCount(2);
 await page.getByRole('button',{name:/Build with AI/}).click();
 await page.getByRole('button',{name:'Close canvas AI assistant'}).click();
 await page.getByRole('button',{name:'Workspace tools and demo options'}).click();
 await page.getByRole('button',{name:'Load sample demo',exact:true}).click();
 await page.getByRole('button',{name:'Workspace tools and demo options'}).click();
 await close();
 const edgesBefore=await page.locator('.react-flow__edge').count();
 const ids={};
 for(const [type,label,index] of [['stage','Stage',0],['activity','Activity',1],['trip','Trip',2],['communication','Message',3]]){
  const surface=await page.locator('.funnel-surface').boundingBox();
  const before=await page.locator('.react-flow__node').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-id')));
  await drag(page.getByRole('button',{name:`Add ${type}`,exact:true}),{x:surface.x+surface.width*.55+(index%2)*190,y:surface.y+180+Math.floor(index/2)*200});
  await expect(page.locator('.react-flow__node')).toHaveCount(before.length+1);
  ids[type]=await page.locator('.react-flow__node').evaluateAll((ns,old)=>ns.map(n=>n.getAttribute('data-id')).find(id=>!old.includes(id)),before);
  await expect(page.getByRole('form',{name:'Add pipeline block'})).toHaveCount(0);
  await expect(page.locator('.funnel-inspector')).toHaveCount(0);
 }
 await expect(page.locator('.react-flow__edge')).toHaveCount(edgesBefore);
 await page.getByRole('button',{name:'Save',exact:true}).click();await page.reload();
 await expect(page.locator(`.react-flow__node[data-id="${ids.trip}"]`)).toContainText('Choose or create');
 await page.locator('.react-flow__controls-fitview').click();
 const from=page.locator(`.react-flow__node[data-id="${ids.stage}"] [data-handleid="out-bottom"]`);
 const target=page.locator(`.react-flow__node[data-id="${ids.trip}"] [data-handleid="in-top"]`);
 await expect(target).toBeInViewport();await from.hover({force:true});const b=await target.boundingBox();await drag(from,{x:b.x+b.width/2,y:b.y+b.height/2});
 const link=page.locator(`.react-flow__edge[data-testid="rf__edge-${ids.stage}->${ids.trip}"]`);await expect(link).toHaveCount(1);
 const nodeCount=await page.locator('.react-flow__node').count();
 await select(ids.trip);await page.getByRole('button',{name:'Choose existing or create new'}).click();
 await page.locator('.pipeline-picker .funnel-child').first().click();
 await expect(page.getByLabel('Trip title',{exact:true})).toBeVisible();
 await expect(page.locator('.react-flow__node')).toHaveCount(nodeCount);await expect(link).toHaveCount(1);
 await close();await select(ids.communication);await page.getByRole('button',{name:'Choose existing or create new'}).click();
 await page.getByRole('button',{name:'＋ Create new communication',exact:true}).click();
 await expect(page.locator('.pipeline-placeholder-panel')).toHaveCount(0);await expect(page.locator(`.react-flow__node[data-id="${ids.communication}"]`)).toHaveCount(1);
 await close();
 const before=await page.locator('.react-flow__node').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-id')));
 await page.getByRole('button',{name:'Add trip',exact:true}).click();
 await expect(page.locator('.funnel-inspector')).toHaveCount(0);
 const newTrip=await page.locator('.react-flow__node').evaluateAll((ns,old)=>ns.map(n=>n.getAttribute('data-id')).find(id=>!old.includes(id)),before);
 await select(newTrip);await page.getByRole('button',{name:'Choose existing or create new'}).click();
 await page.getByRole('button',{name:'＋ Create new trip',exact:true}).click();
 await page.getByRole('button',{name:'Build manually',exact:false}).click();
 await expect(page.getByLabel('Trip title',{exact:true})).toBeVisible();
 await expect(page.locator(`.react-flow__node[data-id="${newTrip}"]`)).toHaveCount(1);
 await expect(page.locator(`.react-flow__node[data-id="${newTrip}"]`)).not.toContainText('Choose or create');
 await close();
 for(const width of [1512,780,390,320]){
  await page.setViewportSize({width,height:982});
  await page.getByRole('button',{name:'Add communication',exact:true}).click();
  await expect(page.locator('.funnel-inspector')).toHaveCount(0);
  await expect(page.getByRole('form',{name:'Add pipeline block'})).toHaveCount(0);
  await page.screenshot({path:`/tmp/loose-node-canvas-${width}.png`,fullPage:true});
 }
 await page.setViewportSize({width:1512,height:982});
 await runContextNavigation(page);await runNodeInteractionAudit(page);await runDirectConnections(page);await runScreenAudit(page);
 await runImpeccableUIAudit(context,base);
 expect(errors).toEqual([]);
 console.log('PASS: four drag-out node types, no auto links or config, placeholder reload, explicit connection, existing Trip selection and new Trip/message creation in the same node, click-to-add at four widths.');
}catch(e){console.error(errors);await page.screenshot({path:'/tmp/placeholder-failure.png',fullPage:true});throw e;}finally{await browser.close();}
