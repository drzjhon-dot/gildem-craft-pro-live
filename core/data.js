// Hourly request cache while open and across reloads. Age of OBSERVATIONS checked separately.
export const HOUR=3600000;
const prefixes={west:'https://west.albion-online-data.com',europe:'https://europe.albion-online-data.com',east:'https://east.albion-online-data.com'};
const inflight=new Map();
const prefix='gildem-aodp-v2:';
let lastCall=0;
let coolUntil=0;
const sleep=(n)=>new Promise(r=>setTimeout(r,n));
function storageGet(k){try{const s=localStorage.getItem(prefix+k);if(!s)return null;return JSON.parse(s);}catch{return null;}}
function storageSet(k,v){try{localStorage.setItem(prefix+k,JSON.stringify(v));}catch{ // remove oldest entries on quota
  try{Object.keys(localStorage).filter(s=>s.startsWith(prefix)).slice(0,15).forEach(s=>localStorage.removeItem(s));localStorage.setItem(prefix+k,JSON.stringify(v));}catch{} }
}
function split(ids){const groups=[];let cur=[];for(const id of [...new Set(ids)]){if(cur.length>=45||cur.join(',').length+id.length>1200){groups.push(cur);cur=[];}cur.push(id);}if(cur.length)groups.push(cur);return groups;}
async function fetchRaw(kind,ids,region,params,force=false){const base=prefixes[region]||prefixes.west;const path='/api/v2/stats/'+kind+'/'+ids.join(',')+'.json';const query=new URLSearchParams(params);const direct=base+path+'?'+query;
  // Netlify proxy first. Falls back to direct request for locally hosted/static deployments.
  const proxy=new URL('./.netlify/functions/market',location.href);
  proxy.searchParams.set('kind',kind);proxy.searchParams.set('region',region);if(force)proxy.searchParams.set('refresh','1');proxy.searchParams.set('items',ids.join(','));for(const [k,v] of query)proxy.searchParams.set(k,v);
  let res;
  try{
    res=await fetch(proxy.toString(),{headers:{'Accept':'application/json'}});
    const type=res.headers.get('content-type')||'';
    // En Netlify Drop no existe la función: no intentes interpretar HTML como JSON.
    if([404,405,501].includes(res.status)||!type.includes('application/json'))res=null;
  }catch{res=null;}
  if(!res){res=await fetch(direct,{headers:{'Accept':'application/json'}});}
  if((res.headers.get('x-gildem-cache')||'').toUpperCase()==='STALE')throw new Error('El proxy devolvió información antigua; no se verificaron precios nuevos.');
  if(res.status===429){
    const waitSeconds=Number(res.headers.get('retry-after')||0);
    const resetSeconds=Number(res.headers.get('ratelimit-reset')||0);
    const absoluteReset=resetSeconds>1000000000?resetSeconds*1000:0;
    coolUntil=Math.max(Date.now()+60000,Date.now()+Math.max(0,waitSeconds)*1000,absoluteReset);
    throw new Error('AODP limita las solicitudes (429). Próximo intento después de '+new Date(coolUntil).toLocaleTimeString('es-ES')+'. No se inventan datos nuevos.');
  }
  if(!res.ok)throw new Error('Error de API '+res.status+' al consultar '+kind);
  const data=await res.json();if(!Array.isArray(data)&&!(kind==='orderbook'&&data&&typeof data==='object'))throw new Error('Respuesta inesperada del servidor');return data;
}
async function api(kind,ids,region='west',params={},force=false){if(!ids?.length)return {rows:[],cached:true,fetchedAt:Date.now()};
  const chunks=split(ids),sets=[],timestamps=[],errors=[];let anyFetched=false;
  for(const chunk of chunks){const key=[region,kind,[...chunk].sort().join(','),JSON.stringify(params)].join('|');const cache=storageGet(key);
    if(!force&&cache&&Date.now()-cache.ts<(kind==='orderbook'?300000:HOUR)){sets.push(cache.rows);timestamps.push(cache.ts);continue;}
    if(inflight.has(key)){const got=await inflight.get(key);sets.push(got.rows);timestamps.push(got.ts);anyFetched ||=!got.fromCache;continue;}
    const work=(async()=>{
      if(Date.now()<coolUntil){if(cache)return {...cache,fromCache:true};throw new Error('API temporalmente limitada');}
      const delay=Math.max(0,1200-(Date.now()-lastCall));if(delay)await sleep(delay);lastCall=Date.now();
      try{const rows=await fetchRaw(kind,chunk,region,params,force);const entry={rows,ts:Date.now()};storageSet(key,entry);return {...entry,fromCache:false};}
      catch(e){if(cache)return {...cache,fromCache:true,stale:true,error:e.message};throw e;}
    })();inflight.set(key,work);
    try{const got=await work;sets.push(got.rows);timestamps.push(got.ts);anyFetched ||=!got.fromCache;if(got.error)errors.push(got.error);}finally{inflight.delete(key);}
  }
  return {rows:sets.flat(),cached:!anyFetched,fetchedAt:Math.min(...timestamps),warning:errors[0]||null};
}
export const prices=(ids,region='west',force=false)=>api('prices',ids,region,{locations:'Bridgewatch,Fort Sterling,Lymhurst,Martlock,Thetford,Caerleon,Brecilien,Black Market',qualities:'1'},force);
export const history=(ids,region='west',force=false)=>api('history',ids,region,{locations:'Bridgewatch,Fort Sterling,Lymhurst,Martlock,Thetford,Caerleon,Brecilien,Black Market',qualities:'1','time-scale':'24'},force);
export const orderbook=(ids,region='west',force=false,cities=['Black Market'])=>api('orderbook',ids,region,{locations:cities.join(','),qualities:'1'},force);
export function clearCache(){try{Object.keys(localStorage).filter(k=>k.startsWith(prefix)).forEach(k=>localStorage.removeItem(k));}catch{}}
export function cachedCount(){try{return Object.keys(localStorage).filter(k=>k.startsWith(prefix)).length;}catch{return 0;}}
// Cotizaciones por calidad para estimar mezcla real. Solo las calidades con
// probabilidades positivas se utilizan; no se inventan precios ausentes.
export const pricesQuality=(ids,region='west',force=false)=>api('prices',ids,region,{locations:'Bridgewatch,Fort Sterling,Lymhurst,Martlock,Thetford,Caerleon,Brecilien,Black Market',qualities:'1,2,3,4,5'},force);
