import {cp,mkdir,rm,stat,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {BRANCHES,BRANCH_CATEGORIES} from '../core/branches.js';
import {imageUpstreams} from '../netlify/functions/item-image.mjs';
import {overlayGearRecipes} from '../core/ao-gear-recipes.js';

const OUTPUT='dist';
const assets=['index.html','app.js','styles.css','sw.js','manifest.webmanifest'];
const folders=['core','icons','assets','v9'];
await rm(OUTPUT,{recursive:true,force:true});
await mkdir(OUTPUT,{recursive:true});
for(const file of assets){await stat(file);await cp(file,join(OUTPUT,file));}
for(const dir of folders){await stat(dir);await cp(dir,join(OUTPUT,dir),{recursive:true});}

// Iconos opcionales precargados. Un fallo de la CDN no bloquea el despliegue.
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

// GCP_AO_DUMPS_GEAR_872: integra recetas reales del RAW de ao-bin-dumps.
// Solo el catálogo estático: AODP continúa proporcionando precios y actividad.
const prefetchCatalog=process.env.GILDEM_PREFETCH_CATALOG==='1';
const catalogStored=[];
if(prefetchCatalog){
 const sources=['https://raw.githubusercontent.com/vkorne-web/albion-market/main/',
  'https://cdn.jsdelivr.net/gh/vkorne-web/albion-market@main/'];
 const fetchJson=async file=>{
  for(const origin of sources)try{
   const res=await fetch(origin+file,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(9500)});
   if(!res.ok)continue;
   const raw=await res.text();
   if(raw.length<1000||raw.length>10_000_000)continue;
   const data=JSON.parse(raw);
   if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).length<100)continue;
   return data;
  }catch{}
  return null;
 };
 const legacy=await Promise.all(['names_es.json','recipes.json'].map(fetchJson));
 if(legacy[0]){
  await mkdir(join(OUTPUT,'catalog'),{recursive:true});
  await writeFile(join(OUTPUT,'catalog/names_es.json'),JSON.stringify(legacy[0]));
  catalogStored.push('names_es.json');
 }
 let recipes=legacy[1];
 const info={source:recipes?'vkorne-web/albion-market (respaldo)':'no disponible',
  raw:'ao-data/ao-bin-dumps/master/items.json',fetchedAt:new Date().toISOString(),
  direct:0,retired:0,legacyFallback:recipes?Object.keys(recipes).length:0};
 if(process.env.GILDEM_DIRECT_BIN_DUMPS!=='0'){
  const dumps=['https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json',
   'https://cdn.jsdelivr.net/gh/ao-data/ao-bin-dumps@master/items.json'];
  for(const url of dumps){
   try{
    const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(22000)});
    if(!response.ok)throw Error('HTTP '+response.status);
    const raw=await response.json();
    const merged=overlayGearRecipes(recipes||{},raw);
    if(merged.statistics.direct<300)throw Error('Menos de 300 recetas de equipo verificables');
    recipes=merged.recipes;
    Object.assign(info,{source:url,direct:merged.statistics.direct,retired:merged.statistics.retired,
     legacyFallback:merged.statistics.legacyFallback,unknownCity:merged.statistics.unknownCity});
    break;
   }catch(e){console.warn('ao-bin-dumps no disponible en build; se mantiene respaldo:',String(e.message||e));}
  }
 }
 if(recipes&&Object.keys(recipes).length>100){
  await mkdir(join(OUTPUT,'catalog'),{recursive:true});
  await writeFile(join(OUTPUT,'catalog/recipes.json'),JSON.stringify(recipes));
  catalogStored.push('recipes.json');
 }
 if(catalogStored.length){
  await writeFile(join(OUTPUT,'catalog/ao-bin-source.json'),JSON.stringify(info,null,2)+'\n');
  console.log('Catálogo crafting:',JSON.stringify(info));
 }
}
await writeFile(join(OUTPUT,'version.json'),JSON.stringify({app:'Gildem Craft Pro',version:'9.0.0',build:'github-netlify',api:'west / AODP',publishedAt:new Date().toISOString()},null,2)+'\n');
await writeFile(join(OUTPUT,'core/icon-manifest.js'),`export const LOCALLY_CACHED_ICONS = new Set(${JSON.stringify(stored)});\n`);
console.log(`Gildem Craft Pro v9.0: dist/ preparado. Iconos: ${stored.length}. Catálogos: ${catalogStored.length}.`);
