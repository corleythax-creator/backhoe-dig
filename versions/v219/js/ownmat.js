// Corley's Island: the owner's own textures. In the map editor's Paint panel the owner picks an image (a photo, or one
// made with any image tool); it is made into a seamless 512 px tile the way tools/textures.py makes the library's
// (cropped to the length that best repeats, the seam faded out, its mean colour taken), named, given a tile size in
// feet, a kind and a shine, and published with the owner key (Supabase, supabase/island_materials.sql). It then joins
// the material library on every device, paintable on the ground and usable for blocks. Ids come from the server (41 and
// up, MAT_OWN0 in materials.js) and never move; the list is cached on the device (bhd_mats), pictures load as used.
// Publishing and loading work on the Vercel site only, as sync does; elsewhere cached ones show in their colour.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const OWN_NET=!!SYNC_URL&&/(^|\.)vercel\.app$|^localhost$|^127\./.test(location.hostname)&&!/\/versions\//.test(location.pathname);
// pictures this page already holds (just published here), by id
const ownPics={};
async function ownRpc(fn,body){const r=await fetch(SYNC_URL+'/rest/v1/rpc/'+fn,{method:'POST',
    headers:{'Content-Type':'application/json',apikey:SYNC_KEY,Authorization:'Bearer '+SYNC_KEY},body:JSON.stringify(body)});
  if(!r.ok)throw new Error('materials '+r.status);return r.json()}
// an own texture's picture into its image, from this page or the server
matOwnImg=(m,im)=>{if(ownPics[m]){im.src=ownPics[m];return}
  if(OWN_NET)ownRpc('mat_img',{p_id:m}).then(u=>{if(typeof u==='string'&&u.startsWith('data:image/'))im.src=u}).catch(()=>{})};
for(const k in matImg){const im=matImg[k];if(+k>=MAT_OWN0&&!im.getAttribute('src'))matOwnImg(+k,im)}
function ownCacheSave(){const a=[];MAT_LIST.forEach((d,i)=>{if(d.own)a.push({i:i+1,n:d.n,cat:d.cat,ft:d.ft,c:d.c,sh:d.sh||0,th:d.th,t:d.t})});
  try{localStorage.setItem(MAT_OWN_LS,JSON.stringify(a))}catch(e){}}
// after own textures arrive or change: their uniforms, pictures, the editor's and the blocks' lists, the ground
function ownChanged(ids){if(!ids.length)return;
  for(const m of ids){matUSet(m);delete matImg[m];
    const bm=blkMeshes[m];if(bm){scene.remove(bm);bm.material.dispose();if(bm.material.map)bm.material.map.dispose();blkMeshes[m]=null;blkWake=Math.max(blkWake,0.05)}}
  edMatPanel();blkMatOpts();edMatLabel();matLayers=[];matTexUpdate();
  // without WebGL2 the vertex colours carry the materials' colours
  if(!MAT_GL2&&ids.some(m=>ED_M.includes(m)))edRefresh([MID[0],MID[1],MID[2],MID[3]],true)}
async function ownFetch(){if(!OWN_NET)return;
  try{const rows=await ownRpc('mat_list',{}),ids=[];
    for(const r of rows||[]){let o;try{o=JSON.parse(r.data)}catch(e){continue}o.i=+r.id;o.t=+r.t;const d=MAT_LIST[o.i-1];
      if(d&&d.t===o.t)continue;if(matOwnTake(o))ids.push(o.i)}
    if(ids.length){ownCacheSave();ownChanged(ids)}}
  catch(e){}}
ownFetch();

// ---------- making a seamless tile ----------
// the crop length (80-100% of the side) whose next row or column best matches the first, so the crop tiles
function ownPeriod(a,w,h,rows){const n=rows?h:w,len=rows?w:h,at=(k,t)=>rows?(k*w+t)*4:(t*w+k)*4;let best=n,be=1e9;
  for(let k=Math.floor(n*0.8);k<n;k++){let e=0;for(let t=0;t<len;t++){const p=at(k,t),q=at(0,t);e+=Math.abs(a[p]-a[q])+Math.abs(a[p+1]-a[q+1])+Math.abs(a[p+2]-a[q+2])}
    if(e<be){be=e;best=k}}
  return best}
