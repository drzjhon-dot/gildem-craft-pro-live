// Cartera conjunta: capital, Focus, límite de órdenes y exposición por artículo.
// Multi-inicio con búsqueda de intercambio local; aproximación discreta, NO
// garantiza el óptimo matemático para todos los universos de recetas.
import {routeProfitAtQuantity} from './depth.js';
import {prudentListingCapacity,liquidityWeight} from './market-volume.js';
import {listingCapacity} from './demand-first.js';
import {allocateSmartPortfolio} from './optimizer.js';
import {resolveStyle,impactCapacity,horizonVolumeUnits} from './market-impact.js';
import {needWeight} from './market-mechanics.js';
import {pendingAdjustedCapacity,portfolioDiversityStats} from './intelligent-portfolio.js';
const f=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;
export function capacityFor(x,capFraction,unknownCap,horizonDays=14){
 if(Number.isFinite(x.marketCapacity))return Math.max(0,Math.floor(x.marketCapacity));
 return listingCapacity(x,{horizonDays,share:capFraction,maxPerRoute:6000,unknownCap});
}
function value(x,goal){
 const p=f(x.profit);const trust=Math.max(.15,Math.min(1,f(x.confidence?.score,40)/100));
 const slippage=(x.competition?.penalty??1)*liquidityWeight(x.activity,x.activity7)*needWeight(x);
 const risk=Math.max(.2,Math.min(1,f(x.stressProfit,p)/Math.max(1,p)));
 const personal=Math.max(.75,Math.min(1.12,f(x.personalLearning?.adjustment,1))); 
 const cash=f(x.capitalPerUnit,1);
 const daily=f(x.demandDaily,x.activity?.observedDaily||0);
 const rotation=Math.min(1,Math.log1p(Math.max(0,daily))/Math.log1p(3000));
 const turnover=.65+2.0*rotation;
 if(goal==='roi')return p/cash*trust*slippage*risk*personal*turnover;
 if(goal==='focus')return f(x.focusGain)/Math.max(1,f(x.focusPerUnit))*trust*slippage*risk*personal;
 if(goal==='balanced'||goal==='daily'){
  // Avoid ranking a single expensive .4 item above a highly liquid .0 line
  // exclusively because its absolute per-unit profit is larger. Log reduces
  // that distortion, ROI captures capital efficiency, rotation favors active
  // markets, and the allocator still checks budget and volume separately.
  const roi=Math.max(0,p/cash), balanced=Math.log1p(Math.max(0,p))*Math.sqrt(Math.min(2,roi))*turnover;
  const own=goal==='daily'&&x.personalLearning?.qtySold>=3?Math.max(.6,Math.min(1.3,3/Math.max(1,x.personalLearning.averageDays))):1;
  return balanced*trust*slippage*risk*personal*own;
 }
 return p*trust*slippage*risk*personal*turnover;
}
export function routePriority(route,goal='balanced'){return value(route,goal);}
export function allocatePortfolioV6(candidates,budget,opts={}){
 const budgetValue=f(budget),focusLimit=opts.focusLimit==null?Infinity:f(opts.focusLimit);
 const maxVariants=Math.min(80,Math.max(1,opts.maxVariants??70));
 const capFraction=opts.capFraction??.06,unknownCap=opts.unknownCap??1,goal=opts.goal||'balanced',horizonDays=opts.horizonDays??14;
 const minConfidence=opts.minimumConfidence||0;
 const smart=opts.intelligent===true;
 // "Usar todo" allows spending available funds, never the removal of exposure caps.
 const itemFraction=smart?Math.min(.50,Math.max(.05,f(opts.maxPerItemFraction,.12))):
   Math.min(1,Math.max(0,f(opts.maxPerItemFraction,.30)));
 const itemExposureLimit=budgetValue*itemFraction;
 const pending=opts.pendingByMarket instanceof Map?opts.pendingByMarket:new Map();
 const empty={rows:[],capital:budgetValue,totalCost:0,totalNetCost:0,totalProfit:0,
  focusUsed:0,remaining:budgetValue,method:'Sin rutas rentables verificables'};
 if(!(budgetValue>0)||focusLimit<0)return empty;
 const sat=opts.saturation!=null&&opts.saturation!==false?resolveStyle(opts.saturation):null;
 const valid=(candidates||[]).filter(x=>x?.id&&x?.city&&f(x.profit)>0&&f(x.capitalPerUnit)>0&&f(x.cost)>0&&f(x.confidence?.score)>=minConfidence);
 // Never buy the same listing book twice through different production cities.
 const byRoute=new Map();for(const x of valid){const key=x.id+'|'+x.city+'|'+x.mode;
  const old=byRoute.get(key);if(!old||value(x,goal)>value(old,goal))byRoute.set(key,x);
 }
 const all=[...byRoute.values()].map(x=>{
  let base=capacityFor(x,capFraction,unknownCap,horizonDays),saturation=null;
  // v8.8.0 · Saturación: tus propias ventas bajan el precio. El lote se limita donde
  // la ganancia marginal deja de compensar y el beneficio se descuenta por impacto.
  // Rutas con libro de órdenes verificado ya calculan el impacto con el libro real.
  if(sat&&!(x.depthVerified&&x.orderLevels?.length)){
   const volumeUnits=horizonVolumeUnits(x,horizonDays);
   if(volumeUnits>0){
    saturation={k:sat.k,volumeUnits,style:sat.id};
    base=Math.min(base,impactCapacity(x,{horizonDays,style:sat}));
   }
  }
  const capacity=pendingAdjustedCapacity(x,base,pending);
  return {...x,saturation:saturation||x.saturation||null,intelligentCapacity:capacity,pendingUnits:pending.get(x.id+'|'+x.city)||0};
 }).filter(x=>x.intelligentCapacity>0);
 if(!all.length)return empty;
 all.sort((a,b)=>value(b,goal)-value(a,goal));
 // v8.7.0 · Reparto proporcional a la demanda. En producción de volumen el tope por
 // objeto ya no es un porcentaje plano del presupuesto: cada ruta recibe una cuota
 // del capital según cuánto capital puede absorber su mercado (capacidad x coste).
 const demandWeighted=opts.bulkMode===true&&opts.demandWeighted!==false;
 const capitalAbsorbed=x=>x.intelligentCapacity*x.capitalPerUnit;
 const totalAbsorbed=all.reduce((a,x)=>a+capitalAbsorbed(x),0)||1;
 const routeShare=new Map(all.map(x=>[x,capitalAbsorbed(x)/totalAbsorbed]));
 const itemShare=new Map();
 for(const x of all)itemShare.set(x.id,(itemShare.get(x.id)||0)+routeShare.get(x));
 const itemFractionFor=id=>demandWeighted?Math.max(itemFraction,Math.min(.60,(itemShare.get(id)||0)*1.5)):itemFraction;
 const destinations=new Set(all.map(x=>x.city));
 const tiers=new Set(all.map(x=>String(x.id).match(/^T([4-8])_/)?.[1]).filter(Boolean));
 // A single selected Royal city or the sole BM market must not be arbitrarily
 // capped as though the player had selected several destinations.
 const cityLimit=smart&&!opts.bulkMode&&destinations.size>1?budgetValue*Math.max(.45,1/destinations.size+.12):Infinity;
 // A high-volume route already has an activity cap per sale market. An extra
 // arbitrary 72% destination ceiling can leave silver idle with no market basis.
 const tierLimit=smart&&!opts.bulkMode&&tiers.size>1?budgetValue*.60:Infinity;
 // Likewise, never force 15% cash idle just because most viable items share T4.
 const desiredItems=Math.min(maxVariants,Math.max(8,Math.floor(f(opts.targetDifferentItems,12))));
 const orders=[
  all,
  [...all].sort((a,b)=>b.profit/b.capitalPerUnit-a.profit/a.capitalPerUnit),
  [...all].sort((a,b)=>b.profit-a.profit),
  [...all].sort((a,b)=>f(b.demandDaily,b.activity?.observedDaily)-f(a.demandDaily,a.activity?.observedDaily))
 ];
 let best=null;
 for(const ordered of orders){
  const counts=new Map(),byItem=new Map(),byCity=new Map(),byTier=new Map();
  let spent=0,focus=0;
  const tierOf=x=>String(x.id).match(/^T([4-8])_/)?.[1]||'?';
  const maxFor=x=>{
   const qty=counts.get(x)||0;
   const cashRoom=Math.floor((budgetValue-spent+1e-8)/x.capitalPerUnit);
   const focusRoom=Number.isFinite(focusLimit)&&f(x.focusPerUnit)>0?Math.floor((focusLimit-focus+1e-8)/x.focusPerUnit):Infinity;
   const itemRoom=Math.floor((budgetValue*itemFractionFor(x.id)-(byItem.get(x.id)||0)+1e-8)/x.capitalPerUnit);
   const cityRoom=Math.floor((cityLimit-(byCity.get(x.city)||0)+1e-8)/x.capitalPerUnit);
   const tierRoom=Math.floor((tierLimit-(byTier.get(tierOf(x))||0)+1e-8)/x.capitalPerUnit);
   return Math.max(0,Math.min(x.intelligentCapacity-qty,cashRoom,focusRoom,itemRoom,cityRoom,tierRoom));
  };
  const take=(x,count)=>{
   if(!counts.has(x)&&counts.size>=maxVariants)return 0;
   const n=Math.floor(Math.min(count,maxFor(x)));
   if(n<1)return 0;
   counts.set(x,(counts.get(x)||0)+n);spent+=n*x.capitalPerUnit;focus+=n*f(x.focusPerUnit);
   byItem.set(x.id,(byItem.get(x.id)||0)+n*x.capitalPerUnit);
   byCity.set(x.city,(byCity.get(x.city)||0)+n*x.capitalPerUnit);
   byTier.set(tierOf(x),(byTier.get(tierOf(x))||0)+n*x.capitalPerUnit);
   return n;
  };
  if(smart){
   // Phase one: seed a broad range of different items BEFORE larger batches.
   const seeded=new Set();
   for(const x of ordered){
    if(seeded.size>=desiredItems||counts.size>=maxVariants)break;
    if(seeded.has(x.id))continue;
    if(take(x,1))seeded.add(x.id);
   }
   // If capital allows, round-robin remaining items instead of monopolizing
   // the first route. This only considers routes with positive calculated profit.
   // En modo demanda el reparto lo hace la fase proporcional posterior; la ronda
   // por turnos daba ~48 unidades a cada ruta sin mirar su actividad.
   const available=demandWeighted?[]:ordered.filter(x=>counts.has(x));
   for(let pass=0;pass<12;pass++){
    let added=0;
    for(const x of available)added+=take(x,Math.max(1,Math.min(4,Math.floor(maxFor(x)/Math.max(1,12-pass)))));
    if(!added)break;
   }
  }else{
   // Legacy route behavior for calculators that call this allocator directly.
   for(const x of ordered)take(x,maxFor(x));
  }
  // v8.7.0 · Fase de demanda: cada ruta recibe capital proporcional a lo que su
  // mercado puede absorber. Un objeto con 10 veces más actividad recibe ~10 veces
  // más unidades (hasta su capacidad), en vez de un tope plano igual para todos.
  if(demandWeighted){
   for(const x of ordered){
    const target=Math.floor(budgetValue*routeShare.get(x)/x.capitalPerUnit);
    const missing=target-(counts.get(x)||0);
    if(missing>0)take(x,missing);
   }
  }
  // Finish with constrained profit-weighted capacity, even in smart mode.
  // The limits remain active for every item and city.
  for(const x of ordered)take(x,maxFor(x));
  const rows=[...counts].filter(([,q])=>q>0).map(([x,qty])=>({
   ...x,qty,maxCrafts:x.intelligentCapacity,allocation:qty*x.capitalPerUnit,itemExposureFraction:itemFractionFor(x.id),demandShare:routeShare.get(x),
   totalProfit:routeProfitAtQuantity(x,qty)
  })).filter(x=>x.totalProfit>0);
  const score=rows.reduce((a,x)=>a+x.qty*value(x,goal),0);
  const profit=rows.reduce((a,x)=>a+x.totalProfit,0);
  const itemCount=new Set(rows.map(x=>x.id)).size;
  // Reward having several profitable, truly distinct items but avoid driving
  // profit below zero or manufacturing unprofitable filler stock.
  const metric=score*(smart?(1+.04*Math.min(24,itemCount)):1)+(opts.bulkMode&&opts.useAll?(spent/Math.max(1,budgetValue))*Math.max(1,score)*.35:0);
  if(!best||metric>best.metric+1e-8||(Math.abs(metric-best.metric)<1e-8&&profit>best.profit))
   best={rows,metric,profit};
 }
 if(!best)return empty;
 const rows=best.rows,totalCost=rows.reduce((a,x)=>a+x.allocation,0);
 const stats=portfolioDiversityStats(rows,{budget:budgetValue,pending});
 return {rows,capital:budgetValue,totalCost,totalNetCost:rows.reduce((a,x)=>a+x.qty*x.cost,0),
  totalProfit:best.profit,focusUsed:rows.reduce((a,x)=>a+x.qty*f(x.focusPerUnit),0),
  remaining:Math.max(0,budgetValue-totalCost),diversity:stats,
  method:opts.bulkMode?'Producción de volumen: actividad semanal superior a 50; reinversión del presupuesto sin reserva; topes dinámicos, mercado e inventario pendiente':smart?'Cartera inteligente: objetos distintos primero; topes por artículo, tier, destino e inventario pendiente':
   'asignación conjunta multi-inicio; resultado aproximado'};
}
