// Corley's Island: the material library the map editor paints onto the ground (Paint tool): ground covers, concrete
// and paving, steel, brick and stone, wood and more. Each is a seamless 512 px texture in textures/ (OpenAI GPT Image,
// made tileable by tools/textures.py) with its mean colour, which the ground's vertex colours take everywhere and the
// texture's detail rides on (Medium and High graphics, WebGL2). The painted ids live in ED_M (terrain.js). Mud has two
// extra textures for when it dries (MUD_STAGES).
// pbr:1 marks a material that also has relief and sheen maps (textures/<id>_n.jpg and _r.jpg, from tools/pbr.py): on High graphics (the
// Material relief setting) the ground shader tilts its lighting by the normal map and takes its sheen from the roughness map and the rain.
// The strengths are the Ground look tunings (tune.js), fading with distance so far ground does not shimmer.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// A material's saved id is its place in MAT_LIST plus one (0 is the natural ground): only ever add to the end.
// ft: how many feet one tile of the texture covers; c: its mean colour (sRGB, from tools/textures.py); sh: how shiny it is
// (0 to 1, none if left out): sharp sun highlights and the sky mirrored in it, on the ground and on blocks
const MAT_CATS=['Ground','Concrete and paving','Steel','Brick and stone','Wood and more'];
const MAT_LIST=[
  {id:'gravel',n:'Crushed gravel',cat:0,ft:4,c:[0.554,0.545,0.461],pbr:1},
  {id:'riverrock',n:'River rock',cat:0,ft:2.5,c:[0.595,0.572,0.538],pbr:1},
  {id:'sand',n:'Sand',cat:0,ft:8,c:[0.709,0.620,0.443],pbr:1},
  {id:'dirt2',n:'Topsoil',cat:0,ft:4.6,c:[0.329,0.245,0.200],pbr:1},
  {id:'clay',n:'Dry clay',cat:0,ft:6,c:[0.580,0.424,0.264],pbr:1},
  {id:'mud',n:'Mud',cat:0,ft:6,c:[0.265,0.181,0.121]},
  {id:'mulch',n:'Wood mulch',cat:0,ft:4,c:[0.503,0.358,0.229],pbr:1},
  {id:'grass2',n:'Lawn sod',cat:0,ft:4,c:[0.236,0.538,0.106]},
  {id:'granite',n:'Bedrock',cat:0,ft:8,c:[0.550,0.546,0.536],pbr:1},
  {id:'concrete',n:'Poured concrete',cat:1,ft:3.6,c:[0.723,0.723,0.723],pbr:1},
  {id:'concrete_broom',n:'Broom-finish concrete',cat:1,ft:6,c:[0.664,0.651,0.635],pbr:1},
  {id:'concrete_old',n:'Old concrete',cat:1,ft:8,c:[0.596,0.579,0.533],pbr:1},
  {id:'aggregate',n:'Exposed aggregate',cat:1,ft:4,c:[0.718,0.712,0.708],pbr:1},
  {id:'pavers',n:'Concrete pavers',cat:1,ft:6.6,c:[0.536,0.537,0.512],pbr:1},
  {id:'cmu',n:'Concrete block',cat:1,ft:2.67,c:[0.533,0.529,0.527],pbr:1},
  {id:'asphalt',n:'Asphalt',cat:1,ft:8.2,c:[0.337,0.321,0.279],pbr:1},
  {id:'diamond',n:'Diamond plate',cat:2,ft:3,c:[0.434,0.389,0.336],pbr:1},
  {id:'rustplate',n:'Steel road plate',cat:2,ft:8,c:[0.312,0.238,0.196],pbr:1},
  {id:'corrugated',n:'Corrugated steel',cat:2,ft:1.8,c:[0.509,0.508,0.506],pbr:1},
  {id:'grating',n:'Bar grating',cat:2,ft:3,c:[0.300,0.331,0.357],pbr:1},
  {id:'rebar',n:'Rebar mat',cat:2,ft:4,c:[0.360,0.327,0.307],pbr:1},
  {id:'yellowsteel',n:'Yellow steel',cat:2,ft:4,c:[0.911,0.701,0.067]},
  {id:'brick',n:'Red brick',cat:3,ft:7.9,c:[0.585,0.458,0.389],pbr:1},
  {id:'brick_old',n:'Old brick',cat:3,ft:6,c:[0.522,0.416,0.328],pbr:1},
  {id:'herringbone',n:'Brick pavers',cat:3,ft:5.7,c:[0.575,0.441,0.366],pbr:1},
  {id:'cobble',n:'Cobblestone',cat:3,ft:3.8,c:[0.547,0.540,0.508],pbr:1},
  {id:'flagstone',n:'Flagstone',cat:3,ft:6.6,c:[0.554,0.515,0.430],pbr:1},
  {id:'plywood',n:'Plywood',cat:4,ft:4,c:[0.889,0.736,0.526],pbr:1},
  {id:'planks',n:'Deck planks',cat:4,ft:7.9,c:[0.573,0.506,0.390],pbr:1},
  {id:'shingles',n:'Roof shingles',cat:4,ft:2.5,c:[0.237,0.243,0.255],pbr:1},
  {id:'fabric',n:'Landscape fabric',cat:4,ft:6,c:[0.138,0.141,0.143]},
  {id:'steel_polished',n:'Polished steel',cat:2,ft:4,c:[0.652,0.651,0.652],sh:1},
  {id:'gravel_wet',n:'Wet gravel',cat:0,ft:4,c:[0.349,0.327,0.303],sh:0.3,pbr:1}];