// on each axis that still shows a seam, fade across a band at its edges to the copy rolled by half along it
function ownSeamless(a,n){const out=Float32Array.from(a);
  for(const ax of [0,1]){const at=(i,j)=>ax?(j*n+i)*4:(i*n+j)*4;let d=0,s=0;
    for(let i=0;i<n;i++)for(let j=0;j<n;j++)for(let c=0;c<3;c++){if(i<n-1)d+=Math.abs(out[at(i+1,j)+c]-out[at(i,j)+c]);if(i===0)s+=Math.abs(out[at(0,j)+c]-out[at(n-1,j)+c])}
    d/=(n-1)*n*3;s/=n*3;if(s/Math.max(d,1e-6)<1.25)continue;
    const src=Float32Array.from(out);
    for(let i=0;i<n;i++){let t=Math.min(1,Math.min(i,n-1-i)/(n*0.07));t=t*t*(3-2*t);if(t>=1)continue;const r=(i+n/2)%n;
      for(let j=0;j<n;j++)for(let c=0;c<3;c++)out[at(i,j)+c]=src[at(i,j)+c]*t+src[at(r,j)+c]*(1-t)}}
  return out}
// an image to the tile: the middle square (at most 1024 px), cropped to its best period, 512 px, seams faded; returns
// the tile, its thumbnail (both JPEG data URLs, the tile under the server's size limit) and its mean colour
function ownTile(img){const W=img.naturalWidth,H=img.naturalHeight,sq=Math.min(W,H),S=Math.min(1024,sq),T=512;
  const c1=document.createElement('canvas');c1.width=c1.height=S;const x1=c1.getContext('2d');x1.imageSmoothingQuality='high';
  x1.drawImage(img,(W-sq)/2,(H-sq)/2,sq,sq,0,0,S,S);const a=x1.getImageData(0,0,S,S).data;
  const ph=ownPeriod(a,S,S,true),pw=ownPeriod(a,S,S,false);
  const c2=document.createElement('canvas');c2.width=c2.height=T;const x2=c2.getContext('2d');x2.imageSmoothingQuality='high';x2.drawImage(c1,0,0,pw,ph,0,0,T,T);
  const id=x2.getImageData(0,0,T,T),f=ownSeamless(id.data,T),c=[0,0,0];
  for(let q=0;q<f.length;q+=4){for(let k=0;k<3;k++){const v=Math.round(Math.min(255,Math.max(0,f[q+k])));id.data[q+k]=v;c[k]+=v}id.data[q+3]=255}
  x2.putImageData(id,0,0);const px=T*T;
  let url='',qu=0.86;for(;qu>0.4;qu-=0.08){url=c2.toDataURL('image/jpeg',qu);if(url.length<=650000)break}
  const c3=document.createElement('canvas');c3.width=c3.height=96;const x3=c3.getContext('2d');x3.imageSmoothingQuality='high';x3.drawImage(c2,0,0,96,96);
  return {url,th:c3.toDataURL('image/jpeg',0.8),c:c.map(v=>+(v/px/255).toFixed(3)),cv:c2}}

// ---------- the card in the Paint panel ----------
const own={tile:null,edit:0,busy:false};
{const s=$('#edOwnCat');MAT_CATS.forEach((c,i)=>s.add(new Option(c,i)))}
const ownMsg=t=>{$('#edOwnMsg').textContent=t};
// the tile shown 2 by 2, so its seams show if any are left
function ownPreview(src){const cv=$('#edOwnPrev'),x=cv.getContext('2d');x.clearRect(0,0,128,128);if(!src)return;
  for(let i=0;i<2;i++)for(let j=0;j<2;j++)x.drawImage(src,i*64,j*64,64,64)}
