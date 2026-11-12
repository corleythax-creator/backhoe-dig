// Corley's Island: things to place in the map editor (Add tool) or on foot (the block bar's What list): buildings,
// fencing, site gear, lights that glow after dark (street lights, lamp posts, floodlights, spotlights, path lights,
// string lights, lanterns), road and traffic gear, farm and garden things and the yard's play things. They are entries in the
// editor's asset list (scenery.js), {t: kind, x, z, yaw, s: size, c: colour}, saved with the map (bhd_map) like the
// trees, so they sync between devices. Each kind is one low-poly, flat-shaded model drawn as one InstancedMesh, so a
// hundred fence sections cost one draw. They stand on surfAt() ground (blocks count), follow the editor's ground edits
// (edRefresh rebuilds the assets), and the solid ones are turned boxes in SOLIDS (terrain.js) that stop the machines
// and the worker. The front of each is its +z side; Turn spins it about its middle.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// n: name; w, d: footprint in metres (x across, z front to back) at size 100%; cap: most of that kind; solid: blocks
// machines and the worker (with the solid box's half sizes, if not the footprint); deep: a footing below the ground, so
// it sits on the highest ground under it and a slope never shows a gap; tint: takes the house colours; cat: its group in the
// editor's Things library (ED_KIND_CATS below); run: laid end to end along a line (the editor's Line); sit: where
// townsfolk sit or stand by it, [x, z, turn from its own, 1 staff or 2 standing] on the model (Harbor Square's people use them: sqSpots)
const PROPS={
  house:{n:'House',cat:1,w:8,d:6.5,cap:40,solid:1,deep:1,tint:1},
  shed:{n:'Shed',cat:1,w:3,d:2.4,cap:60,solid:1,deep:1,tint:1},
  garage:{n:'Garage',cat:1,w:6.6,d:6.6,cap:40,solid:1,deep:1,tint:1},
  fence:{n:'Fence (8 ft)',cat:2,run:1,w:2.44,d:0.15,cap:600,solid:[1.22,0.07],deep:1},
  gate:{n:'Farm gate',cat:2,run:1,w:3.66,d:0.15,cap:120,solid:[1.83,0.07],deep:1},
  light:{n:'Light tower',cat:5,w:1.6,d:2.8,cap:40,solid:1,lamp:['tower',[[-0.55,7.55,-0.27],[-0.18,7.55,-0.27],[0.18,7.55,-0.27],[0.55,7.55,-0.27]]]},
  cone:{n:'Cone',cat:3,w:0.36,d:0.36,cap:400},
  barrel:{n:'Barrel',cat:3,w:0.6,d:0.6,cap:300,solid:[0.3,0.3]},
  pallet:{n:'Pallet',cat:3,w:1.22,d:1.02,cap:300,pad:[0.11,0.61,0.51]},
  potty:{n:'Porta-potty',cat:3,w:1.12,d:1.12,cap:40,solid:1},
  sign:{n:'Sign',cat:3,w:0.9,d:0.12,cap:200,solid:[0.08,0.08]},
  bench:{n:'Bench',cat:4,w:1.8,d:0.6,cap:120,solid:1,sit:[[-0.45,0,0],[0.45,0,0]]},
  cafe:{n:'Café table',cat:4,w:2.0,d:2.0,cap:80,solid:[0.45,0.45],sit:[0,1,2].map(i=>{const a=i*2.09+0.4,x=Math.cos(a)*0.75,z=Math.sin(a)*0.75;return [x,z,Math.atan2(-x,-z)]})},
  stall:{n:'Market stall',cat:4,w:2.8,d:2.8,cap:40,solid:[1.4,1.3],sit:[[0,-0.3,0,1],[0.5,2.2,Math.PI,2],[-0.6,2.3,Math.PI,2]]},
  picnic:{n:'Picnic table (6 ft)',cat:4,w:1.8,d:1.6,cap:80,solid:1},
  picniclong:{n:'Picnic table (8 ft)',cat:4,w:2.44,d:1.6,cap:80,solid:1},
  dumpster:{n:'Dumpster',cat:3,w:2.0,d:1.8,cap:60,solid:1,deep:1},
  // lights (lamp: its kind in LAMP_K and where its lamps are on the model)
  streetlt:{n:'Street light',cat:5,w:0.6,d:0.6,cap:120,solid:[0.15,0.15],lamp:['street',[[0,7.66,1.76]]]},
  lamp:{n:'Park lamp',cat:5,w:0.5,d:0.5,cap:150,solid:[0.12,0.12],lamp:['post',[[0,4.77,0]]]},
  lamppost:{n:'Lamp post',cat:5,w:0.5,d:0.5,cap:150,solid:[0.12,0.12],lamp:['post',[[0,3.82,0]]]},
  flood:{n:'Floodlight',cat:5,w:0.9,d:0.6,cap:80,solid:[0.12,0.12],lamp:['flood',[[-0.25,4.31,0.2],[0.25,4.31,0.2]]]},
  uplight:{n:'Ground spotlight',cat:5,w:0.3,d:0.3,cap:200,lamp:['up',[[0,0.32,0.06]]]},
  // (its id was 'bollard' at first, the same as Harbor Square's bollard below, which as the later key replaced it)
  pathlight:{n:'Path light',cat:5,w:0.3,d:0.3,cap:300,lamp:['path',[[0,0.8,0]]]},
  stringlts:{n:'String lights (20 ft)',cat:5,run:1,w:6.1,d:0.2,cap:120,lamp:['bulb',null]},
  lantern:{n:'Lantern hook',cat:5,w:0.6,d:0.3,cap:150,lamp:['lantern',[[0.35,1.55,0]]]},
  // road and traffic
  barricade:{n:'Barricade',cat:6,run:1,w:2.4,d:0.5,cap:200,solid:[1.2,0.1]},
  jersey:{n:'Jersey barrier (10 ft)',cat:6,run:1,w:3.05,d:0.6,cap:400,solid:[1.52,0.3],deep:1},
  drum:{n:'Traffic drum',cat:6,w:0.75,d:0.75,cap:400,solid:[0.3,0.3]},
  arrowbd:{n:'Arrow board',cat:6,w:2.2,d:2.8,cap:30,solid:1,lamp:['arrow',[[-0.75,2.9,-0.43],[-0.45,2.9,-0.43],[-0.15,2.9,-0.43],[0.15,2.9,-0.43],[0.45,2.9,-0.43],[0.75,2.9,-0.43],[0.5,3.12,-0.43],[0.5,2.68,-0.43],[0.27,3.3,-0.43],[0.27,2.5,-0.43]]]},
  stopsign:{n:'Stop sign',cat:6,w:0.8,d:0.1,cap:100,solid:[0.05,0.05]},
  speedsign:{n:'Speed limit sign',cat:6,w:0.65,d:0.1,cap:100,solid:[0.05,0.05]},
  hydrant:{n:'Fire hydrant',cat:6,w:0.4,d:0.4,cap:80,solid:[0.15,0.15]},
  mailbox:{n:'Mailbox',cat:6,w:0.3,d:0.5,cap:80,solid:[0.08,0.08]},
  trashcan:{n:'Trash can',cat:6,w:0.6,d:0.6,cap:150,solid:[0.28,0.28]},
  recycle:{n:'Recycling bin',cat:6,w:0.6,d:0.6,cap:150,solid:[0.28,0.28]},
  newsbox:{n:'Newspaper boxes',cat:6,w:1.05,d:0.5,cap:60,solid:[0.52,0.24]},
  aframe:{n:'Chalkboard sign',cat:6,w:0.62,d:0.56,cap:80,solid:[0.3,0.27]},
  bikerack:{n:'Bike rack with bikes',cat:6,w:2.4,d:1.8,cap:40,solid:[1.2,0.85]},
  utilbox:{n:'Utility box',cat:6,w:0.55,d:0.45,cap:80,solid:[0.27,0.22]},
  windsock:{n:'Windsock',cat:6,w:0.3,d:0.3,cap:20,solid:[0.06,0.06]},
  // site gear
  pipes:{n:'Culvert pipes',cat:3,w:1.9,d:2.4,cap:60,solid:1,deep:1},
  lumber:{n:'Lumber stack',cat:3,w:1.25,d:3.6,cap:80,solid:1,deep:1},
  sandbags:{n:'Sandbag wall',cat:3,run:1,w:1.8,d:0.5,cap:300,solid:[0.9,0.22]},
  jobbox:{n:'Job box',cat:3,w:1.25,d:0.7,cap:60,solid:1},
  genset:{n:'Generator',cat:3,w:1.4,d:0.8,cap:40,solid:1},
  container:{n:'Shipping container',cat:3,w:2.44,d:6.06,cap:30,solid:1,deep:1},
  scaffold:{n:'Scaffold tower',cat:3,w:2.1,d:1.5,cap:40,solid:1,deep:1},
  silt:{n:'Silt fence (10 ft)',cat:3,run:1,w:3.05,d:0.1,cap:400},
  tires:{n:'Tire stack',cat:3,w:1.0,d:1.0,cap:100,solid:[0.5,0.5]},
  barrow:{n:'Wheelbarrow',cat:3,w:0.7,d:1.5,cap:60},
  fuelstand:{n:'Fuel tank',cat:3,w:5.9,d:2.7,cap:20,solid:1,deep:1},
  office:{n:'Site office trailer',cat:3,w:12,d:3.4,cap:10,solid:1,deep:1},
  // farm and garden
  haybale:{n:'Round hay bale',cat:7,w:1.55,d:1.87,cap:120,solid:1},
  straw:{n:'Straw bales',cat:7,w:1.1,d:1.06,cap:200,solid:1},
  planter:{n:'Flower planter',cat:7,w:1.2,d:0.45,cap:200,solid:1},
  raisedbed:{n:'Raised garden bed',cat:7,w:2.4,d:1.2,cap:80,pad:[0.3,1.2,0.6]},
  birdbath:{n:'Bird bath',cat:7,w:0.65,d:0.65,cap:60,solid:[0.2,0.2]},
  birdhouse:{n:'Birdhouse',cat:7,w:0.3,d:0.3,cap:60,solid:[0.05,0.05]},
  arbor:{n:'Garden arbor',cat:7,w:1.5,d:0.7,cap:40},
  shrub:{n:'Shrub',cat:7,w:1.2,d:1.2,cap:400},
  hedge:{n:'Hedge (8 ft)',cat:7,run:1,w:2.44,d:0.8,cap:400,solid:[1.22,0.4]},
  flowers:{n:'Flower bed',cat:7,w:1.9,d:1.9,cap:200,pad:[0.06,0.67,0.67]},
  pumpkins:{n:'Jack-o\'-lanterns',cat:7,w:1.0,d:0.8,cap:200,lamp:['jack',[[0,0.24,0.18]]]},
  scarecrow:{n:'Scarecrow',cat:7,w:1.4,d:0.3,cap:40,solid:[0.06,0.06]},
  gnome:{n:'Garden gnome',cat:7,w:0.25,d:0.25,cap:200},
  beehive:{n:'Beehives',cat:7,w:1.4,d:0.6,cap:40,solid:1},
  well:{n:'Wishing well',cat:7,w:1.6,d:1.6,cap:20,solid:[0.75,0.75],deep:1},
  bookbox:{n:'Little free library',cat:7,w:0.65,d:0.45,cap:40,solid:[0.06,0.06]},
  coop:{n:'Chicken coop',cat:7,w:1.4,d:2.2,cap:10,solid:[0.7,0.5],deep:1},
  // the yard and play
  firepit:{n:'Fire pit',cat:4,w:1.3,d:1.3,cap:40,lamp:['fire',[[0,0.45,0]]]},
  grill:{n:'Grill',cat:4,w:1.3,d:0.55,cap:40,solid:1},
  adirondack:{n:'Adirondack chair',cat:4,w:0.8,d:0.9,cap:80,tint:1},
  hammock:{n:'Hammock',cat:4,w:3.6,d:1.0,cap:30},
  umbrella:{n:'Patio table',cat:4,w:2.6,d:2.6,cap:40,solid:[0.5,0.5]},
  gazebo:{n:'Gazebo',cat:4,w:3.6,d:3.6,cap:10,tint:1,deep:1,pad:[0.2,1.7,1.7]},
  woodpile:{n:'Firewood stack',cat:4,w:1.6,d:0.5,cap:40,solid:1},
  bollard:{n:'Bollard',cat:6,w:0.26,d:0.26,cap:300,solid:[0.12,0.12]},
  flagpole:{n:'Flag pole',cat:4,w:0.3,d:0.3,cap:40,solid:[0.06,0.06]},
  doghouse:{n:'Dog house',cat:4,w:1.0,d:1.2,cap:20,solid:1,tint:1},
  tent:{n:'Camping tent',cat:8,w:1.8,d:2.2,cap:20,solid:1},
  swing:{n:'Swing set',cat:8,w:3.2,d:1.6,cap:20},
  trampoline:{n:'Trampoline',cat:8,w:3.7,d:3.7,cap:10,pad:[0.9,1.17,1.17]},
  sandbox:{n:'Sandbox',cat:8,w:2.4,d:2.4,cap:20,pad:[0.18,1.15,1.15]},
  hoop:{n:'Basketball hoop',cat:8,w:1.8,d:1.4,cap:20,solid:[0.5,0.3]},
  goal:{n:'Soccer goal',cat:8,w:3.8,d:1.3,cap:10},
  cornhole:{n:'Cornhole board',cat:8,w:0.61,d:1.22,cap:40}};