// the owner's own textures (ownmat.js) come after the library: ids MAT_OWN0 (41) and up, the gap left for more built-in
// ones, each kept for good once given. Known ones are cached on the device (bhd_mats), so a map that uses them draws
// them from the start; one not known yet holds its place in grey until the server's list arrives
const MAT_MAX=72,MAT_OWN0=41,MAT_BUILT=MAT_LIST.length,MAT_OWN_LS='bhd_mats';
// a material's entry by id, a grey stand-in for an own texture this device hasn't heard of yet; undefined for none
const matDef=m=>MAT_LIST[m-1]||(m>=MAT_OWN0&&m<MAT_MAX?{id:'own'+m,n:'Your texture (loading)',cat:0,ft:4,c:[0.5,0.5,0.5],own:1,ph:1}:undefined);
const matIdOk=m=>m>0&&!!matDef(m);
// one cached own texture into the library: {i: id, n, cat, ft, c, sh, th: thumbnail data URL, t: when published}
function matOwnTake(o){if(!o||!(o.i>=MAT_OWN0&&o.i<MAT_MAX)||typeof o.n!=='string'||!Array.isArray(o.c)||o.c.length!==3||!(o.ft>0))return false;
  MAT_LIST[o.i-1]={id:'own'+o.i,n:o.n.slice(0,40),cat:MAT_CATS[o.cat]?o.cat|0:0,ft:Math.min(40,Math.max(0.5,+o.ft)),c:o.c.map(v=>Math.min(1,Math.max(0,+v||0))),
    sh:Math.min(1,Math.max(0,+o.sh||0))||undefined,th:typeof o.th==='string'&&o.th.startsWith('data:image/')?o.th:'',t:+o.t||0,own:1};return true}
