import {extractCatalog,normalizeNames} from './catalog.mjs';
import {getMarket} from './market.mjs';
const CATALOG_KEY='gildem-nova-catalog-v9';
export async function loadCatalog({fetcher=fetch,storage=globalThis.localStorage,force=false,onProgress=()=>{}}={}){
 try{if(!force&&storage){const prev=JSON.parse(storage.getItem(CATALOG_KEY)||'null');if(prev?.catalog?.recipes?.length&&Date.now()-prev.at<24*3600000)return {...prev.catalog,sourceStatus:'caché guardada · '+new Date(prev.at).toLocaleString('es-ES')};}}catch{}
 onProgress('Conectando con los datos de objetos…');let catalog=null,names={};let errors=[];
 const attempt=async endpoints=>{for(const [endpoint,mode] of endpoints)try{const r=await fetcher(endpoint,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();return mode==='raw'?extractCatalog(data):data;}catch(e){errors.push(String(e.message));}return null;};
 catalog=await attempt([['/.netlify/functions/catalog?type=recipes','ready'],['https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json','raw'],['https://cdn.jsdelivr.net/gh/ao-data/ao-bin-dumps@master/items.json','raw']]);
 if(!catalog?.recipes?.length)throw Error('Las recetas no pudieron verificarse. Comprueba las conexiones RAW o la función /catalog. '+errors.slice(-2).join(' · '));
 onProgress('Cargando nombres en español…');
 const namePayload=await attempt([['/.netlify/functions/catalog?type=names','ready'],['https://raw.githubusercontent.com/vkorne-web/albion-market/main/names_es.json','ready']]);
 names=normalizeNames(namePayload?.names||namePayload||{});
 const result={...catalog,names,sourceStatus:catalog.meta?.source||'Fuente sin identificar'};
 try{storage?.setItem(CATALOG_KEY,JSON.stringify({at:Date.now(),catalog:result}));}catch{}
 return result;
}
export {getMarket};