// the Things library's groups (the editor's drawer and the block bar's What list)
const ED_KIND_CATS=['Trees and rocks','Buildings','Fencing','Site gear','Yard','Lights','Road and traffic','Farm and garden','Play','Dock and water'];
// the string lights' bulbs, hung on a sagging wire between the two poles
const STR_PTS=[...Array(11)].map((_,k)=>{const x=-2.7+k*0.54;return [x,2.82-0.55*(1-(x/2.95)**2),0]});
PROPS.stringlts.lamp[1]=STR_PTS;
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
    // a ball r across, stretched by sx, sy, sz; a ring of radius r and tube t, lying flat unless turned
    ball:(r,col,x,y,z,sx,sy,sz)=>put(new THREE.SphereGeometry(r,10,7).scale(sx||1,sy||1,sz||1),col,x,y,z),
    tor:(r,t,col,x,y,z,rx,ry,rz)=>put(new THREE.TorusGeometry(r,t,6,18),col,x,y,z,rx==null?Math.PI/2:rx,ry,rz),
    // a gable roof along x: len long, w across, h from eaves to ridge, its eaves at y
    gable:(len,w,h,col,x,y,z,ry)=>{const L=len/2,W=w/2,v=[[-L,0,-W],[L,0,-W],[L,h,0],[-L,0,-W],[L,h,0],[-L,h,0],[-L,0,W],[-L,h,0],[L,h,0],[-L,0,W],[L,h,0],[L,0,W],
        [-L,0,-W],[-L,h,0],[-L,0,W],[L,0,-W],[L,0,W],[L,h,0],[-L,0,-W],[-L,0,W],[L,0,W],[-L,0,-W],[L,0,W],[L,0,-W]],g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(v.map((q,i)=>v[i-i%3+[0,2,1][i%3]]).flat()),3));g.computeVertexNormals();put(g,col,x,y,z,0,ry||0,0)}};
  fn(B);let n=0;for(const g of parts)n+=g.attributes.position.count;
  const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
  for(const g of parts){P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);C.set(g.attributes.color.array,o*3);o+=g.attributes.position.count}
  const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(P,3));m.setAttribute('normal',new THREE.BufferAttribute(N,3));m.setAttribute('color',new THREE.BufferAttribute(C,3));
  return m}
