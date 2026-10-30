// Bakes the start screen's map picture (shots/startmap.jpg): all the map there is (SPICK.img in js/start.js), every
// tile drawn, without the machines, so the start screen shows it the moment the page opens instead of drawing it once
// the world has loaded. Past its edges the start screen carries on the lake's blue and, on the mainland, the woods
// (shots/startwoods.jpg, cut from it). Run after changing the ground, roads or buildings:
//   NODE_PATH=$(npm root -g) node tools/play.js --gfx low --steps tools/bake_startmap.js
const fs=require('fs'),path=require('path');
module.exports=async p=>{const r=await p.evaluate(async()=>{let n=0;while(mapTilesDone()<MPT_NX*MPT_NZ&&n<5000){mapBuild(200,0,350);n++;await new Promise(r=>setTimeout(r,0))}
  const I=SPICK.img,k=2,W=(I[1]-I[0])*k,H=(I[3]-I[2])*k,cv=document.createElement('canvas');cv.style.cssText=`position:fixed;left:0;top:0;width:${W}px;height:${H}px`;document.body.appendChild(cv);
  drawMap(cv,(I[0]+I[1])/2,(I[2]+I[3])/2,1/k,false,true);
  // the woods past the picture's edges (shots/startwoods.jpg): 100 m of the mainland's woods, mirrored four ways so it tiles
  const g=cv.getContext('2d'),q=cv.width/W*k,T=100*q,wc=document.createElement('canvas');wc.width=wc.height=Math.round(2*T);const wg=wc.getContext('2d');
  for(const [sx,sz] of [[1,1],[-1,1],[1,-1],[-1,-1]]){wg.save();wg.translate(sx<0?2*T:0,sz<0?2*T:0);wg.scale(sx,sz);wg.drawImage(cv,(-400-I[0])*q,(720-I[2])*q,T,T,0,0,T,T);wg.restore()}
  const woods=wc.toDataURL('image/jpeg',0.8);
  // the lake's edges fade into its own blue (the woods carry straight on in the tile)
  const sy=(SPICK.shore-I[2])*q,F=30*q,cw=cv.width;
  for(const [x0,x1] of [[0,F],[cw,cw-F]]){const gr=g.createLinearGradient(x0,0,x1,0);gr.addColorStop(0,SPICK.lake);gr.addColorStop(1,SPICK.lake+'00');g.fillStyle=gr;g.fillRect(Math.min(x0,x1),0,F,sy-8*q)}
  const u=cv.toDataURL('image/jpeg',0.8);cv.remove();return {tiles:mapTilesDone()+'/'+MPT_NX*MPT_NZ,u,woods}});
  const put=(f,d)=>fs.writeFileSync(path.join(__dirname,'..','shots',f),Buffer.from(d.split(',')[1],'base64'));put('startmap.jpg',r.u);put('startwoods.jpg',r.woods);return r.tiles};
