import {extractSpecialRecipes,FULL_ITEM_DUMP,FULL_ITEM_DUMP_BACKUP} from './special-recipes.js';
import {normalized,itemTier,itemEnch} from './engine.js';
const ROOT='https://cdn.jsdelivr.net/gh/vkorne-web/albion-market@main/';
const BACK='https://raw.githubusercontent.com/vkorne-web/albion-market/main/';
const FULL='https://cdn.jsdelivr.net/gh/ao-data/ao-bin-dumps@master/items.json';
const DB='gildem-catalog-2026';
const CATALOG_TTL=24*3600000;
let dbHandle;
function database(){if(!('indexedDB'in window))return Promise.resolve(null);if(!dbHandle)dbHandle=new Promise(resolve=>{const q=indexedDB.open(DB,1);q.onupgradeneeded=()=>q.result.createObjectStore('files');q.onsuccess=()=>resolve(q.result);q.onerror=()=>resolve(null)});return dbHandle;}
async function get(key){const db=await database();if(!db)return null;return new Promise(r=>{const tx=db.transaction('files','readonly');const req=tx.objectStore('files').get(key);req.onsuccess=()=>r(req.result||null);req.onerror=()=>r(null);});}
async function put(key,value){const db=await database();if(!db)return;return new Promise(r=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put({ts:Date.now(),value},key);tx.oncomplete=()=>r();tx.onerror=()=>r();});}
async function downloadJson(name){let failure;for(const u of [ROOT+name,BACK+name]){try{const res=await fetch(u);if(!res.ok)throw Error('HTTP '+res.status);return await res.json();}catch(e){failure=e;}}throw failure||Error('No se pudo obtener catálogo');}
export let names={};export let recipes={};export let advanced={};
let specialLoaded=false,specialLoadedAt=0;
export async function loadCatalog(force=false){
  const [n,r]=await Promise.all([loadCacheFile('names_es.json',force),loadCacheFile('recipes.json',force)]);
  names=n;recipes={...r,...(specialLoaded?Object.fromEntries(Object.entries(recipes).filter(([k,v])=>v.recipeSource==='ao-bin-dumps')):{})};return {names:Object.keys(n).length,recipes:Object.keys(recipes).length};
}
async function loadCacheFile(name,force=false){const prev=await get(name);if(!force&&prev&&Date.now()-prev.ts<CATALOG_TTL)return prev.value;
 try{const value=await downloadJson(name);await put(name,value);return value;}catch(e){if(prev)return prev.value;throw e;}}