// flower colours for the garden things
const FLW=[0xd8344a,0xf2c12e,0x8a4fc8,0xf28ab8,0xf4f4f4,0xf07a2a];
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
  picniclong:B=>{B.box(2.44,0.05,0.75,0xa6743e,0,0.76,0);for(const z of [-0.6,0.6])B.box(2.44,0.05,0.28,0xa6743e,0,0.45,z);
    for(const x of [-1.0,1.0]){for(const s of [-1,1])B.box(0.07,0.95,0.09,0x8a5e30,x,0.38,s*0.28,s*0.62,0,0);B.box(0.07,0.07,1.5,0x8a5e30,x,0.42,0)}},
  dumpster:B=>{B.box(2.0,1.25,1.6,0x2f6a3a,0,0.78,0);B.box(2.06,0.1,1.66,0x285a32,0,1.4,0);B.box(2.0,0.06,0.9,0x1e1e1e,0,1.5,-0.38,-0.12,0,0);B.box(2.0,0.06,0.9,0x1e1e1e,0,1.47,0.42,0.12,0,0);
    for(const x of [-0.7,0.7])B.box(0.3,0.18,1.7,0x285a32,x,0.5,0);for(const x of [-0.85,0.85])for(const z of [-0.65,0.65])B.cyl(0.06,0.06,0.15,6,0x222222,x,0.08,z)},
  // ---------- lights ----------
  streetlt:B=>{B.cyl(0.22,0.26,0.5,10,0x9a978f,0,0.25,0);B.cyl(0.07,0.11,7.3,10,0x8c9094,0,4.1,0);B.box(0.08,0.08,1.6,0x8c9094,0,7.82,0.75,-0.06,0,0);
    B.box(0.38,0.16,0.75,0x7d8186,0,7.78,1.76);B.box(0.3,0.03,0.56,0xfff4d8,0,7.68,1.76)},
  // Harbor Square's: the park lamp, the café table under its umbrella, the market stall (its counter at the front), the bollard
  lamp:B=>{B.cyl(0.07,0.1,4.85,8,0x2f3236,0,2.42,0);B.box(0.45,0.18,0.45,0x2f3236,0,4.9,0);B.box(0.36,0.05,0.36,0xfff1c8,0,4.77,0)},
  cafe:B=>{const D=0x2b2d2f;B.cyl(0.4,0.4,0.04,16,D,0,0.74,0);B.cyl(0.04,0.04,0.74,8,D,0,0.37,0);B.cyl(0.03,0.03,2.4,6,0xe9e4d6,0,1.2,0);B.cyl(0.04,1.35,0.45,12,0x2f6b4f,0,2.3,0);
    for(const [x,z,yl] of PROPS.cafe.sit){B.box(0.42,0.05,0.42,D,x,0.45,z,0,yl,0);B.box(0.42,0.45,0.04,D,x-Math.sin(yl)*0.2,0.68,z-Math.cos(yl)*0.2,0,yl,0);B.cyl(0.02,0.02,0.45,6,D,x,0.22,z)}},
  stall:B=>{for(const x of [-1.3,1.3])for(const z of [-1.3,1.3])B.box(0.07,2.4,0.07,0xe9e4d6,x,1.2,z);B.cyl(0,2.05,0.8,4,0xf2efe6,0,2.8,0,0,Math.PI/4,0);
    B.box(2.6,0.78,0.8,0xa6743e,0,0.39,0.9);[0xc0392b,0xe6a23c,0x6a8f3a,0x8e5a9b,0xd9c27a].forEach((c,i)=>B.box(0.4,0.2,0.36,c,-1.05+i*0.52,0.88,0.95))},
  bollard:B=>{B.cyl(0.11,0.12,0.9,10,0x1f2a24,0,0.45,0);B.cyl(0.13,0.13,0.06,10,0xb08d3a,0,0.93,0)},
  lamppost:B=>{B.cyl(0.18,0.22,0.35,10,0x1f2326,0,0.18,0);B.cyl(0.05,0.07,3.2,8,0x1f2326,0,1.95,0);B.cyl(0.09,0.09,0.08,8,0x1f2326,0,3.58,0);
    B.cyl(0.16,0.11,0.42,8,0xfff0c8,0,3.83,0);B.cyl(0.02,0.25,0.2,8,0x1f2326,0,4.13,0);B.cyl(0.02,0.03,0.18,6,0x1f2326,0,4.3,0)},
  flood:B=>{B.box(0.5,0.1,0.5,0x8d8a84,0,0.05,0);B.cyl(0.06,0.08,4.2,8,0x9a9ea2,0,2.2,0);B.box(0.72,0.06,0.06,0x5a5a5a,0,4.25,0);
    for(const x of [-0.25,0.25]){B.box(0.42,0.32,0.16,0x2b2d30,x,4.35,0.1,0.45,0,0);B.box(0.36,0.26,0.02,0xfffbe8,x,4.31,0.18,0.45,0,0)}},
  uplight:B=>{B.box(0.04,0.2,0.04,0x2d3a2a,0,0.1,0);B.cyl(0.07,0.07,0.16,10,0x2d3a2a,0,0.24,0,0.35,0,0);B.cyl(0.06,0.06,0.01,10,0xfff6dc,0,0.32,0.03,0.35,0,0)},
  pathlight:B=>{B.cyl(0.09,0.1,0.75,10,0x2a2c2e,0,0.375,0);B.cyl(0.085,0.085,0.1,10,0xfff2cc,0,0.8,0);B.cyl(0.13,0.13,0.04,10,0x2a2c2e,0,0.87,0)},
  stringlts:B=>{for(const x of [-2.95,2.95])B.cyl(0.05,0.06,3.0,6,0x7a5a3a,x,1.5,0);
    const P=[[-2.95,2.95],...STR_PTS.map(p=>[p[0],p[1]+0.07]),[2.95,2.95]];
    for(let k=1;k<P.length;k++){const [x0,y0]=P[k-1],[x1,y1]=P[k];B.box(Math.hypot(x1-x0,y1-y0),0.012,0.012,0x222222,(x0+x1)/2,(y0+y1)/2,0,0,0,Math.atan2(y1-y0,x1-x0))}
    for(const p of STR_PTS){B.ball(0.045,0xfff0c0,p[0],p[1],0,1,1.3,1);B.box(0.025,0.05,0.025,0x222222,p[0],p[1]+0.06,0)}},
  lantern:B=>{B.cyl(0.015,0.015,1.8,6,0x1f2326,0,0.9,0);B.box(0.4,0.025,0.025,0x1f2326,0.18,1.8,0);B.box(0.012,0.12,0.012,0x1f2326,0.35,1.74,0);
    B.box(0.16,0.22,0.16,0xffe2a0,0.35,1.55,0);for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]])B.box(0.02,0.22,0.02,0x1f2326,0.35+x*0.08,1.55,z*0.08);
    B.cyl(0.01,0.13,0.1,4,0x1f2326,0.35,1.71,0,0,Math.PI/4,0);B.box(0.18,0.03,0.18,0x1f2326,0.35,1.43,0)},
  // ---------- road and traffic ----------
  barricade:B=>{for(const x of [-1.0,1.0])for(const s of [-1,1])B.box(0.08,1.5,0.08,0xd8d8d8,x,0.72,s*0.14,s*0.2,0,0);
    for(const y of [0.6,0.95,1.3])for(let k=0;k<6;k++)B.box(0.4,0.2,0.03,k%2?0xf4f4f4:0xf26a1b,-1.0+k*0.4,y,0.05)},
  jersey:B=>{B.box(3.0,0.08,0.6,0xb8b4ab,0,0.04,0);B.box(3.0,0.26,0.44,0xb8b4ab,0,0.21,0);B.box(3.0,0.5,0.2,0xbcb8af,0,0.58,0);B.box(2.9,0.04,0.21,0xa8a49b,0,0.4,0)},
  drum:B=>{B.box(0.75,0.08,0.75,0x1a1a1a,0,0.04,0);B.cyl(0.25,0.3,1.0,12,0xf26a1b,0,0.55,0);for(const y of [0.45,0.75])B.cyl(0.29,0.29,0.1,12,0xf4f4f4,0,y,0);B.cyl(0.08,0.12,0.06,10,0xf26a1b,0,1.08,0)},
  arrowbd:B=>{B.box(1.3,0.25,1.7,0xf2a900,0,0.55,0);for(const x of [-0.72,0.72])B.cyl(0.28,0.28,0.18,12,0x1c1c1c,x,0.28,0,0,0,Math.PI/2);
    B.box(0.08,0.08,1.0,0x5a5a5a,0,0.5,1.3);B.box(0.12,2.2,0.12,0xf2a900,0,1.7,-0.5);B.box(2.2,1.1,0.1,0x111111,0,2.9,-0.5);
    for(const p of PROPS.arrowbd.lamp[1])B.box(0.1,0.1,0.03,0x8a6a20,p[0],p[1],p[2]-0.02)},
  stopsign:B=>{B.box(0.06,2.2,0.06,0x9a9a9a,0,1.1,0);B.cyl(0.4,0.4,0.02,8,0xf4f4f4,0,2.05,0.04,Math.PI/2,0,Math.PI/8);B.cyl(0.37,0.37,0.03,8,0xc8102e,0,2.05,0.05,Math.PI/2,0,Math.PI/8);
    B.box(0.42,0.11,0.035,0xf4f4f4,0,2.05,0.06)},
  speedsign:B=>{B.box(0.06,2.3,0.06,0x9a9a9a,0,1.15,0);B.box(0.6,0.76,0.03,0x1a1a1a,0,1.95,0.04);B.box(0.56,0.72,0.035,0xf4f4f4,0,1.95,0.045);
    for(const y of [2.18,2.07])B.box(0.38,0.05,0.04,0x1a1a1a,0,y,0.05);for(const x of [-0.1,0.1])B.box(0.13,0.24,0.04,0x1a1a1a,x,1.8,0.05)},
  hydrant:B=>{B.cyl(0.18,0.18,0.06,10,0xb81c1c,0,0.03,0);B.cyl(0.12,0.13,0.55,10,0xc81e1e,0,0.33,0);B.cyl(0.06,0.13,0.13,10,0xc81e1e,0,0.66,0);
    B.cyl(0.05,0.05,0.34,8,0xc81e1e,0,0.44,0,0,0,Math.PI/2);B.cyl(0.065,0.065,0.12,8,0xc81e1e,0,0.42,0.12,Math.PI/2,0,0);B.cyl(0.02,0.02,0.05,6,0xd4af37,0,0.75,0)},
  trashcan:B=>{B.cyl(0.26,0.24,0.86,14,0x8e9296,0,0.43,0);for(const y of [0.2,0.5,0.8])B.cyl(0.265,0.265,0.025,14,0x7a7e82,0,y,0);B.cyl(0.24,0.24,0.01,14,0x1e1f20,0,0.86,0)},
  recycle:B=>{B.cyl(0.26,0.24,0.86,14,0x1f5aa8,0,0.43,0);for(const y of [0.2,0.5])B.cyl(0.265,0.265,0.025,14,0x1a4c8e,0,y,0);B.cyl(0.27,0.27,0.05,14,0x1a4c8e,0,0.87,0);
    B.box(0.2,0.02,0.06,0x0d0d0d,0,0.9,0);B.box(0.2,0.2,0.01,0xf2f2f2,0,0.62,0.255)},
  // two coin-op newspaper boxes on a shared foot: red and blue, a window over the paper, the coin slot
  newsbox:B=>{B.box(1.04,0.06,0.46,0x3a3c3e,0,0.03,0);for(const [x,c] of [[-0.26,0xb0262a],[0.26,0x1f4f8f]]){B.box(0.46,0.42,0.42,c,x,0.33,0);B.box(0.48,0.5,0.44,c,x,0.8,0);
      B.box(0.36,0.26,0.01,0x9eb8c4,x,0.86,0.225);B.box(0.3,0.16,0.005,0xe8e2d0,x,0.82,0.226);B.box(0.08,0.03,0.02,0xc8c8c8,x+0.12,1.0,0.225);B.box(0.5,0.04,0.46,0x2a2a2a,x,1.07,0)}},
  // a sidewalk chalkboard: two framed boards leaning together, the menu chalked on both faces
  aframe:B=>{for(const s of [-1,1]){B.box(0.6,0.9,0.04,0x6a4a2c,0,0.46,s*0.13,s*-0.27);B.box(0.5,0.72,0.01,0x1c2420,0,0.48,s*(0.152-0.267*0.02),s*-0.27);
      for(let k=0;k<5;k++){const y=0.7-k*0.1;B.box(0.28+((k*37)%3)*0.06,0.025,0.004,k===0?0xf2d27a:0xe8e8e2,0,y,s*(0.164-0.267*(y-0.46)),s*-0.27)}}},
  // a row of three galvanized hoops in the paving with two bikes locked to them, front wheels to the rack
  bikerack:B=>{for(const x of [-0.8,0,0.8]){for(const z of [-0.3,0.3])B.cyl(0.024,0.024,0.8,6,0x9aa0a4,x,0.4,z);B.cyl(0.024,0.024,0.64,6,0x9aa0a4,x,0.8,0,Math.PI/2,0,0)}
    B.box(1.7,0.03,0.08,0x9aa0a4,0,0.015,-0.3);B.box(1.7,0.03,0.08,0x9aa0a4,0,0.015,0.3);
    // (each bike along z beside a hoop: wheels with hubs, the frame's tubes, saddle and bars; s which way it faces)
    for(const [x,s,c] of [[-0.4,1,0x2a5f9a],[0.4,-1,0x8e2a26]]){for(const z of [-0.52,0.52]){B.tor(0.33,0.02,0x161616,x,0.34,z,0,Math.PI/2,0);B.tor(0.04,0.014,0x8a8a8a,x,0.34,z,0,Math.PI/2,0)}
      B.box(0.03,0.03,0.6,c,x,0.66,s*0.03);B.box(0.03,0.03,0.66,c,x,0.5,s*0.1,s*-0.6);B.box(0.03,0.48,0.03,c,x,0.52,s*-0.2,s*0.3);
      B.box(0.03,0.03,0.36,c,x,0.36,s*-0.36);B.box(0.03,0.4,0.03,c,x,0.5,s*0.48,s*-0.3);B.box(0.03,0.36,0.03,c,x,0.5,s*-0.42,s*0.6);
      B.box(0.1,0.04,0.22,0x111111,x,0.8,s*-0.26);B.box(0.46,0.025,0.025,0x222222,x,0.86,s*0.42)}},
  utilbox:B=>{B.box(0.52,1.1,0.42,0x9aa5ad,0,0.56,0);B.box(0.56,0.04,0.46,0x8a949b,0,1.12,0);B.box(0.3,0.16,0.01,0xf2c84b,0,0.85,0.215)},
  mailbox:B=>{B.box(0.1,1.0,0.1,0x7a5a3a,0,0.5,0);B.box(0.16,0.04,0.4,0x7a5a3a,0,0.98,0);B.box(0.24,0.12,0.48,0x2a2a2a,0,1.06,0);
    B.cyl(0.12,0.12,0.48,12,0x2a2a2a,0,1.12,0,Math.PI/2,0,0);B.box(0.02,0.2,0.05,0xc8202a,0.14,1.18,-0.1)},
  windsock:B=>{B.cyl(0.03,0.04,4.5,6,0xd8d8d8,0,2.25,0);B.tor(0.2,0.012,0x888888,0.08,4.35,0,0,0,Math.PI/2);
    for(let k=0;k<5;k++){const r0=0.2-k*0.025,r1=r0-0.025;B.cyl(r1,r0,0.3,10,k%2?0xf4f4f4:0xf26a1b,0.24+k*0.3,4.3-k*0.02,0,0,0,Math.PI/2)}},
  // ---------- site gear ----------
  pipes:B=>{for(const [x,y] of [[-0.46,0.45],[0.46,0.45],[0,1.24]]){B.cyl(0.45,0.45,2.4,14,0xa9a59c,x,y,0,Math.PI/2,0,0);B.cyl(0.36,0.36,2.42,14,0x3a3835,x,y,0,Math.PI/2,0,0)}
    for(const z of [-0.9,0.9])B.box(1.6,0.1,0.15,0x8a6a48,0,0.05,z)},
  lumber:B=>{for(const z of [-1.2,0,1.2])B.box(1.3,0.1,0.1,0x7a5a3a,0,0.05,z);B.box(1.2,0.32,3.6,0xd2b07a,0,0.26,0);B.box(1.24,0.04,3.62,0xb89a66,0,0.44,0);
    B.box(1.2,0.32,3.6,0xd8b884,0,0.62,0);for(const z of [-1.0,1.0])B.box(1.23,0.7,0.03,0x2f60a8,0,0.45,z)},
  sandbags:B=>{for(let r=0;r<3;r++)for(let k=0;k<3;k++){const x=-0.6+k*0.6+(r%2?0.3:0);if(x>0.85)continue;B.box(0.56,0.15,0.36,r%2?0xb8a476:0xc2ae80,x,0.08+r*0.15,0)}},
  jobbox:B=>{B.box(1.2,0.66,0.65,0x1d4f91,0,0.38,0);B.box(1.24,0.08,0.69,0x1a4580,0,0.74,0);for(const x of [-0.5,0.5])B.box(0.08,0.06,0.7,0x222222,x,0.03,0);
    for(const x of [-0.63,0.63])B.box(0.03,0.04,0.25,0x888888,x,0.5,0);B.box(0.14,0.1,0.03,0xb0b0b0,0,0.62,0.34)},
  genset:B=>{B.box(1.4,0.1,0.8,0x1a1a1a,0,0.12,0);B.box(1.3,0.85,0.75,0xe8b51a,0,0.6,0);B.box(0.6,0.4,0.02,0x2a2a2a,0.2,0.6,0.38);
    B.box(0.3,0.3,0.02,0x8a8a8a,-0.4,0.65,0.38);B.cyl(0.04,0.04,0.25,6,0x3a3a3a,0.45,1.15,-0.15);for(const x of [-0.55,0.55])B.cyl(0.11,0.11,0.08,10,0x1c1c1c,x,0.11,0.42,Math.PI/2,0,0)},
  container:B=>{B.box(2.44,2.59,6.06,0xa8432a,0,1.295,0);for(let k=0;k<14;k++)for(const x of [-1.23,1.23])B.box(0.03,2.4,0.14,0x963a24,x,1.3,-2.6+k*0.4);
    B.box(2.3,2.4,0.03,0x9a3b25,0,1.3,-3.04);for(const x of [-0.9,-0.3,0.3,0.9])B.box(0.04,2.35,0.05,0x7a7a7a,x,1.3,-3.07);B.box(2.44,0.12,6.06,0x6a2a1c,0,0.06,0)},
  scaffold:B=>{for(const x of [-1.0,1.0])for(const z of [-0.7,0.7]){B.box(0.05,3.7,0.05,0x9aa0a6,x,1.85,z);B.box(0.16,0.02,0.16,0x6a6a6a,x,0.01,z)}
    for(const y of [0.9,1.8,2.7,3.6])for(const z of [-0.7,0.7])B.box(2.0,0.04,0.04,0x9aa0a6,0,y,z);
    for(const z of [-0.7,0.7])B.box(0.04,2.3,0.04,0xb4b8bc,0,1.35,z,0,0,1.0);for(const y of [1.8,3.6])for(const z of [-0.35,0.35])B.box(2.05,0.05,0.6,0xc49a5a,0,y+0.04,z)},
  silt:B=>{B.box(3.05,0.75,0.02,0x1d1d1d,0,0.38,0);for(const x of [-1.45,0,1.45])B.box(0.05,1.0,0.05,0x8a6a48,x,0.45,0.04)},
  tires:B=>{for(let k=0;k<4;k++){B.tor(0.36,0.13,0x1c1c1c,(k%2)*0.04,0.14+k*0.27,0);B.cyl(0.25,0.25,0.12,12,0x2a2a2a,(k%2)*0.04,0.14+k*0.27,0)}},
  barrow:B=>{B.box(0.62,0.26,0.85,0x2d6a3a,0,0.58,0.1,0.08,0,0);B.box(0.5,0.04,0.6,0x245a30,0,0.45,0.12);B.cyl(0.18,0.18,0.08,12,0x1c1c1c,0,0.18,0.62,0,0,Math.PI/2);
    for(const x of [-0.24,0.24]){B.box(0.04,0.04,1.3,0x7a5a3a,x,0.5,-0.15,-0.12,0,0);B.box(0.04,0.38,0.04,0x3a3a3a,x,0.19,-0.3)}},
  // the yard's diesel tank (the detailed one is site.glb's fueltank, PROP_MDL below): 14 ft long and 7 ft round on two
  // saddles, its pump at the front right; the middle of the whole thing, pump and all, is the model's middle
  fuelstand:B=>{const X=-0.37,Z=-0.28;for(const dx of [-1.4,1.4])B.box(0.4,0.9,2.0,0x9a978f,X+dx,0.45,Z);
    B.cyl(1.05,1.05,4.2,14,0xd8d8d4,X,1.9,Z,0,0,Math.PI/2);B.cyl(1.07,1.07,0.4,14,0xc8a218,X,1.9,Z,0,0,Math.PI/2);B.cyl(0.1,0.1,0.14,8,0x3a3a3a,X+0.9,3.0,Z);
    B.box(0.6,1.4,0.4,0xc0392b,X+2.8,0.7,Z+1.0);B.box(0.4,0.3,0.02,0x1e1e1e,X+2.8,1.1,Z+1.21);B.box(0.05,0.6,0.05,0x2a2a2a,X+3.05,0.9,Z+1.22)},
  // the site office trailer (site.glb's office): 40 by 11 ft on block piers, its door at the front with steps and a
  // landing, which stand in front of its footprint
  office:B=>{for(const x of [-5,-1.7,1.7,5])B.box(0.4,0.6,3,0x9a978f,x,0.3,0);B.box(12,2.8,3.4,0xecebe6,0,2,0);B.box(12.1,0.15,3.5,0xb9b9b4,0,3.45,0);
    for(const x of [-4.2,-1.6,3.6])B.box(1.4,0.9,0.06,0x3c4a52,x,2.3,1.72);B.box(0.95,2.0,0.06,0x8a9198,1.2,1.65,1.72);
    for(let i=0;i<3;i++)B.box(1.2,0.18,0.35,0x8f9396,1.2,0.3+i*0.3,2.6-i*0.3);B.box(1.6,0.08,1.0,0x8f9396,1.2,0.92,2.2)},
  // ---------- farm and garden ----------
  haybale:B=>{B.cyl(0.92,0.92,1.52,16,0xc9a85a,0,0.9,0,0,0,Math.PI/2);for(const x of [-0.77,0.77])B.cyl(0.86,0.86,0.02,16,0xb8964a,x,0.9,0,0,0,Math.PI/2)},
  straw:B=>{for(const [y,z] of [[0.21,-0.27],[0.21,0.27],[0.63,0]]){B.box(1.1,0.42,0.52,0xd9c27a,0,y,z);for(const x of [-0.3,0.3])B.box(0.02,0.43,0.53,0x8a7a4a,x,y,z)}},
  planter:B=>{B.box(1.2,0.45,0.45,0x8a5a3a,0,0.225,0);B.box(1.12,0.04,0.38,0x3d2b1f,0,0.44,0);
    for(let k=0;k<10;k++){const x=-0.48+k*0.107,z=(k%2?0.08:-0.08);B.ball(0.08,0x3f7a35,x,0.5,z);B.ball(0.05,FLW[k%FLW.length],x,0.6,z)}},
  raisedbed:B=>{for(const z of [-0.58,0.58])B.box(2.4,0.3,0.05,0x9a6a42,0,0.15,z);for(const x of [-1.18,1.18])B.box(0.05,0.3,1.2,0x9a6a42,x,0.15,0);
    B.box(2.3,0.24,1.1,0x3a2a1e,0,0.12,0);for(const z of [-0.32,0,0.32])for(let k=0;k<6;k++)B.ball(0.11,z?0x4a8a3a:0x5a9a3a,-0.9+k*0.36,0.3,z,1,0.7,1);
    for(const x of [-0.7,0.2,0.9])B.ball(0.04,0xd23a2a,x,0.36,0.33)},
  birdbath:B=>{B.cyl(0.13,0.18,0.08,10,0xb5b0a6,0,0.04,0);B.cyl(0.07,0.1,0.65,10,0xb5b0a6,0,0.4,0);B.cyl(0.32,0.12,0.12,14,0xbdb8ae,0,0.78,0);B.cyl(0.28,0.28,0.01,14,0x7fb2c8,0,0.835,0)},
  birdhouse:B=>{B.box(0.08,1.6,0.08,0x7a5a3a,0,0.8,0);B.box(0.25,0.28,0.25,0xb55a3a,0,1.74,0);B.gable(0.32,0.34,0.13,0x5a4a3a,0,1.88,0,Math.PI/2);
    B.cyl(0.035,0.035,0.01,8,0x111111,0,1.78,0.126,Math.PI/2,0,0);B.cyl(0.008,0.008,0.07,4,0x7a5a3a,0,1.7,0.15,Math.PI/2,0,0)},
  arbor:B=>{for(const x of [-0.65,0.65])for(const z of [-0.3,0.3])B.box(0.1,2.3,0.1,0xf2efe8,x,1.15,z);for(const z of [-0.3,0.3])B.box(1.7,0.12,0.06,0xf2efe8,0,2.3,z);
    for(let k=0;k<7;k++)B.box(0.05,0.06,0.9,0xf2efe8,-0.75+k*0.25,2.39,0);for(const x of [-0.65,0.65])for(const y of [0.6,1.1,1.6])B.box(0.03,0.03,0.6,0xf2efe8,x,y,0);
    for(let k=0;k<14;k++){const x=k<7?-0.65:0.65,y=0.4+(k%7)*0.3;B.ball(0.12,0x3f6e32,x+(k%2?0.05:-0.05),y,(k%3-1)*0.15);if(k%2)B.ball(0.05,0xe06a8a,x+0.08,y+0.05,0.1)}
    for(let k=0;k<6;k++)B.ball(0.14,0x44743a,-0.6+k*0.24,2.45,(k%2-0.5)*0.3,1,0.6,1)},
  shrub:B=>{B.ball(0.5,0x3f6e32,0,0.42,0,1.1,0.85,1.1);B.ball(0.32,0x4a7a3a,0.32,0.36,0.2);B.ball(0.3,0x355e2b,-0.3,0.32,-0.18);B.ball(0.28,0x44743a,0.05,0.7,-0.1)},
  hedge:B=>{B.box(2.44,1.1,0.76,0x3d6a30,0,0.55,0);for(let k=0;k<4;k++){const x=-0.92+k*0.61;B.ball(0.36,k%2?0x44743a:0x3a6630,x,1.1,0,1,0.6,1.05);
    for(const s of [-1,1])B.ball(0.3,0x40702f,x+0.3,0.6,s*0.32,1,1.4,0.5)}},
  flowers:B=>{B.cyl(0.9,0.95,0.06,14,0x5a3a28,0,0.03,0);
    for(let k=0;k<18;k++){const a=k*2.4,r=0.15+0.65*((k*37)%10)/10,x=Math.cos(a)*r,z=Math.sin(a)*r;B.ball(0.12,0x3f7a35,x,0.12,z,1,0.8,1);B.ball(0.07,FLW[k%FLW.length],x,0.24,z)}},
  pumpkins:B=>{B.ball(0.28,0xe8761c,0,0.22,0,1,0.78,1);B.cyl(0.02,0.03,0.09,5,0x4a5a2a,0,0.47,0);
    for(const x of [-0.09,0.09])B.box(0.06,0.06,0.03,0x2a1406,x,0.28,0.265,0,0,Math.PI/4);B.box(0.18,0.05,0.03,0x2a1406,0,0.15,0.26);
    B.ball(0.18,0xf08a2a,0.4,0.14,0.15,1,0.75,1);B.cyl(0.015,0.02,0.06,5,0x4a5a2a,0.4,0.3,0.15);B.ball(0.15,0xd8681a,-0.32,0.12,0.22,1,0.8,1);B.cyl(0.015,0.02,0.05,5,0x4a5a2a,-0.32,0.25,0.22)},
  scarecrow:B=>{B.box(0.08,1.9,0.08,0x7a5a3a,0,0.95,0);B.box(1.4,0.06,0.06,0x7a5a3a,0,1.45,0);B.box(0.48,0.6,0.24,0xa03a2a,0,1.22,0);
    for(const s of [-1,1]){B.box(0.6,0.16,0.16,0xa03a2a,s*0.42,1.45,0);B.box(0.08,0.1,0.1,0xe0c060,s*0.74,1.45,0);B.box(0.16,0.5,0.18,0x3a4a6a,s*0.1,0.7,0);B.box(0.1,0.08,0.1,0xe0c060,s*0.1,0.42,0)}
    B.ball(0.16,0xd2b48c,0,1.7,0);B.cyl(0.3,0.3,0.02,12,0x6a5a3a,0,1.83,0);B.cyl(0.1,0.13,0.2,10,0x6a5a3a,0,1.93,0)},
  gnome:B=>{B.cyl(0.08,0.11,0.2,10,0x2f5fa8,0,0.12,0);B.cyl(0.02,0.08,0.13,8,0xf4f4f4,0,0.26,0.03);B.ball(0.055,0xf2c6a0,0,0.33,0.01);B.cyl(0.003,0.075,0.22,10,0xc8202a,0,0.47,0);
    for(const x of [-0.05,0.05])B.box(0.05,0.03,0.08,0x3a2a1a,x,0.015,0.02)},
  beehive:B=>{for(const x of [-0.38,0.38]){B.box(0.6,0.3,0.6,0x5a4a3a,x,0.15,0);for(let k=0;k<3;k++)B.box(0.5,0.23,0.42,k%2?0xf2e6b0:0xf8f0d0,x,0.42+k*0.24,0);B.box(0.56,0.06,0.48,0xa8a8a8,x,1.05,0);B.box(0.2,0.02,0.04,0x2a1a0a,x,0.32,0.21)}},
  well:B=>{for(let k=0;k<12;k++){const a=k*Math.PI/6;B.box(0.38,0.7,0.2,k%2?0x8a8580:0x7a7570,Math.cos(a)*0.66,0.35,Math.sin(a)*0.66,0,-a+Math.PI/2,0)}
    B.cyl(0.6,0.6,0.02,12,0x24404a,0,0.4,0);for(const x of [-0.75,0.75])B.box(0.1,1.5,0.1,0x7a5a3a,x,1.1,0);B.gable(1.3,1.3,0.5,0x6a3a2a,0,1.82,0,Math.PI/2);
    B.cyl(0.03,0.03,1.6,6,0x5a4030,0,1.4,0,0,0,Math.PI/2);B.box(0.012,0.35,0.012,0x8a7a5a,0,1.22,0);B.cyl(0.1,0.08,0.15,8,0x7a5a3a,0,0.98,0)},
  bookbox:B=>{B.box(0.1,1.1,0.1,0x7a5a3a,0,0.55,0);B.box(0.55,0.5,0.4,0xb84a3a,0,1.35,0);B.gable(0.65,0.5,0.2,0x4a4a4e,0,1.6,0);
    B.box(0.45,0.38,0.02,0x9ec4d8,0,1.35,0.2);for(let k=0;k<6;k++)B.box(0.06,0.14,0.12,[0x2f5fa8,0xd8b030,0x3a7a3a,0xc8402a,0x6a4a8a,0xe8e0d0][k],-0.17+k*0.068,1.42,0.12);
    B.box(0.42,0.02,0.3,0x8a5a3a,0,1.34,0.05);B.box(0.36,0.06,0.02,0xf4f0e0,0,1.62,0.2)},
  coop:B=>{for(const x of [-0.6,0.6])for(const z of [-0.85,-0.15])B.box(0.1,0.65,0.1,0x8a6a48,x,0.32,z);B.box(1.4,0.8,0.9,0xb03a2e,0,1.05,-0.5);
    B.gable(1.6,1.2,0.45,0x5a4a44,0,1.45,-0.5);B.box(0.3,0.36,0.02,0x2a1a10,0.3,0.95,-0.04);B.box(0.3,0.02,0.85,0x8a6a48,0.3,0.36,0.32,0.75,0,0);
    for(const x of [-0.6,0.6])B.box(0.04,0.6,1.1,0xd8d8d8,x,0.3,0.55);B.box(1.2,0.6,0.02,0xd8d8d8,0,0.3,1.1);
    for(const [x,z] of [[-0.3,0.4],[0.1,0.75],[-0.15,0.95]]){B.ball(0.1,0xf4efe4,x,0.16,z,0.9,0.85,1.2);B.ball(0.05,0xf4efe4,x,0.29,z+0.1);B.box(0.02,0.04,0.05,0xd02a2a,x,0.35,z+0.1)}},
  // ---------- the yard and play ----------
  firepit:B=>{for(let k=0;k<12;k++){const a=k*Math.PI/6;B.box(0.3,0.26,0.2,k%2?0x8a8580:0x6e6a66,Math.cos(a)*0.55,0.13,Math.sin(a)*0.55,0,-a+Math.PI/2,0)}
    for(let k=0;k<3;k++)B.box(0.08,0.08,0.7,0x5a3a22,0,0.1+k*0.03,0,0.2,k*1.05,0);B.cyl(0.38,0.38,0.05,12,0xff6a1a,0,0.06,0);B.cyl(0.002,0.18,0.5,6,0xffa030,0,0.35,0)},
  grill:B=>{B.box(0.7,0.75,0.5,0x2a2c2e,0,0.45,0);B.box(0.7,0.3,0.5,0xb8bcc0,0,0.97,0);B.box(0.7,0.24,0.45,0xc4c8cc,0,1.23,-0.02);
    for(const x of [-0.5,0.5])B.box(0.3,0.03,0.45,0xb8bcc0,x,1.02,0);B.cyl(0.015,0.015,0.6,6,0xd8dcdf,0,1.3,0.26,0,0,Math.PI/2);
    for(const x of [-0.2,0,0.2])B.cyl(0.025,0.025,0.03,8,0x111111,x,0.95,0.26,Math.PI/2,0,0);for(const x of [-0.3,0.3])B.cyl(0.06,0.06,0.04,8,0x111111,x,0.06,0.2,0,0,Math.PI/2)},
  adirondack:B=>{for(let k=0;k<5;k++)B.box(0.09,0.9,0.02,0xf0ece4,-0.24+k*0.12,0.78,-0.3,-0.35,0,0);B.box(0.6,0.03,0.55,0xf0ece4,0,0.38,0,0.15,0,0);
    for(const s of [-1,1]){B.box(0.14,0.03,0.7,0xf0ece4,s*0.34,0.6,0.02);B.box(0.05,0.6,0.05,0xe6e2da,s*0.34,0.3,0.32);B.box(0.05,0.4,0.05,0xe6e2da,s*0.3,0.2,-0.2);B.box(0.05,0.05,0.8,0xe6e2da,s*0.3,0.32,0.05,0.2,0,0)}},
  hammock:B=>{B.box(3.4,0.08,0.1,0x6a4a2a,0,0.04,0);for(const s of [-1,1])B.box(0.08,1.4,0.08,0x6a4a2a,s*1.45,0.65,0,0,0,s*0.4);
    for(let k=0;k<8;k++){const x0=-1.4+k*0.35,x1=x0+0.35,y=u=>0.55+0.5*(u/1.4)**2,ya=y(x0),yb=y(x1);B.box(Math.hypot(0.35,yb-ya),0.02,0.8,k%2?0xf2e0b0:0xd84a4a,(x0+x1)/2,(ya+yb)/2,0,0,0,Math.atan2(yb-ya,0.35))}},
  umbrella:B=>{B.cyl(0.5,0.5,0.04,14,0xf0f0f0,0,0.72,0);B.cyl(0.03,0.03,0.7,6,0x3a3a3a,0,0.36,0);B.cyl(0.25,0.25,0.04,10,0x3a3a3a,0,0.02,0);
    B.cyl(0.02,0.02,2.3,6,0xd8d8d8,0,1.15,0);B.cyl(0.03,1.3,0.38,8,0x2a6a8a,0,2.2,0);
    for(const a of [0,Math.PI*0.66,Math.PI*1.33]){const x=Math.sin(a)*0.85,z=Math.cos(a)*0.85;B.box(0.42,0.04,0.42,0x3a3a3a,x,0.45,z,0,a,0);B.box(0.42,0.42,0.04,0x3a3a3a,x+Math.sin(a)*0.2,0.66,z+Math.cos(a)*0.2,0,a,0);
      for(const s of [-1,1])B.box(0.03,0.45,0.03,0x3a3a3a,x+Math.cos(a)*s*0.18,0.22,z-Math.sin(a)*s*0.18)}},
  gazebo:B=>{B.cyl(1.8,1.85,0.2,8,0xa98a6a,0,0.1,0,0,Math.PI/8,0);for(let k=0;k<8;k++){const a=k*Math.PI/4;B.box(0.12,2.4,0.12,0xf2efe8,Math.sin(a)*1.6,1.4,Math.cos(a)*1.6);
      if(k){const b=a+Math.PI/8;B.box(1.2,0.08,0.06,0xf2efe8,Math.sin(b)*1.5,0.9,Math.cos(b)*1.5,0,b+Math.PI/2,0)}}
    B.cyl(0.08,2.15,1.0,8,0x5a4a44,0,3.1,0,0,Math.PI/8,0);B.cyl(0.1,0.1,0.3,6,0x5a4a44,0,3.7,0)},
  woodpile:B=>{for(const x of [-0.78,0.78])B.box(0.06,1.1,0.06,0x5a4030,x,0.55,0);B.box(1.6,0.05,0.4,0x5a4030,0,0.03,0);
    for(let r=0;r<5;r++)for(let k=0;k<9;k++)B.cyl(0.075,0.075,0.42,6,[0x8a6a48,0x9c7a52,0x7a5a3a][(r+k)%3],-0.66+k*0.165+(r%2?0.04:0),0.13+r*0.15,0,Math.PI/2,0,0)},
  flagpole:B=>{B.cyl(0.04,0.06,7.6,8,0xeeeeee,0,3.8,0);B.ball(0.08,0xd4af37,0,7.66,0);
    for(let k=0;k<7;k++)B.box(1.5,0.114,0.02,k%2?0xf4f4f4:0xb22234,0.79,7.42-k*0.114,0);B.box(0.62,0.46,0.025,0x3c3b6e,0.35,7.25,0)},
  doghouse:B=>{B.box(0.9,0.7,1.1,0xe6d7c0,0,0.38,0);B.gable(1.25,1.1,0.4,0x8a3a2a,0,0.73,0,Math.PI/2);B.box(0.35,0.42,0.02,0x111111,0,0.28,0.56);
    B.cyl(0.175,0.175,0.02,10,0x111111,0,0.49,0.56,Math.PI/2,0,0);B.box(0.25,0.06,0.02,0x2f5fa8,0,0.66,0.565);B.cyl(0.1,0.08,0.06,10,0xc8202a,0.38,0.03,0.75)},
  tent:B=>{B.gable(2.2,1.8,1.3,0x2f7a4a,0,0,0,Math.PI/2);B.box(0.02,0.95,0.6,0x1a3a26,0,0.42,1.04,0,Math.PI/2,0);B.box(2.3,0.02,1.9,0x2a2a2a,0,0.01,0);
    for(const z of [-1.1,1.1])B.box(0.025,1.4,0.025,0x8a8a8a,0,0.7,z);for(const z of [-1.1,1.1])B.box(0.01,0.01,0.9,0xd8d8d8,0,0.7,z*1.35,0.9*Math.sign(z),0,0)},
  swing:B=>{for(const x of [-1.5,1.5])for(const s of [-1,1])B.box(0.08,2.6,0.08,0x8a6a42,x,1.24,s*0.38,s*0.3,0,0);B.cyl(0.06,0.06,3.2,8,0x8a6a42,0,2.48,0,0,0,Math.PI/2);
    for(const c of [-0.6,0.6]){for(const s of [-1,1])B.box(0.015,1.85,0.015,0x666666,c+s*0.22,1.53,0);B.box(0.48,0.04,0.18,0x2a2a2a,c,0.58,0)}},
  trampoline:B=>{B.tor(1.75,0.12,0x2a5aa8,0,0.9,0);B.cyl(1.65,1.65,0.02,24,0x1a1a1a,0,0.89,0);for(let k=0;k<6;k++){const a=k*Math.PI/3;B.box(0.05,0.9,0.05,0x666666,Math.sin(a)*1.75,0.45,Math.cos(a)*1.75)}
    for(let k=0;k<8;k++){const a=k*Math.PI/4;B.cyl(0.02,0.02,1.8,5,0x2a2a2a,Math.sin(a)*1.8,1.8,Math.cos(a)*1.8)}B.tor(1.8,0.03,0x2a2a2a,0,2.7,0)},
  sandbox:B=>{for(const s of [-1,1]){B.box(2.4,0.25,0.1,0x9a6a42,0,0.125,s*1.15);B.box(0.1,0.25,2.4,0x9a6a42,s*1.15,0.125,0)}B.box(2.3,0.18,2.3,0xe8d6a6,0,0.09,0);
    B.cyl(0.1,0.08,0.15,10,0xd8302a,0.6,0.25,0.4);B.box(0.08,0.02,0.4,0x2f5fa8,-0.5,0.19,-0.3,0,0.6,0);B.ball(0.25,0xe8d6a6,-0.3,0.15,0.5,1.4,0.6,1)},
  hoop:B=>{B.box(1.0,0.25,0.6,0x1a1a1a,0,0.12,-0.4);B.cyl(0.06,0.06,3.0,8,0x8a8f94,0,1.6,-0.4);B.box(0.06,0.06,0.6,0x8a8f94,0,3.05,-0.1);
    B.box(1.8,1.05,0.04,0xf4f4f4,0,3.3,0.2);B.box(0.6,0.45,0.045,0xd8302a,0,3.25,0.2);B.box(0.52,0.37,0.05,0xf4f4f4,0,3.25,0.2);B.tor(0.23,0.012,0xe85a1a,0,3.05,0.45);
    for(let k=0;k<8;k++){const a=k*Math.PI/4;B.box(0.008,0.38,0.008,0xf0f0f0,Math.sin(a)*0.19,2.87,0.45+Math.cos(a)*0.19)}},
  goal:B=>{for(const x of [-1.83,1.83]){B.cyl(0.05,0.05,1.83,8,0xf4f4f4,x,0.92,0.6);B.box(0.05,0.05,1.25,0xdddddd,x,0.03,0);B.box(0.04,1.95,0.04,0xdddddd,x,0.95,0,-0.55,0,0)}
    B.cyl(0.05,0.05,3.71,8,0xf4f4f4,0,1.83,0.6,0,0,Math.PI/2);B.box(3.66,0.04,0.04,0xdddddd,0,0.03,-0.6);
    for(let k=1;k<9;k++)B.box(0.01,1.95,0.01,0xe8e8e8,-1.83+k*0.407,0.95,0,-0.55,0,0);for(let k=1;k<5;k++)B.box(3.66,0.01,0.01,0xe8e8e8,0,k*0.366,0.6-k*0.24)},
  cornhole:B=>{B.box(0.61,0.04,1.22,0xd8b27a,0,0.2,0,-0.25,0,0);B.box(0.12,0.045,1.22,0x2f5fa8,-0.2,0.21,0,-0.25,0,0);B.cyl(0.076,0.076,0.05,12,0x111111,0,0.33,-0.4,-0.25,0,0);
    for(const x of [-0.27,0.27])B.box(0.04,0.33,0.04,0x9a7a4a,x,0.17,-0.52);for(const [x,c] of [[-0.12,0xc8202a],[0.1,0x2f5fa8],[0.02,0xc8202a]])B.box(0.15,0.03,0.15,c,x,0.08+(x>0?0.05:0),0.9+x)}};
