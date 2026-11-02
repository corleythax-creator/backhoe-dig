// Corley's Island: the town's neighbourhoods. Residential streets off the cross street and round the edges of town
// (SUB_STREETS: asphalt with a grass strip and a concrete sidewalk each side, ramped up over the cross street's
// sidewalk where they meet it), and along them houses on their lots wherever one fits clear of everything else
// (subFits): two-storey colonials with a front porch, capes with dormers, ranches with an attached garage, each in
// photo-scanned siding under a shingle roof, with glass windows onto lit rooms (interiors.js), a door, shutters,
// a chimney, shrubs, a driveway with a car in it (TF_PARKED, drawn by townfolk.js), a front walk, a mailbox, yard trees
// and a board fence round the back yard; some have a second car at the curb. Round it all, woods: back-yard trees,
// then thickening woods and thickets to the edges of the mainland's ground, so the town fades into the country.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const SUB={RW:6,GS:0.9,SW:1.4,lots:[],houses:0};
// [x0, z0, x1, z1] centre lines (each along x or z)
const SUB_STREETS=[[-63,658.8,-63,750],[-63,750,-63,782],[-107,598,-107,645.2],[-107,658.8,-107,750],[-155,598,-155,750],[-155,598,-107,598],
  [-155,700,-30,700],[-155,750,-63,750],[-140,652,-155,652],[107,658.8,107,734],[17.5,734,160,734],[160,618,160,750],[140,652,160,652]];
// where they meet the cross street over its sidewalk: [x, the walk's z0, z1, which way the side street runs]
const SUB_APRONS=[[-63,655.5,658.8,1],[-107,645.2,648.5,-1],[-107,655.5,658.8,1],[107,655.5,658.8,1]];
// TF_PARKED: {x, y, z, yaw} the parked cars (townfolk.js)
const TF_PARKED=[];
// ---------- what a lot must keep clear of ----------
const SUB_KEEP=[[-104,-18,556,634],[24,36,736,790],[-28,18,722,763],[34,94,676,715],[41,67,672,680],[56,134,579,615],[-140,140,644,660],[-8,8,550,726],[100,132,560,580]];
function subClear(x,z){if(Math.abs(x)>178||z>766||z<588)return false;if(baseHeight(x,z)-WATER<2)return false;
  for(const [a,b,c,d] of SUB_KEEP)if(x>a&&x<b&&z>c&&z<d)return false;
  if(Math.abs(roadOff(x,z))<ROAD_W/2+2)return false;
  for(const s of SOLIDS)if(Math.abs(x-s.x)<s.hx+1&&Math.abs(z-s.z)<s.hz+1)return false;
  for(const [x0,z0,x1,z1] of SUB_STREETS){const ax=Math.min(x0,x1)-5.25,bx=Math.max(x0,x1)+5.25,az=Math.min(z0,z1)-5.25,bz=Math.max(z0,z1)+5.25;if(x>ax&&x<bx&&z>az&&z<bz)return false}
  for(const L of SUB.lots)if(x>L[0]&&x<L[1]&&z>L[2]&&z<L[3])return false;
  return true}
// a rectangle (world, axis-aligned) all clear: its corners, edges and middle
function subFits(x0,x1,z0,z1){for(let i=0;i<=4;i++)for(let j=0;j<=4;j++)if(!subClear(x0+(x1-x0)*i/4,z0+(z1-z0)*j/4))return false;return true}
// ---------- paving: sheets over the ground, lifted (a number or a function of x, z) ----------
const SUBK=shopKit();
function subSheet(mat,x0,x1,z0,z1,lift,step){step=step||2;const g=new THREE.PlaneGeometry(x1-x0,z1-z0,Math.max(1,Math.round((x1-x0)/step)),Math.max(1,Math.round((z1-z0)/step)));g.rotateX(-Math.PI/2);
  const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)+(x0+x1)/2,z=p.getZ(i)+(z0+z1)/2;p.setXYZ(i,x,baseHeight(x,z)+(typeof lift==='function'?lift(x,z):lift),z)}SUBK.put(mat,g)}
