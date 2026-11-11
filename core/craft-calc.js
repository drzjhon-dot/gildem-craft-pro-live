// Gildem Craft Pro v9.4.0 · Craft Cal. — calculadora de crafteo por lotes.
// Mismas reglas que el motor de planes: retorno con bono de ciudad y Focus
// (craftingReturnRate), costes netos tras retornos (craftCost) y comisiones de
// Ajustes. Precios SOLO de AODP (West); si falta una cotización, la fila lo dice
// en lugar de inventarla. Observaciones del mercado, no ventas garantizadas.
import {craftCost,craftProfit,craftingReturnRate,CITIES} from './engine.js';
import {journalInfo} from './journals.js';
import {craftingFameFromRecipe} from './level-craft.js';
import {branchForItem} from './top-market.js';
const n=x=>Number.isFinite(Number(x))?Math.max(0,Number(x)):0;

// Índice de cotizaciones del endpoint /stats/prices: id → {askByCity, bmBid, bestAsk}
export function quoteIndex(rows=[],{maxAgeHours=24,now=Date.now()}={}){
 const map=new Map();
 const fresh=at=>{const t=Date.parse(at);return Number.isFinite(t)&&now-t<=maxAgeHours*3600000;};
 for(const r of rows||[]){
  if(Number(r?.quality||1)!==1)continue;
  const id=r?.item_id,city=r?.city||r?.location;
  if(!id||!city)continue;
  const e=map.get(id)||{ask:new Map(),bmBid:null,bmAt:null};
  const ask=n(r.sell_price_min),bid=n(r.buy_price_max);
  if(city==='Black Market'){
   if(bid>0&&fresh(r.buy_price_max_date)&&bid>(e.bmBid||0)){e.bmBid=bid;e.bmAt=r.buy_price_max_date;}
  }else if(CITIES.includes(city)&&ask>0&&fresh(r.sell_price_min_date)){
   e.ask.set(city,{price:ask,at:r.sell_price_min_date});
  }
  map.set(id,e);
 }
 return map;
}
const cheapestAsk=(quotes,id)=>{
 const e=quotes.get(id);if(!e)return null;
 let best=null;for(const [city,q] of e.ask)if(!best||q.price<best.price)best={price:q.price,city,at:q.at};
 return best;
};
const highestAsk=(quotes,id)=>{
 const e=quotes.get(id);if(!e)return null;
 let best=null;for(const [city,q] of e.ask)if(!best||q.price>best.price)best={price:q.price,city,at:q.at};
 return best;
};

