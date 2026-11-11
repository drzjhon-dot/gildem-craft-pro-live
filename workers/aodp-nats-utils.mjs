// NATS West listener validation: these are observed MARKET ORDERS, never sales.
export const AODP_WEST_LOCATIONS=Object.freeze({
 '3003':'Black Market','2004':'Bridgewatch','5003':'Brecilien',
 '3005':'Caerleon','4002':'Fort Sterling','1002':'Lymhurst',
 '3008':'Martlock','7':'Thetford'
});
// La documentación de AODP publica timestamps NATS como ticks .NET.
// BigInt evita perder precisión al convertir enteros de 18 dígitos.
export function ticksToUnixMilliseconds(value){
 try{const ticks=BigInt(value);const ms=(ticks-621355968000000000n)/10000n;const number=Number(ms);return Number.isFinite(number)?number:null;}catch{return null;}
}
const cleanId=s=>typeof s==='string'&&/^T[1-8]_[A-Z0-9_@-]{2,96}$/.test(s)?s:null;
export function normalizeNatsOrders(body,receivedAt=new Date().toISOString()){
 const payload=Array.isArray(body?.Orders)?body.Orders:Array.isArray(body)?body:[body];
 if(!Array.isArray(payload))return [];
 const result=[];
 for(const o of payload){
  if(!o||typeof o!=='object')continue;
  const itemId=cleanId(o.ItemTypeId??o.item_id??o.itemId);
  const city=AODP_WEST_LOCATIONS[String(o.LocationId??o.locationId)]||null;
  const quality=Number(o.QualityLevel??o.quality);
  if(!itemId||!city||!Number.isInteger(quality)||quality<1||quality>5)continue;
  const orderId=String(o.Id??o.ID??'');
  result.push({itemId,city,quality,orderId:orderId.slice(0,72),lastSeenAt:receivedAt});
 }
 return result;
}
// Minimal NATS text protocol parser for SUB messages; byte length, not JS chars.
export function parseNatsFrames(source){
 let rest=Buffer.from(source),frames=[];
 while(rest.length){
  const breakAt=rest.indexOf('\r\n');if(breakAt<0)break;
  const head=rest.subarray(0,breakAt).toString('utf8');
  if(head.startsWith('MSG ')){
   const parts=head.split(/\s+/);const size=Number(parts.at(-1));
   if(!Number.isInteger(size)||size<0||size>1024*1024)throw Error('NATS MSG inválido');
   const needed=breakAt+2+size+2;
   if(rest.length<needed)break;
   if(rest[needed-2]!==13||rest[needed-1]!==10)throw Error('NATS frame sin CRLF');
   frames.push({type:'MSG',subject:parts[1],payload:rest.subarray(breakAt+2,breakAt+2+size)});
   rest=rest.subarray(needed);
  }else{
   frames.push({type:head==='PING'?'PING':head==='PONG'?'PONG':'LINE',line:head});
   rest=rest.subarray(breakAt+2);
  }
 }
 if(rest.length>2*1024*1024)throw Error('NATS buffer demasiado grande');
 return {frames,rest};
}
