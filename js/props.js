// Corley's Island: things to place in the map editor (Add tool): houses, a shed, a garage, fences, gates, light towers,
// cones, barrels, pallets, a porta-potty, signs, benches, a picnic table and a dumpster. They are entries in the
// editor's asset list (scenery.js), {t: kind, x, z, yaw, s: size, c: colour}, saved with the map (bhd_map) like the
// trees, so they sync between devices. Each kind is one low-poly, flat-shaded model drawn as one InstancedMesh, so a
// hundred fence sections cost one draw. They stand on surfAt() ground (blocks count), follow the editor's ground edits
// (edRefresh rebuilds the assets), and the solid ones are turned boxes in SOLIDS (terrain.js) that stop the machines
// and the worker. The front of each is its +z side; Turn spins it about its middle.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// n: name; w, d: footprint in metres (x across, z front to back) at size 100%; cap: most of that kind; solid: blocks
// machines and the worker (with the solid box's half sizes, if not the footprint); deep: a footing below the ground, so
// it sits on the highest ground under it and a slope never shows a gap; tint: takes the house colours; cat: its group in the
// editor's Things library (ED_KIND_CATS, editor.js)
const PROPS={
  house:{n:'House',cat:1,w:8,d:6.5,cap:40,solid:1,deep:1,tint:1},
  shed:{n:'Shed',cat:1,w:3,d:2.4,cap:60,solid:1,deep:1,tint:1},
  garage:{n:'Garage',cat:1,w:6.6,d:6.6,cap:40,solid:1,deep:1,tint:1},
  fence:{n:'Fence (8 ft)',cat:2,w:2.44,d:0.15,cap:600,solid:[1.22,0.07],deep:1},
  gate:{n:'Farm gate',cat:2,w:3.66,d:0.15,cap:120,solid:[1.83,0.07],deep:1},
  light:{n:'Light tower',cat:3,w:1.6,d:2.8,cap:40,solid:1},
  cone:{n:'Cone',cat:3,w:0.36,d:0.36,cap:400},
  barrel:{n:'Barrel',cat:3,w:0.6,d:0.6,cap:300,solid:[0.3,0.3]},
  pallet:{n:'Pallet',cat:3,w:1.22,d:1.02,cap:300},
  potty:{n:'Porta-potty',cat:3,w:1.12,d:1.12,cap:40,solid:1},
  sign:{n:'Sign',cat:3,w:0.9,d:0.12,cap:200,solid:[0.08,0.08]},
  bench:{n:'Bench',cat:4,w:1.8,d:0.6,cap:120,solid:1},
  picnic:{n:'Picnic table',cat:4,w:1.8,d:1.6,cap:80,solid:1},
  dumpster:{n:'Dumpster',cat:3,w:2.0,d:1.8,cap:60,solid:1,deep:1}};
// house colours (the walls take them; everything else on the model is tinted slightly with them)
const PROP_TINT=[[1,1,1],[1,0.93,0.8],[0.82,0.9,1],[0.86,0.96,0.82],[1,0.84,0.78],[0.9,0.88,0.86]];
const propIMs={};
// ---------- the models ----------
// a model from parts: boxes, cylinders and gable roofs, each one colour, merged into one geometry with vertex colours
function propModel(fn){const parts=[],c3=h=>new THREE.Color(h);
  const put=(g,col,x,y,z,rx,ry,rz)=>{g=g.index?g.toNonIndexed():g;g.rotateX(rx||0);g.rotateZ(rz||0);g.rotateY(ry||0);g.translate(x,y,z);
    const c=c3(col),n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}
    g.setAttribute('color',new THREE.BufferAttribute(a,3));parts.push(g)};
  const B={box:(w,h,d,col,x,y,z,rx,ry,rz)=>put(new THREE.BoxGeometry(w,h,d),col,x,y,z,rx,ry,rz),
    cyl:(rt,rb,h,seg,col,x,y,z,rx,ry,rz)=>put(new THREE.CylinderGeometry(rt,rb,h,seg),col,x,y,z,rx,ry,rz),
    // a gable roof along x: len long, w across, h from eaves to ridge, its eaves at y
    gable:(len,w,h,col,x,y,z,ry)=>{const L=len/2,W=w/2,v=[[-L,0,-W],[L,0,-W],[L,h,0],[-L,0,-W],[L,h,0],[-L,h,0],[-L,0,W],[-L,h,0],[L,h,0],[-L,0,W],[L,h,0],[L,0,W],
        [-L,0,-W],[-L,h,0],[-L,0,W],[L,0,-W],[L,0,W],[L,h,0],[-L,0,-W],[-L,0,W],[L,0,W],[-L,0,-W],[L,0,W],[L,0,-W]],g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(v.map((q,i)=>v[i-i%3+[0,2,1][i%3]]).flat()),3));g.computeVertexNormals();put(g,col,x,y,z,0,ry||0,0)}};
  fn(B);let n=0;for(const g of parts)n+=g.attributes.position.count;
  const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
  for(const g of parts){P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);C.set(g.attributes.color.array,o*3);o+=g.attributes.position.count}
  const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(P,3));m.setAttribute('normal',new THREE.BufferAttribute(N,3));m.setAttribute('color',new THREE.BufferAttribute(C,3));
  return m}
