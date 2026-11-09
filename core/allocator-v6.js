// Cartera conjunta: capital, Focus, límite de órdenes y exposición por artículo.
// Multi-inicio con búsqueda de intercambio local; aproximación discreta, NO
// garantiza el óptimo matemático para todos los universos de recetas.
import {routeProfitAtQuantity} from './depth.js';
import {allocateSmartPortfolio} from './optimizer.js';
const f=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;
export function capacityFor(x,capFraction,unknownCap){
 if(Number.isFinite(x.marketCapacity))return Math.max(0,Math.floor(x.marketCapacity));
 if(x.city==='Black Market'&&x.mode==='instant')return 1;
 if(x.activity?.observations){
  const demand=Math.floor(Math.max(0,f(x.activity.observedDaily))*capFraction/Math.max(1,f(x.craftAmount,1))); 
  // Si hay historial pero actividad demasiado baja, no fabricar lotes enormes.
  return Math.max(0,demand);
 }
 return Math.max(0,Math.floor(unknownCap));
}
function value(x,goal){
 const p=f(x.profit);const trust=Math.max(.15,Math.min(1,f(x.confidence?.score,40)/100));
 const slippage=x.competition?.penalty??1;
 const risk=Math.max(.2,Math.min(1,f(x.stressProfit,p)/Math.max(1,p)));
 const personal=Math.max(.75,Math.min(1.12,f(x.personalLearning?.adjustment,1))); 
 const cash=f(x.capitalPerUnit,1);
 if(goal==='roi')return p/cash*trust*slippage*risk*personal;
 if(goal==='focus')return f(x.focusGain)/Math.max(1,f(x.focusPerUnit))*trust*slippage*risk*personal;
 if(goal==='balanced'||goal==='daily')return (p*.65+(p/cash)*Math.sqrt(cash)*.35)*trust*slippage*risk*personal*(goal==='daily'&&x.personalLearning?.qtySold>=3?Math.max(.6,Math.min(1.3,3/Math.max(1,x.personalLearning.averageDays))):1);
 return p*trust*slippage*risk*personal;
}
export function allocatePortfolioV6(candidates,budget,opts={}){
 const budgetValue=f(budget),focusLimit=opts.focusLimit==null?Infinity:f(opts.focusLimit),maxVariants=Math.min(80,Math.max(1,opts.maxVariants??70));
 const capFraction=opts.capFraction??.1,unknownCap=opts.unknownCap??2,goal=opts.goal||'balanced';
 const minConfidence=opts.minimumConfidence||0,exposureLimit=opts.useAll?Infinity:budgetValue*(opts.maxPerItemFraction??.30);
 if(!(budgetValue>0)||focusLimit<0)return {rows:[],capital:budgetValue,totalCost:0,totalNetCost:0,totalProfit:0,focusUsed:0,remaining:budgetValue};
 const valid=(candidates||[]).filter(x=>x?.id&&x?.city&&f(x.profit)>0&&f(x.capitalPerUnit)>0&&f(x.cost)>0&&f(x.confidence?.score)>=minConfidence&&(!Number.isFinite(focusLimit)||f(x.focusPerUnit)>0));
 // Un mismo mercado y objeto no puede consumir DOS veces el mismo libro de órdenes
 // al comparar ciudades de fabricación alternativas.
 const byRoute=new Map();for(const x of valid){const key=x.id+'|'+x.city+'|'+x.mode;
  const old=byRoute.get(key);if(!old||value(x,goal)>value(old,goal))byRoute.set(key,x);
 }
 const all=[...byRoute.values()].filter(x=>capacityFor(x,capFraction,unknownCap)>0);
 all.sort((a,b)=>value(b,goal)-value(a,goal));
 // Evaluamos varias carteras con distintos órdenes de exploración y cambios 1x1.
 const variants=[
  all,
  [...all].sort((a,b)=>b.profit/b.capitalPerUnit-a.profit/a.capitalPerUnit),
  [...all].sort((a,b)=>b.profit-a.profit),
  [...all].sort((a,b)=>(b.stressProfit||0)-(a.stressProfit||0))
 ];
 let best=null;
 for(const ordered of variants){
  const quantities=new Map(),byItem=new Map();let spent=0,focus=0;
  const maxFor=x=>{
   const previous=quantities.get(x)||0;
   const capitalRoom=Math.floor((budgetValue-spent+1e-8)/x.capitalPerUnit);
   const focRoom=Number.isFinite(focusLimit)?Math.floor((focusLimit-focus+1e-8)/x.focusPerUnit):Infinity;
   const itemRoom=Number.isFinite(exposureLimit)?Math.floor((exposureLimit-(byItem.get(x.id)||0)+1e-8)/x.capitalPerUnit):Infinity;
   const routeRoom=capacityFor(x,capFraction,unknownCap)-previous;
   return Math.max(0,Math.min(routeRoom,capitalRoom,focRoom,itemRoom));
  };
  const take=(x,n)=>{if(!quantities.has(x)&&quantities.size>=maxVariants)return 0;const q=Math.min(n,maxFor(x));if(q<1)return 0;quantities.set(x,(quantities.get(x)||0)+q);spent+=q*x.capitalPerUnit;focus+=q*f(x.focusPerUnit);byItem.set(x.id,(byItem.get(x.id)||0)+q*x.capitalPerUnit);return q;};
  // Intentar ambos destinos solo cuando cada lado ofrece beneficio verificable.
  if(opts.ensureBothMarkets){const b=ordered.find(x=>x.city==='Black Market'),r=ordered.find(x=>x.city!=='Black Market');
   if(b&&r&&b.capitalPerUnit+r.capitalPerUnit<=budgetValue&&b.focusPerUnit+r.focusPerUnit<=focusLimit){take(b,1);take(r,1);}
  }
  for(const x of ordered){const amount=maxFor(x);if(amount>0)take(x,amount);}
  // Intercambios locales: cambiar una unidad de una ruta por otra que deje una
  // mejor cartera conjunta. Así evitamos quedarnos solo con el primer greedy.
  for(let pass=0;pass<2;pass++){
   let bestSwap=null;
   const selected=[...quantities].filter(([,q])=>q>0);
   for(const [from,qty] of selected.slice(0,55)){
    const costFreed=from.capitalPerUnit,focusFreed=f(from.focusPerUnit);
    for(const to of ordered.slice(0,75)){
     if(to===from)continue;
     const current=quantities.get(to)||0;
     if(!current&&selected.length>=maxVariants&&qty>1)continue;
     if(current>=capacityFor(to,capFraction,unknownCap))continue;
     const room=budgetValue-spent+costFreed;
     if(to.capitalPerUnit>room+1e-8)continue;
     if(Number.isFinite(focusLimit)&&focus-focusFreed+f(to.focusPerUnit)>focusLimit+1e-8)continue;
     if(Number.isFinite(exposureLimit)){
      const next=byItem.get(to.id)||0;
      const adjusted=next-(from.id===to.id?costFreed:0)+to.capitalPerUnit;
      if(adjusted>exposureLimit+1e-8)continue;
     }
     const delta=value(to,goal)-value(from,goal);
     if(delta>1e-8&&(!bestSwap||delta>bestSwap.delta))bestSwap={from,to,delta};
    }
   }
   if(!bestSwap)break;
   const {from,to}=bestSwap,remainFrom=quantities.get(from)-1;
   if(remainFrom>0)quantities.set(from,remainFrom);else quantities.delete(from);
   quantities.set(to,(quantities.get(to)||0)+1);
   spent+=to.capitalPerUnit-from.capitalPerUnit;
   focus+=f(to.focusPerUnit)-f(from.focusPerUnit);
   byItem.set(from.id,(byItem.get(from.id)||0)-from.capitalPerUnit);
   byItem.set(to.id,(byItem.get(to.id)||0)+to.capitalPerUnit);
  }
  const normalized=[...quantities].filter(([,q])=>q>0).map(([x,qty])=>({...x,qty,maxCrafts:capacityFor(x,capFraction,unknownCap),allocation:qty*x.capitalPerUnit,totalProfit:routeProfitAtQuantity(x,qty)})).filter(x=>x.totalProfit>0);
  const objective=normalized.reduce((s,x)=>s+x.totalProfit,0);
  // Dar prioridad al objetivo elegido sin dejar de comprobar beneficio neto.
  const metric=normalized.reduce((s,x)=>s+x.qty*value(x,goal),0);
  if(!best||metric>best.metric+1e-8||Math.abs(metric-best.metric)<1e-8&&objective>best.profit){best={rows:normalized,metric,profit:objective};}
 }
 if(!best)return {rows:[],capital:budgetValue,totalCost:0,totalNetCost:0,totalProfit:0,focusUsed:0,remaining:budgetValue};
 // Exponer misma forma básica que el asignador anterior; fitPlan calcula
 // diarios ENTEROS y valida gastos finales en una segunda etapa.
 const rows=best.rows;const totalCost=rows.reduce((s,x)=>s+x.allocation,0);
 const totalNetCost=rows.reduce((s,x)=>s+x.qty*x.cost,0);
 const focusUsed=rows.reduce((s,x)=>s+x.qty*f(x.focusPerUnit),0);
 return {rows,capital:budgetValue,totalCost,totalNetCost,totalProfit:best.profit,focusUsed,remaining:Math.max(0,budgetValue-totalCost),method:'asignación conjunta multi-inicio; resultado aproximado'};
}