function subPave(){const asph=shopLib('asphalt'),walk=shopLib('concrete_broom'),R=SUB.RW/2,O=R+SUB.GS+SUB.SW/2;
  for(const [x0,z0,x1,z1] of SUB_STREETS){const alongZ=x0===x1,a=Math.min(alongZ?z0:x0,alongZ?z1:x1),b=Math.max(alongZ?z0:x0,alongZ?z1:x1),c=alongZ?x0:z0;
    if(alongZ){subSheet(asph,c-R,c+R,a,b,0.04);walkPad(c,(a+b)/2,R,(b-a)/2,0,0,{l:0.04})}else{subSheet(asph,a,b,c-R,c+R,0.04);walkPad((a+b)/2,c,(b-a)/2,R,0,0,{l:0.04})}
    // the sidewalks, cut where they would cross another street, a building or the town's own paving
    for(const sd of [-1,1]){const w=c+sd*O;let run=null;const end=t=>{if(run!==null&&t-run>1){if(alongZ){subSheet(walk,w-SUB.SW/2,w+SUB.SW/2,run,t,0.07);walkPad(w,(run+t)/2,SUB.SW/2,(t-run)/2,0,0,{l:0.07})}
          else{subSheet(walk,run,t,w-SUB.SW/2,w+SUB.SW/2,0.07);walkPad((run+t)/2,w,(t-run)/2,SUB.SW/2,0,0,{l:0.07})}}run=null};
      for(let t=a;t<=b;t+=0.5){const x=alongZ?w:t,z=alongZ?t:w;let ok=Math.abs(roadOff(x,z))>ROAD_W/2+0.3&&!SOLIDS.some(s=>Math.abs(x-s.x)<s.hx+1.2&&Math.abs(z-s.z)<s.hz+1.2);
        if(ok)for(const [p0,q0,p1,q1] of SUB_STREETS){if(p0===x0&&q0===z0&&p1===x1&&q1===z1)continue;const ax=Math.min(p0,p1)-R-0.3,bx=Math.max(p0,p1)+R+0.3,az=Math.min(q0,q1)-R-0.3,bz=Math.max(q0,q1)+R+0.3;if(x>ax&&x<bx&&z>az&&z<bz){ok=false;break}}
        if(ok&&Math.abs(z-652)<10.5&&Math.abs(x)<130)ok=false;
        if(ok&&run===null)run=t;else if(!ok)end(t)}end(b)}}
  // over the cross street's sidewalk, and the ramp up to it from the side street
  for(const [x,z0,z1,d] of SUB_APRONS){subSheet(asph,x-R,x+R,z0,z1,0.185,1);walkPad(x,(z0+z1)/2,R,(z1-z0)/2,0,0,{l:0.185});
    const r0=d<0?z0-2.2:z1,r1=d<0?z0:z1+2.2,L=(xx,z)=>d<0?0.04+0.145*(z-r0)/2.2:0.185-0.145*(z-r0)/2.2;subSheet(asph,x-R,x+R,r0,r1,L,0.55);
    walkPad(x,(r0+r1)/2,R,1.1,0,0,{l:d<0?0.04:0.185,rise:d<0?0.145:-0.145})}}
