import {apiPath,WEST} from '../../src/market.mjs';
const cache=new Map(),COOLDOWN=600000;
const response=(obj,status=200,headers={})=>new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public,max-age=120',...headers}});
export async function queryMarket(url,{fetcher=fetch,now=Date.now(),store=cache}={}){
 const p=new URL(url).searchParams,kind=p.get('kind'),ids=(p.get('items')||'').split(',').filter(Boolean),locations=(p.get('locations')||'').split(',').filter(Boolean);
 const path=apiPath(kind,ids,locations),key=kind+':'+path,old=store.get(key),ttl=kind==='history'?1800000:600000;
 if(old&&now-old.at<ttl)return {rows:old.rows,cached:true,stale:false};
 try{const res=await fetcher(WEST+path,{headers:{'Accept-Encoding':'gzip, deflate, br','Accept':'application/json'},signal:AbortSignal.timeout(12500)});if(res.status===429)throw Error('AODP 429: límite de consultas');if(!res.ok)throw Error('AODP HTTP '+res.status);const rows=await res.json();if(!Array.isArray(rows))throw Error('Respuesta no válida');store.set(key,{rows,at:now});return {rows,cached:false,stale:false};}
 catch(e){if(old)return {rows:old.rows,cached:true,stale:true,warning:String(e.message)};throw e;}
}
export default async function handler(request){if(request.method!=='GET')return response({error:'Método no permitido'},405);try{const result=await queryMarket(request.url);return response(result.rows,200,result.stale?{'X-Gildem-Stale':'true','X-Gildem-Warning':result.warning}:{});}catch(e){return response({error:String(e.message)},503,{'cache-control':'no-store'});}}
export const config={path:'/.netlify/functions/market'};
