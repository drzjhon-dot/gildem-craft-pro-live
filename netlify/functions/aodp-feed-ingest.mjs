import {getStore} from '@netlify/blobs';
import {timingSafeEqual} from 'node:crypto';
import {validateNatsSnapshot} from './aodp-feed-validation.mjs';
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
function secretMatches(provided,expected){if(!provided||!expected||expected.length<32)return false;
 const a=Buffer.from(provided),b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b);}
export default async function(request){
 if(request.method!=='POST')return reply({error:'Método no permitido'},405);
 const secret=process.env.GILDEM_NATS_INGEST_SECRET||'';
 if(secret.length<32)return reply({error:'Feed NATS no configurado'},503);
 if(!secretMatches(request.headers.get('authorization')?.replace(/^Bearer\s+/i,'')||'',secret))return reply({error:'No autorizado'},401);
 if(Number(request.headers.get('content-length')||0)>180000)return reply({error:'Carga demasiado grande'},413);
 try{const raw=await request.text();if(raw.length>180000)return reply({error:'Carga demasiado grande'},413);
  const payload=validateNatsSnapshot(JSON.parse(raw));if(!payload)return reply({error:'Snapshot no válido'},400);
  const store=getStore({name:'gildem-aodp-west-feed'});await store.setJSON('latest',payload);
  return reply({ok:true,receivedAt:new Date().toISOString()});
 }catch(e){console.error('Error al persistir feed:',String(e.message||e));return reply({error:'Servicio de feed no disponible'},503);}
}
export const config={path:'/.netlify/functions/aodp-feed-ingest'};
