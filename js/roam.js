// Corley's Island: townsfolk off the sidewalks. Someone can leave the town's walks (townfolk.js TF_WALK) and go anywhere
// in and round town (RO_BOX, the town's box and a margin: the townsfolk are only about while the camera is near it):
// over lawns, lots, the square, the beach, the pier, into a building by its door, up to you wherever you stand. A way is
// found on a grid of RO_C cells (roRoute: A*, then pulled straight between points that see each other, roLos), each cell
// the ground's height there (hAt, terrain.js: walk pads and decks count, roofs and upper floors don't) or blocked: the lake
// (under WATER), a wall or anything in SOLIDS within RO_R (a floor's own walls by their y0/y1, footprints never), or a
// step up or down of more than RO_STEP to the next cell (cliffs, retaining walls). The cells are worked out as a way
// first crosses them and kept until SOLIDS changes (the map editor moving a building, roTick).
// p.off { pts, i, x, z (where to), near, v (pace), then(p) once there, flee } walks them (roStep, from tfTick in place of
// tfWalkStep): round others and you as on the walks (tfBlocked), pushed clear of walls, giving up on a way that stops
// going (stuck: a new way). Arrived, they stand (p.off with no points left) until roBack walks them to the nearest
// walk and back onto it (roJoin). Who uses it: orders (orders.js ordChase: come, follow, go to a machine, the marina or
// someone), home (ordStart), running off (talk.js talkRun, gunfire), and pursuits (pursuits.js).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

const RO_C=0.9,RO_R=0.3,RO_STEP=0.5,RO_SG=6,RO_MAXN=70000;
const RO_BOX=[TF_BOX[0]-90,TF_BOX[1]+90,TF_BOX[2]-80,TF_BOX[3]+70];
const RO={sg:null,sig:NaN,pass:new Map(),t:0,jobs:[]};
const roKey=(i,j)=>(i+5000)*10000+(j+5000);

// ---------- the ground: who can stand where ----------
// SOLIDS by RO_SG squares (walls and things, footprints left out), remade when one is added, removed or moved
// (whether they moved is checked every 2 s, roTick with check set; otherwise the grid as it is)
function roSolids(check){if(RO.sg&&!check)return RO.sg;let sig=SOLIDS.length;for(const s of SOLIDS)sig+=s.x*0.37+s.z*0.71+(s.hx||0)*0.13;
  if(RO.sg&&sig===RO.sig)return RO.sg;RO.sig=sig;RO.pass.clear();const G=new Map();
  for(const s of SOLIDS){if(s.foot)continue;const hx=(s.hx||0)+RO_R,hz=(s.hz||0)+RO_R;
    for(let i=Math.floor((s.x-hx)/RO_SG);i<=Math.floor((s.x+hx)/RO_SG);i++)for(let j=Math.floor((s.z-hz)/RO_SG);j<=Math.floor((s.z+hz)/RO_SG);j++){const k=roKey(i,j);let L=G.get(k);if(!L)G.set(k,L=[]);L.push(s)}}
  return RO.sg=G}
// a wall or thing within r of x,z for someone standing at height y
function roSolidAt(x,z,y,r){const L=roSolids().get(roKey(Math.floor(x/RO_SG),Math.floor(z/RO_SG)));if(!L)return null;
  for(const s of L){if(s.y1!==undefined&&(y>=s.y1-0.05||y+1.7<=s.y0))continue;if(solidOut(s,x,z,r))return s}return null}
// a cell's ground height, or NaN where no one can stand
function roCell(i,j){const k=roKey(i,j);let h=RO.pass.get(k);if(h!==undefined)return h;const x=(i+0.5)*RO_C,z=(j+0.5)*RO_C;
  if(x<RO_BOX[0]||x>RO_BOX[1]||z<RO_BOX[2]||z>RO_BOX[3])h=NaN;
  else{h=hAt(x,z,baseHeight(x,z)+0.6);if(!(h>WATER+0.08)||roSolidAt(x,z,h,RO_R))h=NaN}
  RO.pass.set(k,h);return h}