try{const a=JSON.parse(localStorage.getItem(MAT_OWN_LS)||'[]');if(Array.isArray(a))a.forEach(matOwnTake)}catch(e){}
// painted Mud dries out (rain.js) through two more looks: damp and matte, then pale and cracked; c as for MAT_LIST
const MUD_STAGES=[{id:'mud_drying',c:[0.446,0.323,0.221]},{id:'mud_cracked',c:[0.658,0.539,0.408]}];
// ---------- textures on the ground ----------
// WebGL2 (nearly every device): the ground shader draws the painted materials itself, per pixel, so a hard edge is a
// sharp line wherever it falls between the mesh's vertices, with the texture on Medium and High graphics. Without
// WebGL2 the vertex colours carry the materials' plain colours (matTint, terrain.js), edges blurred over a cell
const MAT_GL2=true; // three.js draws with WebGL 2 only (since r163)
// the ground shader's material uniforms: the painted-id and cover maps (one texel per editor cell, ED_M and ED_A, set
// up in terrain.js), the texture array holding just the materials the map uses, each id's mean colour and tiles per
// metre, and its layer; for Mud, the layers of its drier looks and their colours over its own
const matU={tMatId:{value:null},tMatCov:{value:null},tMatArr:{value:null},uMatInfo:{value:[]},uMatLS:{value:new Float32Array(MAT_MAX*2)},uMudL:{value:new THREE.Vector2(-1,-1)},
  uMatN:{value:new Float32Array(MAT_MAX).fill(-1)},texPbr:{value:0},uPbr:{value:new THREE.Vector4(1,1,1,55)},uMudC1:{value:new THREE.Vector3()},uMudC2:{value:new THREE.Vector3()},tSkyEnv:{value:skyEnv}};
