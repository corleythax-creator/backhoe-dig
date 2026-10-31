// Corley's Island: rain and wet ground. Rain soaks the soil and it dries out afterwards; how much mud that makes depends
// on what is there: dug dirt, dirt yards and painted topsoil, clay and mud turn to mud, dirt roads and grass get soft,
// sand and gravel drain, rock, paving and steel stay hard. Low ground soaks faster and dries slower; sand dries fast and
// clay slow. The soak feeds the same mud rules as painted Mud (mudOf in water.js, soakAt in mud.js): ruts, puddles,
// bogging down. Rain also falls into holes and ruts, and standing rainwater drains away once it stops.
// Weather (☰ menu): Auto brings showers now and then, Rain keeps it raining, Dry holds it off. The wet ground and the
// weather save with the site (so they sync) and dry on for up to an hour while the game is closed. The Graphics setting
// only changes how much of the rain is drawn (drops, splashes, the far veil).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

// ---------- the wet grid: one point a metre over the mesa top ----------
const RW_X0=MID[0],RW_Z0=MID[2],RW_C=1,RW_NX=Math.round((MID[1]-MID[0])/RW_C)+1,RW_NZ=Math.round((MID[3]-MID[2])/RW_C)+1;
// rainW: water in the soil (0 dry, 1 soaked); rainK: how muddy that ground gets when soaked; rainDry: how fast it dries;
// rainLow: low ground collects water (above 1) and high ground sheds it
const rainW=new Float32Array(RW_NX*RW_NZ),rainK=new Float32Array(RW_NX*RW_NZ),rainDry=new Float32Array(RW_NX*RW_NZ),rainLow=new Float32Array(RW_NX*RW_NZ);
const SOAK_RATE=0.004,DRY_RATE=0.0008,RAIN_IN=0.0004,RAIN_DRAIN=0.0008;
// painted materials: [how muddy, how fast it dries]. Mud is the soil that turns to mud most: newly painted (or loaded
// with a map) it starts soaked, then dries out like the rest over about 20 minutes, through damp to cracked (how it
// looks: materials.js), and rain soaks it again. rainMud marks the points painted Mud, to catch new paint
const rainMud=new Uint8Array(RW_NX*RW_NZ);
const MAT_WET={mud:[1,1],dirt2:[1,1],clay:[1,0.5],sand:[0.2,2.5],gravel:[0.15,2],gravel_wet:[0.15,2],riverrock:[0.1,2],mulch:[0.4,1.2],grass2:[0.55,1]};
function rainBase(i0,i1,j0,j1){
  for(let j=Math.max(0,j0);j<=Math.min(RW_NZ-1,j1);j++)for(let i=Math.max(0,i0);i<=Math.min(RW_NX-1,i1);i++){const x=RW_X0+i*RW_C,z=RW_Z0+j*RW_C,k=j*RW_NX+i;
    const h=baseHeight(x,z),sl=(Math.abs(baseHeight(x+0.5,z)-baseHeight(x-0.5,z))+Math.abs(baseHeight(x,z+0.5)-baseHeight(x,z-0.5)));
    let m=0.45,d=1;
    if(mesaR(x,z)>EDGE-0.5||sl>0.8||h<WATER+2.8)m=sl>0.8?0:0.2;
    else{if(roadAmt(x,z)>0.5)m=0.5;if(yardAt(x,z)>0.5||edSample(ED_P,x,z)>0.3)m=1;
      const p=paintAt(x,z);if(p){const w=MAT_WET[matDef(p).id];if(w){m=w[0];d=w[1]}else m=0}}
    const pm=paintAt(x,z)===MUD_ID?1:0;if(pm&&!rainMud[k])rainW[k]=1;rainMud[k]=pm;
    let avg=0;for(const [a,b] of [[-4,0],[4,0],[0,-4],[0,4]])avg+=baseHeight(x+a,z+b);
    rainK[k]=m;rainDry[k]=d;rainLow[k]=Math.max(0.6,Math.min(1.8,1+(avg/4-h)*1.5))}}
rainBase(0,RW_NX-1,0,RW_NZ-1);
const rwIdx=(x,z)=>{const i=Math.round((x-RW_X0)/RW_C),j=Math.round((z-RW_Z0)/RW_C);return i<0||j<0||i>=RW_NX||j>=RW_NZ?-1:j*RW_NX+i};
// how much mud the rain makes at x,z (0-1); dug or dumped ground in the dig zone counts as dirt (rainSoakK)
function rainSoakAt(x,z){const k=rwIdx(x,z);return k<0?0:ss(0.25,0.9,rainW[k])*rainK[k]}
function rainSoakK(k){const x=gX((k%V)),z=gZ(((k/V)|0)),r=rwIdx(x,z);if(r<0)return 0;
  return ss(0.25,0.9,rainW[r])*(Math.abs(H[k]-H0[k])>0.04?1:rainK[r])}
function rainEdRefresh(x0,x1,z0,z1){rainBase(Math.floor((x0-RW_X0)/RW_C)-1,Math.ceil((x1-RW_X0)/RW_C)+1,Math.floor((z0-RW_Z0)/RW_C)-1,Math.ceil((z1-RW_Z0)/RW_C)+1);rainTexDirty=true}

