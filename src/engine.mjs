// Motor único de crafting: la rotación manda, ROI es una advertencia.
// Sólo items con recetas y observaciones reales. No inventamos volúmenes ni
// convertimos anuncios históricos en ventas confirmadas.
import {CITIES,cmpTier,fmt,n,positive} from './util.mjs';
import {quote,materialQuote} from './market.mjs';
export const DEFAULTS=Object.freeze({budget:10000000,minimumWeekly:50,minimumCrafts:2,maxItems:20,days:14,share:.08,perItemBudget:.20,rrr:.2481,rrrFocus:.4792,station:0,transport:0,bmTax:.025,royalTax:.04,listingFee:.025,maxAge:48});
export function getConfig(v={}){const x={...DEFAULTS,...v};x.budget=Math.max(0,n(x.budget));x.minimumWeekly=Math.max(0,n(x.minimumWeekly));x.minimumCrafts=Math.max(2,Math.floor(n(x.minimumCrafts,2)));x.maxItems=Math.max(1,Math.min(100,Math.floor(n(x.maxItems,20))));x.days=Math.max(1,Math.min(30,n(x.days,14)));x.share=Math.max(.01,Math.min(.5,n(x.share,.08)));x.perItemBudget=Math.max(.02,Math.min(.5,n(x.perItemBudget,.2)));x.rrr=Math.max(0,Math.min(.65,n(x.rrr)));x.rrrFocus=Math.max(0,Math.min(.65,n(x.rrrFocus,.4792)));x.station=Math.max(0,n(x.station));x.transport=Math.max(0,n(x.transport));x.bmTax=Math.max(0,Math.min(.3,n(x.bmTax)));x.royalTax=Math.max(0,Math.min(.3,n(x.royalTax)));x.listingFee=Math.max(0,Math.min(.3,n(x.listingFee)));x.maxAge=Math.max(1,Math.min(168,n(x.maxAge,48)));return x;}
export function evaluate(rec,city,priceMap,historyMap,config={},now=Date.now()){
 const c=getConfig(config);if(!rec?.materials?.length||!rec.city||!city)return null;
 if(city==='Black Market'&&rec.market==='royal')return null;
 const activity=historyMap.get(rec.id+'|'+city),weekly=activity?.weekly;
 if(weekly===null||weekly===undefined||weekly<c.minimumWeekly)return null;
 const output=Math.max(1,n(rec.output,1));
 const rrr=rec.specialtyEnabled===false?0:c.rrr;
 const materialParts=rec.materials.map(m=>{const price=materialQuote(priceMap,m.id,{maxAge:c.maxAge,now});return {...m,price:price?.price??null,city:price?.city??null,ageHours:price?.ageHours??null};});
 if(materialParts.some(m=>m.price===null))return null;
 const raw=materialParts.reduce((s,m)=>s+m.count*m.price,0);
 const expectedMaterials=materialParts.reduce((s,m)=>s+m.count*m.price*(m.returned?(1-rrr):1),0);
 const upfrontPerCraft=raw+c.station+c.transport;
 if(!(upfrontPerCraft>0)||upfrontPerCraft*c.minimumCrafts>c.budget)return null;
 const bm=city==='Black Market';
 const bid=quote(priceMap,rec.id,city,'buy_price_max',{maxAge:c.maxAge,now});
 const ask=quote(priceMap,rec.id,city,'sell_price_min',{maxAge:c.maxAge,now});
 // BM: bid NPC observado; no asumir que podrá publicarse al precio histórico.
 // Royal: la mejor oferta visible es un ANUNCIO, no una venta realizada.
 const chosen=bm?bid:ask;
 const fallback=!chosen&&positive(activity?.avgPrice)?{price:activity.avgPrice,date:null,ageHours:null,source:'historial',side:'historical'}:null;
 const sale=chosen||fallback;
 const salePrice=sale?.price??null;
 const rate=(bm?c.bmTax:c.royalTax)+(bm?0:c.listingFee);
 const profitPerCraft=!chosen?null:(chosen.price*output*(1-rate)-expectedMaterials-c.station-c.transport);
 const capByDemand=Math.floor((weekly*c.days/7)*c.share/output);
 const costBreakEven=Math.ceil((expectedMaterials+c.station+c.transport)/((1-rate)*output));
 return {id:rec.id,recipe:rec,city,craftCity:rec.city,weekly,observationCount:activity.observations,observedDays:activity.days||14,output,upfrontPerCraft,expectedCost:expectedMaterials+c.station+c.transport,raw,materialParts,salePrice,saleKind:chosen?(bm?'bid-NPC':'ask-Royal'):fallback?'histórico':'sin-cotización',saleDate:sale?.date||null,saleAge:sale?.ageHours??null,profitPerCraft,breakEven:costBreakEven,capByDemand,risk:profitPerCraft===null?'Sin precio de venta':profitPerCraft<0?'Pérdida estimada':'Margen estimado',roi:profitPerCraft===null?null:profitPerCraft/upfrontPerCraft*100};
}
export function buildPlan(recipes,{market='black',saleCities=CITIES,priceRows=[],historyRows=new Map(),config={},now=Date.now(),pending=new Map()}={}){
 const c=getConfig(config),priceMap=priceRows instanceof Map?priceRows:new Map();
 const cities=market==='black'?['Black Market']:saleCities.filter(x=>CITIES.includes(x));
 const candidates=[];for(const rec of recipes){for(const city of cities){const route=evaluate(rec,city,priceMap,historyRows,c,now);if(route)candidates.push(route);}}
 // Cada objeto entra una sola vez; elegimos la ciudad con mayor movimiento.
 const best=new Map();for(const r of candidates){const old=best.get(r.id);const score=x=>Math.log1p(x.weekly)*100+(x.profitPerCraft===null?-15:Math.max(-10,Math.min(10,x.roi||0)));
  if(!old||score(r)>score(old))best.set(r.id,r);}
 const ranked=[...best.values()].sort((a,b)=>b.weekly-a.weekly||cmpTier(a.id,b.id));
 const selected=[];let left=c.budget;
 for(const r of ranked){if(selected.length>=c.maxItems)break;
  const stock=Math.max(0,n(pending.get(r.id+'|'+r.city)));
  const capMarket=Math.max(0,Math.floor(r.capByDemand-stock/r.output));
  const capItem=Math.floor(c.budget*c.perItemBudget/r.upfrontPerCraft);
  const capFunds=Math.floor(left/r.upfrontPerCraft);
  let count=Math.min(capMarket,capItem,capFunds,10000);
  if(r.profitPerCraft!==null&&r.profitPerCraft<0){
   const lossBudget=c.budget*.005;
   count=Math.min(count,Math.floor(lossBudget/Math.abs(r.profitPerCraft)));
  }
  if(count<c.minimumCrafts)continue;
  const qty=count,units=qty*r.output,capital=qty*r.upfrontPerCraft,profit=r.profitPerCraft===null?null:qty*r.profitPerCraft;
  const warnings=[];
  if(r.saleKind==='histórico')warnings.push('Precio histórico: no es una orden disponible');
  if(r.saleKind==='sin-cotización')warnings.push('Sin cotización del producto final');
  if(r.profitPerCraft!==null&&r.profitPerCraft<0)warnings.push('Pérdida estimada: revisar antes de invertir');
  if(r.city==='Black Market')warnings.push('La puja NPC no garantiza profundidad ni demanda ejecutable');
  warnings.push('Profundidad de materiales no verificada; comprar por tramos');
  selected.push({...r,qty,units,capital,profit,warnings,pendingStock:stock});left-=capital;
 }
 // El resultado siempre aparece por tier, no en orden de ranking interno.
 selected.sort((a,b)=>cmpTier(a.id,b.id));
 const mats=new Map();for(const r of selected)for(const part of r.materialParts){const key=part.id+'|'+part.city,old=mats.get(key)||{id:part.id,city:part.city,qty:0,price:part.price,ageHours:part.ageHours};old.qty+=r.qty*part.count;mats.set(key,old);}
 const shopping=[...mats.values()].sort((a,b)=>cmpTier(a.id,b.id)||a.city.localeCompare(b.city));
 const priced=selected.filter(r=>r.profit!==null);
 return {market,rows:selected,shopping,scanned:recipes.length,candidates:candidates.length,blocked:ranked.length-selected.length,totalCapital:selected.reduce((s,r)=>s+r.capital,0),totalProfit:priced.length===selected.length?priced.reduce((s,r)=>s+r.profit,0):null,units:selected.reduce((s,r)=>s+r.units,0),budget:c.budget,remaining:left,config:c};
}
export function planSummary(plan){return {articles:plan.rows.length,units:plan.units,capital:plan.totalCapital,profit:plan.totalProfit,weekly:plan.rows.reduce((s,r)=>s+r.weekly,0),spendRatio:plan.budget?plan.totalCapital/plan.budget:0};}
export function purchaseStages(plan,steps=4){return Array.from({length:steps},(_,i)=>({index:i+1,materials:plan.shopping.map(m=>({...m,qty:Math.floor(m.qty/steps)+(i<m.qty%steps?1:0)})).filter(m=>m.qty>0)}));}
export function validatePlan(plan){if(!plan||plan.rows.some(r=>r.qty<2))return false;if(plan.totalCapital>plan.budget+.01)return false;const materialTotals=new Map();for(const r of plan.rows)for(const p of r.materialParts){const key=p.id+'|'+p.city;materialTotals.set(key,(materialTotals.get(key)||0)+p.count*r.qty);}return plan.shopping.every(m=>materialTotals.get(m.id+'|'+m.city)===m.qty)&&plan.shopping.length===materialTotals.size;}