// Se carga únicamente al elegir monturas / pociones / recolección. La primera vez
// descarga el dump oficial, extrae recetas reales y guarda SOLO el resultado
// pequeño en IndexedDB (14 días). Los datos de equipo tradicionales permanecen.
export const SPECIAL_VERSION='special-recipes-v3-food';
export const SPECIAL_TTL=24*3600000;
let recipeSourceState={downloadedAt:null,sourceRevision:null,source:'No comprobada',cached:false};
export function recipeCatalogStatus(){return {...recipeSourceState};}
let specialPromise=null;
function validSpecial(value){
 return value&&typeof value==='object'&&Object.keys(value).length>0&&['potion','mount','gather','food'].every(type=>Object.values(value).some(x=>x?.kind===type));
}
async function remoteSpecial(onProgress,force=false){
 const url=new URL('./.netlify/functions/recipes',window.location.href);
 if(force)url.searchParams.set('refresh','1');
 try{
  onProgress('Consultando recetas optimizadas desde Netlify…');
  const res=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(30000)});
  const type=res.headers.get('content-type')||'';
  if(!res.ok||!type.includes('json'))throw Error('El backend de recetas no está disponible');
  const payload=await res.json();
  if(!validSpecial(payload?.recipes))throw Error(payload?.error||'Backend sin recetas verificables');
  if(payload.warning)onProgress('Advertencia: '+payload.warning);
  return {recipes:payload.recipes,source:payload.source||'Netlify',sourceRevision:payload.sourceRevision||null,downloadedAt:payload.updatedAt||new Date().toISOString(),cached:!!payload.warning};
 }catch(e){onProgress('Usando la fuente oficial alternativa de recetas…');return null;}
}
async function browserSpecial(onProgress){
 let last;
 for(const url of [FULL_ITEM_DUMP,FULL_ITEM_DUMP_BACKUP]){
  try{
   onProgress('Descargando archivo original del juego (17 MB aproximadamente, primera vez)…');
   const res=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(45000)});
   if(!res.ok)throw Error('HTTP '+res.status);
   const dump=await res.json();
   onProgress('Extrayendo recetas de comidas, monturas, pociones y recolección…');
   const data=extractSpecialRecipes(dump);
   if(!validSpecial(data))throw Error('El archivo no incluye suficientes recetas especiales');
   return {recipes:data,source:url,sourceRevision:null,downloadedAt:new Date().toISOString(),cached:false};
  }catch(e){last=e;}
 }
 throw Error('Sin acceso a las fuentes de recetas. '+(last?.message||'Comprueba la conexión'));
}
// Intenta un archivo compacto publicado en Netlify. Solo si no está disponible,
// consulta el dump RAW del juego; NUNCA formatted/items.json, que es un listado
// de IDs y nombres, no un archivo de craftingrequirements.
export async function loadSpecialCatalog(onProgress=()=>{},force=false){
 if(specialLoaded&&!force&&Date.now()-specialLoadedAt<SPECIAL_TTL)return Object.keys(recipes).length;
 if(specialPromise&&!force)return specialPromise;
 const perform=async()=>{
  const latest=await get(SPECIAL_VERSION),previous=latest||await get('special-recipes-7');
  if(!force&&previous&&Date.now()-previous.ts<SPECIAL_TTL&&validSpecial(previous.value)){
   const storedMeta=(await get(SPECIAL_VERSION+'-metadata'))?.value;
   Object.assign(recipes,previous.value);specialLoaded=true;specialLoadedAt=Date.now();recipeSourceState={...storedMeta,cached:true,downloadedAt:storedMeta?.downloadedAt||new Date(previous.ts).toISOString(),source:storedMeta?.source||'Recetas locales',sourceRevision:storedMeta?.sourceRevision||null};
   onProgress('Recetas guardadas el '+new Date(previous.ts).toLocaleString('es-ES')+'. Se comprobarán nuevamente dentro de 24 h.');
   return Object.keys(previous.value).length;
  }
  try{
   const downloaded=await remoteSpecial(onProgress,force)||await browserSpecial(onProgress);
   const special=downloaded.recipes;
   if(!validSpecial(special))throw Error('No se encontraron recetas válidas');
   recipeSourceState={source:downloaded.source,sourceRevision:downloaded.sourceRevision,downloadedAt:downloaded.downloadedAt,cached:downloaded.cached};
   await put(SPECIAL_VERSION,special);await put(SPECIAL_VERSION+'-metadata',recipeSourceState);
   Object.assign(recipes,special);specialLoaded=true;specialLoadedAt=Date.now();
   onProgress('Recetas de '+Object.keys(special).length+' objetos cargadas. Revisión: '+(recipeSourceState.sourceRevision?.slice(0,9)||'no disponible')+'.');
   return Object.keys(special).length;
  }catch(e){
   if(validSpecial(previous?.value)){
    Object.assign(recipes,previous.value);specialLoaded=true;specialLoadedAt=Date.now();recipeSourceState={source:'Copia local, sin actualizar',sourceRevision:null,downloadedAt:new Date(previous.ts).toISOString(),cached:true};
    onProgress('No se pudo actualizar; usando recetas guardadas anteriormente, con fecha '+new Date(previous.ts).toLocaleString('es-ES')+'.');
    return Object.keys(previous.value).length;
   }
   throw Error('No se pudieron cargar recetas especiales. '+e.message+' · Para la carga más fiable, publica la versión completa en GitHub + Netlify.');
  }
 };
 specialPromise=perform().finally(()=>{specialPromise=null;});
 return specialPromise;
}
export function itemName(id){const raw=String(id||'');const base=raw.split('@')[0];const suffix=raw.includes('@')?' · '+itemTier(raw)+'.'+itemEnch(raw):'';return (names[raw]||names[base]||base.replaceAll('_',' '))+suffix;}
export function findItems(term,max=30){let q=normalized(term).trim();if(!q)return [];
 const ids=Object.keys(names);const ranked=[];
 for(const id of ids){const n=normalized(names[id]);const code=normalized(id);if(!(n.includes(q)||code.includes(q)))continue;
 const rank=(n===q?0:n.startsWith(q)?1:code===q?0:code.includes(q)?2:3);ranked.push({id,name:names[id],rank});}
 ranked.sort((a,b)=>a.rank-b.rank||a.name.length-b.name.length||a.name.localeCompare(b.name));
 return ranked.slice(0,max);
}
export const GROUPS=[
 {key:'botas',label:'Botas',test:(id)=>/^T\d+_SHOES_/.test(id)},
 {key:'cascos',label:'Cascos y capuchas',test:(id)=>/^T\d+_HEAD_/.test(id)},
 {key:'pecheras',label:'Armaduras, chaquetas y túnicas',test:(id)=>/^T\d+_ARMOR_/.test(id)},
 {key:'hachas',label:'Hachas',test:(id)=>/^(T\d+)_(MAIN_AXE|2H_AXE|2H_HALBERD|2H_SCYTHE|2H_REALM|2H_BEARPAWS|2H_CARRION)/.test(id)||/HACHA/i.test(names[id]||'')},
 {key:'espadas',label:'Espadas',test:(id)=>/^(T\d+)_(MAIN_SWORD|2H_CLAYMORE|2H_DUALSWORD|2H_KINGMAKER|2H_CLEAVER|2H_BROADSWORD)/.test(id)||/ESPADA/i.test(names[id]||'')},
 {key:'varas',label:'Bastones y varas',test:(id)=>/STAFF|HOLY|NATURE|FIRE|FROST|CURSE|ARCANE/.test(id)},
 {key:'bolsas',label:'Bolsas y capas',test:(id)=>/^T\d+_(BAG|CAPE)/.test(id)},
 {key:'armas',label:'Todas las armas',test:(id)=>/^T\d+_(MAIN_|2H_|OFF_)/.test(id)},
 {key:'todo',label:'Todo el equipamiento',test:(id)=>/^T\d+_(HEAD_|SHOES_|ARMOR_|MAIN_|2H_|OFF_)/.test(id)}
];
export function craftable(group='botas',minTier=4,maxTier=6,maxEnchant=1,limit=85){const def=GROUPS.find(g=>g.key===group)||GROUPS[0];
 return Object.keys(recipes).filter(id=>{const tier=itemTier(id),ench=itemEnch(id);return tier>=minTier&&tier<=maxTier&&ench<=maxEnchant&&def.test(id)&&recipes[id]?.materials?.length;}).sort((a,b)=>itemTier(a)-itemTier(b)||itemEnch(a)-itemEnch(b)||a.localeCompare(b)).slice(0,limit);
}
export async function loadAdvanced(onProgress=()=>{}){
 let cached=await get('advanced-journals');if(cached&&Date.now()-cached.ts<CATALOG_TTL){advanced=cached.value;return Object.keys(advanced).length;}
 onProgress('Descargando datos completos del juego (archivo oficial grande)…');let data;try{let r=await fetch(FULL);if(!r.ok)throw Error('HTTP '+r.status);data=await r.json();}catch(e){if(cached){advanced=cached.value;return Object.keys(advanced).length;}throw Error('No se pudo descargar el archivo avanzado: '+e.message);}
 onProgress('Leyendo diarios de crafting y fama del juego…');const result={},journalEntries=asArray(data?.items?.journalitem);
 for(const j of journalEntries){const mission=j?.famefillingmissions?.craftitemfame;if(!mission)continue;
   const max=Number(j['@maxfame']);const per=Number(mission['@value']);const journal=j['@uniquename'];
   if(!(max>0&&per>0&&journal))continue;
   for(const v of asArray(mission.validitem)){const item=v?.['@id'];if(item)result[item]={journal,max,per};}
 }
 advanced=result;await put('advanced-journals',result);return Object.keys(result).length;
}
function asArray(v){if(!v)return [];return Array.isArray(v)?v:[v];}
export function journalFor(id){return advanced[id]||advanced[String(id).split('@')[0]]||null;}
export function journalIds(j){if(!j)return null;return {empty:j.journal+'_EMPTY',full:j.journal+'_FULL'};}