// ---------- weather ----------
// r: how hard it is raining now (0-1), easing toward want; next: seconds until Auto changes its mind
// c: how much of the sky the cloud covers (0-1); a shower's clouds roll in first and the rain follows them (storm.js)
const weather={mode:'auto',r:0,want:0,next:900,c:0.18};
try{const m=localStorage.getItem('bhd_weather');if(['auto','rain','dry'].includes(m))weather.mode=m}catch(e){}
function setWeather(m,picked){weather.mode=m;
  if(m==='rain')weather.want=0.8;else if(m==='dry')weather.want=0;else weather.next=Math.min(weather.next,60);
  document.querySelectorAll('.sizes button[data-w]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.w===m));
  if(picked){try{localStorage.setItem('bhd_weather',m)}catch(e){}toast(say(m==='rain'?'wxRain':m==='dry'?'wxDry':'wxAuto'),'good');site.dirty=true}}
document.querySelectorAll('.sizes button[data-w]').forEach(b=>b.onclick=()=>setWeather(b.dataset.w,true));
setWeather(weather.mode,false);
let rainT=0,rainTexDirty=true,rainWas=false,rainSaveT=0;
function rainSim(sec){const r=weather.r;
  for(let k=0;k<rainW.length;k++){if(!rainK[k]&&!rainW[k])continue;let w=rainW[k];
    if(r>0.02)w+=r*SOAK_RATE*TU.soak*rainLow[k]*(1-w)*sec;else w-=DRY_RATE*1200/TU.mudDry*rainDry[k]/rainLow[k]*sec;
    rainW[k]=Math.max(0,Math.min(1,w))}}
function rainTick(dt){
  if(!bench.on){
    if(weather.mode==='auto'){weather.next-=dt;
      if(weather.next<=0){if(weather.want>0){weather.want=0;weather.next=TU.rainGap*(300+Math.random()*420)/510}else{weather.want=Math.min(1,(0.35+Math.random()*0.65)*TU.rainHard);weather.next=TU.rainLen*(90+Math.random()*180)/180}}}
    weather.c+=Math.max(-dt/60,Math.min(dt/40,(weather.want>0||weather.r>0.1?1:0.18)-weather.c));
    weather.r+=Math.max(-dt*0.05,Math.min(dt*0.05,weather.want*ss(0.55,0.85,weather.c)-weather.r))}
  const raining=weather.r>0.05;
  // for the Stats panel (stats.js)
  if(raining){stats.rainTime+=dt;if(weather.r>stats.rainTop)stats.rainTop=weather.r}
  if(raining!==rainWas){rainWas=raining;if(raining){toast(say('rainIn'),'',3600);stats.showers++;statDirty=true}else if(!bench.on)toast(say('rainOut'),'',3600)}
  // once a second: soak or dry the soil, and show it
  rainT-=dt;if(rainT<=0){rainT+=1;let any=weather.r>0.02;if(!any)for(let k=0;k<rainW.length;k+=7)if(rainW[k]>0){any=true;break}
    if(any){rainSim(1);rainTexDirty=true;if((rainSaveT-=1)<=0){rainSaveT=20;site.dirty=true}}}
  if(rainTexDirty)rainTexUpdate();
  rainFxTick(dt)}
// the save: soil water (bytes, base64) and the weather, with the time so drying carries on while the game is closed
function rainSave(){const b=new Uint8Array(rainW.length);for(let k=0;k<b.length;k++)b[k]=Math.round(rainW[k]*255);
  return {w:siteB64(b),pm:1,r:+weather.r.toFixed(3),c:+weather.c.toFixed(3),want:+weather.want.toFixed(3),next:Math.round(weather.next),t:Date.now()}}
function rainLoad(d){if(!d||typeof d.w!=='string')return;let b;try{b=siteUnB64(d.w)}catch(e){return}if(b.length!==rainW.length)return;
  for(let k=0;k<b.length;k++)rainW[k]=b[k]/255;
  // saved before painted Mud could dry (pm), when it was always soaked: it starts soaked
  if(!d.pm)for(let k=0;k<b.length;k++)if(rainMud[k])rainW[k]=1;
  if(isFinite(d.r))weather.r=d.r;weather.c=isFinite(d.c)?d.c:weather.r>0.05?1:0.18;if(isFinite(d.want)&&weather.mode==='auto')weather.want=d.want;if(isFinite(d.next))weather.next=d.next;
  // dry on for the time the game was closed (up to an hour; it is not raining meanwhile)
  const gone=isFinite(d.t)?Math.min(3600,Math.max(0,(Date.now()-d.t)/1000)):0;
  if(gone>5&&weather.mode!=='rain'){const r=weather.r;weather.r=0;for(let s=0;s<gone;s+=10)rainSim(Math.min(10,gone-s));weather.r=weather.mode==='auto'&&weather.next>gone?r:0;rainDrain(gone)}
  rainTexDirty=true}
function rainReset(){rainW.fill(0);rainTexDirty=true}
// standing rainwater above the water table drains: in the dig zone, and the mud tiles
function rainDrain(sec){const d=RAIN_DRAIN*TU.puddleDrain*sec;
  for(let j=cJ0;j<=cJ1;j++)for(let i=cI0;i<=cI1;i++){const k=j*V+i;if(Wt[k]<-1e8)continue;const g=H0[k]-TU.wtDepth;if(Wt[k]>g){Wt[k]=Math.max(g,Wt[k]-d);if(Wt[k]<=H[k]+0.001)Wt[k]=-1e9}}
  if(FW)for(let k=0;k<FW.length;k++)if(FW[k]>-1e8){FW[k]-=d;if(FW[k]<=FH0[k]+FD[k]+0.001)FW[k]=-1e9}}

// ---------- how it looks ----------
// the ground shader reads the wet grid from a small texture: r = wet surface (darker, a sheen), g = mud, b = the soil
// water itself, which picks painted Mud's look (wetU, terrain.js)
const rainTex=new THREE.DataTexture(new Uint8Array(RW_NX*RW_NZ*4),RW_NX,RW_NZ,THREE.RGBAFormat);
rainTex.magFilter=rainTex.minFilter=THREE.LinearFilter;wetU.tWet.value=rainTex;
wetU.uWetO.value.set(RW_X0-RW_C/2,RW_Z0-RW_C/2,1/(RW_NX*RW_C),1/(RW_NZ*RW_C));
function rainTexUpdate(){rainTexDirty=false;const a=rainTex.image.data;
  for(let k=0;k<rainW.length;k++){const w=rainW[k];a[k*4]=Math.round(Math.min(1,w*1.6+weather.r*0.5)*255);a[k*4+1]=Math.round(ss(0.25,0.9,w)*rainK[k]*255);a[k*4+2]=Math.round(w*255)}
  rainTex.needsUpdate=true}
// ---------- soil wetness on the big map ----------
// how wet the soil is (rainW), off, at every level (pale to deep blue), or only where it is at least damp, wet or
// soaked; standing water shows bright blue, and in the dig zone wet spoil and churned mud count too. It can show on
// the ground itself as well (uWetView in the ground shader). Kept on this device
const WET_OPTS=[['off','Off',0],['all','All',0],['damp','Damp+',0.3],['wet','Wet+',0.55],['soaked','Soaked',0.9]],WET_KEY='bhd_wetview';
let wetView='off',wetGround=false,wetCv=null,wetDigCv=null,wetMapT=-1e9;
try{const o=JSON.parse(localStorage.getItem(WET_KEY)||'null');if(o&&WET_OPTS.some(w=>w[0]===o.v)){wetView=o.v;wetGround=!!o.g}}catch(e){}
const wetMin=()=>WET_OPTS.find(w=>w[0]===wetView)[2];
// one soil value (0-1, or 2 for standing water) to a pixel
function wetPx(D,o,w,min){if(w>=2){D[o]=40;D[o+1]=170;D[o+2]=255;D[o+3]=235;return}
  if(min>0){if(w>=min){D[o]=30;D[o+1]=90;D[o+2]=210;D[o+3]=190}return}
  if(w<0.05)return;const t=(w-0.05)/0.95;D[o]=175-165*t;D[o+1]=220-180*t;D[o+2]=245-85*t;D[o+3]=140+90*t}
function wetImages(){const min=wetMin();
  if(!wetCv){wetCv=document.createElement('canvas');wetCv.width=RW_NX;wetCv.height=RW_NZ;wetDigCv=document.createElement('canvas');wetDigCv.width=wetDigCv.height=200}
  let g=wetCv.getContext('2d'),img=g.createImageData(RW_NX,RW_NZ),D=img.data;
  for(let j=0;j<RW_NZ;j++)for(let i=0;i<RW_NX;i++){const x=RW_X0+i*RW_C,z=RW_Z0+j*RW_C,k=j*RW_NX+i;
    if(inDig(x,z))continue;wetPx(D,k*4,waterAt(x,z)?2:rainW[k],min)}
  g.putImageData(img,0,0);
  g=wetDigCv.getContext('2d');img=g.createImageData(200,200);D=img.data;
  for(let py=0;py<200;py++)for(let px=0;px<200;px++){const i=px*2,j=py*2,k=j*V+i,r=rwIdx(gX(i),gZ(j));
    wetPx(D,(py*200+px)*4,Wt[k]>H[k]+0.003?2:Math.max(r<0?0:rainW[r],mudA[k]),min)}
  g.putImageData(img,0,0);wetMapT=timeU.value}
// drawMap (maps.js) calls this on the big map, over the ground and the dug area
function wetDrawOn(g,X,Y,sc){if(wetView==='off')return;if(timeU.value-wetMapT>1||timeU.value<wetMapT)wetImages();
  g.save();g.imageSmoothingEnabled=true;g.drawImage(wetCv,X(RW_X0-RW_C/2),Y(RW_Z0-RW_C/2),RW_NX*RW_C*sc,RW_NZ*RW_C*sc);
  g.drawImage(wetDigCv,X(GX0),Y(GZ0),S*sc,S*sc);g.restore()}
function wetSet(v,gr){wetView=v;if(gr!==undefined)wetGround=gr;try{localStorage.setItem(WET_KEY,JSON.stringify({v:wetView,g:wetGround}))}catch(e){}wetMapT=-1e9;wetSync()}
function wetSync(){document.querySelectorAll('#wetBar [data-wv]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.wv===wetView));
  const on=wetView!=='off',min=wetMin();$('#wetKey').hidden=!on;
  $('#wetKey i').style.background=min>0?'linear-gradient(90deg,rgba(30,90,210,.15),rgb(30,90,210) 60%,rgb(40,170,255))':'linear-gradient(90deg,rgb(175,220,245),rgb(10,40,160) 85%,rgb(40,170,255))';
  $('#wetLo').textContent=min>0?`Drier than ${WET_OPTS.find(w=>w[0]===wetView)[1].replace('+','').toLowerCase()}: clear`:'Dry (clear) to soaked';
  const b=$('#wetGround');b.setAttribute('aria-pressed',wetGround);b.textContent=wetGround?'On the ground too: on':'Show on the ground too';
  wetU.uWetView.value=on&&wetGround?1:0;wetU.uWetMin.value=min;
  if(typeof drawBig==='function')drawBig()}
{const bar=$('#wetBar');for(const [k,n] of WET_OPTS){const b=document.createElement('button');b.dataset.wv=k;b.textContent=n;b.onclick=()=>wetSet(k);bar.appendChild(b)}}
$('#wetGround').onclick=()=>wetSet(wetView,!wetGround);
wetSync();
// shelter: roofs, cabs, buildings, bridges, placed props and blocks keep the rain off. They sit on RAIN_LAYER (core.js);
// while it rains a camera high above you draws their depth into a small map round you (about 260 ft across), and drops
// under anything in it are not drawn while splashes land on top of it instead. The machines join on first use
const RC_N=256,RC_S=80,RC_UP=60,RC_R=140;
const rcRT=new THREE.WebGLRenderTarget(RC_N,RC_N,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,generateMipmaps:false});
const rcCam=new THREE.OrthographicCamera(-RC_S/2,RC_S/2,RC_S/2,-RC_S/2,0.1,RC_R);rcCam.rotation.x=-Math.PI/2;rcCam.layers.set(RAIN_LAYER);
const rcDepth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:THREE.DoubleSide});
// uRC: the map's centre x, z, the camera's height and 1/width; the cover height is that height less depth x RC_R
const rcU={tCover:{value:rcRT.texture},uRC:{value:new THREE.Vector4(0,0,-1e5,1/RC_S)},uRCR:{value:RC_R}};
const RC_GLSL='uniform sampler2D tCover;uniform vec4 uRC;uniform float uRCR;\n#include <packing>\n'+
  'float coverY(vec2 xz){vec2 uv=vec2((xz.x-uRC.x)*uRC.w+0.5,(uRC.y-xz.y)*uRC.w+0.5);if(uv.x<0.0||uv.y<0.0||uv.x>1.0||uv.y>1.0)return -1e5;\n'+
  'float d=unpackRGBAToDepth(texture2D(tCover,uv));return d>0.999?-1e5:uRC.z-d*uRCR;}\n';
