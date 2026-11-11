// Optional ALWAYS-ON worker. Netlify alone cannot run persistent NATS/TCP.
// Does not collect prices, trade volume, or completed sales, only PUBLIC order sightings.
import net from 'node:net';
import {normalizeNatsOrders,parseNatsFrames} from './aodp-nats-utils.mjs';
const url=process.env.GILDEM_SITE_URL?.replace(/\/$/,'');
const secret=process.env.GILDEM_NATS_INGEST_SECRET||'';
if(!/^https:\/\/[^\s]+$/.test(url||'')||secret.length<32){
 console.error('Configura GILDEM_SITE_URL=https://tu-sitio.netlify.app y GILDEM_NATS_INGEST_SECRET (32+ caracteres).');process.exit(1);
}
const rows=new Map();let connected=false,lastEventAt=null,seen=0,attempt=0,socket=null;
function observe(order){
 const key=[order.itemId,order.city,order.quality].join('|');const now=Date.now();
 const record=rows.get(key)||{itemId:order.itemId,city:order.city,quality:order.quality,observedOrders:0,lastSeenAt:order.lastSeenAt,firstSeenAt:order.lastSeenAt,at:now,ids:new Set()};
 // Reiniciar la ventana de observación: no acumular eventos indefinidamente.
 if(now-Date.parse(record.firstSeenAt)>=600000){record.observedOrders=0;record.ids.clear();record.firstSeenAt=order.lastSeenAt;}
 const id=order.orderId;
 if(id&&record.ids.has(id))return;
 if(id){record.ids.add(id);if(record.ids.size>2000)record.ids.delete(record.ids.values().next().value);}
 record.observedOrders++;record.lastSeenAt=order.lastSeenAt;record.at=now;rows.set(key,record);
 seen++;lastEventAt=order.lastSeenAt;
}
async function publish(){
 // Count SIGHTINGS over the past 10min. The figures are NOT current orderbook depth.
 const now=Date.now(),recent=[];
 for(const [k,r] of rows){if(now-r.at>600000){rows.delete(k);continue;}
  recent.push({itemId:r.itemId,city:r.city,quality:r.quality,observedOrders:r.observedOrders,lastSeenAt:r.lastSeenAt});
 }
 recent.sort((a,b)=>b.observedOrders-a.observedOrders);
 const payload={region:'west',source:'AODP-NATS-marketorders.deduped',generatedAt:new Date().toISOString(),connected,lastEventAt,observedMessages:seen,orders:recent.slice(0,450)};
 try{
  const reply=await fetch(url+'/.netlify/functions/aodp-feed-ingest',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+secret},body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});
  if(!reply.ok)throw Error('HTTP '+reply.status+' '+(await reply.text()).slice(0,160));
  console.log('NATS West: snapshot publicado',payload.orders.length,'grupos; eventos recibidos',seen);
 }catch(e){console.error('No se pudo publicar el snapshot:',String(e.message||e));}
}
function connect(){
 attempt++;let buffer=Buffer.alloc(0);
 const s=net.createConnection({host:'nats.albion-online-data.com',port:4222});socket=s;
 s.setKeepAlive(true,15000);
 s.on('connect',()=>{
  connected=true;attempt=0;
  // Credenciales públicas publicadas por el AODP. No incluir secretos privados.
  s.write('CONNECT '+JSON.stringify({verbose:false,pedantic:false,name:'gildem-west-market-observer',lang:'node',version:'1',user:'public',pass:'thenewalbiondata'})+'\r\n');
  s.write('SUB marketorders.deduped 1\r\nPING\r\n');
  console.log('Conectado a NATS Americas/West; solo se observan órdenes.');
 });
 s.on('data',chunk=>{
  try{
   buffer=Buffer.concat([buffer,chunk]);const parsed=parseNatsFrames(buffer);buffer=parsed.rest;
   for(const frame of parsed.frames){
    if(frame.type==='PING'){s.write('PONG\r\n');continue;}
    if(frame.type==='MSG'){
     try{for(const o of normalizeNatsOrders(JSON.parse(frame.payload.toString('utf8'))))observe(o);}catch{}
    }
    if(frame.type==='LINE'&&frame.line?.startsWith('-ERR'))console.error('NATS:',frame.line);
   }
  }catch(e){console.error('Error de protocolo:',String(e));s.destroy();}
 });
 s.on('error',e=>console.error('NATS desconectado:',String(e.message||e)));
 s.on('close',()=>{connected=false;if(socket!==s)return;
  const delay=Math.min(60000,1000*Math.pow(2,Math.min(6,attempt)));console.log('Reconectando en',delay,'ms');setTimeout(connect,delay);
 });
}
connect();
setInterval(()=>void publish(),60000);
process.on('SIGTERM',()=>{socket?.end();process.exit(0);});
