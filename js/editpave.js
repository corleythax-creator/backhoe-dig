// Corley's Island: the map editor's paving tools, in the Roads group (paving.js holds the lists and draws them).
// Lots & slabs: every lot is outlined; tap one to pick it, drag it to move it, drag a corner or an edge's dot to size it;
// its card sets the surface, size, turn and height and deletes it; New lot / New slab (bottom bar) then a drag on the
// ground lays a new one (asphalt or broom-finish concrete).
// Parking stripes: drag along the paving to lay a row of stalls (the stalls go on the paved side; along a lot's edge the
// row keeps square to it); tap a row to pick it, drag its end dots; its card sets stall width, depth, angle and sides.
// Every change is one undo step ({pave}, editor.js edSwap) and saved in the map (mapPaves, mapStripes).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const pvSnap=()=>JSON.stringify({p:PAVES,s:STRIPES});
function pvSet(json){const o=JSON.parse(json);PAVES.length=0;PAVES.push(...o.p);STRIPES.length=0;STRIPES.push(...o.s);if(!PAVES.includes(ed.pv))ed.pv=null;if(!STRIPES.includes(ed.pvS))ed.pvS=null;
  paveBuild();ed.paveEdited=true;pvDraw()}
Object.assign(ed,{pv:null,pvS:null,pvNew:'',pvOpt:{w:9*FT,L:18*FT,an:90,sd:0},pvT:0});
const pvBoxOf=()=>{let b=null;if(ed.pv)b=edUnion(b,paveBox(ed.pv));if(ed.pvS)b=edUnion(b,stripeBox(ed.pvS));return b};
function pvCommit(snap,rect,n){if(!snap)return;if(snap===pvSnap())return;ed.paveEdited=true;ed.changed=true;paveBuild();edRefresh(rect,true);edPush({pave:snap,rect,n});edQueueSave();pvDraw()}
// ---------- what the tools draw: outlines of every lot (or row), the picked one bright, with its dots ----------
const pvLines=(function(){const mk=(c,cap)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(cap*3),3));g.setDrawRange(0,0);
  const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:c,depthTest:false,transparent:true,fog:false,toneMapped:false}));l.renderOrder=21;l.frustumCulled=false;l.visible=false;scene.add(l);return l};
  return {all:mk(0xe8ece4,40000),pick:mk(0xf07a22,8000)}})();
const pvDots=edDots(0xf07a22,19,16);
function pvSegs(L,list){const a=L.geometry.attributes.position;let n=0;
  for(const [x0,z0,x1,z1] of list){const len=Math.hypot(x1-x0,z1-z0),k=Math.max(1,Math.ceil(len/2));
    for(let j=0;j<k&&n<a.count-2;j++){for(const t of [j/k,(j+1)/k]){const x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;a.array[n*3]=x;a.array[n*3+1]=hAt(x,z)+0.15;a.array[n*3+2]=z;n++}}}
  a.needsUpdate=true;L.geometry.setDrawRange(0,n);L.visible=n>1}
const pvRing=p=>{const C=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>paveXZ(p,a*p.w/2,b*p.d/2));return C.map((q,i)=>[...q,...C[(i+1)%4]])};
// a lot's dots: its corners (0 to 3) and the middles of its edges (4 to 7), as [u, v] signs
const PV_H=[[-1,-1],[1,-1],[1,1],[-1,1],[0,-1],[1,0],[0,1],[-1,0]];
function pvDraw(){const on=edOn&&(ed.tool==='paving'||ed.tool==='stripes');
  if(!on){pvLines.all.visible=pvLines.pick.visible=pvDots.visible=false;return}
  if(ed.tool==='paving'){pvSegs(pvLines.all,PAVES.filter(p=>p!==ed.pv).flatMap(pvRing));pvSegs(pvLines.pick,ed.pv?pvRing(ed.pv):[]);
    edDotsSet(pvDots,ed.pv?PV_H.map(([a,b])=>paveXZ(ed.pv,a*ed.pv.w/2,b*ed.pv.d/2)):[])}
  else{const row=S=>[[...S.a,...S.b],...stripeLines(S)];pvSegs(pvLines.all,STRIPES.filter(S=>S!==ed.pvS).flatMap(row));pvSegs(pvLines.pick,ed.pvS?row(ed.pvS):[]);
    edDotsSet(pvDots,ed.pvS?[ed.pvS.a,ed.pvS.b]:[])}}
