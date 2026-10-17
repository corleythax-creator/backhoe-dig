// Backhoe Dig: the material library the map editor paints onto the ground (Materials tool): ground covers, concrete
// and paving, steel, brick and stone, wood and more. Each is a seamless 512 px texture in textures/ (OpenAI GPT Image,
// made tileable by tools/textures.py) with its mean colour, which the ground's vertex colours take everywhere and the
// texture's detail rides on (Medium and High graphics, WebGL2). The painted ids live in ED_M (terrain.js).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// A material's saved id is its place in MAT_LIST plus one (0 is the natural ground): only ever add to the end.
// ft: how many feet one tile of the texture covers; c: its mean colour (sRGB, from tools/textures.py)
const MAT_CATS=['Ground','Concrete and paving','Steel','Brick and stone','Wood and more'];
const MAT_LIST=[
  {id:'gravel',n:'Crushed gravel',cat:0,ft:4,c:[0.499,0.498,0.501]},
  {id:'riverrock',n:'River rock',cat:0,ft:4,c:[0.576,0.455,0.347]},
  {id:'sand',n:'Sand',cat:0,ft:6,c:[0.837,0.648,0.386]},
  {id:'dirt2',n:'Topsoil',cat:0,ft:5,c:[0.431,0.215,0.109]},
  {id:'clay',n:'Dry clay',cat:0,ft:8,c:[0.867,0.490,0.207]},
  {id:'mud',n:'Mud',cat:0,ft:6,c:[0.265,0.181,0.121]},
  {id:'mulch',n:'Wood mulch',cat:0,ft:4,c:[0.429,0.256,0.172]},
  {id:'grass2',n:'Lawn sod',cat:0,ft:4,c:[0.236,0.538,0.106]},
  {id:'granite',n:'Bedrock',cat:0,ft:8,c:[0.459,0.456,0.430]},
  {id:'concrete',n:'Poured concrete',cat:1,ft:8,c:[0.697,0.693,0.684]},
  {id:'concrete_broom',n:'Broom-finish concrete',cat:1,ft:6,c:[0.664,0.651,0.635]},
  {id:'concrete_old',n:'Old concrete',cat:1,ft:10,c:[0.450,0.435,0.408]},
  {id:'aggregate',n:'Exposed aggregate',cat:1,ft:4,c:[0.522,0.471,0.418]},
  {id:'pavers',n:'Concrete pavers',cat:1,ft:6,c:[0.528,0.520,0.512]},
  {id:'cmu',n:'Concrete block',cat:1,ft:2.67,c:[0.533,0.529,0.527]},
  {id:'asphalt',n:'Asphalt',cat:1,ft:6,c:[0.268,0.265,0.266]},
  {id:'diamond',n:'Diamond plate',cat:2,ft:3,c:[0.542,0.563,0.582]},
  {id:'rustplate',n:'Steel road plate',cat:2,ft:8,c:[0.312,0.238,0.196]},
  {id:'corrugated',n:'Corrugated steel',cat:2,ft:1.8,c:[0.567,0.585,0.603]},
  {id:'grating',n:'Bar grating',cat:2,ft:3,c:[0.300,0.331,0.357]},
  {id:'rebar',n:'Rebar mat',cat:2,ft:4,c:[0.360,0.327,0.307]},
  {id:'yellowsteel',n:'Yellow steel',cat:2,ft:4,c:[0.911,0.701,0.067]},
  {id:'brick',n:'Red brick',cat:3,ft:2.67,c:[0.678,0.337,0.255]},
  {id:'brick_old',n:'Old brick',cat:3,ft:2.67,c:[0.475,0.246,0.157]},
  {id:'herringbone',n:'Brick pavers',cat:3,ft:4,c:[0.705,0.358,0.238]},
  {id:'cobble',n:'Cobblestone',cat:3,ft:5,c:[0.424,0.426,0.433]},
  {id:'flagstone',n:'Flagstone',cat:3,ft:8,c:[0.584,0.460,0.347]},
  {id:'plywood',n:'Plywood',cat:4,ft:4,c:[0.889,0.736,0.526]},
  {id:'planks',n:'Deck planks',cat:4,ft:2.75,c:[0.437,0.351,0.284]},
  {id:'shingles',n:'Roof shingles',cat:4,ft:2.5,c:[0.237,0.243,0.255]},
  {id:'fabric',n:'Landscape fabric',cat:4,ft:6,c:[0.138,0.141,0.143]}];
