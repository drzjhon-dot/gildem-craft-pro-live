// Strict input verification before writing anything to Netlify Blobs.
export function validateNatsSnapshot(body,now=Date.now()){
 if(!body||body.region!=='west'||body.source!=='AODP-NATS-marketorders.deduped'||!Array.isArray(body.orders)||body.orders.length>450)return null;
 const timestamp=Date.parse(body.generatedAt),last=Date.parse(body.lastEventAt||body.generatedAt);
 if(!Number.isFinite(timestamp)||Math.abs(timestamp-now)>120000||!Number.isFinite(last))return null;
 const orders=[];
 for(const r of body.orders){
  if(typeof r.itemId!=='string'||!/^T[1-8]_[A-Z0-9_@-]{2,96}$/.test(r.itemId)||
    !['Black Market','Bridgewatch','Brecilien','Caerleon','Fort Sterling','Lymhurst','Martlock','Thetford'].includes(r.city)||
    !Number.isInteger(r.quality)||r.quality<1||r.quality>5||
    !Number.isInteger(r.observedOrders)||r.observedOrders<0||r.observedOrders>500000||!Number.isFinite(Date.parse(r.lastSeenAt)))return null;
  orders.push({itemId:r.itemId,city:r.city,quality:r.quality,observedOrders:r.observedOrders,lastSeenAt:r.lastSeenAt});
 }
 return {region:'west',source:body.source,generatedAt:body.generatedAt,connected:body.connected===true,lastEventAt:body.lastEventAt,observedMessages:Math.min(1000000000,Math.max(0,Math.round(Number(body.observedMessages)||0))),orders};
}