// the dot under a screen spot (within about a fingertip)
function pvDotAt(cx,cy){if(!pvDots.visible)return -1;const rc=canvas.getBoundingClientRect(),a=pvDots.geometry.attributes.position.array,n=pvDots.geometry.drawRange.count;let best=-1,bd=26*26;
  for(let i=0;i<n;i++){edV.set(a[i*3],a[i*3+1],a[i*3+2]).project(camera);if(edV.z>1)continue;const sx=(edV.x+1)/2*rc.width+rc.left,sy=(1-edV.y)/2*rc.height+rc.top,d=(sx-cx)**2+(sy-cy)**2;if(d<bd){bd=d;best=i}}
  return best}
// ---------- the tool ----------
function pvTool(t){if(t!=='paving'&&t!=='stripes'){ed.pvNew='';pvDraw();return}if(t==='paving')ed.pvS=null;else ed.pv=null;ed.pvNew='';pvBar();pvCard();pvDraw()}
function pvBar(){const n=$('#edPvNew'),s=$('#edPvSlab');if(n){n.setAttribute('aria-pressed',ed.pvNew==='lot');s.setAttribute('aria-pressed',ed.pvNew==='slab')}
  const o=ed.pvOpt;for(const [id,v] of [['#edPsW',Math.round(o.w/FT*2)/2],['#edPsL',Math.round(o.L/FT)],['#edPsA',o.an],['#edPsSd',o.sd]]){const el=$(id);if(el)el.value=String(v)}}
function pvDown(p,cx,cy,e){const snap=pvSnap();
  if(ed.tool==='paving'){
    const h=ed.pv?pvDotAt(cx,cy):-1;if(h>=0){ed.drag={pv:'size',h,snap,box:paveBox(ed.pv)};return}
    if(ed.pvNew){const [x,z]=edSnapXZ(p.x,p.z),q={x,z,w:0.5,d:0.5,r:0,s:ed.pvNew==='slab'?'concrete_broom':'asphalt',l:ed.pvNew==='slab'?0.1:0.04};
      PAVES.push(q);ed.pv=q;ed.drag={pv:'new',x0:x,z0:z,snap,box:paveBox(q)};return}
    const q=ed.pv&&paveIn(ed.pv,p.x,p.z)?ed.pv:paveAt(p.x,p.z);
    if(q){ed.pv=q;ed.drag={pv:'move',dx:q.x-p.x,dz:q.z-p.z,snap,box:paveBox(q)};pvCard();pvDraw();return}
    ed.pv=null;pvCard();pvDraw();edMouse={pan:true,x:cx,y:cy};return}
  // stripes: an end dot of the picked row, a row's base line, or a new row
  const h=ed.pvS?pvDotAt(cx,cy):-1;if(h>=0){ed.drag={pv:'end',h,snap,box:stripeBox(ed.pvS)};return}
  let best=null,bd=1.2;for(const S of STRIPES){const [d]=edSegD(p.x,p.z,S.a,S.b);if(d<bd){bd=d;best=S}}
  if(!best)for(const S of STRIPES)if(stripeLines(S).some(q=>edSegD(p.x,p.z,[q[0],q[1]],[q[2],q[3]])[0]<0.6)){best=S;break}
  if(best){ed.pvS=best;ed.drag={pv:'row',x:p.x,z:p.z,a:best.a.slice(),b:best.b.slice(),snap,box:stripeBox(best)};pvCard();pvDraw();return}
  const [x,z]=edSnapXZ(p.x,p.z),o=ed.pvOpt,S={a:[x,z],b:[x,z],w:o.w,L:o.L,an:o.an,sd:1};STRIPES.push(S);ed.pvS=S;ed.drag={pv:'newrow',snap,box:stripeBox(S)};pvCard();pvDraw()}