// ---------- things from Forge Studio's prop library ----------
// PROP_FF[kind]: f the model's id there (drawn from <FF_SITE><f>.glb with Machine models on Detailed, fetched the first
// time one of that kind stands on the map: ffNeed below); w, d, h its size in metres and solid its collide boxes' reach
// (library.json's width, length, height and collide; r: the model is turned a quarter, so w and d are too); the rest
// are PROPS fields. A kind already in PROPS above keeps its other fields and its box-built model, fitted to the new
// size; a new kind gets a stand-in from its shape (sh) and colour (col), which is what Low graphics shows, and
// Medium and High too until the model is in or when the site can't be reached. float: it floats, its underside that
// far under the water (or on the bed where that is shallower; a piling stands 2 m down). Ids are 2 to 16 lower-case
// letters (mapDecode). Made from library.json by hand-picked ids; sizes are the library's own
const FF_SITE='https://corley-forge-studio.vercel.app/prop/library/';
const PROP_FF={
  potty:{f:'ff_portable_toilet',w:1.15,d:1.28,h:2.31,solid:[0.56,0.64]},
  dumpster:{f:'ff_dumpster_rolloff',n:'Roll-off dumpster (20 yd)',w:7.18,d:2.64,h:1.52,solid:[3.59,1.32],cap:30},
  container:{f:'ff_container_20ft_red',n:'Shipping container (red)',w:2.44,d:6.12,h:2.59,r:1,solid:[1.22,3.06]},
  scaffold:{f:'ff_scaffold_bay',w:2.47,d:1.67,h:3.23,solid:1},
  lumber:{f:'ff_lumber_stack',w:1.26,d:3.66,h:0.76,r:1,solid:[0.59,1.83]},
  jobbox:{f:'ff_job_box',w:1.34,d:0.8,h:0.87,solid:[0.65,0.4]},
  barrow:{f:'ff_wheelbarrow',w:0.68,d:1.84,h:0.63,r:1,solid:0},
  pipes:{f:'ff_pipe_rack',n:'Pipe rack',w:1.64,d:6.18,h:1.21,r:1,solid:[0.52,3.09]},
  bikerack:{f:'ff_bike_rack',n:'Bike rack',w:2.58,d:0.59,h:0.94,solid:[1.16,0.27]},
  newsbox:{f:'ff_newspaper_box',n:'Newspaper box',w:0.51,d:0.46,h:1.31,solid:[0.26,0.23]},
  speedsign:{f:'ff_sign_speed_limit',w:0.61,d:0.07,h:2.96,solid:[0.05,0.05]},
  doghouse:{f:'ff_doghouse',w:1.06,d:1.4,h:1.05,solid:[0.53,0.7]},
  coop:{f:'ff_chicken_coop',w:1.48,d:4.1,h:1.92,r:1,solid:[0.74,2.05]},
  grill:{f:'ff_gas_grill_black',n:'Gas grill (black)',w:1.37,d:0.58,h:1.16,solid:[0.68,0.29]},
  bollard:{f:'ff_bollard_steel',n:'Bollard (steel pipe)',w:0.4,d:0.4,h:1.07,solid:[0.09,0.09]},
  pathlight:{f:'ff_bollard_light',w:0.22,d:0.22,h:1.07,solid:0,lamp:['path',[[0,0.88,0]]]},
  birdbath:{f:'ff_birdbath_stone',w:0.61,d:0.61,h:0.92,solid:[0.3,0.3]},
  raisedbed:{f:'ff_raised_bed_cedar',n:'Raised garden bed (cedar)',w:2.44,d:1.23,h:0.45,solid:0,pad:[0.45,1.22,0.61]},
  signal:{f:'ff_traffic_signal',n:'Traffic signal',cat:6,sh:'post',col:0x2a2c2e,w:0.88,d:0.67,h:4.37,solid:[0.12,0.12],cap:60},
  streetsign:{f:'ff_street_name_sign',n:'Street-name sign',cat:6,sh:'post',col:0x1f6a3a,w:0.91,d:0.91,h:3.59,solid:[0.05,0.05],cap:150},
  pedsign:{f:'ff_sign_ped_crossing',n:'Pedestrian crossing sign',cat:6,sh:'post',col:0xf2c12e,w:1.08,d:0.07,h:3.55,solid:[0.05,0.05],cap:150},
  bussign:{f:'ff_sign_bus_stop',n:'Bus stop sign',cat:6,sh:'post',col:0x2f5fa8,w:0.46,d:0.09,h:2.91,solid:[0.05,0.05],cap:150},
  parkmeter:{f:'ff_parking_meter',n:'Parking meter',cat:6,sh:'cyl',col:0x4a4d50,w:0.17,d:0.15,h:1.45,solid:[0.09,0.06],cap:150},
  guardrail:{f:'ff_guardrail',n:'Guardrail (12 ft 6 in)',cat:6,sh:'fence',col:0x9a9ea1,w:3.81,d:0.45,h:0.81,solid:[1.9,0.22],run:1,cap:400},
  chainlink:{f:'ff_fence_chainlink',n:'Chain-link fence (10 ft)',cat:2,sh:'fence',col:0x9a9ea1,w:3.12,d:0.07,h:1.91,solid:[1.56,0.04],run:1,cap:400},
  tempfence:{f:'ff_fence_temporary',n:'Temporary fence panel',cat:2,sh:'fence',col:0xb0b4b8,w:3.87,d:0.79,h:1.99,solid:[1.94,0.39],run:1,cap:400},
  manhole:{f:'ff_manhole_cover',n:'Manhole cover',cat:6,sh:'cyl',col:0x3a3a3a,w:1.07,d:1.07,h:0.03,solid:0,cap:150},
  storminlet:{f:'ff_storm_inlet',n:'Storm drain inlet',cat:6,sh:'box',col:0x8a8a86,w:1.52,d:1.26,h:0.16,solid:0,cap:150},
  trashslat:{f:'ff_trash_receptacle',n:'Trash receptacle (steel slat)',cat:6,sh:'cyl',col:0x2f3a34,w:0.72,d:0.72,h:1.09,solid:[0.33,0.33],cap:150},
  drinkfount:{f:'ff_drinking_fountain',n:'Drinking fountain',cat:6,sh:'cyl',col:0x5a6268,w:0.59,d:0.78,h:1,solid:[0.28,0.36],cap:150},
  workzone:{f:'ff_sign_work_zone',n:'Work-zone sign',cat:6,sh:'post',col:0xf07a1a,w:1.77,d:1.05,h:2.6,solid:[0.79,0.39],cap:150},
  palletcmu:{f:'ff_pallet_cmu',n:'Pallet of concrete block',cat:3,sh:'box',col:0x9a978f,w:1.22,d:1.02,h:1.09,solid:[0.61,0.51],cap:150},
  palletcement:{f:'ff_pallet_cement',n:'Pallet of bagged cement',cat:3,sh:'box',col:0xb9b4a6,w:1.22,d:1.02,h:0.88,solid:[0.61,0.51],cap:150},
  rebar:{f:'ff_rebar_bundle',n:'Rebar bundles',cat:3,sh:'box',col:0x6a4a3a,w:6.15,d:0.8,h:0.19,solid:[3.08,0.27],cap:150},
  trenchplate:{f:'ff_trench_plate',n:'Steel road plate (8 × 10 ft)',cat:3,sh:'box',col:0x4a4642,w:3.05,d:2.44,h:0.04,solid:0,pad:[0.043,1.52,1.22],cap:150},
  compressor:{f:'ff_air_compressor',n:'Air compressor (tow-behind)',cat:3,sh:'box',col:0xe8b020,w:3.35,d:1.76,h:1.77,solid:[1.64,0.88],cap:150},
  sawhorses:{f:'ff_sawhorses_plank',n:'Sawhorses with a plank',cat:3,sh:'frame',col:0xc9a56a,w:2.54,d:0.95,h:0.81,solid:[1.24,0.47],cap:150},
  containerblue:{f:'ff_container_20ft_blue',n:'Shipping container (blue)',cat:3,sh:'box',col:0x2f5fa8,w:2.44,d:6.12,h:2.59,r:1,solid:[1.22,3.06],deep:1,cap:30},
  containergreen:{f:'ff_container_20ft_green',n:'Shipping container (green)',cat:3,sh:'box',col:0x2f6a3a,w:2.44,d:6.12,h:2.59,r:1,solid:[1.22,3.06],deep:1,cap:30},
  dockfloat:{f:'ff_dock_floating',n:'Floating dock (6 × 20 ft)',cat:9,sh:'box',col:0x8a6f4a,w:6.23,d:1.93,h:0.7,solid:0,run:1,pad:[0.704,3.05,0.96],float:0.2,cap:120},
  piling:{f:'ff_piling_timber',n:'Dock piling',cat:9,sh:'cyl',col:0x5a4632,w:0.41,d:0.34,h:3.23,solid:[0.2,0.17],float:2,cap:200},
  cleat:{f:'ff_dock_cleat',n:'Dock cleat',cat:9,sh:'box',col:0x9a9ea1,w:0.3,d:0.08,h:0.1,solid:0,cap:200},
  moorbuoy:{f:'ff_mooring_buoy',n:'Mooring buoy',cat:9,sh:'cyl',col:0xf0f0ec,w:0.6,d:0.6,h:0.99,solid:[0.27,0.27],float:0.3,cap:150},
  nunbuoy:{f:'ff_buoy_nun_red',n:'Channel buoy (red nun)',cat:9,sh:'cyl',col:0xc8202a,w:0.92,d:0.91,h:1.69,solid:[0.44,0.46],float:0.5,cap:150},
  canbuoy:{f:'ff_buoy_can_green',n:'Channel buoy (green can)',cat:9,sh:'cyl',col:0x1f7a3a,w:0.92,d:0.91,h:1.59,solid:[0.44,0.46],float:0.5,cap:150},
  lifering:{f:'ff_life_ring_station',n:'Life ring station',cat:9,sh:'post',col:0xf07a1a,w:0.86,d:0.35,h:1.94,solid:[0.08,0.08],cap:150},
  dockbox:{f:'ff_dock_box',n:'Dock box',cat:9,sh:'box',col:0xecebe6,w:1.2,d:0.61,h:0.61,solid:[0.6,0.31],cap:150},
  kayakrack:{f:'ff_kayak_rack',n:'Kayak rack',cat:9,sh:'frame',col:0xe85a1a,w:3.15,d:1.1,h:1.67,solid:[1.51,0.52],cap:150},
  fuelpump:{f:'ff_fuel_dock_pump',n:'Fuel dock pump',cat:9,sh:'box',col:0xc0392b,w:1.31,d:0.6,h:1.97,solid:[0.51,0.3],cap:150},
  fishtable:{f:'ff_fish_cleaning_table',n:'Fish-cleaning table',cat:9,sh:'frame',col:0xb0b4b8,w:2.18,d:0.61,h:1.2,solid:[1.01,0.31],cap:150},
  propane:{f:'ff_propane_tank_500',n:'Propane tank (500 gal)',cat:4,sh:'tank',col:0xe8e8e4,w:3.02,d:1,h:1.33,solid:[1.45,0.5],cap:40},
  clothesline:{f:'ff_clothesline',n:'Clothesline',cat:4,sh:'frame',col:0xe8e8e4,w:6.5,d:1.22,h:1.98,solid:0,cap:40},
  satdish:{f:'ff_satellite_dish',n:'Satellite dish',cat:4,sh:'post',col:0x9a9ea1,w:0.62,d:0.93,h:1.83,solid:[0.06,0.06],cap:150},
  heater:{f:'ff_patio_heater',n:'Patio heater',cat:4,sh:'post',col:0x8a8f94,w:0.85,d:0.85,h:2.25,solid:[0.2,0.2],lamp:['heater',[[0,1.95,0]]],cap:150},
  parasolsand:{f:'ff_patio_umbrella_sand',n:'Patio umbrella (sand)',cat:4,sh:'umb',col:0xd8c8a0,w:2.43,d:2.43,h:2.29,solid:[0.1,0.1],cap:40},
  parasolnavy:{f:'ff_patio_umbrella_navy',n:'Patio umbrella (navy)',cat:4,sh:'umb',col:0x23355a,w:2.43,d:2.43,h:2.29,solid:[0.1,0.1],cap:40},
  parasolred:{f:'ff_patio_umbrella_red',n:'Patio umbrella (terracotta)',cat:4,sh:'umb',col:0xb5553a,w:2.43,d:2.43,h:2.29,solid:[0.1,0.1],cap:40},
  parasolgreen:{f:'ff_patio_umbrella_green',n:'Patio umbrella (green)',cat:4,sh:'umb',col:0x2f6a3a,w:2.43,d:2.43,h:2.29,solid:[0.1,0.1],cap:40},
  pergolacedar:{f:'ff_pergola_cedar',n:'Pergola (cedar)',cat:4,sh:'frame',col:0xb5733c,w:3.66,d:3.66,h:2.74,solid:0,cap:20},
  pergolawhite:{f:'ff_pergola_white',n:'Pergola (white)',cat:4,sh:'frame',col:0xf0f0ec,w:3.66,d:3.66,h:2.74,solid:0,cap:20},
  pergolabrown:{f:'ff_pergola_brown',n:'Pergola (brown)',cat:4,sh:'frame',col:0x5a3a22,w:3.66,d:3.66,h:2.74,solid:0,cap:20},
  gardenshedgreige:{f:'ff_garden_shed_greige',n:'Garden shed (greige)',cat:1,sh:'box',col:0xb9b0a0,w:3.05,d:2.45,h:2.75,solid:[1.52,1.22],deep:1,cap:30},
  gardenshedred:{f:'ff_garden_shed_red',n:'Garden shed (barn red)',cat:1,sh:'box',col:0x8a2a22,w:3.05,d:2.45,h:2.75,solid:[1.52,1.22],deep:1,cap:30},
  gardenshedsage:{f:'ff_garden_shed_sage',n:'Garden shed (sage)',cat:1,sh:'box',col:0x8a9a7a,w:3.05,d:2.45,h:2.75,solid:[1.52,1.22],deep:1,cap:30},
  privacycedar:{f:'ff_fence_privacy_cedar',n:'Privacy fence, cedar (16 ft)',cat:2,sh:'fence',col:0xb5733c,w:4.91,d:0.13,h:1.83,solid:[2.45,0.06],run:1,deep:1,cap:400},
  privacygrey:{f:'ff_fence_privacy_grey',n:'Privacy fence, weathered (16 ft)',cat:2,sh:'fence',col:0x8a8880,w:4.91,d:0.13,h:1.83,solid:[2.45,0.06],run:1,deep:1,cap:400},
  picketfence:{f:'ff_fence_picket_white',n:'Picket fence (16 ft)',cat:2,sh:'fence',col:0xf0f0ec,w:4.89,d:0.13,h:1.22,solid:[2.44,0.07],run:1,deep:1,cap:400},
  splitrail:{f:'ff_fence_split_rail',n:'Split-rail fence (16 ft)',cat:2,sh:'fence',col:0x8a6f4a,w:4.87,d:0.19,h:1.22,solid:[2.43,0.09],run:1,deep:1,cap:400},
  raisedpine:{f:'ff_raised_bed_pine',n:'Raised garden bed (pine)',cat:7,sh:'box',col:0xd8b27a,w:2.44,d:1.23,h:0.45,solid:0,pad:[0.45,1.22,0.61],cap:80},
  yardlamp:{f:'ff_lamp_post_black',n:'Yard lamp post (black)',cat:5,sh:'post',col:0x2a2c2e,w:0.32,d:0.28,h:2.13,solid:[0.1,0.1],lamp:['lantern',[[0,1.77,0]]],cap:150},
  yardlampgreen:{f:'ff_lamp_post_verdigris',n:'Yard lamp post (verdigris)',cat:5,sh:'post',col:0x4f8a7a,w:0.32,d:0.28,h:2.13,solid:[0.1,0.1],lamp:['lantern',[[0,1.77,0]]],cap:150},
  firering:{f:'ff_fire_pit_stone',n:'Fire pit (stone ring)',cat:4,sh:'cyl',col:0x8a8880,w:1.22,d:1.2,h:0.43,solid:[0.53,0.54],cap:40,lamp:['fire',[[0,0.4,0]]]},
  gardenbenchteak:{f:'ff_garden_bench_teak',n:'Garden bench (teak)',cat:4,sh:'box',col:0xb5733c,w:1.54,d:0.64,h:0.91,solid:[0.75,0.3],sit:[[-0.4,0,0],[0.4,0,0]],cap:80},
  gardenbenchwhite:{f:'ff_garden_bench_white',n:'Garden bench (white)',cat:4,sh:'box',col:0xf0f0ec,w:1.54,d:0.64,h:0.91,solid:[0.75,0.3],sit:[[-0.4,0,0],[0.4,0,0]],cap:80},
  gardenbenchgreen:{f:'ff_garden_bench_green',n:'Garden bench (oak and green)',cat:4,sh:'box',col:0x2f6a3a,w:1.54,d:0.64,h:0.91,solid:[0.75,0.3],sit:[[-0.4,0,0],[0.4,0,0]],cap:80},
  grillred:{f:'ff_gas_grill_red',n:'Gas grill (red)',cat:4,sh:'box',col:0xb5332a,w:1.37,d:0.58,h:1.16,solid:[0.68,0.29],cap:40},
  granite:{f:'ff_boulder_granite',n:'Boulder, granite (3 ft)',cat:7,sh:'box',col:0x9a9a98,w:0.91,d:0.73,h:0.61,solid:[0.43,0.35],cap:300},
  fieldstone:{f:'ff_boulder_fieldstone',n:'Boulder, fieldstone (3 ft)',cat:7,sh:'box',col:0x8a8272,w:0.91,d:0.73,h:0.61,solid:[0.46,0.34],cap:300}};