let rcTagged=false;const rcCol=new THREE.Color();
function rcRender(){
  if(!rcTagged){rcTagged=true;for(const g of [machine,truck,skid,mower])g.traverse(o=>{if(o.isMesh&&!o.userData.noCover)o.layers.enable(RAIN_LAYER)})}
  const c=camera.position,px=RC_S/RC_N,cx=Math.round(c.x/px)*px,cz=Math.round(c.z/px)*px;
  rcCam.position.set(cx,c.y+RC_UP,cz);rcCam.updateMatrixWorld();
  // Jessica's roofs lift off while you are under them, but they still keep the rain out
  const lift=[jesRoof,jesBridgeRoof].filter(m=>m&&!m.visible);for(const m of lift)m.visible=true;
  const bg=scene.background,au=renderer.shadowMap.autoUpdate,ca=renderer.getClearAlpha(),rt=renderer.getRenderTarget();renderer.getClearColor(rcCol);
  scene.background=null;scene.overrideMaterial=rcDepth;renderer.shadowMap.autoUpdate=false;renderer.setClearColor(0xffffff,1);
  const xr=renderer.xr.enabled;renderer.xr.enabled=false;renderer.setRenderTarget(rcRT);renderer.render(scene,rcCam);renderer.xr.enabled=xr;
  renderer.setRenderTarget(rt);renderer.setClearColor(rcCol,ca);scene.background=bg;scene.overrideMaterial=null;renderer.shadowMap.autoUpdate=au;
  for(const m of lift)m.visible=false;
  rcU.uRC.value.set(cx,cz,c.y+RC_UP,1/RC_S)}
// raindrops: camera-facing streaks in a box that follows the camera, moved by the GPU. Each drop has its own length,
// speed and a slight slant of its own; the wind (rainWind, in gusts like the grass's) leans them all. A second, fainter
// layer fills a wider box past the near one, a soft veil (not on Low) of falling rain hangs in the haze further out, and streaks
// looking toward the sun light up. The counts follow the Graphics setting (rainN, rainSp); how it rains does not
const RD_BOX=new THREE.Vector3(24,16,24),RD_FAR=new THREE.Vector3(80,34,80),RAIN_WD=[0.8,0.6];
const rainWind=new THREE.Vector2(),rainSunU={value:SUN_DIR},rainSunI={value:1};
function rainDropMat(box,near,far,wid,alpha){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide,
  uniforms:Object.assign({uCam:{value:new THREE.Vector3()},uT:{value:0},uBox:{value:box},uA:{value:0},uWind:{value:rainWind},uSun:rainSunU,uSunI:rainSunI,uNear:{value:near},uFar:{value:far},uW:{value:wid},uK:{value:alpha}},rcU),
  vertexShader:RC_GLSL+'attribute vec3 aP;attribute vec4 aR;uniform vec3 uCam;uniform float uT;uniform vec3 uBox;uniform vec2 uWind;uniform vec3 uSun;uniform float uNear,uFar,uW;varying vec2 vC;varying float vF;varying float vB;\n'+
    'void main(){vec2 corner=position.xy;vec3 vel=vec3(uWind.x*(0.8+0.4*aR.y)+aR.z*0.5,-(7.5+3.0*aR.y),uWind.y*(0.8+0.4*aR.y)+aR.w*0.5);\n'+
    'vec3 p=uCam+mod(aP*uBox+vel*uT-uCam+uBox*0.5,uBox)-uBox*0.5;if(p.y<coverY(p.xz)+0.02){gl_Position=vec4(0.0,0.0,-2.0,1.0);return;}vec3 ax=normalize(vel);vec3 tc=uCam-p;float d=length(tc);tc/=d;\n'+
    'vec3 sd=normalize(cross(ax,tc));float L=(0.35+0.45*aR.x)*(0.8+0.4*aR.y);\n'+
    'vec3 w=p-ax*L*corner.y+sd*max(uW,d*0.0016)*corner.x;vC=corner;\n'+
    'vF=smoothstep(1.0,3.0,d)*(uNear>0.0?smoothstep(uNear*0.7,uNear,d):1.0)*(1.0-smoothstep(uFar*0.7,uFar,d));\n'+
    'vB=pow(max(0.0,dot(-tc,uSun)),5.0);gl_Position=projectionMatrix*viewMatrix*vec4(w,1.0);}',
  fragmentShader:'uniform float uA,uK,uSunI;varying vec2 vC;varying float vF;varying float vB;\n'+
    'void main(){float a=(1.0-vC.x*vC.x)*smoothstep(0.0,0.25,vC.y)*smoothstep(1.0,0.55,vC.y)*vF*uA*uK;float b=vB*uSunI;\n'+
    'gl_FragColor=vec4(mix(vec3(0.74,0.79,0.85),vec3(1.0,0.97,0.9),min(1.0,b*1.5)),min(1.0,a*(1.0+2.5*b)));}'})}