// uMatLS: each id's texture layer (-1 none loaded) and shine
{const w=MAT_LIST.find(m=>m&&m.id==='mud').c,r=(c,i)=>c[i]/w[i];matU.uMudC1.value.set(r(MUD_STAGES[0].c,0),r(MUD_STAGES[0].c,1),r(MUD_STAGES[0].c,2));matU.uMudC2.value.set(r(MUD_STAGES[1].c,0),r(MUD_STAGES[1].c,1),r(MUD_STAGES[1].c,2))}
for(let m=0;m<MAT_MAX;m++)matU.uMatInfo.value.push(new THREE.Vector4(1,1,1,1));
// an id's colour, tile size and shine into the shader's uniforms (again when an own texture arrives or changes)
function matUSet(m){const d=matDef(m);if(d)matU.uMatInfo.value[m].set(d.c[0],d.c[1],d.c[2],1/(d.ft*0.3048));matU.uMatLS.value[m*2+1]=d&&d.sh||0}
for(let m=0;m<MAT_MAX;m++){matU.uMatLS.value[m*2]=-1;matUSet(m)}
const MAT_GLSL_HEAD=MAT_GL2?`precision highp sampler2DArray;
uniform sampler2D tMatId;
uniform sampler2D tMatCov;
uniform sampler2DArray tMatArr;
uniform vec4 uMatInfo[${MAT_MAX}];
uniform vec2 uMatLS[${MAT_MAX}];
uniform float uMatN[${MAT_MAX}];
uniform float texPbr;
uniform vec4 uPbr;
uniform samplerCube tSkyEnv;
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
const matGlsl=()=>MAT_GL2?`float matP=0.0,matS=0.0,matT=1.0,matG=1.0,matNp=0.0;vec3 matC=vec3(1.0),matNt=vec3(0.0,0.0,1.0);
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
  if(mi>0&&p>0.0){vec4 inf=uMatInfo[mi];matC=inf.rgb;matP=p*min(vMatA,1.0);vec2 ls=uMatLS[mi];float ly=ls.x;matS=ls.y*matP*(1.0-mudF);
    // Mud: damp then cracked as the soil water drops (its colour alone where its textures aren't drawn)
    vec3 mk=vec3(1.0);float d1=0.0,d2=0.0;
    if(mi==${MUD_ID}){d1=1.0-smoothstep(0.3,0.55,soilW);d2=1.0-smoothstep(0.06,0.22,soilW);mk=mix(mix(vec3(1.0),uMudC1,d1),uMudC2,d2);matC*=mk;}
    if(texMix>0.5&&ly>=0.0){vec2 uv=vWXZ*inf.a;vec4 tx4=texture(tMatArr,vec3(uv,ly));vec3 tx=tx4.rgb;
      float nl=uMatN[mi];if(texPbr>0.5&&nl>=0.0){
        // relief and sheen (High): the normal map, faded out with distance (it only shimmers far off) and softened where rain films the
        // surface; the roughness map in the alpha scales the sheen, and rain adds to it (uPbr: relief, sheen, rain sheen, fade-out distance)
        float pd=length(vWP-cameraPosition);matG=clamp(tx4.a*2.0,0.0,2.0);matNt=texture(tMatArr,vec3(uv,nl)).rgb*2.0-1.0;
        matNp=matP*uPbr.x*(1.0-smoothstep(0.45*uPbr.w,uPbr.w,pd))*(1.0-0.3*rainF);
        matS=(ls.y+0.35*uPbr.z*rainF)*matP*(1.0-mudF)*matG*uPbr.y;}
      if(mi==${MUD_ID}){if(uMudL.x>=0.0){tx=mix(tx,texture(tMatArr,vec3(uv,uMudL.x)).rgb,d1);tx=mix(tx,texture(tMatArr,vec3(uv,uMudL.y)).rgb,d2);}else tx*=mk;}
      matC=mix(matC,clamp(tx,vec3(0.0),3.0*inf.rgb*mk),texBase);matT=mix(1.0,clamp(dot(tx,vec3(1.0))/dot(inf.rgb,vec3(1.0)),0.0,2.0),texBase);}}
}
`:'';
// after the vertex colour, which has turned the colour linear (core.js): the material over the ground, turned linear
// the same way and darkened by mud and rain as the ground is
const matGlslPost=()=>MAT_GL2?'if(matP>0.0){vec3 mc=matC*(1.0-0.19*mudF)*(1.0-0.12*rainF);mc=mix(mc/12.92,pow((mc+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),mc));diffuseColor.rgb=mix(diffuseColor.rgb,mc,matP);}\n':'';
// shiny materials (sh), in the ground's lighting: a strong, tight sun highlight (after the specular map, then the shininess
// after the Phong setup), and the sky cube map mirrored in it, strong face-on as metal is and stronger still at grazing
// angles, over a darker diffuse (before the lights end); the texture's grain (matT) runs through the mirror too, so
// brushed steel shows its brushing
// a normal map (a material's pbr maps, High graphics): the ground is lit from its tilted normal. The map's x runs east and its y
// south (the texture's u and v on the ground), so it tilts the world normal that way
const matGlslNorm=()=>MAT_GL2?'if(matNp>0.0){vec3 mnW=inverseTransformDirection(normal,viewMatrix);mnW=normalize(mnW+vec3(matNt.x,0.0,matNt.y)*1.1*matNp);normal=transformDirection(mnW,viewMatrix);}\n':'';
// the Ground look tunings (tune.js) into the shader, read live each frame (relief, sheen, rain sheen, fade-out distance in metres)
function matPbrSync(){matU.uPbr.value.set(TU.pbrRelief,TU.pbrSheen,TU.pbrRain,TU.pbrFar);
  // the natural dirt and grass (terrain.js), with the same Material relief setting
  if(typeof groundRelU!=='undefined'){groundRelU.value=matU.texPbr.value*TU.pbrGround;faceRelU.value=matU.texPbr.value*TU.pbrFace;if(groundRelU.value>0)groundRelLoad()}}
const matGlslSpec=()=>MAT_GL2?'specularStrength=mix(specularStrength,12.0,matS);\n':'';
const matGlslShin=()=>MAT_GL2?'material.specularShininess=mix(material.specularShininess,90.0,matS);\n':'';
const matGlslRefl=()=>MAT_GL2?`if(matS>0.0){vec3 mrN=inverseTransformDirection(normal,viewMatrix);vec3 mrV=normalize(vWP-cameraPosition);
  vec3 mrE=textureCube(tSkyEnv,reflect(mrV,mrN)).rgb;float mrF=0.35+0.65*pow(1.0-clamp(dot(-mrV,mrN),0.0,1.0),5.0);
  reflectedLight.directDiffuse*=1.0-0.7*matS;reflectedLight.indirectDiffuse*=1.0-0.7*matS;reflectedLight.indirectSpecular+=mrE*mrF*matT*matS;}