// ---------- a house ----------
// in its own frame: o out toward the street (f looks along it), s across. kind: col (two storeys and a porch), cape
// (a storey and a half, dormers, a stoop), ranch (one storey, its garage at one end)
const SUB_SIDING=['sidingW','sidingG','sidingB','sidingR','sidingW','sidingG'],SUB_DOOR=[0x7e1f1f,0x1f3a5f,0x23402f,0x2b2d2f,0xb98b2e],SUB_SHUT=[0x1f2a24,0x2b2d2f,0x1f3a5f,0x5a2a22];
function subHouse(K,x,z,f,kind,u){const W=kind==='ranch'?13:kind==='cape'?9.6:10.4,D=kind==='ranch'?8.6:8.2,n=kind==='col'?2:1,Hs=2.8,Rr=kind==='cape'?3.6:kind==='ranch'?1.7:2.4;
  const yF=rmGroundMax(x,z,f,W+1,D+1)+0.45,R=rmKit(K,x,z,yF,f),sf=Math.sin(f),cf=Math.cos(f),wl=SUB_SIDING[Math.floor(u*97)%SUB_SIDING.length],
    WH=0xf4f3ef,door=SUB_DOOR[Math.floor(u*53)%SUB_DOOR.length],shut=SUB_SHUT[Math.floor(u*31)%SUB_SHUT.length],roof=u>0.5?'shingles':'roofG',HT=Hs*n;
  // foundation, corner boards, the band between floors (the walls go up once the windows and door are known)
  R.box(W+0.08,1.4,D+0.08,'concOld',0,0,-1.4);if(n>1)R.box(W,HT-Hs,D,wl,0,0,Hs);
  for(const o of [-1,1])for(const s of [-1,1])R.box(0.14,HT,0.14,WH,o*(D/2+0.01),s*(W/2+0.01),0);if(n>1)R.box(W+0.06,0.12,D+0.06,WH,0,0,Hs);
  // the gable roof, its ridge along the street; fascia boards; a brick chimney at one end
  {const P=R.P(0,0);K.geo(famGable(D,Rr,W),wl,P[0],yF+HT,P[1],f);const hd=D/2+0.4,a=Math.atan2(Rr,D/2),L=hd/Math.cos(a);
    for(const t of [-1,1]){const [px,pz]=R.P(t*hd/2,0);K.box(W+0.7,0.14,L,roof,px,yF+HT+Rr-(hd/2)*Math.tan(a)+0.07,pz,f,t*a);const [bx,bz]=R.P(t*(hd-0.02),0);K.box(W+0.7,0.2,0.05,WH,bx,yF+HT+Rr-hd*Math.tan(a)-0.02,bz,f)}
    const [rx,rz]=R.P(0,0);K.box(W+0.72,0.12,0.24,0x3a3a38,rx,yF+HT+Rr+0.1,rz,f);
    const cs=(u>0.3?1:-1)*(W/2-0.75);R.box(0.85,HT+Rr+1.4,0.75,'brick',-D*0.12,cs,-0.3);R.box(1.0,0.12,0.9,0x6b6a64,-D*0.12,cs,HT+Rr+1.1)}
  // windows: its glass, white casing and sill, shutters; upstairs and in the garage a pane onto a lit room, downstairs a
  // hole in the wall onto the real one (holes: front and each side's, for the walls)
  const holes={f:[],[-1]:[],[1]:[]},S1=kind==='ranch'?W/2-4.05:W/2;
  const win=(o,s,y,yaw,w,h,sh,hole)=>{const [px,pz]=R.P(o,s),fx=Math.sin(yaw),fz=Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
    if(hole&&y<Hs)hole.push({m:hole===holes.f?s:o,w,y0:y-h/2,y1:y+h/2});else rmWinAdd(px+fx*0.012,yF+y,pz+fz*0.012,yaw,w,h);K.box(w,h,0.02,'glass',px+fx*0.04,yF+y,pz+fz*0.04,yaw);
    for(const t of [-1,1]){K.box(0.09,h+0.18,0.08,WH,px+fx*0.05+rx*t*(w/2+0.045),yF+y,pz+fz*0.05+rz*t*(w/2+0.045),yaw);K.box(w+0.18,0.09,0.08,WH,px+fx*0.05,yF+y+t*(h/2+0.045),pz+fz*0.05,yaw)}
    K.box(0.04,h,0.05,WH,px+fx*0.05,yF+y,pz+fz*0.05,yaw);K.box(w,0.04,0.05,WH,px+fx*0.05,yF+y+h*0.08,pz+fz*0.05,yaw);
    if(sh)for(const t of [-1,1])K.box(w*0.5,h+0.1,0.05,shut,px+fx*0.04+rx*t*(w*0.75+0.12),yF+y,pz+fz*0.04+rz*t*(w*0.75+0.12),yaw)};
  const front=(s,y,w,h)=>win(D/2,s,y,f,w,h,1,holes.f),side=(t,o,y)=>win(o,t*W/2,y,f+t*Math.PI/2,0.9,1.3,0,t>0&&kind==='ranch'?null:holes[t]);
  const ds=kind==='ranch'?-W/2+3.4:0,gs=W/2-2.1;
  if(kind==='col'){for(const s of [-3.3,-1.9,1.9,3.3])front(s,1.45,0.9,1.45);for(const s of [-3.6,-1.8,0,1.8,3.6])front(s,Hs+1.45,0.9,1.35)}
  else if(kind==='cape'){for(const s of [-2.8,-1.6,1.6,2.8])front(s,1.45,0.9,1.4);
    // dormers through the roof: a little gable each with its window
    for(const s of [-2.2,2.2]){const o=D/2-1.25,[px,pz]=R.P(o,s);K.box(1.5,1.8,1.6,wl,px,yF+HT+1.15,pz,f);K.geo(famGable(1.8,0.7,1.7),roof,px,yF+HT+2.05,pz,f+Math.PI/2);
      win(o+0.8,s,HT+1.25,f,0.75,0.95,0)}}
  else{for(const s of [-5.6,-1.0,0.4])front(s,1.5,1.2,1.2);
    // the garage: its door of panels, a lamp each side
    const [gx,gz]=R.P(D/2+0.03,gs);K.box(3.6,2.3,0.06,WH,gx,yF-0.2+1.15,gz,f);for(let k=1;k<4;k++)K.box(3.5,0.03,0.08,0xd8d6cf,gx,yF-0.2+k*0.575,gz,f);
    for(const t of [-1,1]){const [lx,lz]=R.P(D/2+0.06,gs+t*2.1);K.lit(new THREE.BoxGeometry(0.12,0.22,0.1),0xffe2a8,lx,yF+2.2,lz,f)}}
  for(const t of [-1,1])for(const o of [-D/4,D/4])side(t,o,1.45);if(n>1)for(const t of [-1,1])side(t,0,Hs+1.45);if(kind==='cape')for(const t of [-1,1])side(t,0,HT+1.3);
  // the door with its casing and a lamp; a porch (col) or a stoop, and the steps down to the walk
  // the walls: siding outside, paint inside, holes for the windows and the front door (it swings in as the worker comes
  // up: rmDoor, interiors.js); a ranch's garage stays a solid block at its end. Inside, its rooms (rmHome)
  {const T=0.18,inn=[0xeee7da,0xe3e8e4,0xefe4d6,0xe6e4ee,0xf2efe6][Math.floor(u*41)%5];
    rmWall(R,'s',D/2,-1,-W/2,S1,T,Hs,wl,inn,[...holes.f,{m:ds,w:1.04,y0:0,y1:2.12}]);rmWall(R,'s',-D/2,1,-W/2,S1,T,Hs,wl,inn,[]);
    rmWall(R,'o',-W/2,1,-D/2+T,D/2-T,T,Hs,wl,inn,holes[-1]);
    if(S1<W/2){R.box(W/2-S1,HT,D,wl,0,(S1+W/2)/2,0);R.solid(0,(S1+W/2)/2,W/2-S1,D);rmWall(R,'o',S1,-1,-D/2+T,D/2-T,0.04,Hs,inn,inn,[])}
    else rmWall(R,'o',W/2,-1,-D/2+T,D/2-T,T,Hs,wl,inn,holes[1]);
    const sa=-W/2+T,sb=S1-(S1<W/2?0.04:T),[px,pz]=R.P(0,(sa+sb)/2),cs=(u>0.3?1:-1)*(W/2-0.75);R.solid(-D*0.12,cs,0.85,0.75);
    walkPad(px,pz,(sb-sa)/2,D/2-T,f,yF+0.03);rmHome(R,{s0:sa,s1:sb,o0:-D/2+T,o1:D/2-T,H:Hs,cs,co:-D*0.12,stairs:n>1,u,inn});
    {const c=Math.abs(cf),s=Math.abs(sf);SOLIDS.push({x,z,hx:(c*W+s*D)/2+0.05,hz:(s*W+c*D)/2+0.05,foot:1})}const [hx,hz]=R.P(D/2-0.06,ds-0.5);rmDoor('house'+door,hx,yF+0.03,hz,f,1.0);if(R.spots.length)rmAdd(R,Math.max(W,D)/2).home=1}
  {    for(const t of [-1,1]){const [cx,cz]=R.P(D/2+0.05,ds+t*0.6);K.box(0.12,2.25,0.08,WH,cx,yF+1.12,cz,f)}const [hx,hz]=R.P(D/2+0.05,ds);K.box(1.34,0.14,0.1,WH,hx,yF+2.2,hz,f);
    const [lx,lz]=R.P(D/2+0.1,ds+0.85);K.lit(new THREE.BoxGeometry(0.14,0.24,0.12),0xffe2a8,lx,yF+1.8,lz,f)}
  const pw=kind==='col'?W-1.6:2.2,pd=kind==='col'?2.2:1.4,po=D/2+pd/2;
  R.box(pw,0.16,pd,'deckG',po,ds,-0.16);{const [px,pz]=R.P(po,ds);walkPad(px,pz,Math.abs(cf)*pw/2+Math.abs(sf)*pd/2,Math.abs(sf)*pw/2+Math.abs(cf)*pd/2,0,yF)}
  if(kind==='col'){for(const s of [-pw/2+0.15,-1.1,1.1,pw/2-0.15]){R.box(0.2,2.6,0.2,WH,D/2+pd-0.15,s,0);const [cx,cz]=R.P(D/2+pd-0.15,s);SOLIDS.push({x:cx,z:cz,hx:0.12,hz:0.12})}
    const [rx,rz]=R.P(D/2+pd/2+0.1,0);K.box(pw+0.4,0.12,pd+0.5,roof,rx,yF+2.72,rz,f,0.12);R.box(pw+0.3,0.22,0.08,WH,D/2+pd+0.12,0,2.5);
    for(const t of [-1,1]){const s0=t*1.1,s1=t*(pw/2-0.15),m=(s0+s1)/2,l=Math.abs(s1-s0);R.box(l,0.07,0.07,WH,D/2+pd-0.15,m,0.9);R.box(l,0.05,0.05,WH,D/2+pd-0.15,m,0.12);
      for(let k=0.15;k<l;k+=0.16)R.box(0.04,0.78,0.04,WH,D/2+pd-0.15,s0+t*k,0.12)}}
  const ns=3,g0=baseHeight(...R.P(D/2+pd+0.5*ns,ds)),rise=(yF-g0)/(ns+1);
  for(let k=1;k<=ns;k++){const top=yF-rise*k,o=D/2+pd+(k-0.5)*0.3,[sx,sz]=R.P(o,ds);K.box(1.6,Math.max(0.05,top-g0+0.1),0.3,'concOld',sx,(top+g0-0.1)/2,sz,f);
    walkPad(sx,sz,Math.abs(cf)*0.8+Math.abs(sf)*0.15,Math.abs(sf)*0.8+Math.abs(cf)*0.15,0,top)}
  // shrubs along the front, clear of the steps and the porch
  for(const s of [-W/2+0.6,-W/2+1.5,W/2-1.5,W/2-0.6]){if(kind==='col'&&Math.abs(s)<pw/2+0.3||kind==='ranch'&&Math.abs(s-gs)<2.1||Math.abs(s-ds)<1.3)continue;
    const [bx,bz]=R.P(D/2+(kind==='col'?pd+0.6:0.55),s),r=0.45+0.15*((s*7+u*10)%1+1)%1;K.geo(new THREE.IcosahedronGeometry(r,1),[0x2f5a2a,0x3d6b2f,0x4a7a36][Math.floor(u*7+s)&1?1:2],bx,baseHeight(bx,bz)+r*0.75,bz)}
  return {W,D,ds,gs,kind,yF,pd}}
