import {extractCatalog,normalizeLegacyRecipes,normalizeNames} from '../../src/catalog.mjs';
const RAW=['https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json','https://cdn.jsdelivr.net/gh/ao-data/ao-bin-dumps@master/items.json'];
const LEGACY='https://raw.githubusercontent.com/vkorne-web/albion-market/main/';
let cache=new Map();
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':status===200?'public,max-age=600,s-maxage=21600':'no-store'}});
async function getJSON(url,fetcher,timeout){const res=await fetcher(url,{headers:{Accept:'application/json','Accept-Encoding':'gzip,deflate,br'},signal:AbortSignal.timeout(timeout)});if(!res.ok)throw Error('HTTP '+res.status);return res.json();}
export async function getCatalog(type,{fetcher=fetch,now=Date.now(),store=cache}={}){
 if(!['recipes','names'].includes(type))throw Error('Categoría de catálogo no permitida');
 const hit=store.get(type);if(hit&&now-hit.at<21600000)return hit.value;
 let result,error;
 if(type==='names'){
  try{const raw=await getJSON(LEGACY+'names_es.json',fetcher,20000);result={names:normalizeNames(raw),meta:{source:'vkorne-web/albion-market',fetchedAt:new Date(now).toISOString()}};if(Object.keys(result.names).length<50)throw Error('Sin nombres válidos');}
  catch(e){error=e;}
 }else{
  for(const url of RAW){try{const raw=await getJSON(url,fetcher,30000);result=extractCatalog(raw);if(result.recipes.length<100)throw Error('Menos de 100 recetas válidas');break;}catch(e){error=e;result=null;}}
  if(!result){try{const raw=await getJSON(LEGACY+'recipes.json',fetcher,18000);result=normalizeLegacyRecipes(raw);if(result.recipes.length<100)throw Error('Catálogo derivado insuficiente');}catch(e){error=e;result=null;}}
 }
 if(!result){if(hit)return {...hit.value,meta:{...hit.value.meta,stale:true,warning:String(error?.message||'Fallo en origen')}};throw Error('Catálogo no disponible: '+String(error?.message||'sin conexión'));}
 store.set(type,{value:result,at:now});return result;
}
export default async function handler(request){if(request.method!=='GET')return reply({error:'Método no permitido'},405);try{return reply(await getCatalog(new URL(request.url).searchParams.get('type')));}catch(e){return reply({error:String(e.message)},503);}}
export const config={path:'/.netlify/functions/catalog'};
