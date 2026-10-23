// The start card's machine pictures (shots/*.jpg): climbs into each machine where it sits, pins a three-quarter camera on
// it at the top graphics tier in late-morning sun with the screen hidden, and saves the frame. Run it through play.js:
//   NODE_PATH=$(npm root -g) node tools/play.js --size 720x450 --boot 8000 --steps tools/shots.js
// Only some: SHOTS=dozer,mini (names below); WAIT=ms lets each settle (12000). A shot is [file, ride (a WK_RIDES key, 'hv:<kind>' for the first heavy
// machine of that kind, or 'foot'), how far back the camera sits (m), how high it looks (m), turn from the front (deg),
// camera height (m above the look point), and how far ahead of the machine's middle it looks (m)]. The camera looks a
// little under the machine so it sits above the name strip along the bottom of its tile.
const path=require('path');
const SHOTS=[
  ['dig','ex',9,2,55,2.2,2],['truck','truck',9.5,1.6,-40,2.2],['mow','mow',3.6,0.6,-35,1.4],['walk','foot',3.2,1.1,-20,0.3],
  ['skid','skid',5.2,1.1,-38,1.6],['backhoe','hv:backhoe',8.5,1.5,-40,2.2],['mini','hv:mini',6,1.2,-38,1.8],
  ['dozer','hv:dozer',7.5,1.4,-38,2],['loader','hv:loader',9.5,1.6,-38,2.4],['semi','hv:semi',11,1.8,-35,2.2],
  ['pickup','hv:pickup',7.5,1,-38,1.4],['atv','hv:atv',3.6,0.7,-38,1],['bike','bike',3.4,0.7,-50,0.7],['boat','boat0',7,0.8,-140,2.6]];
module.exports=async(page)=>{const want=(process.env.SHOTS||'').split(',').filter(Boolean),out=[];
  await page.evaluate(()=>{ultraGuardOff=true;setGfx('ultra');setWeather('dry');weather.amt=0;dnSet(10.5*60);
    document.querySelectorAll('body>*').forEach(e=>{if(e!==renderer.domElement)e.style.display='none'})});
  for(const s of SHOTS){if(want.length&&!want.includes(s[0]))continue;
    out.push(await page.evaluate(([r,dist,up,turn,hi,ah=0])=>{let k=r;
      if(r.startsWith('hv:'))k='hv'+hvs.findIndex(h=>h.k===r.slice(3));
      // on foot: out on the mesa top with the excavator over his shoulder
      if(k==='foot'){if(mode!=='walk')setMode('walk');Object.assign(wk,{x:st.x+5,z:st.z-9,inside:null});wk.y=wkFloor(wk.x,wk.z,0,1e9);
        wk.yaw=wk.view=Math.atan2(wk.x-st.x,wk.z-st.z);walker.visible=true}
      else{const R=WK_RIDES[k];wk.inside=k;walker.visible=false;if(R.pick)R.pick();setMode(R.m)}
      const o=k==='foot'?wk:WK_RIDES[k].o,a=o.yaw+turn*Math.PI/180,lx=o.x+Math.sin(o.yaw)*ah,lz=o.z+Math.cos(o.yaw)*ah,y=(o.y!==undefined?o.y:hAt(o.x,o.z))+up;
      viewPin={};viewPinApply=()=>{camera.position.set(lx+Math.sin(a)*dist,y+hi,lz+Math.cos(a)*dist);camera.lookAt(lx,y-dist*0.12,lz)};
      firstCam=true;return k},s.slice(1)));
    await page.waitForTimeout(+process.env.WAIT||12000);
    await page.screenshot({path:path.resolve(__dirname,'..','shots',s[0]+'.jpg'),type:'jpeg',quality:80,timeout:180000})}
  return out};