const PROP_MODELS={
  house:B=>{B.box(8.2,0.9,6.7,0x8d8a84,0,-0.15,0);B.box(8,2.8,6.5,0xece6da,0,1.7,0);B.gable(8.8,7.4,2.1,0x5a4a44,0,3.1,0);
    B.box(0.6,1.6,0.6,0x9a5a44,2.4,4.1,-1.2);B.box(1,2.1,0.08,0x7a4a2c,-1.2,1.35,3.26);B.box(1.5,0.12,1.2,0x8d8a84,-1.2,0.32,3.8);
    for(const x of [1,2.8])B.box(1.2,1.1,0.08,0x9ec4d8,x,1.95,3.26);for(const x of [-2.6,0,2.6])B.box(1.2,1.1,0.08,0x9ec4d8,x,1.95,-3.26);
    for(const z of [-1.5,1.5]){B.box(0.08,1.1,1.2,0x9ec4d8,4.01,1.95,z);B.box(0.08,1.1,1.2,0x9ec4d8,-4.01,1.95,z)}},
  shed:B=>{B.box(3.1,0.6,2.5,0x8d8a84,0,-0.2,0);B.box(3,2.1,2.4,0xc9a27a,0,1.15,0);B.gable(3.4,2.9,0.9,0x6a3a2c,0,2.2,0);
    B.box(1.4,1.8,0.06,0x8a6a4a,0,1.0,1.22);B.box(0.05,1.8,0.08,0x5a4030,0,1.0,1.26);B.box(0.6,0.5,0.06,0x9ec4d8,0,1.7,-1.22)},
  garage:B=>{B.box(6.8,0.8,6.8,0x8d8a84,0,-0.2,0);B.box(6.6,2.7,6.6,0xe4ddd0,0,1.55,0);B.gable(7.2,7.2,1.6,0x4a4a4e,0,2.9,0,Math.PI/2);
    B.box(4.8,2.2,0.08,0xf4f4f0,0,1.3,3.31);for(let k=1;k<4;k++)B.box(4.8,0.04,0.1,0xc8c8c4,0,0.2+k*0.55,3.33);B.box(0.9,2.0,0.08,0x7a4a2c,-3.31,1.2,1.6,0,Math.PI/2,0)},
  fence:B=>{for(const x of [-1.17,1.17])B.box(0.1,1.6,0.1,0xf2efe8,x,0.5,0);for(const y of [0.35,0.85])B.box(2.44,0.08,0.05,0xf2efe8,0,y,-0.03);
    for(let k=0;k<10;k++)B.box(0.09,1.0-0.02*(k%2),0.025,0xf6f3ec,-1.02+k*0.227,0.55,0.02)},
  gate:B=>{for(const x of [-1.86,1.86])B.box(0.14,1.9,0.14,0x6a5a4a,x,0.55,0);for(let k=0;k<5;k++)B.box(3.5,0.05,0.05,0xa8b0b4,0,0.2+k*0.24,0);
    for(const x of [-1.75,1.75])B.box(0.05,1.05,0.05,0xa8b0b4,x,0.66,0);B.box(3.65,0.05,0.05,0xa8b0b4,0,0.66,0,0,0,0.29)},
  light:B=>{B.box(1.0,0.5,2.2,0xe8b51a,0,0.75,0);B.box(0.7,0.08,0.7,0x3a3a3a,0,0.5,-1.5);for(const x of [-0.62,0.62])B.cyl(0.3,0.3,0.2,10,0x222222,x,0.3,0.2,0,0,Math.PI/2);
    B.box(0.1,0.1,1.2,0x5a5a5a,0,0.55,1.5);for(const x of [-0.75,0.75])for(const z of [-0.9,0.9]){B.box(0.7,0.08,0.08,0xe8b51a,x*0.6,0.6,z);B.box(0.12,0.62,0.12,0x5a5a5a,x,0.31,z)}
    B.cyl(0.07,0.1,6.4,6,0xc8c8c8,0,4.2,-0.4);B.box(1.5,0.12,0.12,0xc8c8c8,0,7.3,-0.4);
    for(const x of [-0.55,-0.18,0.18,0.55]){B.box(0.32,0.32,0.18,0x3a3a3a,x,7.55,-0.38);B.box(0.26,0.26,0.03,0xfff6c8,x,7.55,-0.28)}},
  cone:B=>{B.box(0.36,0.04,0.36,0x222222,0,0.02,0);B.cyl(0.035,0.16,0.66,8,0xf26a1b,0,0.37,0);B.cyl(0.085,0.11,0.1,8,0xf4f4f4,0,0.42,0)},
  barrel:B=>{B.cyl(0.29,0.29,0.88,10,0x2d5aa0,0,0.44,0);for(const y of [0.3,0.6])B.cyl(0.3,0.3,0.03,10,0x23477e,0,y,0);B.cyl(0.27,0.27,0.02,10,0x3a6ab0,0,0.885,0)},
  pallet:B=>{for(const x of [-0.56,0,0.56])B.box(0.1,0.09,1.02,0xa98a5e,x,0.045,0);for(let k=0;k<7;k++)B.box(1.22,0.02,0.1,0xc4a272,0,0.1,-0.46+k*0.153)},
  potty:B=>{B.box(1.1,2.1,1.1,0x2f6fb8,0,1.05,0);B.box(1.16,0.12,1.16,0xf0f0f0,0,2.16,0);B.box(0.9,0.14,0.9,0xf0f0f0,0,2.28,0);B.box(0.8,1.85,0.04,0x285f9e,0,1.0,0.56);
    B.box(0.06,0.25,0.05,0xdddddd,0.3,1.0,0.59);B.box(1.12,0.08,1.12,0x2a2a2a,0,0.04,0)},
  sign:B=>{B.box(0.08,2.1,0.08,0x9a9a9a,0,1.05,0);B.box(0.82,0.82,0.04,0xf26a1b,0,1.75,0.06,0,0,Math.PI/4);B.box(0.55,0.08,0.042,0x1a1a1a,0,1.78,0.07);B.box(0.4,0.08,0.042,0x1a1a1a,0,1.63,0.07)},
  bench:B=>{for(const z of [-0.12,0,0.12])B.box(1.8,0.04,0.1,0x9a6a3c,0,0.45,z+0.05);for(const y of [0.65,0.8])B.box(1.8,0.1,0.03,0x9a6a3c,0,y,-0.15);
    for(const x of [-0.75,0.75]){B.box(0.06,0.45,0.4,0x3a3a3a,x,0.22,0.05);B.box(0.06,0.5,0.05,0x3a3a3a,x,0.65,-0.17)}},
  picnic:B=>{B.box(1.8,0.05,0.75,0xa6743e,0,0.76,0);for(const z of [-0.6,0.6])B.box(1.8,0.05,0.28,0xa6743e,0,0.45,z);
    for(const x of [-0.7,0.7]){for(const s of [-1,1])B.box(0.07,0.95,0.09,0x8a5e30,x,0.38,s*0.28,s*0.62,0,0);B.box(0.07,0.07,1.5,0x8a5e30,x,0.42,0)}},
  dumpster:B=>{B.box(2.0,1.25,1.6,0x2f6a3a,0,0.78,0);B.box(2.06,0.1,1.66,0x285a32,0,1.4,0);B.box(2.0,0.06,0.9,0x1e1e1e,0,1.5,-0.38,-0.12,0,0);B.box(2.0,0.06,0.9,0x1e1e1e,0,1.47,0.42,0.12,0,0);
    for(const x of [-0.7,0.7])B.box(0.3,0.18,1.7,0x285a32,x,0.5,0);for(const x of [-0.85,0.85])for(const z of [-0.65,0.65])B.cyl(0.06,0.06,0.15,6,0x222222,x,0.08,z)}};
{const mt=M(0xffffff,{vertexColors:true});
  for(const k in PROPS){const im=new THREE.InstancedMesh(propModel(PROP_MODELS[k]),mt,PROPS[k].cap);
    im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(PROPS[k].cap*3),3);
    im.castShadow=im.receiveShadow=true;im.frustumCulled=false;im.count=0;im.visible=false;scene.add(im);propIMs[k]=im}}
