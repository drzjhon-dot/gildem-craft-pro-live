// Revisa accesibilidad de fuentes de referencia; NO extrae estadísticas ni precios.
// Solo destinos estáticos para evitar SSRF. El motor numérico sigue usando AODP.
const SOURCES=[
 ['albion-journal','https://vanatoliyv.github.io/albion-craft-profit/'],
 ['albion-hub','https://albiononlinehub.com/top-selling-items'],
 ['royal-forge','https://royalforge.app/market'],
 ['albion-tools','https://albiononlinetools.com/marketplace/']
];
export async function verifyMarketReferences(fetcher=fetch){
 const at=new Date().toISOString();
 const checks=await Promise.all(SOURCES.map(async ([key,url])=>{
  try{
   let r=await fetcher(url,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(5500),headers:{'user-agent':'GildemCraftPro/8.5.9'}});
   if(r.status===405||r.status===501)r=await fetcher(url,{method:'GET',redirect:'follow',signal:AbortSignal.timeout(5500),headers:{'Range':'bytes=0-0','user-agent':'GildemCraftPro/8.5.9'}});
   return {key,status:r.ok?'accessible':'unavailable',checkedAt:at};
  }catch{return {key,status:'unverified',checkedAt:at};}
 }));
 return {checkedAt:at,checks,usedForPrices:false,usedForMarketVolume:false,numericSource:'Albion Online Data Project (AODP)'};
}
export default async function handler(request){
 if(request.method!=='GET')return new Response('Método no permitido',{status:405});
 return new Response(JSON.stringify(await verifyMarketReferences()),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
}
export const config={path:'/.netlify/functions/market-references'};
