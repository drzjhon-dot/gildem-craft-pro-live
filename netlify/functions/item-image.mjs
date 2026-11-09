// Proxy de imágenes oficiales de Albion. Solo IDs de ítems, nunca URLs arbitrarias.
// CDN de respaldo para usuarios cuyo navegador bloquea el renderer externo.
import {validIconId} from '../../core/icons.js';
const maximum=750_000;
const publicCache={'Cache-Control':'public,max-age=86400,s-maxage=604800','Netlify-CDN-Cache-Control':'public,max-age=604800','X-Content-Type-Options':'nosniff'};
export function imageUpstreams(id,size){
 const encoded=encodeURIComponent(id);
 return [
  `https://cdn.albionfreemarket.com/item/${encoded}.png?size=${size}`,
  `https://render.albiononline.com/v1/item/${encoded}.png?size=${size}&quality=1`
 ];
}
export async function resolveIcon(id,size,fetcher=fetch){
 if(!validIconId(id))return null;
 const px=Math.min(217,Math.max(32,Math.round(Number(size)||84)));
 for(const url of imageUpstreams(id,px)){
  try{
   const response=await fetcher(url,{headers:{Accept:'image/png,image/*;q=0.8'},signal:AbortSignal.timeout(4500)});
   const type=response.headers.get('content-type')||'';
   if(!response.ok||!type.startsWith('image/'))continue;
   const contentLength=Number(response.headers.get('content-length')||0);
   if(contentLength>maximum)continue;
   const bytes=new Uint8Array(await response.arrayBuffer());
   if(bytes.byteLength<24||bytes.byteLength>maximum)continue;
   const pngHeader=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
   const webpHeader=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
   if(!pngHeader&&!webpHeader)continue;
   return {bytes,contentType:pngHeader?'image/png':'image/webp',url};
  }catch{}
 }
 return null;
}
export default async request=>{
 const url=new URL(request.url);
 const id=url.searchParams.get('id')||'';
 const size=Number(url.searchParams.get('size')||84);
 if(!validIconId(id)||!Number.isFinite(size)||size<32||size>217){
  return new Response('ID de ítem o tamaño inválido',{status:400,headers:{'Cache-Control':'no-store'}});
 }
 const result=await resolveIcon(id,size);
 if(!result)return new Response('Icono no disponible',{status:404,headers:{'Cache-Control':'public,max-age=300'}});
 return new Response(result.bytes,{status:200,headers:{...publicCache,'Content-Type':result.contentType}});
};
