// Fuente: Albion Online Data Project, servidor West. Historial = actividad de
// anuncios observados; NO volumen confirmado de transacciones reales.
import {CITIES,MARKETS,chunk,dateAgeHours,parseUTC,positive} from './util.mjs';
export const WEST='https://west.albion-online-data.com';
export function assertIDs(ids){if(!Array.isArray(ids)||ids.length===0||ids.length>45||ids.some(x=>!/^T[1-8]_[A-Z0-9_@-]{1,100}$/.test(x)))throw Error('IDs de objetos no permitidos');}
export function apiPath(kind,ids,locations){assertIDs(ids);if(!['prices','history'].includes(kind))throw Error('Consulta no permitida');if(!Array.isArray(locations)||!locations.length||locations.some(x=>!MARKETS.includes(x)))throw Error('Ciudad no permitida');const params=new URLSearchParams({locations:locations.join(','),qualities:'1'});if(kind==='history')params.set('time-scale','24');return `/api/v2/stats/${kind}/${ids.join(',')}.json?${params}`;}
function bucketKey(kind,ids,loc){return `gildem-v9:${kind}:${[...ids].sort().join(',')}:${loc.join(',')}`;}
const memory=new Map();
export async function getMarket(kind,ids,locations,{fetcher=fetch,force=false,now=Date.now(),cache=memory,proxy=true}={}){
 const unique=[...new Set(ids)];if(!unique.length)return {rows:[],fetchedAt:null,stale:false,warning:'Sin IDs para consultar'};
 let rows=[],warnings=[],oldest=null,stale=false;
 for(const part of chunk(unique,40)){
  const key=bucketKey(kind,part,locations),cached=cache.get(key),ttl=kind==='history'?1800000:600000;
  if(cached&&!force&&now-cached.at<ttl){rows.push(...cached.rows);oldest=oldest===null?cached.at:Math.min(oldest,cached.at);continue;}
  const path=apiPath(kind,part,locations),endpoints=proxy?[`/.netlify/functions/market?kind=${kind}&items=${encodeURIComponent(part.join(','))}&locations=${encodeURIComponent(locations.join(','))}`,WEST+path]:[WEST+path];
  let last,backoff=false;
  for(const endpoint of endpoints){
   if(backoff)break;
   try{
    const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),15000);
    let res;try{res=await fetcher(endpoint,{signal:ctl.signal,headers:{Accept:'application/json'}});}finally{clearTimeout(timeout);}
    if(res.status===429){backoff=true;throw Error('AODP respondió 429; evita repetir solicitudes de inmediato');}
    if(!res.ok){
     if(res.status===503){try{const body=await res.clone().json();if(/429|limite|límite/i.test(body?.error||'')){backoff=true;throw Error('AODP 429: espera antes de volver a consultar');}}catch(e){if(backoff)throw e;}}
     throw Error('API HTTP '+res.status);
    }
    const payload=await res.json();if(!Array.isArray(payload))throw Error('Formato de datos inesperado');
    const isStale=res.headers?.get?.('X-Gildem-Stale')==='true';
    if(isStale){stale=true;warnings.push('Proxy West devolvió observaciones antiguas; revisar fechas');}
    cache.set(key,{at:now,rows:payload});rows.push(...payload);oldest=oldest===null?now:Math.min(oldest,now);last=null;break;
   }catch(e){last=e;}
  }
  if(last){warnings.push(last.message);if(cached){rows.push(...cached.rows);oldest=oldest===null?cached.at:Math.min(oldest,cached.at);stale=true;}else{stale=true;}}
 }
 return {rows,fetchedAt:oldest===null?null:new Date(oldest).toISOString(),stale,warning:warnings.join(' · ')||null,coverage:rows.length};
}
export function priceIndex(records){const map=new Map();for(const r of records||[]){if(!r?.item_id||!r.city)continue;map.set(r.item_id+'|'+r.city,r);}return map;}
export function quote(priceMap,id,city,side,{maxAge=48,now=Date.now()}={}){
 const row=priceMap.get(id+'|'+city);if(!row||!['sell_price_min','buy_price_max'].includes(side))return null;
 const value=positive(row[side]),time=row[side+'_date'],ageHours=dateAgeHours(time,now);
 if(value===null||ageHours===null||ageHours<0||ageHours>maxAge)return null;
 return {price:value,ageHours,date:time,source:'AODP West',side};
}
export function weeklyObserved(historyRows,now=Date.now(),days=14){const threshold=now-days*86400000;const map=new Map();for(const r of historyRows||[]){const id=r.item_id,city=r.location||r.city;if(!id||!city)continue;let count=0,observations=0,totalPrice=0;for(const day of r.data||[]){const ts=parseUTC(day.timestamp||day.date||'');const n=Number(day.item_count);if(!Number.isFinite(ts)||ts<threshold||ts>now||!Number.isFinite(n)||n<0)continue;count+=n;observations++;totalPrice+=n*Math.max(0,Number(day.avg_price)||0);}const key=id+'|'+city;const old=map.get(key)||{count:0,observations:0,volume:0};old.count+=count;old.observations+=observations;old.volume+=totalPrice;map.set(key,old);}return new Map([...map].map(([key,v])=>[key,{weekly:v.observations?7*v.count/days:null,observations:v.observations,avgPrice:v.count>0?v.volume/v.count:null,days}]));}
export function materialQuote(map,id,{maxAge=48,now=Date.now(),cities=CITIES}={}){
 const options=cities.map(city=>({city,q:quote(map,id,city,'sell_price_min',{maxAge,now})})).filter(x=>x.q);
 options.sort((a,b)=>a.q.price-b.q.price);return options[0]?{city:options[0].city,...options[0].q}:null;
}
export function requiredMaterials(recipes){return [...new Set(recipes.flatMap(r=>r.materials.map(x=>x.id)))];}