// a new row's end: square to the lot under it when nearly so; its stalls on the paved side (or the side picked)
function pvRowEnd(S,x,z){const q=paveAt(S.a[0],S.a[1]);let dx=x-S.a[0],dz=z-S.a[1];const L=Math.hypot(dx,dz);
  if(q&&L>0.5){const c=Math.cos(q.r),s=Math.sin(q.r);let best=null,bd=0.14;for(const [ux,uz] of [[c,-s],[s,c],[-c,s],[-s,-c]]){const d=1-(dx*ux+dz*uz)/L;if(d<bd){bd=d;best=[ux,uz]}}
    if(best){const t=dx*best[0]+dz*best[1];dx=best[0]*t;dz=best[1]*t}}
  S.b=[S.a[0]+dx,S.a[1]+dz];const o=ed.pvOpt;
  if(o.sd)S.sd=o.sd;else{const ux=dx/(L||1),uz=dz/(L||1),mx=(S.a[0]+S.b[0])/2,mz=(S.a[1]+S.b[1])/2,on=sd=>paveHas(mx-uz*sd*S.L/2,mz+ux*sd*S.L/2);S.sd=on(1)||!on(-1)?1:-1}}
function pvDrag(d,p){const now=performance.now();
  if(d.pv==='move'){const q=ed.pv;[q.x,q.z]=edSnapXZ(p.x+d.dx,p.z+d.dz);d.moved=1}
  else if(d.pv==='new'){const q=ed.pv,[x,z]=edSnapXZ(p.x,p.z);q.w=Math.max(0.5,Math.abs(x-d.x0));q.d=Math.max(0.5,Math.abs(z-d.z0));q.x=(x+d.x0)/2;q.z=(z+d.z0)/2;d.moved=1}
  else if(d.pv==='size'){const q=ed.pv,[su,sv]=PV_H[d.h],[pu,pv]=paveUV(q,...edSnapXZ(p.x,p.z));
    let u0=-q.w/2,u1=q.w/2,v0=-q.d/2,v1=q.d/2;if(su<0)u0=Math.min(pu,u1-0.5);if(su>0)u1=Math.max(pu,u0+0.5);if(sv<0)v0=Math.min(pv,v1-0.5);if(sv>0)v1=Math.max(pv,v0+0.5);
    const [x,z]=paveXZ(q,(u0+u1)/2,(v0+v1)/2);q.x=x;q.z=z;q.w=u1-u0;q.d=v1-v0;d.moved=1}
  else if(d.pv==='end'){const S=ed.pvS;S[d.h?'b':'a']=edSnapXZ(p.x,p.z);d.moved=1}
  else if(d.pv==='row'){const S=ed.pvS,dx=p.x-d.x,dz=p.z-d.z;S.a=[d.a[0]+dx,d.a[1]+dz];S.b=[d.b[0]+dx,d.b[1]+dz];d.moved=1}
  else if(d.pv==='newrow'){pvRowEnd(ed.pvS,...edSnapXZ(p.x,p.z));d.moved=1}
  pvDraw();if(now-ed.pvT>120){ed.pvT=now;paveBuild()}pvCardSize()}
