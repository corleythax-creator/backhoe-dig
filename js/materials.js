// Corley's Island: the material library the map editor paints onto the ground (Paint tool): ground covers, concrete
// and paving, steel, brick and stone, wood and more. Each is a seamless 512 px texture in textures/ (OpenAI GPT Image,
// made tileable by tools/textures.py) with its mean colour, which the ground's vertex colours take everywhere and the
// texture's detail rides on (Medium and High graphics, WebGL2). The painted ids live in ED_M (terrain.js). Mud has two
// extra textures for when it dries (MUD_STAGES).
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
// painted Mud dries out (rain.js) through two more looks: damp and matte, then pale and cracked; c as for MAT_LIST
const MUD_STAGES=[{id:'mud_drying',c:[0.446,0.323,0.221]},{id:'mud_cracked',c:[0.658,0.539,0.408]}];
// ---------- textures on the ground ----------
// WebGL2 (nearly every device): the ground shader draws the painted materials itself, per pixel, so a hard edge is a
// sharp line wherever it falls between the mesh's vertices, with the texture on Medium and High graphics. Without
// WebGL2 the vertex colours carry the materials' plain colours (matTint, terrain.js), edges blurred over a cell
const MAT_GL2=renderer.capabilities.isWebGL2;
// the ground shader's material uniforms: the painted-id and cover maps (one texel per editor cell, ED_M and ED_A, set
// up in terrain.js), the texture array holding just the materials the map uses, each id's mean colour and tiles per
// metre, and its layer; for Mud, the layers of its drier looks and their colours over its own
const matU={tMatId:{value:null},tMatCov:{value:null},tMatArr:{value:null},uMatInfo:{value:[]},uMatLayer:{value:new Float32Array(MAT_MAX).fill(-1)},uMudL:{value:new THREE.Vector2(-1,-1)},
  uMudC1:{value:new THREE.Vector3()},uMudC2:{value:new THREE.Vector3()}};
{const w=MAT_LIST.find(m=>m.id==='mud').c,r=(c,i)=>c[i]/w[i];matU.uMudC1.value.set(r(MUD_STAGES[0].c,0),r(MUD_STAGES[0].c,1),r(MUD_STAGES[0].c,2));matU.uMudC2.value.set(r(MUD_STAGES[1].c,0),r(MUD_STAGES[1].c,1),r(MUD_STAGES[1].c,2))}
for(let m=0;m<MAT_MAX;m++){const d=MAT_LIST[m-1];matU.uMatInfo.value.push(d?new THREE.Vector4(d.c[0],d.c[1],d.c[2],1/(d.ft*0.3048)):new THREE.Vector4(1,1,1,1))}
const MAT_GLSL_HEAD=MAT_GL2?`precision highp sampler2DArray;
uniform sampler2D tMatId;
uniform sampler2D tMatCov;
uniform sampler2DArray tMatArr;
uniform vec4 uMatInfo[${MAT_MAX}];
uniform float uMatLayer[${MAT_MAX}];
uniform vec2 uMudL;
uniform vec3 uMudC1;
uniform vec3 uMudC2;
`:'';
// in the ground's colour step: how much of this pixel a material covers (matP) and its colour (matC), mixed in over the
// lit-ground colour after the vertex colour (matGlslPost). The four editor cells around the pixel give the cover,
// blended between their centres: a hard edge (cells fully covered, or not at all) turns over in about a pixel where
// that blend crosses half, so it follows the painted cells' outline, rounding their corners, as round brushes want;
// cells laid by the hard square brush (254) are drawn whole instead, each pixel taking the cell it is in, so their
// corners stay sharp; soft-edged paint (any cell covered 252 or less) keeps the blend. vMatA is 1 near paint and drops where the ground was dug or dumped. The
// material is the cell with the most cover, nearest first; its texture (Medium and High) is divided by its mean
// colour for detail, as the ground's own textures are. Painted Mud blends to its drying and cracked looks as the soil
// water (soilW, rain.js) drops. Read when the shader compiles, after terrain.js has loaded
const matGlsl=()=>MAT_GL2?`float matP=0.0;vec3 matC=vec3(1.0);
vec2 mfF=(vWXZ-vec2(${ED_X0.toFixed(1)},${ED_Z0.toFixed(1)}))/${ED_C.toFixed(2)};vec2 mfW=fwidth(mfF);
if(vMatA>0.001){
  ivec2 b=ivec2(floor(mfF));vec2 u=fract(mfF);
  float a0=texelFetch(tMatCov,b,0).r,a1=texelFetch(tMatCov,b+ivec2(1,0),0).r,a2=texelFetch(tMatCov,b+ivec2(0,1),0).r,a3=texelFetch(tMatCov,b+ivec2(1,1),0).r;
  vec4 aa=vec4(a0,a1,a2,a3);vec4 pa=step(0.002,aa)*step(aa,vec4(252.5/255.0));bool soft=pa.x+pa.y+pa.z+pa.w>0.0;
  vec4 sq=step(253.5/255.0,aa)*step(aa,vec4(254.5/255.0));bool box=!soft&&sq.x+sq.y+sq.z+sq.w>0.0;
  aa=min(aa*(255.0/253.0),vec4(1.0));
  if(box)u=clamp((u-0.5)/max(mfW,vec2(1e-4))+0.5,0.0,1.0);
  float c=mix(mix(aa.x,aa.y,u.x),mix(aa.z,aa.w,u.x),u.y);
  float g=abs(mix(aa.y-aa.x,aa.w-aa.z,u.y))*mfW.x+abs(mix(aa.z-aa.x,aa.w-aa.y,u.x))*mfW.y;
  float p=soft||box?c:clamp((c-0.5)/max(g,1e-4)+0.5,0.0,1.0);
  vec4 w=aa*vec4((1.0-u.x)*(1.0-u.y),u.x*(1.0-u.y),(1.0-u.x)*u.y,u.x*u.y);
  ivec2 bm=b;float wm=w.x;if(w.y>wm){wm=w.y;bm=b+ivec2(1,0);}if(w.z>wm){wm=w.z;bm=b+ivec2(0,1);}if(w.w>wm){wm=w.w;bm=b+ivec2(1,1);}
  int mi=int(texelFetch(tMatId,bm,0).r*255.0+0.5);
  if(mi>0&&p>0.0){vec4 inf=uMatInfo[mi];matC=inf.rgb;matP=p*min(vMatA,1.0);float ly=uMatLayer[mi];
    // Mud: damp then cracked as the soil water drops (its colour alone where its textures aren't drawn)
    vec3 mk=vec3(1.0);float d1=0.0,d2=0.0;
    if(mi==${MUD_ID}){d1=1.0-smoothstep(0.3,0.55,soilW);d2=1.0-smoothstep(0.06,0.22,soilW);mk=mix(mix(vec3(1.0),uMudC1,d1),uMudC2,d2);matC*=mk;}
    if(texMix>0.5&&ly>=0.0){vec2 uv=vWXZ*inf.a;vec3 tx=texture(tMatArr,vec3(uv,ly)).rgb;
      if(mi==${MUD_ID}){if(uMudL.x>=0.0){tx=mix(tx,texture(tMatArr,vec3(uv,uMudL.x)).rgb,d1);tx=mix(tx,texture(tMatArr,vec3(uv,uMudL.y)).rgb,d2);}else tx*=mk;}
      matC=mix(matC,clamp(tx,vec3(0.0),3.0*inf.rgb*mk),texBase);}}
}
`:'';
// after the vertex colour, which has turned the colour linear (core.js): the material over the ground, turned linear
// the same way and darkened by mud and rain as the ground is
const matGlslPost=()=>MAT_GL2?'if(matP>0.0){vec3 mc=matC*(1.0-0.19*mudF)*(1.0-0.12*rainF);mc=mix(mc/12.92,pow((mc+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),mc));diffuseColor.rgb=mix(diffuseColor.rgb,mc,matP);}\n':'';
const matImg={};let matLayers=[];
// rebuilds the texture array when the materials painted on the map (and loaded) change; the images load on first use.
// Skipped while the ground detail is off (Low graphics), where the shader never reads it
function matTexUpdate(){if(!MAT_GL2||!texOn||!gfxDetail)return;
  const used=new Uint8Array(MAT_MAX);for(let q=0;q<ED_M.length;q++)used[ED_M[q]]=1;
  // ids for the library, names for Mud's drier looks
  const want=[];for(let m=1;m<=MAT_LIST.length;m++)if(used[m])want.push(m);
  if(used[MUD_ID])for(const st of MUD_STAGES)want.push(st.id);
  const ready=[];
  for(const m of want){let im=matImg[m];
    if(!im){im=matImg[m]=new Image();im.onload=matTexUpdate;im.src=`textures/${typeof m==='number'?MAT_LIST[m-1].id:m}.jpg`}
    if(im.complete&&im.naturalWidth)ready.push(m)}
  if(ready.length===matLayers.length&&ready.every((m,i)=>m===matLayers[i]))return;
  const T=512,L=Math.max(1,ready.length),data=new Uint8Array(T*T*4*L),cv=document.createElement('canvas');cv.width=cv.height=T;
  const x2=cv.getContext('2d');ready.forEach((m,l)=>{x2.drawImage(matImg[m],0,0,T,T);data.set(x2.getImageData(0,0,T,T).data,l*T*T*4)});
  const t=new THREE.DataTexture2DArray(data,T,T,L);t.format=THREE.RGBAFormat;t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;
  if(matU.tMatArr.value)matU.tMatArr.value.dispose();matU.tMatArr.value=t;
  matU.uMatLayer.value.fill(-1);ready.forEach((m,l)=>{if(typeof m==='number')matU.uMatLayer.value[m]=l});
  const l1=ready.indexOf(MUD_STAGES[0].id),l2=ready.indexOf(MUD_STAGES[1].id);matU.uMudL.value.set(l1>=0&&l2>=0?l1:-1,l2);matLayers=ready}
