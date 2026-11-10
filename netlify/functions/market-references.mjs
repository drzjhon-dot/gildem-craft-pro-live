// Auditoría de accesibilidad, NO scraping de precios ni prueba del servidor de las páginas.
// El único origen numérico usado automáticamente es AODP West.
import {WEST_MARKET_SOURCES} from '../../core/server-policy.js';
export async function verifyMarketReferences(fetcher=fetch,{region='west'}={}){
 if(region!=='west')return {checkedAt:new Date().toISOString(),region:'west',error:'Solo Americas West',checks:[],usedForPrices:false,usedForMarketVolume:false};
 const at=new Date().toISOString();
 const checks=await Promise.all(WEST_MARKET_SOURCES.map(async ({key,url,westSelectable})=>{
  try{
   let r=await fetcher(url,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(4500),headers:{'user-agent':'GildemCraftPro/8.6.3'}});
   if(r.status===405||r.status===501)r=await fetcher(url,{method:'GET',redirect:'follow',signal:AbortSignal.timeout(4500),headers:{Range:'bytes=0-0','user-agent':'GildemCraftPro/8.6.3'}});
   return {key,status:r.ok?'accessible':'unavailable',checkedAt:at,westSelectable,serverVerified:false,numericImported:false};
  }catch{return {key,status:'unverified',checkedAt:at,westSelectable,serverVerified:false,numericImported:false};}
 }));
 return {checkedAt:at,region:'west',checks,usedForPrices:false,usedForMarketVolume:false,numericSource:'Albion Online Data Project (AODP West)',numericServerVerified:true};
}
export default async function handler(request){
 if(request.method!=='GET')return new Response('Método no permitido',{status:405});
 const region=new URL(request.url).searchParams.get('region')||'west';
 if(region!=='west')return new Response(JSON.stringify({error:'Gildem solo consulta el servidor América (West)'}),{status:400,headers:{'content-type':'application/json'}});
 return new Response(JSON.stringify(await verifyMarketReferences()),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
}
export const config={path:'/.netlify/functions/market-references'};