// ---------- placing ----------
// a thing's footprint corners and middle, turned and sized, as [x, z] points
function propPts(a){const p=PROPS[a.t],hw=p.w/2*a.s,hd=p.d/2*a.s,c=Math.cos(a.yaw),s=Math.sin(a.yaw),out=[[a.x,a.z]];
  for(const [u,v] of [[-hw,-hd],[hw,-hd],[-hw,hd],[hw,hd]])out.push([a.x+u*c+v*s,a.z-u*s+v*c]);return out}
// the ground it stands on: the highest under its footprint for ones with a footing, else under its middle
function propY(a){const P=PROPS[a.t];if(!P.deep)return surfAt(a.x,a.z);let y=-1e9;for(const [x,z] of propPts(a))y=Math.max(y,surfAt(x,z));return y}
// the instances and the solid boxes from the asset list; assetsBuild (scenery.js) calls it after every change
function propsBuild(){const o=new THREE.Object3D(),col=new THREE.Color(),n={};
  for(let i=SOLIDS.length-1;i>=0;i--)if(SOLIDS[i].prop)SOLIDS.splice(i,1);
  for(const k in PROPS)n[k]=0;
  for(const a of assets){const P=PROPS[a.t];if(!P||n[a.t]>=P.cap)continue;const im=propIMs[a.t],i=n[a.t]++;
    o.position.set(a.x,propY(a),a.z);o.rotation.set(0,a.yaw,0);o.scale.setScalar(a.s);o.updateMatrix();im.setMatrixAt(i,o.matrix);
    const t=P.tint?PROP_TINT[(a.c|0)%PROP_TINT.length]:[1,1,1];im.setColorAt(i,col.setRGB(t[0],t[1],t[2]));
    if(P.solid){const [lx,lz]=Array.isArray(P.solid)?P.solid:[P.w/2,P.d/2],c=Math.cos(a.yaw),s=Math.sin(a.yaw),L=lx*a.s,Z=lz*a.s;
      SOLIDS.push({x:a.x,z:a.z,lx:L,lz:Z,cs:c,sn:s,hx:Math.abs(c)*L+Math.abs(s)*Z,hz:Math.abs(s)*L+Math.abs(c)*Z,prop:1})}}
  for(const k in PROPS){const im=propIMs[k];im.count=n[k];im.visible=n[k]>0;im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true}}
// for the editor: how near a ground point is to a thing (under 1 is on it), its ring's radius and its name
function propHit(a,x,z){const P=PROPS[a.t],c=Math.cos(a.yaw),s=Math.sin(a.yaw),dx=x-a.x,dz=z-a.z,u=dx*c-dz*s,v=dx*s+dz*c;
  return Math.max(Math.abs(u)/(P.w/2*a.s+0.4),Math.abs(v)/(P.d/2*a.s+0.4))}
const propR=a=>Math.hypot(PROPS[a.t].w,PROPS[a.t].d)/2*a.s;
const propName=a=>{const P=PROPS[a.t];return `${P.n}, ${(P.w*a.s/FT).toFixed(0)} × ${(P.d*a.s/FT).toFixed(P.d*a.s<1?1:0)} ft`};
propsBuild();