const rainMat=rainDropMat(RD_BOX,0,RD_BOX.x*0.5,0.006,1),rainFarMat=rainDropMat(RD_FAR,RD_BOX.x*0.42,RD_FAR.x*0.5,0.012,0.55);
let rainLines=null,rainFar=null;
function rainDropMesh(n,mat){const g=new THREE.InstancedBufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,0,1,0,0,1,1,0,-1,1,0],3));g.setIndex([0,1,2,0,2,3]);
  const p=new Float32Array(n*3),r=new Float32Array(n*4);for(let i=0;i<n*3;i++)p[i]=Math.random();for(let i=0;i<n*4;i++)r[i]=i%4<2?Math.random():Math.random()*2-1;
  g.setAttribute('aP',new THREE.InstancedBufferAttribute(p,3));g.setAttribute('aR',new THREE.InstancedBufferAttribute(r,4));g.instanceCount=n;
  const m=new THREE.Mesh(g,mat);m.frustumCulled=false;m.visible=false;m.renderOrder=3;m.userData.n=n;scene.add(m);return m}
// the veil: an open cylinder round the camera, faint falling streaks in the fog colour; nearer ground hides it
const rainVeilMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,side:THREE.BackSide,
  uniforms:{uT:{value:0},uA:{value:0},uC:{value:new THREE.Color()},uWind:{value:rainWind},uSunI:rainSunI},
  vertexShader:'varying vec3 vL;void main(){vL=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform float uT,uA,uSunI;uniform vec3 uC;uniform vec2 uWind;varying vec3 vL;\n'+
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.0),f.x),f.y);}\n'+
    'void main(){float an=atan(vL.z,vL.x)/6.2832;float lean=dot(uWind,normalize(vec2(-vL.z,vL.x)))*0.004;\n'+
    'vec2 q=vec2((an+vL.y*lean)*260.0,vL.y*0.05+uT*0.35);float s=n(q*vec2(1.0,1.0))*0.6+n(q*vec2(2.3,0.7)+3.1)*0.4;\n'+
    'float v=smoothstep(-1.0,0.1,vL.y/30.0)*(1.0-smoothstep(0.2,1.0,vL.y/30.0));\n'+
    'gl_FragColor=vec4(mix(uC,vec3(0.93,0.95,0.97),0.35+0.2*uSunI),uA*v*(0.35+0.65*s*s));}'});
const rainVeil=new THREE.Mesh(new THREE.CylinderGeometry(58,58,60,48,1,true),rainVeilMat);rainVeil.frustumCulled=false;rainVeil.visible=false;rainVeil.renderOrder=2;scene.add(rainVeil);
// splashes where drops land near the camera: little crowns of spray thrown up off firm ground, rings that spread and
// fade on puddles and the lake. One instanced draw; spawned on the CPU into a ring buffer
const SP_LIFE=[0.28,0.9];
const rsMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide,
  uniforms:Object.assign({uCam:{value:new THREE.Vector3()},uT:{value:0},uSunI:rainSunI},rcU),
  vertexShader:RC_GLSL+'attribute vec4 aS;attribute vec3 aK;uniform vec3 uCam;uniform float uT;varying vec2 vC;varying float vAge;varying float vKind;varying float vSeed;varying float vF;\n'+
    // under a roof the drop lands on the roof: a crown up there instead
    // a drip (kind 2) falls from the eave it left at aS.w, aK.y metres to the ground, as a short streak
    'void main(){vec2 corner=position.xy;vec3 b=aS.xyz;vC=corner;vSeed=aK.z;\n'+
    'if(aK.x>1.5){float tt=uT-aS.w,fall=4.9*tt*tt;if(tt<0.0||fall>aK.y){gl_Position=vec4(0.0,0.0,-2.0,1.0);return;}\n'+
    '  b.y-=fall;vec2 f=normalize(uCam.xz-b.xz);float L=0.03+0.05*min(1.0,tt*2.0);vKind=2.0;vAge=0.0;vF=1.0-smoothstep(9.0,13.0,distance(uCam,b));\n'+
    '  gl_Position=projectionMatrix*viewMatrix*vec4(b+vec3(-f.y,0.0,f.x)*corner.x*0.003+vec3(0.0,(corner.y*0.5+0.5)*L,0.0),1.0);return;}\n'+
    'float kind=aK.x,cy=coverY(b.xz);if(cy>b.y+0.25){b.y=cy+0.01;kind=0.0;}\n'+
    'float life=kind>0.5?'+SP_LIFE[1].toFixed(2)+':'+SP_LIFE[0].toFixed(2)+';float t=(uT-aS.w)/life;vAge=t;vKind=kind;\n'+
    'vec3 w;if(t<0.0||t>1.0){gl_Position=vec4(0.0,0.0,-2.0,1.0);return;}\n'+
    'if(kind>0.5){w=b+vec3(corner.x,0.0,corner.y)*aK.y;}\n'+
    'else{vec2 f=normalize(uCam.xz-b.xz);float sz=min(aK.y,0.18);w=b+vec3(-f.y,0.0,f.x)*corner.x*sz+vec3(0.0,(corner.y*0.5+0.5)*sz*1.1,0.0);}\n'+
    'vF=1.0-smoothstep(9.0,13.0,distance(uCam,b));gl_Position=projectionMatrix*viewMatrix*vec4(w,1.0);}',
  fragmentShader:'uniform float uSunI;varying vec2 vC;varying float vAge;varying float vKind;varying float vSeed;varying float vF;\n'+
    'void main(){float t=vAge,a=0.0;\n'+
    'if(vKind>1.5){gl_FragColor=vec4(0.85,0.88,0.92,(1.0-vC.x*vC.x)*0.7*vF);return;}\n'+
    'if(vKind>0.5){float r=length(vC),r1=t*0.95,r2=(t-0.22)*0.7;\n'+
    'a=smoothstep(0.09,0.0,abs(r-r1))*(1.0-t)*(1.0-t)*0.9+(t>0.22?smoothstep(0.06,0.0,abs(r-r2))*(1.0-t)*0.5:0.0);\n'+
    'a+=smoothstep(0.12,0.0,r)*smoothstep(0.25,0.0,t)*0.6;}\n'+
    'else{vec2 p=vec2(vC.x,(vC.y*0.5+0.5)*1.1);float R=0.25+0.55*sqrt(t);\n'+
    'vec2 e=vec2(p.x/R,(p.y-0.04)/(0.22*R));a=smoothstep(0.45,0.0,abs(length(e)-1.0))*0.85*(1.0-t);\n'+
    'for(int i=0;i<6;i++){float fi=float(i),s=fract(sin(vSeed*91.7+fi*12.9)*437.5);float ang=(fi+s)/6.0*6.2832;\n'+
    'float sp=0.5+0.5*s;vec2 dp=vec2(cos(ang)*sp*t*0.9,(1.6+0.8*s)*t-2.6*t*t);\n'+
    'a+=smoothstep(0.13,0.05,length(p-dp))*(1.0-t*0.6);}\n'+
    'a+=smoothstep(0.12,0.0,abs(p.x))*smoothstep(0.5*sin(3.1416*min(1.0,t*1.4)),0.0,p.y)*0.5;}\n'+
    'gl_FragColor=vec4(vec3(0.9,0.93,0.96)*(0.85+0.3*uSunI),min(1.0,a)*vF*0.75);}'});