function pvUp(d){
  if(d.pv==='new'&&(ed.pv.w<1||ed.pv.d<1)){PAVES.splice(PAVES.indexOf(ed.pv),1);ed.pv=null;paveBuild();pvDraw();toast(say('edPvDrag'),'',2600);pvCard();return}
  if(d.pv==='newrow'){const S=ed.pvS;if(Math.hypot(S.b[0]-S.a[0],S.b[1]-S.a[1])<S.w/Math.sin(S.an*Math.PI/180)){STRIPES.splice(STRIPES.indexOf(S),1);ed.pvS=null;paveBuild();pvDraw();toast(say('edPsDrag'),'',2600);pvCard();return}}
  if(d.pv==='new'){ed.pvNew='';pvBar()}
  if(d.moved)pvCommit(d.snap,edUnion(d.box,pvBoxOf()),{move:'Moved a lot',new:'New lot',size:'Sized a lot',end:'Moved a stripe row end',row:'Moved a stripe row',newrow:'New stripe row'}[d.pv]);
  pvCard()}
// ---------- the picked lot's or row's card ----------
const pvSurfN=s=>(PAVE_SURF.find(q=>q[0]===s)||PAVE_SURF[0])[1];
function pvCardSize(){const q=ed.pv,el=$('#edPvSize');if(q&&el)el.textContent=`${edFmt(q.w,0)} × ${edFmt(q.d,0)} ft · ${Math.round(q.w*q.d/(FT*FT)).toLocaleString()} sq ft`;
  const S=ed.pvS,er=$('#edPsN');if(S&&er){const n=stripeLines(S).length-(S.sd===2?2:1);er.textContent=`${n} stall${n===1?'':'s'} · ${edFmt(Math.hypot(S.b[0]-S.a[0],S.b[1]-S.a[1]),0)} ft`}}