// ---------- lots along every street ----------
function subLots(){const H=famKit(),FN=famKit(),trees=[],conc=shopLib('concrete'),R=SUB.RW/2,PL=R+SUB.GS+SUB.SW;let k=0;
  for(const [x0,z0,x1,z1] of SUB_STREETS){const alongZ=x0===x1,a=Math.min(alongZ?z0:x0,alongZ?z1:x1),b=Math.max(alongZ?z0:x0,alongZ?z1:x1),c=alongZ?x0:z0;
    for(const sd of [-1,1])for(let t=a+9;t<=b-8;t+=1){
      const u=hash(c*0.37+sd*3.1+t*0.011,t*0.53+c*0.019),kind=u<0.42?'col':u<0.72?'cape':'ranch',W=kind==='ranch'?13:kind==='cape'?9.6:10.4,D=kind==='ranch'?8.6:8.2,FW=W+7,set=4.5+u*1.5,
        depth=set+D+3.8,near=c+sd*PL,far=c+sd*(PL+depth),q0=Math.min(near,far),q1=Math.max(near,far);
      const [lx0,lx1,lz0,lz1]=alongZ?[q0,q1,t-FW/2,t+FW/2]:[t-FW/2,t+FW/2,q0,q1];if(!subFits(lx0,lx1,lz0,lz1))continue;
      SUB.lots.push([lx0,lx1,lz0,lz1]);SUB.houses++;
      // the house faces the street: o toward it, s along it (the driveway on the side away from the next lot's)
      const f=alongZ?(sd<0?Math.PI/2:-Math.PI/2):(sd<0?0:Math.PI),dist=PL+set+D/2,hx=alongZ?c+sd*dist:t,hz=alongZ?t:c+sd*dist;
      const h=subHouse(H,hx,hz,f,kind,u),P=(o,s)=>[hx+Math.sin(f)*o+Math.cos(f)*s,hz+Math.cos(f)*o-Math.sin(f)*s];
      // the driveway (to the garage, or beside the house), its car; the front walk; the mailbox; yard trees; a back fence
      const dsd=kind==='ranch'?h.gs:(u*13%1<0.5?1:-1)*(W/2+1.95),edge=D/2+set+SUB.SW+SUB.GS,dEnd=kind==='ranch'?D/2:-D/2+1;
      {const A=P(dEnd,dsd-1.5),B=P(edge,dsd+1.5);const x0=Math.min(A[0],B[0]),x1=Math.max(A[0],B[0]),z0=Math.min(A[1],B[1]),z1=Math.max(A[1],B[1]);
        subSheet(conc,x0,x1,z0,z1,0.06,1.5);walkPad((x0+x1)/2,(z0+z1)/2,(x1-x0)/2,(z1-z0)/2,0,0,{l:0.06})}
      {const [cx,cz]=P(kind==='ranch'?D/2+3.2:D/2+1.6,dsd);TF_PARKED.push({x:cx,y:baseHeight(cx,cz)+0.06,z:cz,yaw:f+Math.PI})}
      if(u*7%1<0.4){const [qx,qz]=P(D/2+set+SUB.SW+SUB.GS+1.15,-dsd*0.25);TF_PARKED.push({x:qx,y:baseHeight(qx,qz)+0.04,z:qz,yaw:f+Math.PI/2})}
      {const w0=D/2+h.pd+0.9,A=P(w0,h.ds-0.55),B=P(D/2+set,h.ds+0.55);const x0=Math.min(A[0],B[0]),x1=Math.max(A[0],B[0]),z0=Math.min(A[1],B[1]),z1=Math.max(A[1],B[1]);
        subSheet(conc,x0,x1,z0,z1,0.07,1);walkPad((x0+x1)/2,(z0+z1)/2,(x1-x0)/2,(z1-z0)/2,0,0,{l:0.07})}
      {const [mx,mz]=P(edge+0.35,dsd-(dsd>0?1.9:-1.9)),y=baseHeight(mx,mz);FN.box(0.08,1.1,0.08,0x5c4632,mx,y+0.55,mz);FN.box(0.22,0.22,0.48,[0x2b2d2f,0x1f3a5f,0x5a2a22][k%3],mx,y+1.15,mz,f+Math.PI/2);SOLIDS.push({x:mx,z:mz,hx:0.12,hz:0.12})}
      {const [tx,tz]=P(D/2+set*0.8,-Math.sign(dsd||1)*(W/2+1.2));trees.push(treeEntry('leafy',tx,tz,u*6.3,0.6+u*0.25,k%6));
        if(u>0.5){const [bx,bz]=P(-D/2-2.4,(u-0.5)*W);trees.push(treeEntry('pine',bx,bz,u*3.1,0.6+u*0.2,(k+2)%6))}}
      if(u*11%1<0.7){const back=-D/2-3.6,sides=FW/2-0.3,pts=[[-D/2+0.2,-sides],[back,-sides],[back,sides],[-D/2+0.2,sides]];
        for(let i=0;i<3;i++){const [ao,as]=pts[i],[bo,bs]=pts[i+1],A=P(ao,as),B=P(bo,bs),L=Math.hypot(B[0]-A[0],B[1]-A[1]),ry=Math.atan2(B[0]-A[0],B[1]-A[1]);
          for(let j=0;j<Math.ceil(L/2.4);j++){const t0=j/Math.ceil(L/2.4),t1=(j+1)/Math.ceil(L/2.4),mx=A[0]+(B[0]-A[0])*(t0+t1)/2,mz=A[1]+(B[1]-A[1])*(t0+t1)/2,y=baseHeight(mx,mz);
            FN.box(0.04,1.7,L/Math.ceil(L/2.4)+0.02,0x8a6a4a,mx,y+0.85,mz,ry);const px=A[0]+(B[0]-A[0])*t0,pz=A[1]+(B[1]-A[1])*t0;FN.box(0.1,1.8,0.1,0x6b5038,px,baseHeight(px,pz)+0.9,pz)}
          SOLIDS.push({x:(A[0]+B[0])/2,z:(A[1]+B[1])/2,hx:Math.abs(B[0]-A[0])/2+0.06,hz:Math.abs(B[1]-A[1])/2+0.06})}}
      k++;t+=FW-1}}
  famAdd(H);famAdd(FN);return trees}