let rsMesh=null,rsN=0,rsHead=0,rsAcc=0,rsT=0,rsS=null,rsK=null;
function rsGfx(n){if(rsMesh&&rsN===n)return;if(rsMesh){scene.remove(rsMesh);rsMesh.geometry.dispose();rsMesh=null}rsN=n;rsHead=0;if(!n)return;
  const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));g.setIndex([0,1,2,0,2,3]);
  rsS=new THREE.InstancedBufferAttribute(new Float32Array(n*4).fill(-1e4),4);rsK=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);
  rsS.setUsage(THREE.DynamicDrawUsage);rsK.setUsage(THREE.DynamicDrawUsage);g.setAttribute('aS',rsS);g.setAttribute('aK',rsK);g.instanceCount=n;
  rsMesh=new THREE.Mesh(g,rsMat);rsMesh.frustumCulled=false;rsMesh.renderOrder=3;scene.add(rsMesh)}
const rsFwd=new THREE.Vector3();
function rsTick(dt,r){if(!rsMesh)return;rsT=(rsT+dt)%1000;rsMat.uniforms.uT.value=rsT;rsMat.uniforms.uCam.value.copy(camera.position);
  // ring buffer times wrap with rsT: clear the ones born "in the future"
  if(rsT<dt){const a=rsS.array;for(let i=3;i<a.length;i+=4)a[i]=-1e4;rsS.needsUpdate=true}
  rsAcc+=r*rsN*1.6*dt;let n=Math.min(rsN>>2,rsAcc|0);rsAcc-=n;if(!n)return;
  camera.getWorldDirection(rsFwd);const fl=Math.hypot(rsFwd.x,rsFwd.z)||1,cx=camera.position.x+rsFwd.x/fl*5,cz=camera.position.z+rsFwd.z/fl*5;
  const S4=rsS.array,K3=rsK.array;let any=false;
  while(n-->0){const ang=Math.random()*6.2832,rad=Math.sqrt(Math.random())*11,x=cx+Math.cos(ang)*rad,z=cz+Math.sin(ang)*rad;
    let y=surfAt(x,z),ring=0;if(y<WATER){y=WATER;ring=1}else{const w=waterAt(x,z);if(w&&w.y>=y-0.02){y=w.y;ring=1}}
    if(Math.abs(y-camera.position.y)>25)continue;const i=rsHead;rsHead=(rsHead+1)%rsN;any=true;
    S4[i*4]=x;S4[i*4+1]=y+(ring?0.012:0.002);S4[i*4+2]=z;S4[i*4+3]=rsT;
    K3[i*3]=ring;K3[i*3+1]=ring?0.14+Math.random()*0.16:0.1+Math.random()*0.08;K3[i*3+2]=Math.random()*10}
  if(any){rsS.needsUpdate=true;rsK.needsUpdate=true}}
// a drip off an eave: the falling drop, then the little crown where it lands
function rsDrip(x,y,z,h){if(!rsMesh||h<0.3)return;const S4=rsS.array,K3=rsK.array;
  let i=rsHead;rsHead=(rsHead+1)%rsN;S4.set([x,y,z,rsT],i*4);K3.set([2,h,Math.random()*10],i*3);
  i=rsHead;rsHead=(rsHead+1)%rsN;S4.set([x,y-h+0.002,z,rsT+Math.sqrt(h/4.9)],i*4);K3.set([0,0.06+Math.random()*0.04,Math.random()*10],i*3);
  rsS.needsUpdate=rsK.needsUpdate=true}
function rainGfx(n,sp){if(!rainLines||rainLines.userData.n!==n){
    for(const m of [rainLines,rainFar])if(m){scene.remove(m);m.geometry.dispose()}
    rainLines=rainDropMesh(Math.max(1,n),rainMat);rainFar=rainDropMesh(Math.max(1,Math.round(n*0.6)),rainFarMat);rainLines.userData.off=rainFar.userData.off=!n;rainVeil.userData.off=n<1500}
  rsGfx(sp|0)}
// the sky greys over, the sun and its disc dim and the haze closes in, from the time of day's sky and lights (daynight.js;
// SUN_I is the noon sun, so rainSunI is how bright the sunlight is now)
const SKY_R=new THREE.Color(0x8e989f),FOG_FAR=scene.fog.far,SUN_I=sun.intensity,hemiL=scene.children.find(o=>o.isHemisphereLight);
const skyTint=new THREE.Color(),skyGrey=new THREE.Color();
function rainFxTick(dt){dnTick(dt);const r=weather.r,v=Math.max(ss(0,0.6,r),0.75*ss(0.3,1,weather.c));
  scene.background.copy(DAY.bg).lerp(skyGrey.copy(SKY_R).multiplyScalar(DAY.lum),v*0.85);scene.fog.color.copy(scene.background);scene.fog.far=FOG_FAR*gfxFog*DAY.fogK*(1-0.6*v);
  sun.intensity*=1-0.7*v;if(hemiL)hemiL.intensity=DAY.hemiI*LI*(1+0.15*v);
  sky.material.color.copy(skyTint.setRGB(1,1,1).lerp(SKY_R,v*0.75));skySunVis.value=1-v;
  rainSunI.value=sun.intensity/SUN_I;stormTick(dt);
  // the breeze under the rain, in gusts that roll over the island like the grass's (mower.js)
  const t=timeU.value,c=camera.position,gu=Math.pow(0.5+0.5*Math.sin((c.x*RAIN_WD[0]+c.z*RAIN_WD[1])*0.42-t*1.9+1.5*Math.sin((-0.6*c.x+0.8*c.z)*0.11+t*0.23)),3);
  rainWind.set(RAIN_WD[0],RAIN_WD[1]).multiplyScalar(TU.rainWind*(0.7+0.9*gu));
  const on=r>0.03;rsTick(dt,on?r:0);wsTick(dt,r);wetTick(dt,r);dripTick(dt,r);
  wetU.uRunoff.value=ss(0.15,0.7,r);
  if(!rainLines)return;const off=rainLines.userData.off;rainLines.visible=rainFar.visible=on&&!off;rainVeil.visible=on&&!off&&!rainVeil.userData.off;if(!rainLines.visible)return;
  const a=0.6*ss(0.03,0.5,r);
  for(const m of [rainMat,rainFarMat]){m.uniforms.uCam.value.copy(c);m.uniforms.uT.value=(m.uniforms.uT.value+dt)%1000;m.uniforms.uA.value=a}
  rainVeil.position.set(c.x,c.y,c.z);rainVeilMat.uniforms.uT.value=(rainVeilMat.uniforms.uT.value+dt)%1000;rainVeilMat.uniforms.uA.value=0.5*ss(0.1,0.8,r);rainVeilMat.uniforms.uC.value.copy(scene.fog.color)}
