// v9.9.6 · Una sola definición de actividad AODP para Top Mercado y planes.
// La actividad conjunta 1-5 es un indicador, NO ventas garantizadas.
// Un lote fabricado necesita además una demanda atendible compatible con
// la distribución de calidades: NO se puede asignar el 100% de ese volumen.
import {aggregateTopMarket} from './top-market.js';
import {historyMetrics} from './optimizer.js';
import {demandHistoryIndex} from './demand-first.js';
import {addressableDemand,qualityVolumeIndex} from './market-mechanics.js';

const key=(id,city)=>id+'|'+city;
const blank=(days,now)=>historyMetrics([],days,now);
const normalize=(top,normal,days,now)=>{
 if(!top)return blank(days,now);
 return {
  ...normal,days,observations:top.observations,activeDays:top.activeDays,
  coverage:top.activeDays/days,count:top.totalUnits,
  observedDaily:top.dailyAmount,observedSilverDaily:top.dailySilver,
  observedTurnover:top.dailySilver*days,
  // El promedio conjunto es informativo, no se utiliza como precio de
  // equilibrio para una orden Normal (cuya cotización es otra).
  allQualityAvgPrice:top.unitPrice,allQualityHistory:true,
  periodStart:top.periodStart,periodEnd:top.periodEnd,
  normalPrice:normal.medianPrice,normalObservedDaily:normal.observedDaily,
  isSalesData:false
 };
};

export function sharedMarketActivity(rows=[],{now=Date.now()}={}){
 const list=Array.isArray(rows)?rows:[];
 // IMPORTANTE: el mismo agregador de Top Mercado, no una reconstrucción aparte.
 const top14=aggregateTopMarket(list,{days:14,now});
 const top7=aggregateTopMarket(list,{days:7,now});
 const seven=new Map(top7.map(x=>[key(x.id,x.city),x]));
 const byMarket=new Map();
 const normalSeries=demandHistoryIndex(list); // Solo calidad Normal para precios de la puja.
 const higher14=qualityVolumeIndex(list,14,now);
 const higher7=qualityVolumeIndex(list,7,now);
 const coverageSeries=new Map();
 const seen=new Map();
 // Para la auditoría de cobertura mostrar TODAS las calidades, también cuando
 // la calidad Normal no se observó. Nunca duplicar la misma muestra API.
 for(const r of list){
  const city=r?.location||r?.city,id=r?.item_id,q=Number(r?.quality??1);
  if(!id||!city||!(q>=1&&q<=5)||!Array.isArray(r?.data))continue;
  const k=key(id,city),observations=coverageSeries.get(k)||[],signatures=seen.get(k)||new Set();
  for(const p of r.data){const sig=[q,p?.timestamp,p?.item_count,p?.avg_price].join('|');
   if(signatures.has(sig))continue;
   signatures.add(sig);observations.push(p);
  }
  coverageSeries.set(k,observations);seen.set(k,signatures);
 }
 for(const a of top14){
  const k=key(a.id,a.city),b=seven.get(k)||null;
  const normal=normalSeries.get(k)||[];
  const normal14=historyMetrics(normal,14,now),normal7=historyMetrics(normal,7,now);
  const d14=addressableDemand(normal14.observations?normal14.observedDaily:null,higher14.get(k));
  const d7=addressableDemand(normal7.observations?normal7.observedDaily:null,higher7.get(k));
  // Capamos al total 1-5 (nunca sumamos calidad 2-3 dos veces).
  // Si no hay datos de calidad Normal, no suponemos que nuestro lote
  // pueda abastecer órdenes de calidad superior.
  const daily=d14.daily===null?null:Math.min(a.dailyAmount,d14.daily);
  const recentDaily=d7.daily===null?null:Math.min(b?.dailyAmount??0,d7.daily);
  const activity=normalize(a,normal14,14,now);
  const activity7=normalize(b,normal7,7,now);
  byMarket.set(k,{
   id:a.id,city:a.city,daily,recentDaily,
   activity,activity7,activity30:blank(30,now),
   marketObservedDaily:a.dailyAmount,marketObserved7Daily:b?.dailyAmount??null,
   source:'Top Mercado · AODP West · calidades 1–5',
   verified:daily!==null&&daily>0,
   qualitySupply:d14.byQuality,
   windowStart:a.periodStart,windowEnd:a.periodEnd
  });
 }
 return {byMarket,top14,top7,coverageSeries};
}

// No se permiten anuncios BM sin evidencia reciente aunque el precio parezca rentable.
// Esta restricción es intencional: nunca reutilizar 1-2 muestras viejas para
// justificar lotes enteros, ni confundir missing history con 0 ventas.
export function hasListingEvidence(route,{minDays14=4,minDays7=2,minWeekly=1}={}){
 if(route?.mode==='instant'&&route?.depthVerified)return true;
 const a=route?.activity,r=route?.activity7;
 return Number(a?.activeDays)>=minDays14&&Number(r?.activeDays)>=minDays7&&
   Number(r?.count)>=minWeekly&&Number(route?.demandDaily)>0&&
   (route?.marketEvidenceSource!=='Top Mercado · AODP West'||Number(route?.marketRecentAddressableDaily)>0);
}