const roAt=(x,z)=>roCell(Math.floor(x/RO_C),Math.floor(z/RO_C));
// a straight line someone can walk: every half a cell standable, no step on it over RO_STEP
function roLos(x0,z0,x1,z1){const d=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.ceil(d/(RO_C*0.5)));let ph=roAt(x0,z0);
  for(let k=1;k<=n;k++){const t=k/n,h=roAt(x0+(x1-x0)*t,z0+(z1-z0)*t);if(!(h===h))return false;if(ph===ph&&Math.abs(h-ph)>RO_STEP)return false;ph=h}return true}

// ---------- a way there ----------
// [[x, z]...] from x0,z0 to x1,z1 (or the nearest standable spot to it), or null
function* roRouteG(x0,z0,x1,z1){roSolids();const C=RO_C;let gi=Math.floor(x1/C),gj=Math.floor(z1/C);
  // where it ends: the spot itself, or the nearest one to it someone can stand on
  if(!(roCell(gi,gj)===roCell(gi,gj))){let b=null,bd=1e9;for(let r=1;r<=8&&!b;r++)for(let a=-r;a<=r;a++)for(const [i,j] of [[gi+a,gj-r],[gi+a,gj+r],[gi-r,gj+a],[gi+r,gj+a]]){const h=roCell(i,j);if(h===h){const d=Math.hypot(i-gi,j-gj);if(d<bd){bd=d;b=[i,j]}}}
    if(!b)return null;[gi,gj]=b;x1=(gi+0.5)*C;z1=(gj+0.5)*C}
  yield;if(roLos(x0,z0,x1,z1))return [[x1,z1]];yield;
  const si=Math.floor(x0/C),sj=Math.floor(z0/C),m=Math.round(40/C),i0=Math.max(Math.floor(RO_BOX[0]/C),Math.min(si,gi)-m),j0=Math.max(Math.floor(RO_BOX[2]/C),Math.min(sj,gj)-m),
    i1=Math.min(Math.ceil(RO_BOX[1]/C),Math.max(si,gi)+m),j1=Math.min(Math.ceil(RO_BOX[3]/C),Math.max(sj,gj)+m),W=i1-i0+1,H=j1-j0+1,N=W*H;
  if(si<i0||si>i1||sj<j0||sj>j1)return null;
  const g=new Float32Array(N).fill(Infinity),from=new Int32Array(N).fill(-1),shut=new Uint8Array(N),hf=[],hi=[];
  const push=(f,i)=>{let k=hf.length;hf.push(f);hi.push(i);while(k>0){const q=(k-1)>>1;if(hf[q]<=f)break;hf[k]=hf[q];hi[k]=hi[q];k=q}hf[k]=f;hi[k]=i};
  const pop=()=>{const r=hi[0],lf=hf.pop(),li=hi.pop();if(hf.length){let k=0;const n=hf.length;for(;;){let c=2*k+1;if(c>=n)break;if(c+1<n&&hf[c+1]<hf[c])c++;if(hf[c]>=lf)break;hf[k]=hf[c];hi[k]=hi[c];k=c}hf[k]=lf;hi[k]=li}return r};
  const hu=(i,j)=>{const dx=Math.abs(i-gi),dz=Math.abs(j-gj);return Math.max(dx,dz)+0.414*Math.min(dx,dz)};
  const s0=(sj-j0)*W+(si-i0),goal=(gj-j0)*W+(gi-i0);g[s0]=0;push(hu(si,sj),s0);let n=0,found=false;
  const D=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  while(hf.length&&n<RO_MAXN){const c=pop();if(shut[c])continue;shut[c]=1;n++;if(c===goal){found=true;break}if(n%150===0)yield;
    const ci=c%W+i0,cj=(c/W|0)+j0,ch=c===s0?roAt(x0,z0):roCell(ci,cj);
    for(const [a,b,w] of D){const ni=ci+a,nj=cj+b;if(ni<i0||ni>i1||nj<j0||nj>j1)continue;const k=(nj-j0)*W+(ni-i0);if(shut[k])continue;
      const h=roCell(ni,nj);if(!(h===h)||ch===ch&&Math.abs(h-ch)>RO_STEP)continue;
      if(a&&b&&(!(roCell(ci+a,cj)===roCell(ci+a,cj))||!(roCell(ci,cj+b)===roCell(ci,cj+b))))continue;
      const ng=g[c]+w;if(ng<g[k]){g[k]=ng;from[k]=c;push(ng+hu(ni,nj),k)}}}
  if(!found)return null;
  const cells=[];for(let c=goal;c!==-1&&c!==s0;c=from[c])cells.push([(c%W+i0+0.5)*C,((c/W|0)+j0+0.5)*C]);cells.reverse();cells[cells.length-1]=[x1,z1];
  // pulled straight: from each point on to the furthest it can see
  const out=[];let cx=x0,cz=z0,k=0;
  while(k<cells.length){yield;let f=k;for(let t=cells.length-1;t>k;t--)if(roLos(cx,cz,cells[t][0],cells[t][1])){f=t;break}out.push(cells[f]);[cx,cz]=cells[f];k=f+1}
  return out}

