// Functionality test: a player opens the game, goes into the map editor, picks half of Corley's Island's trees with a
// box drag, reads how many are picked, deletes them, and opens the Map card, where the edited map could be kept
// (Duplicate, Download file, Copy map). It stops there: nothing is duplicated, downloaded or copied. play.js runs it in
// a throwaway browser with no saves, as play.test (no sync), so the edit never reaches a real device or map.
//   NODE_PATH=$(npm root -g) node tools/play.js --gfx low --size 1200x800 --steps tools/test-half-trees.js
// Prints each step with what the screen showed; "pass" is false, with the reason in "fail", if any step went wrong.
module.exports=async page=>{
  const steps=[],fail=[],ok=(c,m)=>{if(!c)fail.push(m)},log=(s,v)=>{steps.push(v===undefined?s:{[s]:v});console.error('·',s,v===undefined?'':JSON.stringify(v))};
  const settle=ms=>page.waitForTimeout(ms||800),click=async s=>{const r=await page.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;e.scrollIntoView({block:'nearest'});const b=e.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]},s);
    if(!r)throw new Error('no '+s+' on the screen');await page.mouse.click(...r);await settle()};
  const trees=()=>page.evaluate(()=>assets.filter(a=>a.t==='pine'||a.t==='leafy').length);

  // 1. open the game's menu and pick Map editor
  const before=await trees();log('trees on the island',before);
  await click('#menuBtn');ok(await page.isVisible('#editBtn'),'the menu has no Map editor button');
  await click('#editBtn');ok(await page.evaluate(()=>edOn&&!$('#editor').hidden),'the map editor did not open');log('opened the map editor');

  // 2. Things → Select, and keep the boulders out of it (On the map → Boulders → Hide them; hiding isn't saved)
  await click('#edRail [data-g="things"]');await click('#edSub [data-t="select"]');
  ok(await page.evaluate(()=>ed.tool==='select'),'the Select tool is not on');
  await page.evaluate(()=>{ed.open['a:rock']=true;edListDraw()});await settle(300);
  await click('#edList [data-hdall="rock"]');log('hid the boulders',await page.evaluate(()=>assets.filter(a=>a.t==='rock'&&a.hd).length));
  await click('#edPanelBtn');ok(await page.isHidden('#edDrawer'),'the drawer did not fold away');

  // 3. look straight down over all the trees (as the player would by zooming and tilting; Copy view gives this code)
  await page.evaluate(()=>{const T=assets.filter(a=>a.t==='pine'||a.t==='leafy'),xs=T.map(a=>a.x),zs=T.map(a=>a.z);
    const x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs),f=Math.tan(camera.fov*Math.PI/360);
    const back=Math.max((z1-z0)/2/f/0.6,(x1-x0)/2/f/camera.aspect/0.8)+10;
    viewGo(`view ${(x0+x1)/2/FT},${(z0+z1)/2/FT},0,89,${back/FT}`)});
  // wait until the game has drawn from up there
  await page.waitForFunction(()=>Math.abs(camera.position.y-hAt(ed.x,ed.z)-Math.sin(ed.pitch)*ed.dist)<1,null,{timeout:120000});await settle(2000);

  // 4. drag a box over the western half of the trees, from empty ground beyond them; the edge goes between the middle two
  const box=await page.evaluate(()=>{camera.updateMatrixWorld();const rc=canvas.getBoundingClientRect(),v=new THREE.Vector3();
    const P=assets.filter(a=>(a.t==='pine'||a.t==='leafy')).map(a=>{v.set(a.x,hAt(a.x,a.z)+0.5,a.z).project(camera);return [(v.x+1)/2*rc.width+rc.left,(1-v.y)/2*rc.height+rc.top]});
    const sx=P.map(p=>p[0]).sort((a,b)=>a-b),h=Math.floor(sx.length/2),ys=P.map(p=>p[1]);
    return {x0:Math.max(rc.left+2,sx[0]-25),y0:Math.min(...ys)-25,x1:(sx[h-1]+sx[h])/2,y1:Math.max(...ys)+25,top:$('#edTop').getBoundingClientRect().bottom,bot:$('#edBottom').getBoundingClientRect().top}});
  ok(box.y0>box.top&&box.y1<box.bot,'the trees do not fit between the top and bottom bars');
  ok(await page.evaluate(([x,y])=>{const p=edPick(x,y);return p&&!edHit(p.x,p.z)},[box.x0,box.y0]),'the drag would start on a thing, not empty ground');
  await page.mouse.move(box.x0,box.y0);await page.mouse.down();
  for(let i=1;i<=8;i++)await page.mouse.move(box.x0+(box.x1-box.x0)*i/8,box.y0+(box.y1-box.y0)*i/8);
  await page.mouse.up();await settle(1500);
  // the box also catches machines standing in it (Delete leaves machines alone): On the map → Machines → "N picked" lets them go
  log('picked by the box',await page.evaluate(()=>$('#edInfo .edihead h3').textContent));
  if(await page.evaluate(()=>ed.sel.some(s=>s.m))){await click('#edPanelBtn');await click('#edList .edlgo[data-g="m"]');
    const k='#edList .edlck[data-k^="m"][aria-pressed="true"]';for(let i=0;i<30&&await page.$(k);i++)await click(k);await click('#edPanelBtn')}

  // 5. see how many are about to go: the selection card says "N selected" and which kinds
  const card=await page.evaluate(()=>({head:($('#edInfo .edihead h3')||{}).textContent,kinds:($('#edInfo .edihead small')||{}).textContent,
    trees:ed.sel.filter(s=>s.a&&(s.a.t==='pine'||s.a.t==='leafy')).length,other:ed.sel.filter(s=>!s.a||!(s.a.t==='pine'||s.a.t==='leafy')).map(s=>s.a?s.a.t:s.m.name)}));
  log('selection card',card);
  if(!card.trees){fail.push('the box picked no trees');return {pass:false,fail,steps}}
  ok(card.trees===Math.floor(before/2),`picked ${card.trees} trees, not half of ${before}`);
  ok(!card.other.length,'things other than trees are still picked: '+card.other.join(', '));

  // 6. delete them (the Delete button on the selection card)
  await click('#edSelDel');const after=await trees();
  log('trees left',after);ok(after===before-card.trees,`expected ${before-card.trees} trees left, found ${after}`);
  ok(await page.evaluate(()=>!$('#edUndo').disabled),'Undo is not offered after the delete');

  // 7. open the Map card, where the edited map could be kept, and stop there
  await click('#edFileBtn');
  const mapCard=await page.evaluate(()=>({open:!$('#edDrawer').hidden&&ed.pane==='map',name:$('#edMapNm').textContent,
    buttons:[...document.querySelectorAll('#edFile button')].filter(b=>b.offsetParent).map(b=>b.textContent.trim())}));
  log('map card',mapCard);ok(mapCard.open&&mapCard.buttons.includes('Duplicate')&&mapCard.buttons.includes('Download file'),'the Map card did not open with its keep options');
  log('stopped before keeping it: nothing duplicated, downloaded or copied');
  return {pass:!fail.length,fail,steps}};