const MAT_MAX=32;
// ---------- textures on the ground ----------
// WebGL2 only (a texture array); without it the painted ground keeps the plain material colours
const MAT_GL2=renderer.capabilities.isWebGL2;
// the ground shader's material uniforms: the painted-id map (one texel per editor cell, set up in terrain.js), the
// texture array holding just the materials the map uses, each id's mean colour and tiles per metre, and its layer
const matU={tMatId:{value:null},tMatArr:{value:null},uMatInfo:{value:[]},uMatLayer:{value:new Float32Array(MAT_MAX).fill(-1)}};
for(let m=0;m<MAT_MAX;m++){const d=MAT_LIST[m-1];matU.uMatInfo.value.push(d?new THREE.Vector4(d.c[0],d.c[1],d.c[2],1/(d.ft*0.3048)):new THREE.Vector4(1,1,1,1))}
const MAT_GLSL_HEAD=MAT_GL2?`precision highp sampler2DArray;
uniform sampler2D tMatId;
uniform sampler2DArray tMatArr;
uniform vec4 uMatInfo[${MAT_MAX}];
uniform float uMatLayer[${MAT_MAX}];
`:'';
// in the ground's colour step: where a material covers the ground, its texture takes over the grass and dirt detail
// (gd) at full strength (gk); divided by its mean colour, as the vertex colour already is that colour. The id map
// is the editor grid of terrain.js (called when the shader compiles, after that has loaded)
const matGlsl=()=>MAT_GL2?`if(vMatA>0.01&&texMix>0.5){
  int mi=int(texture(tMatId,((vWXZ-vec2(${ED_X0.toFixed(1)},${ED_Z0.toFixed(1)}))/${ED_C.toFixed(2)}+0.5)/vec2(${ED_NX.toFixed(1)},${ED_NZ.toFixed(1)})).r*255.0+0.5);
  float ly=mi>0?uMatLayer[mi]:-1.0;
  if(ly>=0.0){vec4 inf=uMatInfo[mi];vec3 tm=texture(tMatArr,vec3(vWXZ*inf.a,ly)).rgb/inf.rgb;gd=mix(gd,clamp(tm,0.0,3.0),vMatA);gk=mix(gk,1.0,vMatA);}
}
`:'';
const matImg={};let matLayers=[];
// rebuilds the texture array when the materials painted on the map (and loaded) change; the images load on first use.
// Skipped while the ground detail is off (Low graphics), where the shader never reads it
function matTexUpdate(){if(!MAT_GL2||!texOn||!gfxDetail)return;
  const used=new Uint8Array(MAT_MAX);for(let q=0;q<ED_M.length;q++)used[ED_M[q]]=1;
  const ready=[];
  for(let m=1;m<=MAT_LIST.length;m++){if(!used[m])continue;let im=matImg[m];
    if(!im){im=matImg[m]=new Image();im.onload=matTexUpdate;im.src=`textures/${MAT_LIST[m-1].id}.jpg`}
    if(im.complete&&im.naturalWidth)ready.push(m)}
  if(ready.length===matLayers.length&&ready.every((m,i)=>m===matLayers[i]))return;
  const T=512,L=Math.max(1,ready.length),data=new Uint8Array(T*T*4*L),cv=document.createElement('canvas');cv.width=cv.height=T;
  const x2=cv.getContext('2d');ready.forEach((m,l)=>{x2.drawImage(matImg[m],0,0,T,T);data.set(x2.getImageData(0,0,T,T).data,l*T*T*4)});
  const t=new THREE.DataTexture2DArray(data,T,T,L);t.format=THREE.RGBAFormat;t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;
  if(matU.tMatArr.value)matU.tMatArr.value.dispose();matU.tMatArr.value=t;
  matU.uMatLayer.value.fill(-1);ready.forEach((m,l)=>matU.uMatLayer.value[m]=l);matLayers=ready}
