import {cp,mkdir,rm,stat,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {BRANCHES,BRANCH_CATEGORIES} from '../core/branches.js';
import {imageUpstreams} from '../netlify/functions/item-image.mjs';

const OUTPUT='dist';
const assets=['index.html','app.js','styles.css','sw.js','manifest.webmanifest'];
const folders=['core','icons'];
await rm(OUTPUT,{recursive:true,force:true});
await mkdir(OUTPUT,{recursive:true});
for(const file of assets){await stat(file);await cp(file,join(OUTPUT,file));}
for(const dir of folders){await stat(dir);await cp(dir,join(OUTPUT,dir),{recursive:true});}

// Netlify can prebundle representative Albion item icons into the published
// site. Static hosting then works even when a visitor blocks external hosts.
// Never fail a crafting deployment because an image service is unavailable.
const prefetch=process.env.GILDEM_PREFETCH_ICONS==='1'||(!!process.env.NETLIFY&&process.env.GILDEM_PREFETCH_ICONS!=='0');
const stored=[];
if(prefetch){
 const ids=[...new Set([...BRANCH_CATEGORIES,...BRANCHES].map(x=>x.iconId))].filter(Boolean);
 await mkdir(join(OUTPUT,'item-icons'),{recursive:true});
 let offset=0;
 async function worker(){
  while(offset<ids.length){
   const id=ids[offset++];
   for(const url of imageUpstreams(id,128)){
    try{
     const res=await fetch(url,{headers:{Accept:'image/png'},signal:AbortSignal.timeout(3000)});
     if(!res.ok||!(res.headers.get('content-type')||'').startsWith('image/'))continue;
     const bytes=Buffer.from(await res.arrayBuffer());
     if(bytes.byteLength<24||bytes.byteLength>750_000||bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71)continue;
     await writeFile(join(OUTPUT,'item-icons',encodeURIComponent(id)+'.png'),bytes);
     stored.push(id);break;
    }catch{}
   }
  }
 }
 await Promise.all(Array.from({length:Math.min(8,ids.length)},()=>worker()));
}
await writeFile(join(OUTPUT,'version.json'),JSON.stringify({app:'Gildem Craft Pro',version:'8.5.2',build:'github-netlify',api:'west / AODP',publishedAt:new Date().toISOString()},null,2)+'\n');
await writeFile(join(OUTPUT,'core/icon-manifest.js'),`export const LOCALLY_CACHED_ICONS = new Set(${JSON.stringify(stored)});\n`);
console.log(`Gildem Craft Pro: dist/ preparado. Iconos locales del selector: ${stored.length}. Fuentes en vivo con respaldo automático.`);
