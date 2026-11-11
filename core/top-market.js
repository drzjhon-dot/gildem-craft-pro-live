// Gildem Craft Pro v9.2.0 · Top de ventas del mercado (América / West).
// La misma información que las webs de «top selling items», calculada aquí desde
// el historial público de AODP, siempre en el servidor West y conectada a los
// planes de crafteo. Son observaciones del mercado, no ventas garantizadas.
import {BRANCHES} from './branches.js';
const n=x=>Number.isFinite(Number(x))?Math.max(0,Number(x)):0;
const DAY=86400000;

// Agrega el historial diario (time-scale 24) por «objeto|ciudad» dentro de la
// ventana pedida. El promedio divide por los días de la VENTANA, como hacen las
// webs de referencia: un objeto que solo se vendió 2 de 7 días promedia bajo.
export function aggregateTopMarket(rows=[],{days=7,now=Date.now()}={}){
 const window=Math.max(1,Math.min(30,Math.floor(n(days))||7));
 const since=now-window*DAY;
 const bucket=new Map();
 for(const row of rows||[]){
  const id=row?.item_id,city=row?.location||row?.city;
  if(!id||!city||!Array.isArray(row.data))continue;
  const key=id+'|'+city;
  const entry=bucket.get(key)||{id,city,units:0,silver:0,observations:0,activeDays:new Set()};
  for(const point of row.data){
   const at=Date.parse(point?.timestamp);
   if(!Number.isFinite(at)||at<since||at>now+DAY)continue;
   const count=n(point.item_count),price=n(point.avg_price);
   if(!(count>0))continue;
   entry.units+=count;entry.silver+=count*price;entry.observations++;
   entry.activeDays.add(new Date(at).toISOString().slice(0,10));
  }
  bucket.set(key,entry);
 }
 const out=[];
 for(const e of bucket.values()){
  if(!(e.units>0))continue;
  out.push({id:e.id,city:e.city,days:window,
   dailyAmount:e.units/window,
   dailySilver:e.silver/window,
   unitPrice:e.silver/e.units,
   totalUnits:e.units,observations:e.observations,activeDays:Math.min(e.activeDays.size,window)});
 }
 return out;
}

export const TOP_SORTS=Object.freeze({
 silver:{label:'Silver por día',field:'dailySilver'},
 amount:{label:'Unidades por día',field:'dailyAmount'},
 price:{label:'Precio por unidad',field:'unitPrice'}
});
export function rankTopMarket(entries=[],{sortBy='silver',limit=60,cities=null,minDaily=0}={}){
 const field=(TOP_SORTS[sortBy]||TOP_SORTS.silver).field;
 const allowed=cities&&cities.length?new Set(cities):null;
 return (entries||[])
  .filter(e=>(!allowed||allowed.has(e.city))&&e.dailyAmount>=n(minDaily))
  .sort((a,b)=>n(b[field])-n(a[field])||n(b.dailySilver)-n(a.dailySilver))
  .slice(0,Math.max(1,Math.floor(n(limit))||60));
}

// Rama concreta (no agregada) a la que pertenece un objeto, para saltar al plan.
const aggregate=key=>key==='weapons_all'||String(key).endsWith('_all')||key==='gather_tools';
export function branchForItem(id){
 for(const b of BRANCHES){
  if(aggregate(b.key))continue;
  try{if(b.test(id))return {key:b.key,label:b.label,market:b.market==='royal'?'royal':'black'};}catch{}
 }
 const fallback=BRANCHES.find(b=>{try{return b.test(id);}catch{return false;}});
 return fallback?{key:fallback.key,label:fallback.label,market:fallback.market==='royal'?'royal':'black'}:null;
}