function pvCard(){if(ed.tool!=='paving'&&ed.tool!=='stripes')return;
  // a change made with a slider: the lists before it are kept from the first move, committed when it is let go
  const live=(id,fn,fmt)=>{const el=$('#'+id);let snap=null,b0=null;el.oninput=()=>{if(!snap){snap=pvSnap();b0=pvBoxOf()}fn(+el.value);$('#'+id+'V').textContent=fmt(+el.value);paveBuild();pvDraw();pvCardSize()};
    el.onchange=()=>{const s=snap;snap=null;pvCommit(s,edUnion(b0,pvBoxOf()),'Changed paving');pvCard()}};
  const now=(fn,n)=>{const s=pvSnap(),b0=pvBoxOf();fn();pvCommit(s,edUnion(b0,pvBoxOf()),n);pvCard()};
  if(ed.tool==='paving'){const q=ed.pv;if(!q){edCard(null);return}const deg=Math.round(((q.r*180/Math.PI)%360+540)%360-180);
    edCard(`<h3>${pvSurfN(q.s)} ${q.s==='asphalt'||q.s==='gravel'?'lot':'slab'}</h3><dl><dt>Size</dt><dd id="edPvSize"></dd></dl>
      <div class="row" id="edPvSf" role="group" aria-label="Surface">${PAVE_SURF.map(([k,n])=>`<button class="sm" data-s="${k}" aria-pressed="${q.s===k}">${n}</button>`).join('')}</div>
      <div class="edopt"><label for="edPvW">Width</label><input id="edPvW" type="range" min="4" max="400" step="1" value="${Math.round(edFt(q.w))}"><output id="edPvWV">${Math.round(edFt(q.w))} ft</output></div>
      <div class="edopt"><label for="edPvD">Length</label><input id="edPvD" type="range" min="4" max="400" step="1" value="${Math.round(edFt(q.d))}"><output id="edPvDV">${Math.round(edFt(q.d))} ft</output></div>
      <div class="edopt"><label for="edPvR">Turn</label><input id="edPvR" type="range" min="-180" max="180" step="1" value="${deg}"><output id="edPvRV">${deg}°</output></div>
      <div class="edopt"><label for="edPvL">Height</label><input id="edPvL" type="range" min="0" max="8" step="0.5" value="${(q.l/0.0254).toFixed(1)}"><output id="edPvLV">${(q.l/0.0254).toFixed(1)} in</output></div>
      <div class="row"><button id="edPvCopy" class="sm">Copy</button><button id="edPvDel" class="sm danger">Delete</button></div>`);
    document.querySelectorAll('#edPvSf [data-s]').forEach(b=>b.onclick=()=>{if(q.s!==b.dataset.s)now(()=>{q.s=b.dataset.s},'Paving surface')});
    live('edPvW',v=>{q.w=v*FT},v=>v+' ft');live('edPvD',v=>{q.d=v*FT},v=>v+' ft');live('edPvR',v=>{q.r=v*Math.PI/180},v=>v+'°');live('edPvL',v=>{q.l=v*0.0254},v=>v.toFixed(1)+' in');
    $('#edPvCopy').onclick=()=>now(()=>{const c=Object.assign({},q),[x,z]=paveXZ(q,q.w+1,0);c.x=x;c.z=z;PAVES.push(c);ed.pv=c},'Copied a lot');
    $('#edPvDel').onclick=()=>now(()=>{PAVES.splice(PAVES.indexOf(q),1);ed.pv=null},'Deleted a lot');pvCardSize();return}
  const S=ed.pvS;if(!S){edCard(null);return}
  edCard(`<h3>Parking stripes</h3><dl><dt>Row</dt><dd id="edPsN"></dd></dl>
    <div class="edopt"><label for="edPsRW">Stall width</label><input id="edPsRW" type="range" min="7" max="14" step="0.5" value="${(Math.round(edFt(S.w)*2)/2)}"><output id="edPsRWV">${Math.round(edFt(S.w)*2)/2} ft</output></div>
    <div class="edopt"><label for="edPsRL">Stall depth</label><input id="edPsRL" type="range" min="12" max="26" step="1" value="${Math.round(edFt(S.L))}"><output id="edPsRLV">${Math.round(edFt(S.L))} ft</output></div>
    <div class="row" id="edPsRA" role="group" aria-label="Angle">${[90,60,45].map(a=>`<button class="sm" data-a="${a}" aria-pressed="${S.an===a}">${a===90?'Straight in':a+'° angled'}</button>`).join('')}</div>
    <div class="row" id="edPsRS" role="group" aria-label="Sides"><button class="sm" data-sd="flip" aria-pressed="false">Other side</button><button class="sm" data-sd="2" aria-pressed="${S.sd===2}">Both sides</button></div>
    <div class="row"><button id="edPsDel" class="sm danger">Delete row</button></div>`);
  live('edPsRW',v=>{S.w=v*FT},v=>v+' ft');live('edPsRL',v=>{S.L=v*FT},v=>v+' ft');
  document.querySelectorAll('#edPsRA [data-a]').forEach(b=>b.onclick=()=>{const a=+b.dataset.a;if(S.an!==a)now(()=>{S.an=a;ed.pvOpt.an=a;pvBar()},'Stall angle')});
  document.querySelectorAll('#edPsRS [data-sd]').forEach(b=>b.onclick=()=>now(()=>{S.sd=b.dataset.sd==='flip'?(S.sd===2?1:-S.sd):S.sd===2?1:2},'Stall sides'));
  $('#edPsDel').onclick=()=>now(()=>{STRIPES.splice(STRIPES.indexOf(S),1);ed.pvS=null},'Deleted a stripe row');pvCardSize()}
// the bottom bar: New lot / New slab, and the next row's stalls
$('#edPvNew').onclick=()=>{ed.pvNew=ed.pvNew==='lot'?'':'lot';pvBar();if(ed.pvNew)toast(say('edPvDrag'),'',2600)};
$('#edPvSlab').onclick=()=>{ed.pvNew=ed.pvNew==='slab'?'':'slab';pvBar();if(ed.pvNew)toast(say('edPvDrag'),'',2600)};
$('#edPsW').onchange=e=>{ed.pvOpt.w=+e.target.value*FT};$('#edPsL').onchange=e=>{ed.pvOpt.L=+e.target.value*FT};
$('#edPsA').onchange=e=>{ed.pvOpt.an=+e.target.value};$('#edPsSd').onchange=e=>{ed.pvOpt.sd=+e.target.value};