`:'';
const matImg={};let matLayers=[];
// an own texture's picture comes from the server (ownmat.js sets this); until it does, its colour shows alone
let matOwnImg=null;
// the image of a library id (or a Mud stage's name), loading on first use; calls back once it is in
function matImgOf(m,cb){let im=matImg[m];
  if(!im){im=matImg[m]=new Image();const d=typeof m==='number'?matDef(m):null;
    if(d&&d.own){if(matOwnImg)matOwnImg(m,im)}else im.src=`textures/${d?d.id:m}.jpg`}
  if(cb){if(im.complete&&im.naturalWidth)cb(im);else im.addEventListener('load',()=>cb(im),{once:true})}
  return im}
// rebuilds the texture array when the materials painted on the map (and loaded) change; the images load on first use.
// Skipped while the ground detail is off (Low graphics), where the shader never reads it
function matTexUpdate(){if(!MAT_GL2||!texOn||!gfxDetail)return;
  const used=new Uint8Array(MAT_MAX);for(let q=0;q<ED_M.length;q++)used[ED_M[q]]=1;
  // ids for the library, names for Mud's drier looks
  const want=[];for(let m=1;m<MAT_MAX;m++)if(used[m]&&matDef(m))want.push(m);
  // relief and sheen maps (normal map as a layer of its own, roughness into the alpha of the colour layer) for the materials that have them
  if(matU.texPbr.value)for(let m=1;m<MAT_MAX;m++)if(used[m]&&matDef(m).pbr)want.push(matDef(m).id+'_n',matDef(m).id+'_r');
  if(used[MUD_ID])for(const st of MUD_STAGES)want.push(st.id);
  const ready=[];
  for(const m of want){const fresh=!matImg[m],im=matImgOf(m);if(fresh)im.addEventListener('load',matTexUpdate);
    if(im.complete&&im.naturalWidth)ready.push(m)}
  if(ready.length===matLayers.length&&ready.every((m,i)=>m===matLayers[i]))return;
  const layers=ready.filter(m=>!(typeof m==='string'&&m.endsWith('_r')));
  const T=512,L=Math.max(1,layers.length),data=new Uint8Array(T*T*4*L),cv=document.createElement('canvas');cv.width=cv.height=T;
  const x2=cv.getContext('2d');layers.forEach((m,l)=>{x2.drawImage(matImg[m],0,0,T,T);data.set(x2.getImageData(0,0,T,T).data,l*T*T*4);
    const d=typeof m==='number'?matDef(m):null,r=d&&d.pbr&&matImg[d.id+'_r'];
    if(r&&r.complete){x2.drawImage(r,0,0,T,T);const q=x2.getImageData(0,0,T,T).data,o=l*T*T*4;for(let i=3;i<q.length;i+=4)data[o+i]=255-q[i-3]}});
  const t=new THREE.DataArrayTexture(data,T,T,L);t.format=THREE.RGBAFormat;t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;
  if(matU.tMatArr.value)matU.tMatArr.value.dispose();matU.tMatArr.value=t;
  for(let m=0;m<MAT_MAX;m++)matU.uMatLS.value[m*2]=-1;matU.uMatN.value.fill(-1);
  layers.forEach((m,l)=>{if(typeof m==='number'){matU.uMatLS.value[m*2]=l;const d=matDef(m),n=d.pbr?layers.indexOf(d.id+'_n'):-1;if(n>=0&&matImg[d.id+'_r']&&matImg[d.id+'_r'].complete)matU.uMatN.value[m]=n}});
  const l1=layers.indexOf(MUD_STAGES[0].id),l2=layers.indexOf(MUD_STAGES[1].id);matU.uMudL.value.set(l1>=0&&l2>=0?l1:-1,l2);matLayers=ready}