// ---------- the woods round it all: thickening from the back yards out to the edges of the mainland's ground ----------
function subWoods(trees){let sd=91;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647},pts=[],T=famKit();
  const free=(x,z,r)=>{if(baseHeight(x,z)-WATER<1.6)return false;for(const [a,b,c,d] of SUB_KEEP)if(x>a-r&&x<b+r&&z>c-r&&z<d+r)return false;
    if(Math.abs(roadOff(x,z))<ROAD_W/2+r)return false;for(const s of SOLIDS)if(Math.abs(x-s.x)<s.hx+r&&Math.abs(z-s.z)<s.hz+r)return false;
    for(const [x0,z0,x1,z1] of SUB_STREETS)if(x>Math.min(x0,x1)-5.5-r&&x<Math.max(x0,x1)+5.5+r&&z>Math.min(z0,z1)-5.5-r&&z<Math.max(z0,z1)+5.5+r)return false;
    for(const L of SUB.lots)if(x>L[0]+1&&x<L[1]-1&&z>L[2]+1&&z<L[3]-1)return false;return true};
  // how thick the woods are: open round town, thick past the last streets and toward the edge of the ground
  const dens=(x,z)=>{const e=Math.max((Math.abs(x)-150)/40,(z-745)/15,0);return Math.min(1,0.08+e*0.9)};
  const cell=new Map();
  for(let g=0;g<36000&&pts.length<1900;g++){const x=-430+rnd()*860,z=588+rnd()*188;if(z>fhZ(x)-4||rnd()>dens(x,z))continue;const ci=Math.floor(x/4),cj=Math.floor(z/4);let hit=false;for(let a=-1;a<=1&&!hit;a++)for(let b=-1;b<=1&&!hit;b++)for(const p of cell.get((ci+a)*4096+cj+b)||[])if((p[0]-x)**2+(p[1]-z)**2<12){hit=true;break}
    if(hit||!free(x,z,2.6))continue;pts.push([x,z]);const k=ci*4096+cj;if(!cell.has(k))cell.set(k,[]);cell.get(k).push([x,z])}
  for(const [x,z] of pts){const pine=rnd()<(Math.abs(x)>170||z>748?0.55:0.3);trees.push(treeEntry(pine?'pine':'leafy',x,z,rnd()*6.3,0.75+rnd()*0.6,(rnd()*6)|0))}
  // thickets and young growth along the woods' edge
  let nb=0;for(let g=0;g<5000&&nb<400;g++){const x=-260+rnd()*520,z=592+rnd()*180,d=dens(x,z);if(d<0.25||d>0.9||rnd()>0.5)continue;if(!free(x,z,1.2))continue;
    nb++;const r=0.5+rnd()*0.7;T.geo(new THREE.IcosahedronGeometry(r,1),[0x2f5a2a,0x3d6b2f,0x4a6a30,0x55703a][(rnd()*4)|0],x,baseHeight(x,z)+r*0.6,z,rnd()*6)}
  famAdd(T);return trees}
// build it all: the streets, the houses on their lots, the woods; then their windows
(function(){subPave();const trees=subLots();treeGroup('suburbs',subWoods(trees));SUBK.add();rmWinsBuild()})();