// the shelter map is drawn just before each frame (main.js), so the cabs it holds are where the machines are now
// while it rains, every frame; while things drip after it, once a second (for the eaves, below)
let rcNext=0,rcSkip=0;
function rainCover(){if(!(rsMesh||rainLines&&!rainLines.userData.off))return;const now=performance.now(),due=rsMesh&&now>=rcNext;
  // the cover map is redrawn every third frame (and when it is read): it is fixed to the ground, so it only has to keep
  // up with where you are
  if(weather.r>0.03&&!due&&++rcSkip%3)return;
  if(weather.r>0.03||wetAll>0.08&&due){rcRender();if(due){rcNext=now+1000;rcRead()}}}

// ---------- everything gets wet ----------
// wetAll: how wet the machines, the worker, buildings, trees and props are (0-1). It soaks in over half a minute of rain
// and dries over about five minutes after. Every lit material (wetPatch, from main.js before the first frame) darkens
// with it and turns glossy, the tops most; the ground and the grass have their own wet look. How it looks only
const wetAllU={value:0};let wetAll=0;
// rain on the machines (Ultra, gfx.js wetDrops, set by post.js): the physically based materials (the detailed machines'
// paint, steel, glass and rubber, models.js) also get beads of water on their tops and drops running down their sides,
// placed in the part's own frame so they ride along with it. They show as it gets wet and go as it dries; the runs move
// only while it rains (wetDropT). Drawn within about 45 ft. Only how it looks
let wetDropsOn=false;const wetDropU={value:0},wetDropT={value:0};
const WET_DROP_GLSL='uniform float uDrops,uDropT;varying vec3 vDropP,vDropN;\n'+
  'vec2 wdH(vec2 c){return fract(sin(vec2(dot(c,vec2(127.1,311.7)),dot(c,vec2(269.5,183.3))))*43758.5453);}\n'+
  // a bead in some of the cells, a smooth cap 0-1 high
  'float wdBead(vec2 p,float th){vec2 c=floor(p),h=wdH(c);if(fract(h.x*7.13+h.y*3.7)>th)return 0.0;vec2 o=fract(p)-0.5-(h-0.5)*0.45;float d=length(o)/(0.12+0.16*h.y);return max(0.0,1.0-d*d);}\n'+
  // a drop running down a side (x across, y up, in m): a bead at its head and a thin wet trail above it
  'float wdRun(vec2 p,float t){float cx=floor(p.x*22.0),fx=fract(p.x*22.0)-0.5;vec2 h=wdH(vec2(cx,3.1));if(h.x>0.45)return 0.0;\n'+
  ' float L=0.5+h.y,sy=p.y/L+h.x*5.0,sg=floor(sy),fy=fract(sy),hs=fract(sin(sg*91.7+cx*7.3)*4375.85),x=fx-(hs-0.5)*0.5;\n'+
  ' float head=1.0-fract(hs*3.0+t*(0.3+0.4*hs)/L),dv=(fy-head)*L,lx=1.0-x*x/0.0324;\n'+
  ' float tr=dv>0.0&&lx>0.0?lx*exp(-dv*5.0)*0.45:0.0,d=length(vec2(x/0.3,dv/0.012));return max(tr,max(0.0,1.0-d*d));}\n'+
  // the normal tilted by a height field (from its slope on the screen)
  'vec3 wdBump(vec3 n,float h,vec3 pos){vec3 dx=dFdx(pos),dy=dFdy(pos);float hx=dFdx(h),hy=dFdy(h);vec3 r1=cross(dy,n),r2=cross(n,dx);float det=dot(dx,r1);\n'+
  ' return normalize(abs(det)*n-sign(det)*(hx*r1+hy*r2));}\n';
const WET_DROP_FS='float wD=0.0;{float fd=uDrops*smoothstep(0.08,0.4,uWetAll)*(1.0-smoothstep(4.0,14.0,length(vViewPosition)));\n'+
  ' if(fd>0.001){float up=inverseTransformDirection(normal,viewMatrix).y,hg=0.0,top=smoothstep(0.35,0.75,up),sd=1.0-smoothstep(0.35,0.75,abs(up));\n'+
  '  vec3 an=abs(vDropN);vec2 sp=vec2(an.x>an.z?vDropP.z:vDropP.x,vDropP.y);\n'+
  '  if(top>0.0)hg=max(wdBead(vDropP.xz*18.0,0.35*min(uDrops,2.0)),wdBead(vDropP.xz*9.0+17.0,0.2*min(uDrops,3.0)))*top;\n'+
  '  if(sd>0.0)hg=max(hg,max(wdRun(sp,uDropT)*min(uDrops,1.0),0.8*wdBead(sp*vec2(18.0,14.0)+5.0,0.15*min(uDrops,4.0)))*sd);\n'+
  '  hg*=min(fd,1.0);wD=smoothstep(0.0,0.25,hg);normal=wdBump(normal,hg*0.006,-vViewPosition);diffuseColor.rgb*=1.0-0.18*wD;}}\n';
// the cab glass (the excavator's and the truck's see-through windows, which the wet look leaves alone) beads up and runs
// the same way, each drop a lens of water catching the sky and the sun, on every face but the one under a windscreen
// (the part's front, +z), whose drops and wipers are the windscreen's own (WS). The excavator's glass is one box, so it
// is drawn from both sides while there are drops, to show them from the cab too (the truck's panes have both faces)
const WET_GLASS=[glass.material,TGLASS];glass.material.userData.side2=true;
function wetGlassPatch(m){m.userData.wetP=m.userData.glassP=true;const old=m.onBeforeCompile,key=m.customProgramCacheKey();
  m.onBeforeCompile=function(sh,r){if(old)old.call(this,sh,r);if(!wetDropsOn)return;
    Object.assign(sh.uniforms,{uWetAll:wetAllU,uDrops:wetDropU,uDropT:wetDropT});
    // drops a third the size of the paint's (glass is seen close up), clear in the middle and dark at the edge
    sh.vertexShader='varying vec3 vDropP,vDropN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDropP=transformed*length(modelMatrix[0].xyz)*3.0;vDropN=objectNormal;');
    sh.fragmentShader='uniform float uWetAll;\n'+WET_DROP_GLSL+sh.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+
      WET_DROP_FS.replace('hg*=min(fd,1.0);','hg*=min(fd,1.0)*(1.0-step(0.7,vDropN.z));').replace('diffuseColor.rgb*=1.0-0.18*wD;',
        'diffuseColor.a=max(diffuseColor.a,wD*(0.1+0.45*(1.0-smoothstep(0.15,0.8,hg))));'))
      .replace('#include <lights_phong_fragment>','#include <lights_phong_fragment>\nmaterial.specularShininess=mix(material.specularShininess,300.0,wD);material.specularColor=max(material.specularColor,vec3(wD));')};
  m.customProgramCacheKey=()=>key+'|wetg'+(wetDropsOn?'|drops':'');m.needsUpdate=true}
