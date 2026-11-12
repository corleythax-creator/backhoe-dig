#!/usr/bin/env node
// Corley's Island: writes each textures/**/*.jpg's .ktx2 twin (Basis Universal ETC1S, mipmapped, flipped to match the
// JPEG as three.js draws it), which js/ktx.js loads in its place so the picture stays compressed on the graphics card.
// Colour maps are encoded perceptually (sRGB); relief, roughness and metal maps (_n, _r, _m) as linear data, the
// relief maps with Basis's normal-map preset. Run by tools/release.py on every release, and by hand after changing a
// texture: node tools/ktx.mjs [file.jpg ...]. textures/ktx.json keeps each JPEG's hash, so only new or changed ones
// are encoded (and a .ktx2 whose JPEG is gone is removed). QUALITY sets the colour maps' quality (1-255).
// Needs ktx2-encoder and sharp: installed on first run into ~/.cache/island-ktx (npm).
import fs from 'fs';import path from 'path';import os from 'os';import crypto from 'crypto';import {execSync} from 'child_process';
import {createRequire} from 'module';import {pathToFileURL} from 'url';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..'),TEX=path.join(root,'textures'),MAN=path.join(TEX,'ktx.json');
const QUALITY=255,LINEAR=/_(n|r|m)\.jpg$/;
const DEPS=path.join(os.homedir(),'.cache/island-ktx');
if(!fs.existsSync(path.join(DEPS,'node_modules/ktx2-encoder'))){fs.mkdirSync(DEPS,{recursive:true});
  execSync(`npm install --silent --no-audit --no-fund --prefix "${DEPS}" ktx2-encoder@0.6.0 sharp@0.34`,{stdio:'inherit'})}
const req=createRequire(path.join(DEPS,'x.js')),sharp=req('sharp');
const {encodeToKTX2}=await import(pathToFileURL(path.join(DEPS,'node_modules/ktx2-encoder/dist/node/index.js')).href);
const decode=async b=>{const {data,info}=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {width:info.width,height:info.height,data}};
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith('.jpg')?[path.join(d,e.name)]:[]);
const man=fs.existsSync(MAN)?JSON.parse(fs.readFileSync(MAN,'utf8')):{},all=walk(TEX),rel=f=>path.relative(TEX,f).split(path.sep).join('/');
const pick=process.argv.slice(2).map(f=>path.resolve(f)),todo=pick.length?pick:all;
const log=console.log;let n=0,jb=0,kb=0;
for(const f of todo){const k=rel(f),b=fs.readFileSync(f),h=crypto.createHash('md5').update(b).digest('hex').slice(0,12),out=f.slice(0,-4)+'.ktx2';
  if(!pick.length&&man[k]===h&&fs.existsSync(out))continue;
  const lin=LINEAR.test(f),o={isUASTC:false,generateMipmap:true,isYFlip:true,isSetKTX2SRGBTransferFunc:!lin,isPerceptual:!lin,imageDecoder:decode,
    ...(/_n\.jpg$/.test(f)?{isNormalMap:true}:{qualityLevel:QUALITY,compressionLevel:2})};
  console.log=()=>{};let r;try{r=await encodeToKTX2(b,o)}finally{console.log=log}
  fs.writeFileSync(out,r);man[k]=h;n++;jb+=b.length;kb+=r.length;log(`${k}: ${(b.length/1024).toFixed(0)} KB jpg -> ${(r.length/1024).toFixed(0)} KB ktx2`)}
// a .ktx2 whose JPEG is gone goes too
const have=new Set(all.map(rel));for(const k of Object.keys(man))if(!have.has(k)){delete man[k];const o=path.join(TEX,k.slice(0,-4)+'.ktx2');if(fs.existsSync(o))fs.unlinkSync(o)}
fs.writeFileSync(MAN,JSON.stringify(Object.fromEntries(Object.entries(man).sort()),null,0).replace(/,"/g,',\n"')+'\n');
log(n?`ktx: encoded ${n} texture(s), ${(jb/1048576).toFixed(1)} MB of JPEG -> ${(kb/1048576).toFixed(1)} MB of KTX2`:'ktx: all textures up to date')