// a stand-in by shape, w by d by h: a box, an upright cylinder, a tank lying along x, a sign or lamp on a post, an
// umbrella, a fence panel between two posts, or a frame of four posts with a top
const FF_KIT={
  box:(B,F)=>B.box(F.w,F.h,F.d,F.col,0,F.h/2,0),
  cyl:(B,F)=>B.cyl(F.w/2,F.w/2,F.h,12,F.col,0,F.h/2,0),
  tank:(B,F)=>{const r=Math.min(F.h,F.d)/2;B.cyl(r,r,F.w,12,F.col,0,F.h-r,0,0,0,Math.PI/2);for(const x of [-F.w/3,F.w/3])B.box(0.12,F.h-r,F.d*0.6,0x6a6a6a,x,(F.h-r)/2,0)},
  post:(B,F)=>{const t=Math.min(0.8,F.h*0.25);B.cyl(0.04,0.05,F.h-t,6,0x8c9094,0,(F.h-t)/2,0);B.box(F.w,t,Math.min(F.d,0.3),F.col,0,F.h-t/2,0)},
  umb:(B,F)=>{B.cyl(0.03,0.03,F.h,6,0x8c9094,0,F.h/2,0);B.cyl(0.05,F.w/2,0.45,10,F.col,0,F.h-0.22,0);B.cyl(0.25,0.25,0.08,10,0x3a3a3a,0,0.04,0)},
  fence:(B,F)=>{for(const x of [-1,1])B.box(0.08,F.h,Math.max(0.08,F.d),0x8c9094,x*(F.w/2-0.04),F.h/2,0);B.box(F.w-0.16,F.h*0.8,0.04,F.col,0,F.h*0.55,0)},
  frame:(B,F)=>{for(const x of [-1,1])for(const z of [-1,1])B.box(0.1,F.h,0.1,F.col,x*(F.w/2-0.05),F.h/2,z*(F.d/2-0.05));B.box(F.w,0.1,F.d,F.col,0,F.h-0.05,0)}};