function ownOpen(edit){const d=edit?MAT_LIST[edit-1]:null;own.edit=edit;own.tile=null;$('#edOwnCard').hidden=false;
  $('#edOwnName').value=d?d.n:'';$('#edOwnFt').value=d?d.ft:4;$('#edOwnCat').value=d?d.cat:0;$('#edOwnSh').value=Math.round((d&&d.sh||0)*100);ownShV();
  $('#edOwnKey').value=localStorage.getItem('bhd_gui_key')||'';$('#edOwnGo').textContent=d?'Save changes':'Add to the library';
  $('#edOwnPick').textContent=d?'Pick a new picture (or keep this one)':'Pick a photo or picture';ownPreview(null);
  if(d)matImgOf(edit,ownPreview);
  ownMsg(OWN_NET?'The picture is made into a seamless tile. It reaches every device once added.':'Adding textures works on the game\'s website (corleys-island.vercel.app), not this copy.')}
const ownShV=()=>{$('#edOwnShV').textContent=$('#edOwnSh').value+'%'};
$('#edOwnSh').oninput=ownShV;
$('#edOwnAdd').onclick=()=>ownOpen(0);
$('#edOwnEdit').onclick=()=>ownOpen(ed.mat);
$('#edOwnX').onclick=()=>{$('#edOwnCard').hidden=true};
// the Edit button shows while one of the owner's textures is picked
function ownMatPicked(){const d=MAT_LIST[ed.mat-1];$('#edOwnEdit').hidden=!(d&&d.own)}
ownMatPicked();
$('#edOwnFile').onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;ownMsg('Making it seamless…');
  const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{try{own.tile=ownTile(im);ownPreview(own.tile.cv);
        if(!$('#edOwnName').value)$('#edOwnName').value=f.name.replace(/\.[^.]*$/,'').replace(/[_-]+/g,' ').slice(0,40);
        ownMsg('Shown 2 by 2 so you can check the seams. Name it, then add it.')}catch(err){ownMsg('Could not read that picture.')}};
    im.onerror=()=>ownMsg('Could not read that picture.');im.src=r.result};r.readAsDataURL(f)};
$('#edOwnGo').onclick=async()=>{if(own.busy)return;const n=$('#edOwnName').value.trim(),ft=+$('#edOwnFt').value,k=$('#edOwnKey').value.trim(),old=own.edit?MAT_LIST[own.edit-1]:null;
  if(!OWN_NET)return ownMsg('Adding textures works on the game\'s website (corleys-island.vercel.app), not this copy.');
  if(!own.tile&&!old)return ownMsg('Pick a picture first.');if(!n)return ownMsg('Give it a name.');
  if(!(ft>=0.5&&ft<=40))return ownMsg('The tile size goes from 0.5 to 40 ft.');if(!k)return ownMsg('Type the owner key first.');
  const t=own.tile,data={n,cat:+$('#edOwnCat').value,ft,sh:+$('#edOwnSh').value/100,c:t?t.c:old.c,th:t?t.th:old.th};
  own.busy=true;ownMsg('Publishing…');
  try{const id=await ownRpc('mat_put',{p_key:k,p_id:own.edit||null,p_data:JSON.stringify(data),p_img:t?t.url:null});
    if(id===-1)return ownMsg('That owner key is not right. Nothing was published.');
    if(id===-2)return ownMsg(`The library is full (${MAT_MAX-MAT_OWN0} of your own textures).`);
    if(!(id>=MAT_OWN0))return ownMsg('The server did not take it. Nothing was published.');
    try{localStorage.setItem('bhd_gui_key',k)}catch(e){}
    if(t)ownPics[id]=t.url;matOwnTake(Object.assign({i:id,t:Date.now()},data));ownCacheSave();ownChanged([id]);
    ed.mat=id;edMatPanel();edMatLabel();$('#edOwnCard').hidden=true;
    toast(`${n} is in the library${old?'':' under '+MAT_CATS[data.cat]}. Every device gets it the next time the game opens.`,'',4200);ownFetch()}
  catch(e){ownMsg('Could not reach the server. Nothing was published.')}
  finally{own.busy=false}};