// Calcula un lote. items: [{id, qty}]. Devuelve filas por objeto, materiales y
// diarios agregados, y totales con DOS profits: Mercado Negro y mejor Royal.
export function calcBatch(items=[],{recipes={},quotes=new Map(),journalLookup=()=>null,
 premium=true,focus=false,dailyBonus=0,tax=4,setup=2.5,stationFee=0,maxAgeHours=24}={}){
 const taxRate=n(tax)/100,setupRate=n(setup)/100;
 const rows=[],materials=new Map(),journals=new Map();
 for(const item of items||[]){
  const id=item?.id,qty=Math.max(0,Math.floor(n(item?.qty)));
  if(!id||!qty)continue;
  const recipe=recipes[id];
  if(!recipe?.materials?.length){rows.push({id,qty,ok:false,reason:'Sin receta cargada para este objeto.'});continue;}
  const rate=craftingReturnRate({specialty:!!recipe.city,dailyBonus,focus}).returnRate;
  const cost=craftCost(recipe,mid=>cheapestAsk(quotes,mid),rate,n(stationFee));
  if(!cost){rows.push({id,qty,ok:false,reason:'Faltan cotizaciones de algún material en AODP (ventana de '+maxAgeHours+' h).'});continue;}
  const amount=Math.max(1,n(recipe.amount)||1);
  const bm=quotes.get(id)?.bmBid||0;
  const royal=highestAsk(quotes,id);
  const profitBM=bm>0?craftProfit(cost,bm*amount,{tax:taxRate,mode:'instant'}):null;
  const profitRoyal=royal?craftProfit(cost,royal.price*amount,{tax:taxRate,setup:setupRate,mode:'listed'}):null;
  const fame=craftingFameFromRecipe(id,recipe,{premium});
  const branch=branchForItem(id);
  const journal=journalInfo(id,recipe,branch?.key||'',journalLookup(id));
  const journalsPerCraft=journal?.ratio>0?journal.ratio:0;
  rows.push({id,qty,ok:true,craftCity:recipe.city||null,returnRate:rate,amount,
   unitCost:cost.total,totalCost:cost.total*qty,rawPerCraft:cost.rawMaterials,
   bmBid:bm>0?bm:null,royalAsk:royal?.price||null,royalCity:royal?.city||null,
   profitBM:profitBM?profitBM.profit*qty:null,profitRoyal:profitRoyal?profitRoyal.profit*qty:null,
   famePerCraft:fame?.value||0,fameTotal:(fame?.value||0)*qty,fameEstimated:!!fame?.estimated,
   journalsNeeded:journalsPerCraft*qty,journalEmpty:journal?.empty||null});
  for(const m of cost.materials){
   const key=m.id+'|'+(m.city||'');
   const e=materials.get(key)||{id:m.id,city:m.city||null,gross:0,used:0,unitPrice:m.unitPrice,usedBy:new Set()};
   e.gross+=m.count*qty;e.used+=m.used*qty;
   e.unitPrice=Math.max(e.unitPrice,n(m.unitPrice));e.usedBy.add(id);
   materials.set(key,e);
  }
  if(journalsPerCraft>0&&journal?.empty){
   const e=journals.get(journal.empty)||{empty:journal.empty,name:journal.name||journal.code,tier:journal.tier,needed:0,exact:journal.exact,usedBy:new Set()};
   e.needed+=journalsPerCraft*qty;e.exact=e.exact&&journal.exact;e.usedBy.add(id);
   journals.set(journal.empty,e);
  }
 }
 const materialList=[...materials.values()].map(m=>({...m,usedBy:[...m.usedBy].sort(),
  gross:Math.ceil(m.gross),spare:Math.max(0,Math.ceil(m.gross)-Math.ceil(m.used)),
  grossCost:Math.ceil(m.gross)*m.unitPrice,netCost:m.used*m.unitPrice}));
 const journalList=[...journals.values()].map(j=>{
  const price=cheapestAsk(quotes,j.empty);
  const count=Math.ceil(j.needed-1e-9);
  return {...j,usedBy:[...j.usedBy].sort(),count,unitPrice:price?.price||null,buyCity:price?.city||null,
   totalCost:price?count*price.price:null};
 });
 const ok=rows.filter(r=>r.ok);
 const totals={
  crafts:ok.reduce((a,r)=>a+r.qty,0),
  netCost:ok.reduce((a,r)=>a+r.totalCost,0),
  grossCapital:materialList.reduce((a,m)=>a+m.grossCost,0),
  journalCost:journalList.reduce((a,j)=>a+(j.totalCost||0),0),
  profitBM:ok.some(r=>r.profitBM!=null)?ok.reduce((a,r)=>a+(r.profitBM??0),0):null,
  profitRoyal:ok.some(r=>r.profitRoyal!=null)?ok.reduce((a,r)=>a+(r.profitRoyal??0),0):null,
  bmMissing:ok.filter(r=>r.profitBM===null).length,
  royalMissing:ok.filter(r=>r.profitRoyal===null).length,
  fame:ok.reduce((a,r)=>a+r.fameTotal,0)
 };
 return {rows,materials:materialList.sort((a,b)=>b.grossCost-a.grossCost),journals:journalList,totals};
}

// IDs cuyo precio hay que pedir a AODP para calcular un lote.
export function calcPriceIds(items=[],recipes={},journalLookup=()=>null){
 const ids=new Set();
 for(const item of items||[]){
  const id=item?.id;const recipe=recipes[id];
  if(!id||!recipe?.materials?.length)continue;
  ids.add(id);
  for(const m of recipe.materials)ids.add(m.id);
  const branch=branchForItem(id);
  const j=journalInfo(id,recipe,branch?.key||'',journalLookup(id));
  if(j?.empty)ids.add(j.empty);
 }
 return [...ids];
}