for(const k in PROP_FF){const F=PROP_FF[k];if(!PROPS[k])PROP_MODELS[k]=B=>FF_KIT[F.sh](B,F);PROPS[k]=Object.assign(PROPS[k]||{},F)}
// a kind's box-built model; a Forge kind's is fitted to the Forge model's size, standing on the ground about its middle
function propGeo(k){const g=propModel(PROP_MODELS[k]),F=PROP_FF[k];if(!F)return g;g.computeBoundingBox();const b=g.boundingBox,c=b.getCenter(new THREE.Vector3());
  g.translate(-c.x,-b.min.y,-c.z);g.scale(F.w/Math.max(0.01,b.max.x-b.min.x),F.h/Math.max(0.01,b.max.y-b.min.y),F.d/Math.max(0.01,b.max.z-b.min.z));g.computeVertexNormals();return g}
{const mt=M(0xffffff,{vertexColors:true});
  for(const k in PROPS){const im=new THREE.InstancedMesh(propGeo(k),mt,PROPS[k].cap);
    im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(PROPS[k].cap*3),3);
    im.castShadow=im.receiveShadow=true;im.frustumCulled=false;im.count=0;im.visible=false;im.layers.enable(RAIN_LAYER);scene.add(im);propIMs[k]=im}}
// how tall each model is (the outline when placing on foot)
const PROP_H={};for(const k in PROPS){const g=propIMs[k].geometry;g.computeBoundingBox();PROP_H[k]=g.boundingBox.max.y}
// (a kind's id is 2 to 16 lower-case letters, or the map leaves it out on loading: mapDecode, terrain.js)
// kinds whose detailed model (models.js, mdlPropParts) is a node of another name: [node, copies], each copy
// [x, y, z, yaw, scale] on this kind's own model (none: the node as it is). The simple model above is what Low shows
// and what the footprint, solid and lamps are set by, so the copies are laid to match it
const PROP_MDL={
  fuelstand:['fueltank',[[-0.37,0,-0.28,0,1]]],
  haybale:['roundbale'],
  picniclong:['picnic8'],
  straw:['bale',[[0,0,-0.27,Math.PI/2,1],[0,0,0.27,Math.PI/2,1],[0,0.42,0,Math.PI/2,1]]],
  // the bridges' 19 ft davit lamp, scaled up to this kind's 25 ft: its lens lands on the lamp above (5.93 m and 1.36 m out, x 1.292)
  streetlt:['lampArm',[[0,0,0,0,7.66/5.93]]]};