// the whole way at once (for a check; the game asks roGo, which works it out a slice a frame)
function roRoute(x0,z0,x1,z1){const it=roRouteG(x0,z0,x1,z1);for(;;){const r=it.next();if(r.done)return r.value}}

// ---------- walking it ----------
// set p off to x,z (o: near (stop that far short), v (pace), then(p) once there, fail(p) if there is no way, flee, max
// seconds, tag). A short straight way goes at once; any other is worked out a slice a frame (roTick) while they stand
function roGo(p,x,z,o={}){if(p.room||p.drv||p.cop||p.dead||p.hurt||p.path||p.go||p.goTo)return false;
  const t=p.off,off=p.off={pts:[],i:0,x,z,near:o.near||0.4,v:o.v||0,then:o.then||null,fail:o.fail||null,flee:o.flee||0,t:0,max:o.max||240,stuck:0,at:performance.now()/1000,tag:o.tag||(t&&t.tag)||'',pending:1};
  p.goal=null;p.tkGo=null;p.wait=0;
  const h=roAt(x,z);if(h===h&&Math.hypot(x-p.x,z-p.z)<40&&roLos(p.x,p.z,x,z)){off.pts=[[x,z]];off.pending=0;return true}
  RO.jobs.push({p,off,it:roRouteG(p.x,p.z,x,z)});return true}
// once done off the walks: the way to the nearest walk, and onto it
function roBack(p){if(!p.off)return;const W=ordWalkOf(p.x,p.z);if(!W){p.off=null;return}const [ax,az,ex,ez]=tfAt(W.w,W.s),x=ax-ez*0.32,z=az+ex*0.32;
  if(Math.hypot(x-p.x,z-p.z)<0.8||!roGo(p,x,z,{near:0.3,tag:'back',then:q=>roJoin(q),fail:q=>roJoin(q)}))roJoin(p)}
function roJoin(p){const W=ordWalkOf(p.x,p.z);p.off=null;if(!W)return;p.w=W.w;p.s=W.s;p.dir=Math.random()<0.5?1:-1;p.xok=false;p.side=0.32;p.goal=null;p.wait=Math.max(p.wait||0,0.3)}
// away from x,z (a shot, a machine, being told to run)
function roFlee(p,x,z,s,v){const a=Math.atan2(p.x-x,p.z-z);for(const da of [0,0.5,-0.5,1,-1,1.6,-1.6,2.3,-2.3]){const d=14+Math.random()*8,tx=p.x+Math.sin(a+da)*d,tz=p.z+Math.cos(a+da)*d;
    if(roAt(tx,tz)===roAt(tx,tz)&&roLos(p.x,p.z,tx,tz)){p.off={pts:[[tx,tz]],i:0,x:tx,z:tz,near:0.5,v,then:q=>{q.off.flee=0},fail:null,flee:1,t:0,max:60,stuck:0,at:performance.now()/1000,tag:'flee',pending:0};
      p.goal=null;p.tkGo=null;p.wait=0;p.flee=Math.max(p.flee||0,s);return true}}return false}
