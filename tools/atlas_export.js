mapReset();let t0=performance.now();while(mapTilesDone()<MPT_NX*MPT_NZ&&performance.now()-t0<300000){mapBuild(500,0,130);await new Promise(r=>setTimeout(r,5))}const nDone=mapTilesDone();
const PX=1.5,W=Math.round(MPT_NX*MPT_M*PX),H=Math.round(MPT_NZ*MPT_M*PX),cv=document.createElement('canvas');cv.width=W;cv.height=H;
const g=cv.getContext('2d');g.fillStyle='#1a4769';g.fillRect(0,0,W,H);g.imageSmoothingEnabled=true;
for(const t of mapTiles)if(t&&t.cv)g.drawImage(t.cv,t.i*MPT_M*PX,t.j*MPT_M*PX,MPT_M*PX+1,MPT_M*PX+1);
const X=x=>(x-MAPW_X0)*PX,Y=z=>(z-MAPW_Z0)*PX;
g.lineCap=g.lineJoin='round';g.strokeStyle='rgba(176,148,104,.9)';
for(const r of ROADS.concat(ISLAND_ROADS)){g.lineWidth=r.w*PX;g.beginPath();r.pts.forEach((p,n)=>n?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.stroke()}
const hs=[];const GS=2,NX=Math.round(MPT_NX*MPT_M/GS),NZ=Math.round(MPT_NZ*MPT_M/GS);
for(let j=0;j<NZ;j++){const row=[];for(let i=0;i<NX;i++)row.push(Math.round(baseHeight(MAPW_X0+(i+.5)*GS,MAPW_Z0+(j+.5)*GS)*10)/10);hs.push(row)}
const rc=new THREE.Raycaster(),dn=new THREE.Vector3(0,-1,0);scene.updateMatrixWorld(true);
const objs=[];scene.traverse(o=>{if((o.isMesh||o.isInstancedMesh)&&o.visible)objs.push(o)});
const sol=[];for(const s of SOLIDS){const rot=s.sn!==undefined,hx=rot?s.lx:s.hx,hz=rot?s.lz:s.hz;if(hx<1.4&&hz<1.4)continue;
  rc.set(new THREE.Vector3(s.x,200,s.z),dn);let top=null,col=null;try{const h=rc.intersectObjects(objs,false);if(h.length){top=h[0].point.y;const m=h[0].object.material;const c=(Array.isArray(m)?m[0]:m)?.color;col=c?'#'+c.getHexString():null}}catch(e){}
  sol.push([+s.x.toFixed(2),+s.z.toFixed(2),+hx.toFixed(2),+hz.toFixed(2),rot?+Math.atan2(s.sn,s.cs).toFixed(3):0,top==null?null:+(top-baseHeight(s.x,s.z)).toFixed(1),col])}
const out={nDone,W,H,PX,X0:MAPW_X0,Z0:MAPW_Z0,GS,NX,NZ,WATER,hs,sol,trees:mapTrees().map(t=>t.map(v=>+v.toFixed(2))),
  bridges:BRIDGES.map(b=>({x0:b.x0,z0:b.z0,ux:b.ux,uz:b.uz,len:b.len,hw:b.hw,temp:!!b.temp,dock:!!b.dock,foot:!!b.foot})),
  causeways:CAUSEWAYS.map(b=>({x0:b.x0,z0:b.z0,ux:b.ux,uz:b.uz,len:b.len,hw:b.hw})),
  roads:ROADS.concat(ISLAND_ROADS).map(r=>({w:r.w,pts:r.pts})),img:cv.toDataURL('image/png')};
return out