function wetPatch(m){if(m&&!m.userData.wetP&&WET_GLASS.includes(m)){wetGlassPatch(m);return}
  if(!m||m.userData.wetP||m.userData.noWet||m===groundMat||tuftMats.includes(m))return;
  const t=m.type;if(t!=='MeshPhongMaterial'&&t!=='MeshStandardMaterial'&&t!=='MeshLambertMaterial')return;if(m.transparent&&m.opacity<0.7)return;
  m.userData.wetP=true;const old=m.onBeforeCompile,key=m.customProgramCacheKey(),drops=()=>wetDropsOn&&t==='MeshStandardMaterial';
  m.onBeforeCompile=function(sh,r){if(old)old.call(this,sh,r);sh.uniforms.uWetAll=wetAllU;let f='uniform float uWetAll;\n'+sh.fragmentShader;const dr=drops();
    if(dr){sh.uniforms.uDrops=wetDropU;sh.uniforms.uDropT=wetDropT;f=WET_DROP_GLSL+f;
      sh.vertexShader='varying vec3 vDropP,vDropN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDropP=transformed*length(modelMatrix[0].xyz);vDropN=objectNormal;')}
    f=f.includes('#include <normal_fragment_maps>')?f.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nfloat wW=uWetAll*clamp(inverseTransformDirection(normal,viewMatrix).y*0.6+0.4,0.0,1.0);diffuseColor.rgb*=1.0-0.32*wW;'+(dr?WET_DROP_FS:''))
      :f.replace('#include <color_fragment>','#include <color_fragment>\nfloat wW=uWetAll*0.6;diffuseColor.rgb*=1.0-0.32*wW;'+(dr?'float wD=0.0;':''));
    sh.fragmentShader=f.replace('#include <lights_phong_fragment>','#include <lights_phong_fragment>\nmaterial.specularColor=max(material.specularColor,vec3(0.25*wW));material.specularShininess=mix(material.specularShininess,max(material.specularShininess,80.0),wW);')
      .replace('#include <lights_physical_fragment>','#include <lights_physical_fragment>\nmaterial.roughness=mix(material.roughness,min(material.roughness,0.28),wW);'+(dr?'material.roughness=mix(material.roughness,0.04,wD);':''))};
  m.customProgramCacheKey=()=>key+'|wet'+(drops()?'|drops':'');m.needsUpdate=true}
// post.js turns the beads on or off; the materials that have them are built again
function wetDropsSet(on){on=!!on;if(on===wetDropsOn)return;wetDropsOn=on;
  scene.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))if(m&&m.userData.wetP&&(m.type==='MeshStandardMaterial'||m.userData.glassP)){m.needsUpdate=true;if(m.userData.side2)m.side=on?THREE.DoubleSide:THREE.FrontSide}})}
function wetPatchAll(){scene.traverse(o=>{if(o.isMesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(wetPatch)})}
function wetTick(dt,r){wetAll=r>0.03?Math.min(1,wetAll+dt*(0.01+0.05*r)):Math.max(0,wetAll-dt/300);wetAllU.value=wetAll;
  if(wetDropsOn){wetDropU.value=TU.ultraDrops;if(r>0.03)wetDropT.value=(wetDropT.value+dt*(0.4+0.6*r))%1000}}
// drips: once a second the shelter map comes back from the GPU and the edges of roofs within about 40 ft are found
// (cover that drops away by more than 2 ft to the next spot); drops fall from them while it rains and for a while after
const rcPix=new Uint8Array(RC_N*RC_N*4),rcEdges=[];let rcCX=0,rcCZ=0,rcTop=0,dripAcc=0;
const rcH=k=>{const a=rcPix[k*4+3]/255,d=(255/256)*(rcPix[k*4]/255/16777216+rcPix[k*4+1]/255/65536+rcPix[k*4+2]/255/256+a);return d>0.999?-1e5:rcTop-d*RC_R};
// the roof over the worker on foot: cover within about 30 ft over their head (a porch, the pavilion, a room, the
// covered bridge; a high deck far above doesn't count), for the rain on the roof (ambience.js); its height above them, or 0
let rcRoof=0;
function rcOver(x,z){const px=RC_S/RC_N,i=Math.floor((x-rcCX)/px+RC_N/2),j=Math.floor((rcCZ-z)/px+RC_N/2);
  return i<0||j<0||i>=RC_N||j>=RC_N?-1e5:rcH(j*RC_N+i)}
// read back without waiting for the GPU where it can (WebGL 2): the map's place is kept with it until the pixels arrive.
// A read still out after 3 s means this device never answers, and it goes back to reading straight away (rcSync)
let rcBusy=0,rcSync=false,rcTok=0;
function rcRead(){const v=rcU.uRC.value,cx=v.x,cz=v.y,top=v.z,now=performance.now();
  if(rcBusy&&now-rcBusy>3000){rcSync=true;rcBusy=0;rcTok++}
  if(!rcSync&&renderer.readRenderTargetPixelsAsync){if(rcBusy)return;rcBusy=now;const tok=++rcTok;
    renderer.readRenderTargetPixelsAsync(rcRT,0,0,RC_N,RC_N,rcPix).then(()=>{if(tok===rcTok)rcReadDone(cx,cz,top)},()=>{}).finally(()=>{if(tok===rcTok)rcBusy=0})}
  else{renderer.readRenderTargetPixels(rcRT,0,0,RC_N,RC_N,rcPix);rcReadDone(cx,cz,top)}}
function rcReadDone(cx,cz,top){rcCX=cx;rcCZ=cz;rcTop=top;rcEdges.length=0;
  {const h=mode==='walk'&&!wk.inside?rcOver(wk.x,wk.z)-wk.y:0;rcRoof=h>1.7&&h<9?h:0}
  const px=RC_S/RC_N,R=Math.round(12/px),c=RC_N>>1;
  for(let y=c-R;y<c+R;y++)for(let x=c-R;x<c+R;x++){const k=y*RC_N+x,h=rcH(k);if(h<-1e4)continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const hn=rcH(k+dy*RC_N+dx);if(hn>h-0.6)continue;
      // texture rows run from the south (bottom) up; the drip hangs just past the edge
      const wx=rcCX+(x+0.5+dx*0.6-RC_N/2)*px,wz=rcCZ-(y+0.5+dy*0.6-RC_N/2)*px;rcEdges.push(wx,h-0.04,wz);break}
    if(rcEdges.length>900)return}}
function dripTick(dt,r){if(!rsMesh||!rcEdges.length)return;const n=rcEdges.length/3,wet=r>0.03?0.4+r:wetAll*wetAll;
  dripAcc+=Math.min(40,n*0.12*wet)*dt;
  while(dripAcc>=1){dripAcc--;const i=(Math.random()*n|0)*3,x=rcEdges[i],y=rcEdges[i+1],z=rcEdges[i+2],g=surfAt(x,z);
    if(Math.hypot(x-camera.position.x,z-camera.position.z)<13)rsDrip(x,y,z,y-g)}}


// ---------- the windscreens: drops on the glass, and wipers ----------
// The excavator's front window and the truck's windscreen bead up with drops while it rains and dry off slowly after.
// The wipers (key [wipers], or the Wipers button) sweep the machine you are in: each blade clears the strip it passes
// over, and drops build up again behind it. How wet each strip is lives in wsW: 24 strips per blade across its sweep,
// then one for the glass no blade reaches. A blade parks where it started when they go off. The drops are drawn on a
// plane just outside the glass, in the glass's own metres; the Graphics setting only drops the running drops on Low
const WS_BINS=24;
const WS=[{par:cab,mode:'dig',pos:[0,0.92,0.628],w:0.84,h:1.1,
    blades:[{g:exWiper,px:0.3,py:0.74-0.92,len:0.6,ph0:Math.PI/2,s:1,a0:-0.15,a1:1.3}]},
  {par:tBody,mode:'truck',pos:[0,2.5,2.642],w:2.0,h:0.55,
    blades:[{g:trWipers[0],px:-0.15,py:2.255-2.5,len:0.7,ph0:Math.PI,s:-1,a0:0.08,a1:1.45},{g:trWipers[1],px:0.15,py:2.255-2.5,len:0.7,ph0:0,s:1,a0:0.08,a1:1.45}]}];