// a step along it (tfTick, for whoever has p.off)
function roStep(p,dt){const o=p.off;if(p.inside>0){p.inside-=dt;return}
  if(o.pending){p.spd=0;p.amp+=(0-p.amp)*Math.min(1,dt*6);return}
  if(p.flee>0&&!o.flee)roFlee(p,wk.x,wk.z,p.flee,Math.max(p.vt,TU.gunFlee||3));
  const turn=(yw,k)=>{let d=yw-p.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));p.yaw+=d*Math.min(1,dt*k)};
  const still=()=>{p.spd=0;p.amp+=(0-p.amp)*Math.min(1,dt*6);const h=hAt(p.x,p.z,p.y+0.45);p.y+=(h-p.y)*Math.min(1,dt*8)};
  if(p.wait>0){p.wait-=dt;still();turn(p.look,3);return}
  if(o.i>=o.pts.length){still();if(o.then){const f=o.then;o.then=null;f(p);return}
    // nothing more to do out here: back to the walks
    if(!p.ord&&!p.pu&&!p.dy&&!p.tg&&!(p.flee>0)&&(o.idle=(o.idle||0)+dt)>2)roBack(p);return}
  o.t+=dt;if(o.t>o.max){o.pts.length=0;o.i=0;return}
  const P=o.pts[o.i],last=o.i===o.pts.length-1,dx=P[0]-p.x,dz=P[1]-p.z,d=Math.hypot(dx,dz);
  if(d<(last?o.near:0.35)){o.i++;return}
  const ux=dx/d,uz=dz/d;if(p.ghost>0)p.ghost-=dt;const bl=tfBlocked(p,ux,uz,0.9);p.blk=bl?(p.blk||0)+dt:0;if(p.blk>2.5){p.ghost=2.5;p.blk=0}
  const v=o.v||p.vt;p.spd+=((bl?0:v)-p.spd)*Math.min(1,dt*(bl?8:2));const ds=Math.min(d,p.spd*dt);
  let nx=p.x+ux*ds,nz=p.z+uz*ds;const s=roSolidAt(nx,nz,p.y,0.26);if(s){const q=solidOut(s,nx,nz,0.26);if(q){nx+=q[0];nz+=q[1]}}
  const ny=hAt(nx,nz,p.y+0.45);
  if(!(ny>WATER+0.05)||Math.abs(ny-p.y)>0.55){o.stuck+=dt;p.spd=0;if(o.stuck>1.2){o.stuck=0;const pts=roRoute(p.x,p.z,o.x,o.z);if(pts){o.pts=pts;o.i=0}else{o.pts.length=0;o.i=0}}return}
  if(ds>0)o.stuck=Math.max(0,o.stuck-dt);p.x=nx;p.z=nz;p.y+=(ny-p.y)*Math.min(1,dt*10);
  turn(Math.atan2(ux,uz),7);p.amp+=(Math.min(1,p.spd/1.2)*0.42-p.amp)*Math.min(1,dt*6);p.ph+=p.spd*dt*Math.PI*2/(1.5*p.sc)}
// now and then: the grid kept in step with SOLIDS
// each frame: ways being worked out, a few milliseconds' worth (TU.roMs); and the grid kept in step with SOLIDS
function roTick(dt){const t0=performance.now(),J=RO.jobs;
  while(J.length&&performance.now()-t0<TU.roMs){const j=J[0];if(j.p.off!==j.off||!tf.people.includes(j.p)){J.shift();continue}
    const r=j.it.next();if(!r.done)continue;J.shift();const o=j.off;o.pending=0;o.at=performance.now()/1000;
    if(r.value)o.pts=r.value;else{o.pts=[];o.then=null;if(o.fail)o.fail(j.p);else if(!j.p.ord&&!j.p.pu)roJoin(j.p)}}
  if((RO.t+=dt)<2)return;RO.t=0;roSolids(true)}
