// Corley's Island: the frame recorder, for catching a glitch that lasts a frame or two (townsfolk hopping on their
// seats). Record (F8) keeps the last few seconds: a small picture of every frame and, for each townsperson near the
// camera, how they were drawn that frame (their detailed model or the crowd copy, the clip and the time in it, where
// it was placed, the detailed model's hips). Save (F9) downloads it all as one file (hop-<time>.json) to hand to
// Claude. Recording costs a little each frame, so it is off until asked for and nothing of it is kept between visits.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md. Nothing here runs at load.
const FREC={on:false,frames:[],max:300,near:12,cv:null,cx:null,w:480,h:270,row:null,fr:0,o:{},hips:new WeakMap(),ids:new Map(),v:null,t0:0};
function frecToggle(){if(FREC.on)frecStop();else frecStart()}
function frecStart(){if(FREC.on)return;FREC.on=true;FREC.frames=[];FREC.ids=new Map();FREC.last=null;FREC.fr=0;FREC.t0=performance.now();FREC.v=FREC.v||new THREE.Vector3();
  if(!FREC.cv){FREC.cv=document.createElement('canvas');FREC.cv.width=FREC.w;FREC.cv.height=FREC.h;FREC.cx=FREC.cv.getContext('2d')}
  // how each person was drawn: the crowd copy (tfFgPose) or the detailed model (tfUhPose), seen as they are called
  const o=FREC.o;o.fg=tfFgPose;o.uh=tfUhPose;o.free=tfUhFree;o.post=postRender;
  tfFgPose=function(p,c,i,dt){o.fg(p,c,i,dt);frecPerson(p,'crowd',TF_PL.y)};
  tfUhPose=function(p,c,dt){const r=o.uh(p,c,dt);if(r)frecPerson(p,'hero',p.uh.object.position.y);return r};
  tfUhFree=function(p){if(FREC.row&&frecNear(p))FREC.row.ev.push('hero off '+frecName(p));return o.free(p)};
  postRender=function(){o.post();frecGrab()};
  FREC.row=frecNewRow();$('#recBadge').hidden=false;toast(say('recOn'),'',5200)}
function frecStop(){if(!FREC.on)return;const o=FREC.o;tfFgPose=o.fg;tfUhPose=o.uh;tfUhFree=o.free;postRender=o.post;FREC.on=false;FREC.row=null;FREC.frames=[];
  $('#recBadge').hidden=true;toast(say('recOff'),'',2600)}
function frecNewRow(){return {n:FREC.fr,t:+((performance.now()-FREC.t0)/1000).toFixed(3),ppl:[],ev:[],img:null}}
function frecNear(p){const c=camera.position;return (p.x-c.x)**2+(p.z-c.z)**2<FREC.near*FREC.near}
function frecName(p){let n=FREC.ids.get(p);if(n===undefined){n=FREC.ids.size+1;FREC.ids.set(p,n)}return (p.body||'?')+'#'+n}
// one person this frame: how they were drawn and where, and the detailed model's hips (its pelvis bone) above that
function frecPerson(p,how,y){const R=FREC.row;if(!R||!frecNear(p))return;
  const e={who:frecName(p),how,clip:p.fk||'',ct:+(p.ct||0).toFixed(3),y:+p.y.toFixed(3),drawnY:+y.toFixed(3),sit:p.sit?1:0,act:p.act||'',
    room:p.room?1:0,spd:+(p.spd||0).toFixed(2)};
  const n=performance.now()/1000;if(p.tkSay>n)e.saying=1;if(p.tkHear>n)e.hearing=1;if(p.trip)e.trip=p.trip.ph;
  if(how==='hero'){const h=p.uh;let b=FREC.hips.get(h);if(b===undefined){b=null;h.object.traverse(q=>{if(!b&&q.isBone&&/pelvis|hips/i.test(q.name))b=q});FREC.hips.set(h,b)}
    if(b){b.getWorldPosition(FREC.v);e.hipsAbove=+(FREC.v.y-y).toFixed(3)}e.heroClip=h.clip;e.visible=h.object.visible?1:0}
  // a change since the last frame (a new clip, onto or off the detailed model, a jump in height)
  const L=FREC.last||(FREC.last=new Map()),q=L.get(p);
  if(q){if(q.how!==how)R.ev.push(e.who+' '+q.how+' > '+how);if(q.clip!==e.clip)R.ev.push(e.who+' clip '+q.clip+' > '+e.clip);if(Math.abs(q.drawnY-e.drawnY)>0.05)R.ev.push(e.who+' height '+q.drawnY+' > '+e.drawnY)}
  L.set(p,e);R.ppl.push(e)}
// after the frame is drawn: a small picture of it, and the row kept (the oldest dropped past FREC.max)
function frecGrab(){const R=FREC.row;FREC.fr++;FREC.row=frecNewRow();if(!R)return;
  try{FREC.cx.drawImage(renderer.domElement,0,0,FREC.w,FREC.h);FREC.cv.toBlob(b=>{R.img=b},'image/jpeg',0.7)}catch(e){}
  FREC.frames.push(R);if(FREC.frames.length>FREC.max)FREC.frames.shift()}
// the last few seconds into one file: each frame's picture (as a data URL) with its people and changes
async function frecSave(){if(!FREC.on){toast(say('recNone'),'',3200);return}const F=FREC.frames.slice(),url=b=>new Promise(r=>{if(!b){r(null);return}const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)});
  const out={game:'corleys-island',version:typeof EFFORT!=='undefined'&&EFFORT.versions?EFFORT.versions[EFFORT.versions.length-1].v:'',gfx:gfxCur&&gfxCur.name,
    when:new Date().toISOString(),screen:[renderer.domElement.width,renderer.domElement.height],frames:[]};
  for(const R of F)out.frames.push({n:R.n,t:R.t,ev:R.ev,people:R.ppl,img:await url(R.img)});
  const a=document.createElement('a'),d=new Date(),p2=x=>String(x).padStart(2,'0');a.download='hop-'+p2(d.getHours())+p2(d.getMinutes())+p2(d.getSeconds())+'.json';
  a.href=URL.createObjectURL(new Blob([JSON.stringify(out)],{type:'application/json'}));document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);
  toast(say('recSaved',{n:F.length}),'good',5200)}