// ---------- placing ----------
// a thing's footprint corners and middle, turned and sized, as [x, z] points
function propPts(a){const p=PROPS[a.t],hw=p.w/2*a.s,hd=p.d/2*a.s,c=Math.cos(a.yaw),s=Math.sin(a.yaw),out=[[a.x,a.z]];
  for(const [u,v] of [[-hw,-hd],[hw,-hd],[-hw,hd],[hw,hd]])out.push([a.x+u*c+v*s,a.z-u*s+v*c]);return out}
// the ground it stands on: the highest under its footprint for ones with a footing, else under its middle
function propY(a){const P=PROPS[a.t];if(P.float)return Math.max(surfAt(a.x,a.z),WATER-P.float*a.s);if(!P.deep)return surfAt(a.x,a.z);let y=-1e9;for(const [x,z] of propPts(a))y=Math.max(y,surfAt(x,z));return y}
// the instances and the solid boxes from the asset list; assetsBuild (scenery.js) calls it after every change
function propsBuild(){const o=new THREE.Object3D(),col=new THREE.Color(),n={};
  for(let i=SOLIDS.length-1;i>=0;i--)if(SOLIDS[i].prop)SOLIDS.splice(i,1);walkPadsDrop('prop');
  for(const k in PROPS)n[k]=0;
  for(const a of assets){const P=PROPS[a.t];if(a.hd||!P||n[a.t]>=P.cap)continue;const im=propIMs[a.t],i=n[a.t]++;
    const py=propY(a);o.position.set(a.x,py,a.z);o.rotation.set(0,a.yaw,0);
    // what you can stand on (a pallet, the gazebo's floor, the sandbox): its top (pad: [height, half width, half depth])
    if(P.pad)walkPad(a.x,a.z,P.pad[1]*a.s,P.pad[2]*a.s,a.yaw,py+P.pad[0]*a.s,{tag:'prop'});o.scale.setScalar(a.s);o.updateMatrix();im.setMatrixAt(i,o.matrix);
    const t=P.tint?PROP_TINT[(a.c|0)%PROP_TINT.length]:[1,1,1];im.setColorAt(i,col.setRGB(t[0],t[1],t[2]));
    if(P.solid){const [lx,lz]=Array.isArray(P.solid)?P.solid:[P.w/2,P.d/2],c=Math.cos(a.yaw),s=Math.sin(a.yaw),L=lx*a.s,Z=lz*a.s;
      SOLIDS.push({x:a.x,z:a.z,lx:L,lz:Z,cs:c,sn:s,hx:Math.abs(c)*L+Math.abs(s)*Z,hz:Math.abs(s)*L+Math.abs(c)*Z,prop:1})}}
  for(const k in PROPS){const im=propIMs[k];im.count=n[k];im.visible=n[k]>0;im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true}
  propLampsBuild();if(typeof sqSpots==='function')sqSpots();ffNeed()}
// the Forge models of the kinds standing on the map, each fetched once (forgetown.js's loader: meshopt glTF), with
// Machine models on Detailed: one mesh and one material of its own (colour, normal and roughness pictures, kept as
// they are) under the game's sky (mdlScanMat), drawn in place of the box-built one through the same instance list
// (mdl.propIM: mdlPropsSync shows one or the other). A fetch that fails is tried again after half a minute
const ff={req:{},n:0};
function ffNeed(){if(typeof mdl==='undefined'||!mdl.want||typeof bfImport!=='function')return;
  for(const k in PROP_FF){const im=propIMs[k];if(!im.count||mdl.propIM[k]||ff.req[k]>performance.now())continue;ff.req[k]=Infinity;
    bfImport().then(({loader})=>new Promise((ok,no)=>loader.load(FF_SITE+PROP_FF[k].f+'.glb',ok,undefined,no))).then(g=>{
      g.scene.updateMatrixWorld(true);const parts=[];
      g.scene.traverse(o=>{if(!o.isMesh)return;const q=o.geometry.clone();
        // the library's models are packed (whole-number positions and normals, scaled by the mesh's own matrix): as plain numbers first
        for(const n of ['position','normal']){const A=q.attributes[n];if(!A)continue;const F=new Float32Array(A.count*3);for(let i=0;i<A.count;i++){F[i*3]=A.getX(i);F[i*3+1]=A.getY(i);F[i*3+2]=A.getZ(i)}q.setAttribute(n,new THREE.BufferAttribute(F,3))}
        q.applyMatrix4(o.matrixWorld);q.normalizeNormals();if(PROP_FF[k].r)q.rotateY(Math.PI/2);q.computeBoundingSphere();parts.push([q,mdlScanMat(o.material)])});
      if(!parts.length)throw new Error('no mesh');const ims=mdl.propIM[k]=mdlInst(null,PROPS[k].cap,parts);
      for(const m of ims){m.instanceMatrix=im.instanceMatrix;m.instanceColor=im.instanceColor;m.frustumCulled=false}ff.n++;mdlPropsSync()})
      .catch(e=>{ff.req[k]=performance.now()+30000;console.warn('Forge thing not loaded: '+k,e&&e.message||e)})}}
// for the editor: how near a ground point is to a thing (under 1 is on it), its ring's radius and its name
function propHit(a,x,z){const P=PROPS[a.t],c=Math.cos(a.yaw),s=Math.sin(a.yaw),dx=x-a.x,dz=z-a.z,u=dx*c-dz*s,v=dx*s+dz*c;
  return Math.max(Math.abs(u)/(P.w/2*a.s+0.4),Math.abs(v)/(P.d/2*a.s+0.4))}
const propR=a=>Math.hypot(PROPS[a.t].w,PROPS[a.t].d)/2*a.s;
const propName=a=>{const P=PROPS[a.t];return `${P.n}, ${(P.w*a.s/FT).toFixed(0)} × ${(P.d*a.s/FT).toFixed(P.d*a.s<1?1:0)} ft`};

// ---------- lamps: the lights among the things glow after dark ----------
// Every lamp head gets a halo and, for the ones that light the ground, a pool of light laid over the ground under it
// (both one draw for every lamp, so the phone can have hundreds). On High graphics the two lit lamps nearest the camera
// also get a real spotlight that lights the machines, the worker and the things round them.
// A light's colour (c on its asset) is one of LAMP_COLS, picked in the editor's swatches; fire and the arrow board keep their own.
const LAMP_COLS=[0xffd9a0,0xf2f4ff,0xffb347,0xff4a3a,0x5cff7a,0x5a8cff,0xc070ff];
const LAMP_COL_N=['Warm white','Cool white','Amber','Red','Green','Blue','Purple'];
// h: the halo across (m); r: the pool's radius (0 for none), f: how far ahead of the lamp its middle is, a: how much longer
// than wide; col: a colour of its own; fx: 1 flickers like a flame, 2 flashes; ang, aim, dist, i: its real spotlight's
// cone (radians), direction on the model, reach (m) and strength (none without ang); pb: the pool's brightness
const LAMP_K={
  street:{h:2.4,r:7,f:1.6,a:1,ang:1.05,aim:[0,-1,0.2],dist:24,i:1.2},
  post:{h:1.7,r:4.2,f:0,a:1,ang:1.25,aim:[0,-1,0],dist:14,i:0.8,pb:0.85},
  flood:{h:1.6,r:5.5,f:10,a:2.2,ang:0.5,aim:[0,-0.38,1],dist:40,i:1.6},
  up:{h:0.8,r:1.2,f:0.5,a:1,ang:0.45,aim:[0,1,0.3],dist:12,i:1.2,pb:0.6},
  path:{h:0.7,r:1.5,f:0,a:1,ang:1.3,aim:[0,-1,0],dist:5,i:0.35,pb:0.6},
  bulb:{h:0.5,r:0},
  lantern:{h:1.0,r:2.2,f:0,a:1,ang:1.3,aim:[0,-1,0],dist:7,i:0.45,pb:0.7},
  heater:{h:0.9,r:1.8,f:0,a:1,col:0xffb070,pb:0.6},
  tower:{h:1.6,r:9,f:8,a:1.5,col:0xfff2d8,ang:0.75,aim:[0,-0.5,1],dist:40,i:1.6},
  fire:{h:1.5,r:3.2,f:0,a:1,col:0xff8a2a,fx:1,ang:1.5,aim:[0,-1,0],dist:9,i:0.9,pb:0.8},
  jack:{h:0.6,r:1.0,f:0.3,a:1,col:0xff9a30,fx:1,pb:0.5},
  arrow:{h:0.45,r:0,col:0xffb020,fx:2}};
