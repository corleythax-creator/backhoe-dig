// Corley's Island: rain and wet ground. Rain soaks the soil and it dries out afterwards; how much mud that makes depends
// on what is there: dug dirt, dirt yards and painted topsoil, clay and mud turn to mud, dirt roads and grass get soft,
// sand and gravel drain, rock, paving and steel stay hard. Low ground soaks faster and dries slower; sand dries fast and
// clay slow. The soak feeds the same mud rules as painted Mud (mudOf in water.js, soakAt in mud.js): ruts, puddles,
// bogging down. Rain also falls into holes and ruts, and standing rainwater drains away once it stops.
// Weather (☰ menu): Auto brings showers now and then, Rain keeps it raining, Dry holds it off. The wet ground and the
// weather save with the site (so they sync) and dry on for up to an hour while the game is closed. The Graphics setting
// only changes how many raindrops are drawn.
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
const MAT_WET={mud:[1,1],dirt2:[1,1],clay:[1,0.5],sand:[0.2,2.5],gravel:[0.15,2],riverrock:[0.1,2],mulch:[0.4,1.2],grass2:[0.55,1]};
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
function rainSoakK(k){const x=(k%V)*CELL-S/2,z=((k/V)|0)*CELL-S/2,r=rwIdx(x,z);if(r<0)return 0;
  return ss(0.25,0.9,rainW[r])*(Math.abs(H[k]-H0[k])>0.04?1:rainK[r])}
function rainEdRefresh(x0,x1,z0,z1){rainBase(Math.floor((x0-RW_X0)/RW_C)-1,Math.ceil((x1-RW_X0)/RW_C)+1,Math.floor((z0-RW_Z0)/RW_C)-1,Math.ceil((z1-RW_Z0)/RW_C)+1);rainTexDirty=true}

// ---------- weather ----------
// r: how hard it is raining now (0-1), easing toward want; next: seconds until Auto changes its mind
const weather={mode:'auto',r:0,want:0,next:240};
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
    weather.r+=Math.max(-dt*0.05,Math.min(dt*0.05,weather.want-weather.r))}
  const raining=weather.r>0.05;
  if(raining!==rainWas){rainWas=raining;if(raining)toast(say('rainIn'),'',3600);else if(!bench.on)toast(say('rainOut'),'',3600)}
  // once a second: soak or dry the soil, and show it
  rainT-=dt;if(rainT<=0){rainT=1;let any=weather.r>0.02;if(!any)for(let k=0;k<rainW.length;k+=7)if(rainW[k]>0){any=true;break}
    if(any){rainSim(1);rainTexDirty=true;if((rainSaveT-=1)<=0){rainSaveT=20;site.dirty=true}}}
  if(rainTexDirty)rainTexUpdate();
  rainFxTick(dt)}
// the save: soil water (bytes, base64) and the weather, with the time so drying carries on while the game is closed
function rainSave(){const b=new Uint8Array(rainW.length);for(let k=0;k<b.length;k++)b[k]=Math.round(rainW[k]*255);
  return {w:siteB64(b),pm:1,r:+weather.r.toFixed(3),want:+weather.want.toFixed(3),next:Math.round(weather.next),t:Date.now()}}
function rainLoad(d){if(!d||typeof d.w!=='string')return;let b;try{b=siteUnB64(d.w)}catch(e){return}if(b.length!==rainW.length)return;
  for(let k=0;k<b.length;k++)rainW[k]=b[k]/255;
  // saved before painted Mud could dry (pm), when it was always soaked: it starts soaked
  if(!d.pm)for(let k=0;k<b.length;k++)if(rainMud[k])rainW[k]=1;
  if(isFinite(d.r))weather.r=d.r;if(isFinite(d.want)&&weather.mode==='auto')weather.want=d.want;if(isFinite(d.next))weather.next=d.next;
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
    if(x>-S/2&&x<S/2&&z>-S/2&&z<S/2)continue;wetPx(D,k*4,waterAt(x,z)?2:rainW[k],min)}
  g.putImageData(img,0,0);
  g=wetDigCv.getContext('2d');img=g.createImageData(200,200);D=img.data;
  for(let py=0;py<200;py++)for(let px=0;px<200;px++){const i=px*2,j=py*2,k=j*V+i,r=rwIdx(i*CELL-S/2,j*CELL-S/2);
    wetPx(D,(py*200+px)*4,Wt[k]>H[k]+0.003?2:Math.max(r<0?0:rainW[r],mudA[k]),min)}
  g.putImageData(img,0,0);wetMapT=timeU.value}
// drawMap (maps.js) calls this on the big map, over the ground and the dug area
function wetDrawOn(g,X,Y,sc){if(wetView==='off')return;if(timeU.value-wetMapT>1||timeU.value<wetMapT)wetImages();
  g.save();g.imageSmoothingEnabled=true;g.drawImage(wetCv,X(RW_X0-RW_C/2),Y(RW_Z0-RW_C/2),RW_NX*RW_C*sc,RW_NZ*RW_C*sc);
  g.drawImage(wetDigCv,X(-S/2),Y(-S/2),S*sc,S*sc);g.restore()}
