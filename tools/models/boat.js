// Corley's Island: the detailed centre-console runabout (one tied up at every island's dock and one at the town marina,
// js/boats.js), built from shapes and written out as models/boat.glb by tools/build_model.js (three.js r147 in headless
// Chromium). The game loads it (js/models.js, MDL_KIT.boat) in place of the kit-built boat when Machine models are Detailed.
// The contract with the game, so a model made in Blender or bought can replace this one:
// - one node, body, in the boat's own frame: origin on the waterline under the middle of the hull, x to port (left), y
//   up, z forward; the hull 5.2 m long at the sheer (stem at z 2.6, transom at z -2.6; a 17 ft runabout) and 2.1 m in
//   beam, drawing 0.34 m at the keel; the outboard hangs off the transom to about z -3.2. The helmsman sits at
//   (0, 0, -0.47) on the leaning post, facing the wheel on the console's aft face round (0, 1.0, 0.2);
// - materials named for the game's (models.js mdlMatOf): plastic#e8b923 is the topsides and transom, which the game
//   repaints in each boat's own hull colour; glass#b9d4dc is the windscreen, which it makes see-through; the rest are
//   colour kinds (paint#… gelcoat, matte#… upholstery and non-skid, metal#… stainless, rubber#…, plastic#…) and mdlMats
//   names (lens, redL, chrome).
// Metres. Classic script, no modules.
function buildBoat(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={};
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),V=(...a)=>new T.Vector3(...a);
function put(part,mat,g,p,r){g=g.index?g.toNonIndexed():g.clone();
  if(r&&r.isQuaternion)q.copy(r);else{e.set(...(r||[0,0,0]));q.setFromEuler(e)}
  mtx.compose(V(...(p||[0,0,0])),q,V(1,1,1));g.applyMatrix4(mtx);
  g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
const RB=(w,h,d,r)=>new T.RoundedBoxGeometry(w,h,d,Math.max(w,h,d)>0.4?2:1,Math.max(1e-4,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4)));
const BX=(w,h,d)=>new T.BoxGeometry(w,h,d);
const CY=(rt,rb,h,n,open)=>new T.CylinderGeometry(rt,rb,h,n||16,1,!!open);
function side(pts,w,bev){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:16});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
function tube(mat,pts,r,n,rs,closed){const c=new T.CatmullRomCurve3(pts.map(p=>V(...p)),!!closed,'catmullrom',0.1);put(B,mat,new T.TubeGeometry(c,n||Math.max(8,pts.length*8),r,rs||10,!!closed))}
function rod(mat,a,b,r,n){const A=V(...a),Bv=V(...b),d=Bv.clone().sub(A),L=d.length();
  put(B,mat,CY(r,r,L,n||10),A.add(Bv).multiplyScalar(0.5).toArray(),new T.Quaternion().setFromUnitVectors(V(0,1,0),d.normalize()))}