// a kind whose light colour can be picked
const propGlow=t=>!!(PROPS[t]&&PROPS[t].lamp&&!LAMP_K[PROPS[t].lamp[0]].col);
const propLampU={uK:{value:0},uT:{value:0},uH:{value:500}};
// how bright a lamp is now: steady, a flame's flicker or a flash
const LAMP_GLSL_K=`float lampK(float fx,vec3 p){return fx<0.5?1.0:fx<1.5?0.82+0.18*sin(uT*11.0+p.x*3.1)*sin(uT*6.7+p.z*5.3):step(0.45,fract(uT*0.9));}`;
const propHaloMat=new THREE.ShaderMaterial({uniforms:Object.assign({map:{value:dnHaloTex}},propLampU),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:`attribute float sz;attribute float fx;attribute vec3 col;uniform float uK,uT,uH;varying vec3 vC;${LAMP_GLSL_K}
    void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);float k=lampK(fx,position),d=-mv.z;vC=col*uK*k*clamp(1.6-d/250.0,0.0,1.0);
      gl_PointSize=sz*(fx>0.5&&fx<1.5?0.85+0.15*k:1.0)*uH/max(0.2,d);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform sampler2D map;varying vec3 vC;void main(){gl_FragColor=vec4(vC*texture2D(map,gl_PointCoord).a,1.0);}`});
const propPoolMat=new THREE.ShaderMaterial({uniforms:Object.assign({map:{value:dnPoolTex}},propLampU),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,
  vertexShader:`attribute float fx;attribute vec3 col;uniform float uK,uT;varying vec3 vC;varying vec2 vUv;${LAMP_GLSL_K}
    void main(){vC=col*uK*0.45*lampK(fx,position);vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform sampler2D map;varying vec3 vC;varying vec2 vUv;void main(){gl_FragColor=vec4(vC*texture2D(map,vUv).a,1.0);}`});
const propHalos=new THREE.Points(new THREE.BufferGeometry(),propHaloMat),propPools=new THREE.Mesh(new THREE.BufferGeometry(),propPoolMat);
propHalos.frustumCulled=propPools.frustumCulled=false;propHalos.visible=propPools.visible=false;propPools.renderOrder=1;scene.add(propHalos,propPools);
// the lit lamps, one a thing: middle of its heads, aim, colour and kind (for the real spotlights)
const propLamps=[];
// the real spotlights; always in the scene on High (dark by day), so nothing compiles again when one comes on
const propSpots=[0,1].map(()=>{const l=new THREE.SpotLight(0xffffff,0,20,1,0.5,0);l.castShadow=false;l.visible=false;scene.add(l,l.target);return l});
function propLampGfx(on){for(const l of propSpots)l.visible=!!on}
propLampGfx(gfxCur.propLt);
function propLampsBuild(){const H={p:[],c:[],s:[],f:[]},Q={p:[],c:[],f:[],u:[],i:[]},col=new THREE.Color(),v=new THREE.Vector3(),o=new THREE.Object3D();propLamps.length=0;
  for(const a of assets){const P=PROPS[a.t];if(a.hd||!P||!P.lamp)continue;const K=LAMP_K[P.lamp[0]],fx=K.fx||0;
    col.setHex(K.col||LAMP_COLS[(a.c|0)%LAMP_COLS.length]);o.position.set(a.x,propY(a),a.z);o.rotation.set(0,a.yaw,0);o.scale.setScalar(a.s);o.updateMatrix();
    let mx=0,my=0,mz=0;const hs=P.lamp[1];
    for(const h of hs){v.set(h[0],h[1],h[2]).applyMatrix4(o.matrix);H.p.push(v.x,v.y,v.z);H.c.push(col.r,col.g,col.b);H.s.push(K.h*a.s);H.f.push(fx);mx+=v.x/hs.length;my+=v.y/hs.length;mz+=v.z/hs.length}
    const c=Math.cos(a.yaw),s=Math.sin(a.yaw);
    if(K.ang){const d=v.set(K.aim[0],K.aim[1],K.aim[2]).normalize();propLamps.push({x:mx,y:my,z:mz,dx:d.x*c+d.z*s,dy:d.y,dz:-d.x*s+d.z*c,col:col.getHex(),K})}
    if(!K.r)continue;
    // the pool: a 5 × 5 grid of points laid on the ground (blocks too) round a spot ahead of the lamp
    const rx=K.r*a.s,rz=K.r*K.a*a.s,cx=mx+s*K.f*a.s,cz=mz+c*K.f*a.s,o0=Q.p.length/3,pb=K.pb||1;
    for(let j=0;j<5;j++)for(let i=0;i<5;i++){const u=(i/2-1)*rx,w=(j/2-1)*rz,x=cx+u*c+w*s,z=cz-u*s+w*c;
      Q.p.push(x,surfAt(x,z)+0.06,z);Q.u.push(i/4,j/4);Q.c.push(col.r*pb,col.g*pb,col.b*pb);Q.f.push(fx)}
    for(let j=0;j<4;j++)for(let i=0;i<4;i++){const q=o0+j*5+i;Q.i.push(q,q+5,q+1,q+1,q+5,q+6)}}
  const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(H.p,3));hg.setAttribute('col',new THREE.Float32BufferAttribute(H.c,3));
  hg.setAttribute('sz',new THREE.Float32BufferAttribute(H.s,1));hg.setAttribute('fx',new THREE.Float32BufferAttribute(H.f,1));propHalos.geometry.dispose();propHalos.geometry=hg;
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(Q.p,3));pg.setAttribute('uv',new THREE.Float32BufferAttribute(Q.u,2));
  pg.setAttribute('col',new THREE.Float32BufferAttribute(Q.c,3));pg.setAttribute('fx',new THREE.Float32BufferAttribute(Q.f,1));pg.setIndex(Q.i);propPools.geometry.dispose();propPools.geometry=pg;
  propSpotT=0}
// each frame from daynight.js: lamp is how dark it is (0 by day, 1 at night), ll the Lamp light tuning
let propSpotT=0;const propCamP=new THREE.Vector3();
function propLampTick(lamp,ll,dt){const on=lamp>0.01&&propHalos.geometry.attributes.position&&propHalos.geometry.attributes.position.count>0;
  propHalos.visible=!!on;propPools.visible=!!on&&propPools.geometry.index&&propPools.geometry.index.count>0;
  propLampU.uK.value=lamp*Math.min(1.5,ll);propLampU.uT.value=timeU.value%1000;propLampU.uH.value=renderer.domElement.height*0.5;
  if(!propSpots[0].visible)return;
  if(!on){for(const l of propSpots)l.intensity=0;return}
  // every third of a second, the two nearest lit lamps get the spotlights
  propSpotT-=dt;camera.getWorldPosition(propCamP);
  if(propSpotT<=0){propSpotT=0.33;const near=propLamps.map(L=>[(L.x-propCamP.x)**2+(L.z-propCamP.z)**2,L]).filter(q=>q[0]<6400).sort((a,b)=>a[0]-b[0]);
    propSpots.forEach((l,i)=>{const L=near[i]&&near[i][1];l.userData.L=L;if(!L)return;
      l.position.set(L.x,L.y,L.z);l.target.position.set(L.x+L.dx*5,L.y+L.dy*5,L.z+L.dz*5);l.color.setHex(L.col);l.angle=L.K.ang;l.distance=L.K.dist})}
  const t=timeU.value;
  for(const l of propSpots){const L=l.userData.L;if(!L){l.intensity=0;continue}
    const f=L.K.fx===1?0.82+0.18*Math.sin(t*11+L.x*3.1)*Math.sin(t*6.7+L.z*5.3):1;l.intensity=L.K.i*2.4*lamp*ll*LI*f}}

// ---------- placing on foot: the block bar's What list sets these in front of you, like a block (blocks.js) ----------
// The thing faces you (Turn spins it an eighth of a turn), snaps to the block grid when the block snap does, and goes
// into the map's asset list (saved and synced as the editor's are), so the map editor can move it later. Lift picks up
// the nearest placed thing in front of you (not trees, and not what the editor locked).
let thTurn=0,thCol=0;const thP={x:0,z:0,y:0,yaw:0,ok:false,why:''};
const thGhostMat=new THREE.MeshBasicMaterial({color:0xf5c518,transparent:true,opacity:0.4,depthWrite:false,toneMapped:false});
const thGhost=new THREE.Mesh(propIMs.cone.geometry,thGhostMat);thGhost.visible=false;scene.add(thGhost);
// the spot just in front: under the bucket, in front of the worker, or where the dot meets the ground in first person
function thSpot(t){const P=PROPS[t];
  if(mode!=='walk')return [tip.x,tip.z];
  if(blkFP()){const r=blkRay();return [r.x,r.z]}
  const k=WK_R+Math.max(P.w,P.d)/2+0.3;return [wk.x+Math.sin(wk.yaw)*k,wk.z+Math.cos(wk.yaw)*k]}
function thAim(){const t=blkThing,P=PROPS[t];camera.getWorldDirection(blkV);
  let [x,z]=thSpot(t);const yaw=Math.round((Math.atan2(-blkV.x,-blkV.z)+thTurn)/(Math.PI/12))*Math.PI/12;
  if(blkLock==='grid'||blkLock==='gridblocks'){const g=blkGrid*IN;x=Math.round(x/g)*g;z=Math.round(z/g)*g}
  const p=thP,a={t,x,z,yaw,s:1};p.x=x;p.z=z;p.yaw=yaw;p.y=propY(a);p.ok=false;
  if(assets.filter(q=>q.t===t).length>=P.cap)p.why=say('thCap',{n:P.cap,what:P.n});
  else if(surfAt(x,z)<WATER+0.05)p.why=say('thWater');
  else if(P.solid&&mode==='walk'&&propHit(a,wk.x,wk.z)<1)p.why=say('thStand');
  else if(EX_C.some(lz=>blkCircleD(st,lz,{x,z,w:P.w,d:P.d})<EX_R+0.05))p.why='Too close to the excavator. Reach out farther.';
  else{p.ok=true;p.why=''}
  return p}
function thChanged(){assetsBuild();shpTreesRefresh();edSave()}
function thPlace(){if(mode!=='dig'&&mode!=='walk'){toast(say('blkWrongMode'));return}
  const p=thAim();if(!p.ok){toast(p.why);return}
  assets.push({t:blkThing,x:+p.x.toFixed(2),z:+p.z.toFixed(2),yaw:p.yaw,s:1,c:thCol});thChanged();started();
  toast(say('thSet',{what:PROPS[blkThing].n}),'good',1800)}
function thLift(){if(mode!=='dig'&&mode!=='walk'){toast(say('blkLiftMode'));return}
  const [fx,fz]=blkFP()?(r=>[r.x,r.z])(blkRay(TU.blkReach/FT)):mode==='walk'?[wk.x+Math.sin(wk.yaw)*(WK_R+0.6),wk.z+Math.cos(wk.yaw)*(WK_R+0.6)]:[tip.x,tip.z];
  let best=null,bd=1.6;for(const a of assets)if(PROPS[a.t]&&!a.hd){const d=propHit(a,fx,fz);if(d<bd){bd=d;best=a}}
  if(!best){toast(say('thNone'));return}
  if(best.lk){toast(say('thLocked'));return}
  assets.splice(assets.indexOf(best),1);thChanged();toast(say('thLifted',{what:PROPS[best.t].n}),'good',1600)}
function thTurnBy(){thTurn=(thTurn+Math.PI/4)%(Math.PI*2)}
// the outline of the thing where it will go, yellow, or red when it can't
function thTick(){const show=blkOn&&!!blkThing&&(mode==='dig'||mode==='walk')&&!bench.on;thGhost.visible=show;if(!show)return;
  const p=thAim();if(thGhost.geometry!==propIMs[blkThing].geometry)thGhost.geometry=propIMs[blkThing].geometry;
  thGhost.position.set(p.x,p.y+0.01,p.z);thGhost.rotation.y=p.yaw;thGhostMat.color.setHex(p.ok?0xf5c518:0xff5143)}
propsBuild();