function wetSet(v,gr){wetView=v;if(gr!==undefined)wetGround=gr;try{localStorage.setItem(WET_KEY,JSON.stringify({v:wetView,g:wetGround}))}catch(e){}wetMapT=-1e9;wetSync()}
function wetSync(){document.querySelectorAll('#wetBar [data-wv]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.wv===wetView));
  const on=wetView!=='off',min=wetMin();$('#wetKey').hidden=!on;
  $('#wetKey i').style.background=min>0?'linear-gradient(90deg,rgba(30,90,210,.15),rgb(30,90,210) 60%,rgb(40,170,255))':'linear-gradient(90deg,rgb(175,220,245),rgb(10,40,160) 85%,rgb(40,170,255))';
  $('#wetLo').textContent=min>0?`Drier than ${WET_OPTS.find(w=>w[0]===wetView)[1].replace('+','').toLowerCase()}: clear`:'Dry (clear) to soaked';
  const b=$('#wetGround');b.setAttribute('aria-pressed',wetGround);b.textContent=wetGround?'On the ground too: on':'Show on the ground too';
  wetU.uWetView.value=on&&wetGround?1:0;wetU.uWetMin.value=min;
  if(!$('#bigmap').hidden&&typeof drawMap==='function')drawMap($('#big'),MAP_CX,MAP_CZ,MAP_HALF,true)}
{const bar=$('#wetBar');for(const [k,n] of WET_OPTS){const b=document.createElement('button');b.dataset.wv=k;b.textContent=n;b.onclick=()=>wetSet(k);bar.appendChild(b)}}
$('#wetGround').onclick=()=>wetSet(wetView,!wetGround);
wetSync();
// raindrops: streaks in a box that follows the camera, moved by the GPU; the count follows the Graphics setting
const RD_BOX=new THREE.Vector3(26,16,26);
const rainMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,
  uniforms:{uCam:{value:new THREE.Vector3()},uT:{value:0},uBox:{value:RD_BOX},uA:{value:0}},
  vertexShader:'attribute float e;uniform vec3 uCam;uniform float uT;uniform vec3 uBox;varying float vE;\nvoid main(){vec3 vel=vec3(1.4,-11.0,0.5);vec3 w=uCam+mod(position+vel*uT-uCam+uBox*0.5,uBox)-uBox*0.5;w-=normalize(vel)*0.8*e;vE=e;\ngl_Position=projectionMatrix*viewMatrix*vec4(w,1.0);}',
  fragmentShader:'uniform float uA;varying float vE;\nvoid main(){gl_FragColor=vec4(0.86,0.9,0.95,uA*(1.0-0.75*vE));}'});
let rainLines=null;
function rainGfx(n){if(rainLines&&rainLines.userData.n===n)return;if(rainLines){scene.remove(rainLines);rainLines.geometry.dispose()}
  const p=new Float32Array(n*6),e=new Float32Array(n*2);
  for(let i=0;i<n;i++){const x=Math.random()*RD_BOX.x,y=Math.random()*RD_BOX.y,z=Math.random()*RD_BOX.z;p.set([x,y,z,x,y,z],i*6);e[i*2+1]=1}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('e',new THREE.BufferAttribute(e,1));
  rainLines=new THREE.LineSegments(g,rainMat);rainLines.frustumCulled=false;rainLines.visible=false;rainLines.renderOrder=3;rainLines.userData.n=n;scene.add(rainLines)}
// the sky greys over, the sun and its disc dim and the haze closes in
const SKY0=scene.background.clone(),SKY_R=new THREE.Color(0x8e989f),FOG_FAR=scene.fog.far,SUN_I=sun.intensity,hemiL=scene.children.find(o=>o.isHemisphereLight),HEMI_I=hemiL?hemiL.intensity:0;
const skyTint=new THREE.Color();
function rainFxTick(dt){const r=weather.r,v=ss(0,0.6,r);
  scene.background.copy(SKY0).lerp(SKY_R,v*0.85);scene.fog.color.copy(scene.background);scene.fog.far=FOG_FAR*gfxFog*(1-0.6*v);
  sun.intensity=SUN_I*(1-0.7*v);if(hemiL)hemiL.intensity=HEMI_I*(1+0.15*v);
  sky.material.color.copy(skyTint.setRGB(1,1,1).lerp(SKY_R,v*0.75));skySunVis.value=1-v;
  if(!rainLines)return;rainLines.visible=r>0.03;if(!rainLines.visible)return;
  rainMat.uniforms.uCam.value.copy(camera.position);rainMat.uniforms.uT.value=(rainMat.uniforms.uT.value+dt)%1000;rainMat.uniforms.uA.value=0.6*ss(0.03,0.5,r)}
