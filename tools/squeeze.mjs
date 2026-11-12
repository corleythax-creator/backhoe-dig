#!/usr/bin/env node
// Corley's Island: makes the model files (models/**/*.glb) smaller to download and keep, without changing how they
// look or what the game reads from them. Run by tools/release.py on every release (and by hand: node tools/squeeze.mjs
// [file ...]); a file it has done before is skipped (its asset.generator ends "+squeeze"), so the model builders
// (tools/build_model.js, tools/scans.js, Human Forge's wire) can keep writing plain files.
//  1. Snap: vertex positions, normals and texture coordinates, and animation keys, are rounded to a fine power-of-two
//     grid (a position to 1/2048 m or 1/16384 of the part's size, whichever is finer; a normal to 1/512; a texture
//     coordinate to 1/4096, a texel of a 4K picture), staying 32-bit floats, so the game's code sees the same data
//     types it always did. Rounded floats end in runs of zero bits, which brotli (Vercel serves .glb compressed) and
//     meshopt pack far better: about half the download.
//  2. Meshopt (EXT_meshopt_compression): the files the game opens with three.js's GLTFLoader (everything but
//     models/people) are also reordered and meshopt-packed, about a third of the size on disk and in the device's
//     cache. models.js mdlLoaderReady gives every GLTFLoader the decoder; forgetown.js and tools/model-shot.js have
//     their own. models/people is read by Human Forge's own parser (human-forge.js), which has no meshopt decoder, so
//     those files are only snapped.
// Needs @gltf-transform and meshoptimizer: installed on first run into ~/.cache/island-squeeze (npm).
import fs from 'fs';import path from 'path';import os from 'os';import {execSync} from 'child_process';import {createRequire} from 'module';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const DEPS=path.join(os.homedir(),'.cache/island-squeeze'),PKGS=['@gltf-transform/core@4','@gltf-transform/extensions@4','@gltf-transform/functions@4','meshoptimizer@0.25'];
if(!fs.existsSync(path.join(DEPS,'node_modules/@gltf-transform/functions'))){fs.mkdirSync(DEPS,{recursive:true});
  execSync(`npm install --silent --no-audit --no-fund --prefix "${DEPS}" ${PKGS.join(' ')}`,{stdio:'inherit'})}
const req=createRequire(path.join(DEPS,'x.js'));
const {NodeIO,VertexLayout}=req('@gltf-transform/core'),{ALL_EXTENSIONS,EXTMeshoptCompression}=req('@gltf-transform/extensions'),
  {reorder}=req('@gltf-transform/functions'),{MeshoptEncoder,MeshoptDecoder}=req('meshoptimizer');
await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const TAG='+squeeze',POS=2**-11,POS_REL=2**-14,STEP={NORMAL:2**-9,TANGENT:2**-9,TEXCOORD_0:2**-12,TEXCOORD_1:2**-12};
const ROT=2**-15,KEY=2**-12;
// the JSON chunk of a .glb, to see whether it was squeezed before without parsing the whole file
function glbJson(f){const fd=fs.openSync(f,'r'),h=Buffer.alloc(20);fs.readSync(fd,h,0,20,0);const n=h.readUInt32LE(12),b=Buffer.alloc(n);
  fs.readSync(fd,b,0,n,20);fs.closeSync(fd);return JSON.parse(b.toString('utf8'))}
const snapArr=(v,st)=>{for(let i=0;i<v.length;i++)v[i]=Math.round(v[i]/st)*st};
function posStep(a){const v=a.getArray(),n=a.getElementSize();let ext=0;
  for(let c=0;c<n;c++){let lo=Infinity,hi=-Infinity;for(let i=c;i<v.length;i+=n){if(v[i]<lo)lo=v[i];if(v[i]>hi)hi=v[i]}ext=Math.max(ext,hi-lo)}
  return ext>0?Math.min(POS,2**Math.floor(Math.log2(ext*POS_REL))):POS}
function snap(doc){const done=new Set();
  for(const m of doc.getRoot().listMeshes())for(const p of m.listPrimitives())for(const s of p.listSemantics()){const a=p.getAttribute(s);
    if(done.has(a)||a.getComponentType()!==5126||a.getNormalized())continue;const st=s==='POSITION'?posStep(a):STEP[s];if(!st)continue;done.add(a);snapArr(a.getArray(),st)}
  for(const an of doc.getRoot().listAnimations())for(const c of an.listChannels()){const o=c.getSampler()&&c.getSampler().getOutput(),t=c.getTargetPath();
    if(!o||done.has(o)||o.getComponentType()!==5126||t==='weights')continue;done.add(o);snapArr(o.getArray(),t==='rotation'?ROT:KEY)}}
const files=process.argv.slice(2).length?process.argv.slice(2).map(f=>path.resolve(f)):(function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>
  e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith('.glb')?[path.join(d,e.name)]:[])})(path.join(root,'models'));
let before=0,after=0,n=0;
for(const f of files){const j=glbJson(f);if(String(j.asset&&j.asset.generator||'').endsWith(TAG))continue;
  const people=path.relative(root,f).split(path.sep).includes('people'),was=fs.statSync(f).size;
  const doc=await io.read(f);snap(doc);
  if(!people){await doc.transform(reorder({encoder:MeshoptEncoder,target:'size'}));
    doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE})}
  const a=doc.getRoot().getAsset();a.generator=(a.generator||'glTF')+TAG;
  // people: Human Forge's parser reads packed (non-interleaved) arrays
  if(people)io.setVertexLayout(VertexLayout.SEPARATE);else io.setVertexLayout(VertexLayout.INTERLEAVED);
  fs.writeFileSync(f,await io.writeBinary(doc));const now=fs.statSync(f).size;before+=was;after+=now;n++;
  console.log(`${path.relative(root,f)}: ${(was/1024).toFixed(0)} KB -> ${(now/1024).toFixed(0)} KB${people?' (snapped)':''}`)}
console.log(n?`squeezed ${n} model file(s): ${(before/1048576).toFixed(1)} MB -> ${(after/1048576).toFixed(1)} MB`:'models: all squeezed already')
