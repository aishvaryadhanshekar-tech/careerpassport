import {expect} from '@playwright/test';

export async function runImpeccableUIAudit(context, origin='http://127.0.0.1:5173') {
 const page=await context.newPage();

 try {
  await page.goto(`${origin}/settings`);
  await expect(page.locator('main#workspace-content')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#workspace-content')).toBeFocused();
  // Isolated component fixture uses the actual shared widgets and production stylesheet.
  await page.evaluate(async()=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {TagInput}=await import('/src/formControls.tsx');
   const {UnitCombobox}=await import('/src/roleProfile/UnitCombobox.tsx');
   const {Tabs,TabPanel}=await import('/src/Tabs.tsx');
   const {ShareComposeModal}=await import('/src/ShareComposeModal.tsx');
   const e=React.createElement;
   function Fixture(){const [tags,setTags]=React.useState('');const [unit,setUnit]=React.useState('');const [tab,setTab]=React.useState('first');const [open,setOpen]=React.useState(false);
    return e('div',{},e('label',{htmlFor:'audit-tags'},'Skills'),e(TagInput,{id:'audit-tags',value:tags,onChange:setTags,suggestions:['React','Research']}),e(UnitCombobox,{value:unit,onChange:setUnit}),e('output',{'data-testid':'unit-value'},unit),e(Tabs,{tabs:[{id:'first',label:'First'},{id:'second',label:'Second'}],active:tab,onChange:setTab,ariaLabel:'Audit tabs'}),e(TabPanel,{id:tab,active:true},tab),e('button',{onClick:()=>setOpen(true)},'Open share'),open&&e(ShareComposeModal,{jobTitle:'Product Designer',applicationLink:'https://example.test/apply',onClose:()=>setOpen(false)}));}
   const host=document.createElement('div');host.id='audit-fixture';host.style.cssText='position:fixed;inset:0;z-index:5000;padding:24px;overflow:auto;background:white';document.body.append(host);createRoot(host).render(e(Fixture));
  });
  const skills=page.getByRole('combobox',{name:'Skills'});
  await skills.fill('Re');await skills.press('ArrowDown');await skills.press('Enter');
  await expect(page.getByRole('button',{name:'Remove React',exact:true})).toBeVisible();
  await skills.fill('Custom skill');await skills.press('Enter');await expect(page.getByRole('button',{name:'Remove Custom skill'})).toBeVisible();
  await skills.press('Escape');await expect(skills).toHaveAttribute('aria-expanded','false');
  const unit=page.getByRole('button',{name:'Unit',exact:true});await unit.focus();await unit.press('ArrowDown');await unit.press('Enter');await expect(page.getByTestId('unit-value')).not.toBeEmpty();
  await page.getByRole('tab',{name:'First',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'Second',exact:true})).toBeFocused();await expect(page.getByRole('tabpanel')).toHaveText('second');await page.keyboard.press('Home');await expect(page.getByRole('tab',{name:'First',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Open share'}).click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Close',exact:true})).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(dialog.getByRole('button',{name:'Copy message',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'Close',exact:true})).toBeFocused();
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('blocked');}}}));await dialog.getByRole('button',{name:'Copy message',exact:true}).click();await expect(dialog.getByRole('alert')).toContainText('copy it manually');
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(page.getByRole('button',{name:'Open share'})).toBeFocused();
  // Valid published candidate application and full Trip, created in this isolated demo context.
  await page.goto(`${origin}/`);
  const data=await page.evaluate(async()=>{
   const {demoService}=await import('/src/demo/service.ts');const {createTrip}=await import('/src/tripsStore.ts');
   const id='impeccable-candidate-audit';const service=demoService();const project=service.loadDemo(id);const candidate=Object.values(project.candidates)[0];
   const created=createTrip(project.configuration.draft);const trip=created.draft.trips.find(t=>t.id===created.tripId);trip.title='Design work sample';trip.status='published';trip.spine='Describe a product decision you made.';trip.stages[0].items=[{id:'audit-response',kind:'question',prompt:'Explain your decision',type:'paragraph',required:'mandatory',options:[]}];service.assignFullTrip(id,candidate.id,trip.id,trip);
   const assignment=Object.values(service.get(id).assignments).find(a=>a.tripId===trip.id);return {id,assignment:assignment.id};
  });
  for(const width of [1512,390,320]){
   await page.setViewportSize({width,height:982});
   for(const [name,path] of [['application',`/demo/apply/${data.id}`],['trip',`/demo/trip/${data.id}/${encodeURIComponent(data.assignment)}`],['missing-trip','/demo/trip/missing/missing'],['missing-assessment','/demo/assessment/missing/missing/missing']]){
    await page.goto(origin+path);await expect(page.getByRole('heading',{level:1})).toBeVisible();await expect(page.locator('html')).toHaveCSS('color-scheme','light');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),`${name} ${width} overflow`).toBeLessThanOrEqual(1);
    await page.screenshot({path:`/tmp/impeccable-final-${name}-${width}.png`,fullPage:true});
   }
  }
  await page.goto(`${origin}/demo/trip/${data.id}/${encodeURIComponent(data.assignment)}`);await page.getByLabel('Explain your decision').fill('I reviewed candidate evidence with the hiring team.');await page.getByRole('button',{name:'Submit response'}).click();await expect(page.getByRole('heading',{name:'Response received'})).toBeVisible();
  console.log('Impeccable UI checks passed: skip link, custom/preset values by keyboard, tabs, modal focus/return, clipboard failure, candidate light/responsive routes and valid Trip submission.');
 } finally {await page.close();}
}