// triangles from a list of [a, b, c] points, each turned to face its want direction
function tris(mat,list){const pos=[];for(const [a,b,c,want] of list){const n=b.clone().sub(a).cross(c.clone().sub(a));const t=n.dot(want)<0?[a,c,b]:[a,b,c];for(const p of t)pos.push(p.x,p.y,p.z)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();put(B,mat,BGU.toCreasedNormals(g,0.5))}
const quad=(L,a,b,c,d,want)=>L.push([a,b,c,want],[c,b,d,want]);
const B='body',HULL='plastic#e8b923',GEL='plastic#f2f1ec',BOT='plastic#e9e7e1',NS_='matte#d6d3ca',UPH='matte#3f4852',SS='metal#d3d6d8',BLK='plastic#1c1d1f';
const LEN=5.2,BEAM=2.1,Z0=-LEN/2,ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const lerp=(a,b,t)=>a+(b-a)*t;

// ---------- the hull: a deep-V lofted from stations, two lifting strakes a side, reversed chines, flared topsides ----------
// at t along it (0 the transom, 1 the stem): half beam at the sheer, sheer and keel heights, the chine
function sec(t){const w=t<0.55?BEAM/2*(0.93+0.07*t/0.55):BEAM/2*Math.sqrt(Math.max(0,1-((t-0.55)/0.45)**2));
  return {w,sheer:0.58+0.2*ss(0.5,1,t),keel:-0.34+0.42*ss(0.62,1,t)**2,cy:-0.13+0.12*ss(0.55,1,t),cx:w*(0.9-0.32*ss(0.6,1,t))}}
// a station's half section, keel to sheer, as [x, y], and how far each point sits back for the raked stem
function prof(t){const s=sec(t),k=Math.min(1,s.cx/0.4),P=[[0,s.keel]],bot=f=>[s.cx*f,lerp(s.keel,s.cy,f)];
  for(const f of [0.34,0.67]){const [x,y]=bot(f);P.push([x,y],[x+0.022*k,y-0.004*k],[x+0.027*k,y+0.009*k])}
  P.push([s.cx,s.cy],[s.cx+0.045*k,s.cy+0.004]);const x0=s.cx+0.045*k;
  P.push([lerp(x0,s.w,0.45)+0.008,lerp(s.cy,s.sheer,0.4)],[lerp(x0,s.w,0.8)+0.004,lerp(s.cy,s.sheer,0.78)],[s.w,s.sheer]);
  return {s,P,bottom:8}}// the first 9 points (to the chine flat) are the white bottom
const NS=64,zOf=(t,y,s)=>Z0+t*LEN-0.38*(s.sheer-y)*ss(0.72,1,t)**1.5;
{const st=[];for(let i=0;i<=NS;i++){const t=i/NS;st.push(prof(t))}
  const np=st[0].P.length,hullL=[],botL=[];
  for(const sd of [-1,1])for(let i=0;i<NS;i++){const A=st[i],Bs=st[i+1],ta=i/NS,tb=(i+1)/NS;
    for(let j=0;j<np-1;j++){const pt=(S,t,k)=>V(sd*S.P[k][0],S.P[k][1],zOf(t,S.P[k][1],S.s));
      const a=pt(A,ta,j),b=pt(Bs,tb,j),c=pt(A,ta,j+1),d=pt(Bs,tb,j+1);
      const dx=A.P[j+1][0]-A.P[j][0],dy=A.P[j+1][1]-A.P[j][1],want=V(sd*dy,-dx,0);if(want.lengthSq()<1e-10)want.set(sd,0,0);
      quad(j<A.bottom?botL:hullL,a,b,c,d,want)}}
  // the transom: a flat face across the aft section, fanned from its middle
  const S=st[0],mid=V(0,(S.s.keel+S.s.sheer)/2,Z0),ring=[];
  for(let k=S.P.length-1;k>=0;k--)ring.push(V(-S.P[k][0],S.P[k][1],Z0));for(let k=1;k<S.P.length;k++)ring.push(V(S.P[k][0],S.P[k][1],Z0));
  for(let k=0;k<ring.length;k++){const a=ring[k],b=ring[(k+1)%ring.length];hullL.push([mid,a,b,V(0,0,-1)])}
  tris(HULL,hullL);tris(BOT,botL);
  // the boot stripe just above the waterline: a dark band laid on the topsides
  {const band=[],at=(S,t,y,sd)=>{const P=S.P;for(let k=S.bottom;k<P.length-1;k++)if(P[k][1]<=y&&P[k+1][1]>=y){const f=(y-P[k][1])/(P[k+1][1]-P[k][1]);return V(sd*(P[k][0]+(P[k+1][0]-P[k][0])*f+0.003),y,zOf(t,y,S.s))}return null};
    for(const sd of [-1,1])for(let i=0;i<NS;i++){const ta=i/NS,tb=(i+1)/NS,a=at(st[i],ta,0.05,sd),b=at(st[i+1],tb,0.05,sd),c=at(st[i],ta,0.11,sd),d=at(st[i+1],tb,0.11,sd);
      if(a&&b&&c&&d)quad(band,a,b,c,d,V(sd,0,0))}
    tris('plastic#1f2326',band)}
  // the rub rail along the sheer, its stainless insert, and the bow eye
  for(const sd of [-1,1]){const pts=[];for(let i=0;i<=NS;i+=2){const t=i/NS,s=sec(t);pts.push([sd*(s.w+0.012),s.sheer-0.012,Z0+t*LEN+(t>0.99?-0.01:0)])}
    tube('rubber#1e1f21',pts,0.026,96,8);tube(SS,pts.map(([x,y,z])=>[x+sd*0.02,y,z]),0.008,96,6)}
  put(B,SS,new T.TorusGeometry(0.035,0.009,8,16),[0,0.2,zOf(0.985,0.2,sec(0.985))+0.03],[0,Math.PI/2,0])}

// ---------- the deck: gunwale caps, the cockpit's inner walls and non-skid sole, the raised bow casting deck ----------
{const TA=Math.round(0.05*NS)/NS,TB=Math.round(0.73*NS)/NS,SOLE=0.12,BOW=0.6,wi=t=>Math.max(0,sec(t).w-0.12),cap=[],wall=[],sole=[],bow=[];
  for(let i=0;i<NS;i++){const ta=i/NS,tb=(i+1)/NS,sa=sec(ta),sb=sec(tb),za=Z0+ta*LEN,zb=Z0+tb*LEN;
    for(const sd of [-1,1]){
      // the cap: from the sheer to the wall's top, rolled a little at its outer edge
      if(tb<=TA+1e-6)continue;
      quad(cap,V(sd*(sa.w+0.004),sa.sheer,za),V(sd*(sb.w+0.004),sb.sheer,zb),V(sd*wi(ta),sa.sheer+0.012,za),V(sd*wi(tb),sb.sheer+0.012,zb),V(0,1,0));
      const fl=tb<=TB+1e-6?SOLE:BOW;
      quad(wall,V(sd*wi(ta),sa.sheer+0.012,za),V(sd*wi(tb),sb.sheer+0.012,zb),V(sd*wi(ta),fl,za),V(sd*wi(tb),fl,zb),V(-sd,0,0))}
    if(ta>=TA-1e-6&&tb<=TB+1e-6)quad(sole,V(-wi(ta),SOLE,za),V(-wi(tb),SOLE,zb),V(wi(ta),SOLE,za),V(wi(tb),SOLE,zb),V(0,1,0));
    if(ta>=TB-1e-6)quad(bow,V(-wi(ta),BOW,za),V(-wi(tb),BOW,zb),V(wi(ta),BOW,za),V(wi(tb),BOW,zb),V(0,1,0))}
  // the riser at the bow deck's aft edge, the splashwell across the stern, the stern deck behind it
  {const t=TB,s=sec(t),w=wi(t),z=Z0+t*LEN;quad(cap,V(-w,SOLE,z),V(w,SOLE,z),V(-w,BOW,z),V(w,BOW,z),V(0,0,-1))}
  {const s=sec(TA),w=wi(TA),z=Z0+TA*LEN,s0=sec(0);quad(cap,V(-w,SOLE,z),V(w,SOLE,z),V(-w,s.sheer+0.012,z),V(w,s.sheer+0.012,z),V(0,0,1));
    quad(cap,V(-s0.w-0.004,s0.sheer,Z0),V(s0.w+0.004,s0.sheer,Z0),V(-s.w-0.004,s.sheer,z),V(s.w+0.004,s.sheer,z),V(0,1,0));
    quad(cap,V(-w,s.sheer+0.012,z),V(w,s.sheer+0.012,z),V(-s.w-0.004,s.sheer,z),V(s.w+0.004,s.sheer,z),V(0,0,1))}
  tris(GEL,cap.concat(wall));tris(NS_,sole.concat(bow));
  // hatches in the bow deck and the sole: a dark seam round each lid, a flush pull
  for(const [z,w,d,y] of [[1.75,0.62,0.5,BOW],[2.2,0.34,0.3,BOW],[-1.25,0.5,0.62,SOLE]]){
    for(const [dx,dz,ww,dd] of [[0,d/2,w,0.012],[0,-d/2,w,0.012],[w/2,0,0.012,d],[-w/2,0,0.012,d]])put(B,'plastic#55585c',BX(ww,0.004,dd),[dx,y+0.002,z+dz]);
    put(B,SS,RB(0.1,0.006,0.03,0.003),[0,y+0.004,z+d/2-0.06])}
  // drains and a pair of scuppers aft, a cushion on the bow deck, the anchor locker lid
  for(const sd of [-1,1])put(B,'plastic#2b2c2e',CY(0.03,0.03,0.006,14),[sd*0.6,SOLE+0.003,-2.25]);
  put(B,UPH,RB(0.9,0.08,0.7,0.035),[0,BOW+0.04,1.55]);for(const x of [-0.15,0.15])put(B,'matte#353d46',BX(0.006,0.004,0.66),[x,BOW+0.081,1.55])}

// ---------- the console: moulded, a raked windscreen in a stainless rail, the helm with wheel, gauges and throttle ----------
put(B,GEL,side([[0.06,0.12],[0.68,0.12],[0.7,0.5],[0.66,0.96],[0.6,1.0],[0.48,1.02],[0.2,0.92],[0.13,0.88],[0.1,0.5]],0.8,0.045));
put(B,GEL,RB(0.86,0.06,0.7,0.025),[0,0.15,0.38]);
// a door in the aft face down to the head inside, its latch; grab handles each side
put(B,'plastic#d8d6cf',RB(0.42,0.5,0.02,0.02),[0,0.47,0.095]);put(B,SS,RB(0.05,0.03,0.02,0.008),[0.15,0.5,0.082]);
for(const sd of [-1,1])tube(SS,[[sd*0.405,0.7,0.2],[sd*0.44,0.72,0.3],[sd*0.44,0.72,0.5],[sd*0.405,0.7,0.6]],0.012,16,8);
// the dash: a dark panel, two gauges and a display, switches, the compass up top
{const dash=(x,y,z)=>[x,y,z],ang=1.22;
  put(B,'plastic#232528',RB(0.66,0.32,0.02,0.01),[0,0.965,0.335],[ang,0,0]);
  for(const [x,r] of [[-0.2,0.05],[0.2,0.05]]){put(B,'glass#0f171c',CY(r,r,0.012,24),dash(x,0.985,0.355),[ang+Math.PI/2,0,0]);put(B,'chrome',new T.TorusGeometry(r,0.007,6,24),dash(x,0.99,0.36),[ang,0,0])}
  put(B,'glass#0b1216',RB(0.22,0.13,0.012,0.008),[0,0.99,0.36],[ang,0,0]);put(B,'chrome',RB(0.24,0.15,0.006,0.006),[0,0.987,0.353],[ang,0,0]);
  for(let i=0;i<5;i++)put(B,'black',RB(0.022,0.014,0.03,0.004),[-0.2+i*0.1,0.92,0.21],[ang,0,0]);
  put(B,'black',CY(0.06,0.07,0.06,20),[0,1.04,0.52]);put(B,'glass#2a3640',new T.SphereGeometry(0.055,16,8,0,Math.PI*2,0,Math.PI/2),[0,1.07,0.52])}
// the helm: tilted shaft, a three-spoke stainless wheel with a knob
{const ax=V(0,0.62,-0.785).normalize(),c=V(0,0.985,0.2),qq=new T.Quaternion().setFromUnitVectors(V(0,0,1),ax),qy=new T.Quaternion().setFromUnitVectors(V(0,1,0),ax);
  put(B,'black',CY(0.04,0.05,0.1,16),c.clone().addScaledVector(ax,-0.05).toArray(),qy);
  put(B,SS,new T.TorusGeometry(0.17,0.013,10,40),c.toArray(),qq);put(B,'black',CY(0.04,0.04,0.05,16),c.toArray(),qy);
  for(let k=0;k<3;k++){const a=k/3*Math.PI*2+Math.PI/2,d=V(Math.cos(a),Math.sin(a),0).applyQuaternion(qq);rod(SS,c.clone().addScaledVector(d,0.03).toArray(),c.clone().addScaledVector(d,0.165).toArray(),0.008,8)}
  const kn=V(Math.cos(-0.4),Math.sin(-0.4),0).applyQuaternion(qq);put(B,'black',CY(0.012,0.012,0.06,10),c.clone().addScaledVector(kn,0.17).addScaledVector(ax,0.03).toArray(),qy)}
// the throttle and shift on the starboard side of the console
put(B,'black',RB(0.08,0.14,0.14,0.02),[-0.43,0.82,0.3]);put(B,SS,CY(0.012,0.012,0.18,10),[-0.47,0.9,0.3],[0.5,0,0]);put(B,'black',CY(0.025,0.025,0.08,12),[-0.47,0.98,0.26],[0,0,Math.PI/2]);
// the windscreen wrapped round the console's top, in a stainless grab rail
{const N=14,W=0.44,base=x=>[0.98-0.03*(x/W)**2,0.64-0.2*(x/W)**2],pos=[],h=0.36,rk=0.17;
  const P=(x,u,o)=>{const [y,z]=base(x);return V(x+o*Math.sign(x)*0,y+u*h+o*0.3,z-u*rk+o)};
  for(let i=0;i<N;i++){const xa=-W+2*W*i/N,xb=-W+2*W*(i+1)/N;
    for(const [o,flip] of [[0.004,1],[-0.004,-1]]){const a=P(xa,0,o),b=P(xb,0,o),c=P(xa,1,o),d=P(xb,1,o);for(const t of flip>0?[[a,b,c],[c,b,d]]:[[a,c,b],[c,d,b]])for(const p of t)pos.push(p.x,p.y,p.z)}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();put(B,'glass#b9d4dc',g);
  const top=[],L=[];for(let i=0;i<=N;i++){const x=-W+2*W*i/N,[y,z]=base(x);top.push([x,y+h+0.01,z-rk])}
  tube(SS,top,0.012,40,8);for(const s of [-1,1]){const [y,z]=base(s*W);tube(SS,[[s*W,y-0.02,z+0.01],[s*W,y+h*0.5,z-rk*0.5],[s*W,y+h+0.01,z-rk]],0.012,12,8)}
  for(let i=0;i<=N;i++){const x=-W+2*W*i/N,[y,z]=base(x);L.push([x,y+0.005,z+0.005])}tube('rubber#1e1f21',L,0.01,40,6)}

// ---------- the leaning post: a padded seat and backrest on a stainless frame, a cooler under it, rod holders behind ----------
put(B,GEL,RB(0.66,0.5,0.42,0.04),[0,0.37,-0.47]);put(B,'plastic#e7e4dc',RB(0.6,0.04,0.38,0.015),[0,0.59,-0.47]);
put(B,UPH,RB(0.72,0.11,0.44,0.045),[0,0.69,-0.5]);put(B,UPH,RB(0.72,0.3,0.1,0.045),[0,0.95,-0.69],[-0.12,0,0]);
for(const sd of [-1,1]){tube(SS,[[sd*0.37,0.62,-0.27],[sd*0.38,0.72,-0.27],[sd*0.38,0.78,-0.4],[sd*0.37,0.8,-0.62],[sd*0.37,1.12,-0.72]],0.016,24,8);
  rod(SS,[sd*0.37,0.62,-0.7],[sd*0.37,1.12,-0.72],0.016,10)}
rod(SS,[-0.37,1.12,-0.72],[0.37,1.12,-0.72],0.016,10);
for(const x of [-0.27,-0.09,0.09,0.27]){rod(SS,[x,0.96,-0.76],[x,1.16,-0.8],0.024,14);put(B,'black',CY(0.024,0.024,0.04,14),[x,0.94,-0.756],[-0.2,0,0])}
// the cooler seat in front of the console
put(B,'plastic#ecebe6',RB(0.7,0.4,0.42,0.04),[0,0.32,0.98]);put(B,UPH,RB(0.72,0.09,0.44,0.04),[0,0.565,0.98]);
for(const sd of [-1,1])put(B,'plastic#9fa3a6',RB(0.03,0.04,0.16,0.01),[sd*0.355,0.4,0.98])

// ---------- the stern: a bench across the splashwell, the stern light, cleats, rod holders, trim tabs and the ladder ----------
{const z=-2.12;put(B,GEL,RB(1.6,0.3,0.44,0.04),[0,0.27,z]);put(B,UPH,RB(1.62,0.09,0.46,0.04),[0,0.465,z]);put(B,UPH,RB(1.58,0.22,0.08,0.035),[0,0.62,z-0.2],[0.12,0,0])}
rod(SS,[0.62,0.6,-2.48],[0.62,1.55,-2.5],0.012,8);put(B,'lens',new T.SphereGeometry(0.035,14,10),[0.62,1.58,-2.5]);put(B,'black',CY(0.03,0.03,0.04,12),[0.62,1.535,-2.5]);
const cleat=(x,y,z,ry)=>{put(B,SS,RB(0.05,0.03,0.05,0.012),[x,y+0.015,z],[0,ry,0]);put(B,SS,RB(0.2,0.02,0.035,0.01),[x,y+0.04,z],[0,ry,0])};
for(const sd of [-1,1]){const s0=sec(0.03),sm=sec(0.52);cleat(sd*(s0.w-0.06),s0.sheer+0.012,Z0+0.03*LEN,0);cleat(sd*(sm.w-0.06),sm.sheer+0.012,Z0+0.52*LEN,Math.PI/2)}
cleat(0,sec(0.95).sheer+0.012,Z0+0.95*LEN-0.05,Math.PI/2);
for(const sd of [-1,1])for(const t of [0.12,0.2]){const s=sec(t);put(B,'chrome',CY(0.03,0.026,0.03,16,true),[sd*(s.w-0.06),s.sheer+0.014,Z0+t*LEN]);put(B,'black',CY(0.024,0.024,0.004,14),[sd*(s.w-0.06),s.sheer+0.01,Z0+t*LEN])}
for(const sd of [-1,1]){put(B,'steel#43464a',RB(0.32,0.012,0.2,0.004),[sd*0.62,-0.2,Z0-0.09]);rod('steel#43464a',[sd*0.62,-0.19,Z0-0.12],[sd*0.62,0.05,Z0-0.005],0.016,10)}
for(const x of [0.7,0.86])rod(SS,[x,0.05,Z0-0.03],[x,0.62,Z0-0.03],0.011,8);for(const y of [0.15,0.3,0.45])rod(SS,[0.7,y,Z0-0.04],[0.86,y,Z0-0.04],0.01,8);
// side lights on the bow, port red and starboard green
{const t=0.9,s=sec(t),z=Z0+t*LEN;for(const [sd,m] of [[1,'redL'],[-1,'glass#1f9a45']]){put(B,'black',RB(0.05,0.06,0.13,0.012),[sd*(s.w-0.02),s.sheer+0.04,z],[0,sd*0.35,0]);put(B,m,RB(0.022,0.045,0.1,0.01),[sd*(s.w+0.006),s.sheer+0.04,z],[0,sd*0.35,0])}}

// ---------- the bow rail on its stanchions ----------
{const pts=[],H=0.32;for(const t of [0.62,0.7,0.78,0.85,0.91,0.96])pts.push(t);
  const at=(t,sd)=>{const s=sec(t);return [sd*Math.max(0.03,s.w-0.07),s.sheer+H,Z0+t*LEN-(t>0.95?0.04:0)]};
  const rail=[...pts.map(t=>at(t,1)),[0,sec(0.985).sheer+H-0.02,Z0+0.985*LEN-0.08],...pts.slice().reverse().map(t=>at(t,-1))];tube(SS,rail,0.014,90,8);
  for(const sd of [-1,1])for(const t of [0.62,0.75,0.88]){const p=at(t,sd);rod(SS,[p[0],p[1]-H,p[2]],p,0.012,8);put(B,SS,CY(0.028,0.03,0.012,14),[p[0],p[1]-H+0.006,p[2]])}}

// ---------- the outboard: transom bracket, cowling, lower cowl, the leg with its plate, gearcase, skeg and propeller ----------
{const Zt=Z0,BL='plastic#1b1c1e',GR='plastic#2e3033';
  put(B,'steel#3b3e42',RB(0.3,0.36,0.12,0.02),[0,0.4,Zt-0.07]);for(const x of [-0.11,0.11])put(B,'steel#3b3e42',RB(0.04,0.42,0.18,0.01),[x,0.38,Zt-0.12]);
  rod('chrome',[0.08,0.32,Zt-0.06],[0.05,0.5,Zt-0.2],0.016,10);rod('chrome',[-0.08,0.32,Zt-0.06],[-0.05,0.5,Zt-0.2],0.016,10);
  put(B,GR,side([[Zt-0.13,0.47],[Zt-0.13,0.66],[Zt-0.6,0.66],[Zt-0.62,0.47],[Zt-0.4,0.42],[Zt-0.2,0.42]],0.4,0.04));
  put(B,BL,side([[Zt-0.11,0.66],[Zt-0.11,0.98],[Zt-0.18,1.12],[Zt-0.34,1.18],[Zt-0.52,1.15],[Zt-0.64,1.04],[Zt-0.66,0.82],[Zt-0.64,0.66]],0.44,0.07));
  for(const sd of [-1,1])for(let i=0;i<4;i++)put(B,'plastic#2e3033',BX(0.006,0.012,0.16),[sd*0.218,1.0+i*0.03,Zt-0.53],[0.25,0,0]);
  put(B,'plastic#9da1a5',RB(0.3,0.02,0.02,0.008),[0,0.66,Zt-0.11]);
  // the leg: a streamlined section down to the anti-ventilation plate
  const foil=new T.Shape(),C=0.24,TH=0.09;for(let i=0;i<=20;i++){const u=i/20,x=C*u,y=TH/2*(2.97*Math.sqrt(u)-1.26*u-3.52*u*u+2.84*u**3-1.015*u**4);i?foil.lineTo(x,y):foil.moveTo(x,y)}
  for(let i=19;i>=1;i--){const u=i/20,x=C*u,y=TH/2*(2.97*Math.sqrt(u)-1.26*u-3.52*u*u+2.84*u**3-1.015*u**4);foil.lineTo(x,-y)}
  const leg=new T.ExtrudeGeometry(foil,{depth:0.66,bevelEnabled:false,curveSegments:8});leg.rotateX(Math.PI/2);leg.rotateY(Math.PI/2);put(B,GR,leg,[0,0.43,Zt-0.2]);
  put(B,GR,RB(0.34,0.018,0.4,0.008),[0,-0.22,Zt-0.37]);
  put(B,GR,new T.LatheGeometry([[0,0],[0.03,0.01],[0.06,0.05],[0.072,0.12],[0.072,0.24],[0.06,0.3],[0.045,0.33]].map(([r,y])=>new T.Vector2(r,y)),24),[0,-0.38,Zt-0.18],[-Math.PI/2,0,0]);
  put(B,GR,side([[Zt-0.22,-0.4],[Zt-0.42,-0.4],[Zt-0.44,-0.6],[Zt-0.38,-0.6]],0.025,0.008));
  for(let i=0;i<5;i++)put(B,'plastic#111214',BX(0.006,0.05,0.012),[0.04,-0.3,Zt-0.27-i*0.025]);
  // the propeller: three pitched blades on a hub
  const pz=Zt-0.54;put(B,'steel#4d5155',CY(0.05,0.035,0.14,16),[0,-0.38,pz],[Math.PI/2,0,0]);
  for(let k=0;k<3;k++){const a=k/3*Math.PI*2,bl=new T.SphereGeometry(0.11,14,8);bl.scale(0.62,1,0.07);bl.translate(0,0.1,0);
    const qb=new T.Quaternion().setFromEuler(new T.Euler(0,0.55,a,'ZYX'));put(B,'steel#4d5155',bl,[0,-0.38,pz-0.01],qb)}}

// ---------- merge: one mesh per material ----------
const root=new T.Group();root.name='boat';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat.replace(/[^a-zA-Z0-9]/g,'');g.add(mesh)}}
return root}