const WS_GLSL_DROP='vec4 wsDrop(vec2 q,float r,float lit){float d=length(q)/r;if(d>1.0)return vec4(0.0);vec2 n=q/r;\n'+
  // a bead of water: the far side of the bead dark, light gathered low in it, a bright glint high on one side
  'float rim=smoothstep(0.5,1.0,d),gl=smoothstep(0.34,0.0,length(n-vec2(-0.35,0.42)));\n'+
  'vec3 c=mix(vec3(0.8,0.85,0.9)*(0.8+0.2*n.y*-1.0),vec3(0.1,0.12,0.14),rim*(n.y>0.0?0.85:0.45))+gl*(0.55+0.6*lit);\n'+
  'return vec4(c,(0.16+0.5*rim+0.7*gl)*smoothstep(1.0,0.82,d));}\n';
function wsMake(ws){
  ws.W=new Float32Array(WS_BINS*2+1);ws.px=new Uint8Array(64*4);ws.tex=new THREE.DataTexture(ws.px,64,1,THREE.RGBAFormat);
  ws.tex.magFilter=ws.tex.minFilter=THREE.NearestFilter;ws.ph=0;ws.prev=ws.blades.map(b=>b.a0);
  const bp=[0,1].map(i=>{const b=ws.blades[i]||ws.blades[0];return new THREE.Vector4(b.px,b.py,ws.blades[i]?b.len:0,0)}),
    ba=[0,1].map(i=>{const b=ws.blades[i]||ws.blades[0];return new THREE.Vector4(b.a0,b.a1,b.ph0,b.s)});
  ws.mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{tW:{value:ws.tex},uBp:{value:bp},uBa:{value:ba},uT:{value:0},uH:{value:ws.h},uRun:{value:1},uSunI:rainSunI},
    vertexShader:'varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform sampler2D tW;uniform vec4 uBp[2];uniform vec4 uBa[2];uniform float uT,uH,uRun,uSunI;varying vec2 vP;\n'+
      'float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+
      'float bin(float k){return texture2D(tW,vec2((k+0.5)/64.0,0.5)).r;}\n'+
      // how wet the glass is at p: the strip of the blade that reaches it, or the glass no blade reaches
      'float wetAt(vec2 p){for(int i=0;i<2;i++){vec2 d=p-uBp[i].xy;float L=length(d);if(L<uBp[i].z&&L>uBp[i].z*0.12){\n'+
      '  float th=uBa[i].w*(atan(d.y,d.x)-uBa[i].z);th=mod(th+3.14159,6.28318)-3.14159;float f=(th-uBa[i].x)/(uBa[i].y-uBa[i].x);\n'+
      '  if(f>-0.03&&f<1.03)return bin(float(i)*'+WS_BINS+'.0+clamp(floor(f*'+WS_BINS+'.0),0.0,'+(WS_BINS-1)+'.0));}}\n'+
      '  return bin('+(WS_BINS*2)+'.0);}\n'+WS_GLSL_DROP+
      'void main(){vec4 o=vec4(0.0);const float C=0.016;vec2 c=floor(vP/C),f=vP-(c+0.5)*C;float w=wetAt((c+0.5)*C);\n'+
      'if(hs(c)<w*0.8){float r=C*(0.16+0.28*hs(c+7.1));vec2 j=(vec2(hs(c+3.3),hs(c+5.7))-0.5)*(C-2.0*r);o=wsDrop(f-j,r,uSunI);}\n'+
      // a few bigger drops run down the glass, wandering a little, with a thin wet trail above them
      'if(uRun>0.5){const float R=0.045;float ci=floor(vP.x/R),hc=hs(vec2(ci,1.7));if(hc>0.72){\n'+
      '  float yd=uH*0.5-mod(uT*(0.03+0.06*hs(vec2(ci,4.1)))+hc*7.0,uH+0.2),xd=(ci+0.5)*R+0.008*sin(yd*30.0+hc*20.0);\n'+
      '  if(wetAt(vec2(xd,yd))>0.45){vec4 b=wsDrop(vP-vec2(xd,yd),0.0055,uSunI);if(b.a>o.a)o=b;\n'+
      '    float tr=vP.y-yd;if(tr>0.0&&tr<0.09&&abs(vP.x-xd-0.008*sin(vP.y*30.0+hc*20.0)+0.008*sin(yd*30.0+hc*20.0))<0.0013)o=max(o,vec4(0.85,0.88,0.92,0.22*(1.0-tr/0.09)));}}}\n'+
      'o.a=max(o.a,w*0.06);gl_FragColor=o;}'});
  ws.mesh=new THREE.Mesh(new THREE.PlaneGeometry(ws.w,ws.h),ws.mat);ws.mesh.position.set(...ws.pos);ws.mesh.renderOrder=4;
  ws.mesh.visible=false;ws.mesh.userData.noCover=true;ws.par.add(ws.mesh)}
for(const ws of WS)wsMake(ws);
let wipeOn=false,wipeTipped=false;
function setWipers(on){wipeOn=!!on;const b=$('#wipeBtn');b.textContent=wipeOn?'Wipers: on':'Wipers';b.setAttribute('aria-pressed',wipeOn)}
$('#wipeBtn').onclick=()=>setWipers(!wipeOn);
// blade angle at a point in its cycle (0-1: out and back)
const wsAng=(b,ph)=>b.a0+(b.a1-b.a0)*(0.5-0.5*Math.cos(ph*Math.PI*2));
function wsTick(dt,r){let wetMax=0;
  for(const ws of WS){const W=ws.W,run=mode===ws.mode&&wipeOn;
    // rain wets the glass, faster in a downpour; out of the rain it dries over a few minutes
    for(let k=0;k<W.length;k++)W[k]=r>0.02?W[k]+r*0.09*dt*(1-W[k]):Math.max(0,W[k]-dt/240);
    if(run||ws.ph>0){const p0=ws.ph;ws.ph+=dt/1.5;if(ws.ph>=1){ws.ph=run?ws.ph%1:0;stats.wipes++;statDirty=true}if(!run&&p0>0&&ws.ph<p0)ws.ph=0;
      ws.blades.forEach((b,i)=>{const a=wsAng(b,ws.ph),f0=(Math.min(a,ws.prev[i])-b.a0)/(b.a1-b.a0),f1=(Math.max(a,ws.prev[i])-b.a0)/(b.a1-b.a0);
        for(let k=Math.max(0,Math.floor(f0*WS_BINS));k<=Math.min(WS_BINS-1,Math.floor(f1*WS_BINS));k++)W[i*WS_BINS+k]=0;
        ws.prev[i]=a;b.g.rotation.z=b.s*a})}
    let m=0;for(let k=0;k<W.length;k++){ws.px[k*4]=Math.round(W[k]*255);m=Math.max(m,W[k])}ws.tex.needsUpdate=true;
    ws.mesh.visible=m>0.01;if(ws.mesh.visible){ws.mat.uniforms.uT.value=(ws.mat.uniforms.uT.value+dt)%1000;ws.mat.uniforms.uRun.value=gfxCur.tex==='low'?0:1}
    if(mode===ws.mode)wetMax=m}
  // the button shows in the excavator and the truck while it rains, or while the glass is wet or the wipers run
  const show=WS.some(ws=>ws.mode===mode)&&(r>0.03||wetMax>0.1||wipeOn),bt=$('#wipeBtn');if(bt.hidden===show)bt.hidden=!show;
  if(!wipeTipped&&!wipeOn&&camMode==='cab'&&wetMax>0.4){wipeTipped=true;toast(say('wipeTip'),'tip',4000)}}
