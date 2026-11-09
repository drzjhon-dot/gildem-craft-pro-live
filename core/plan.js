// Estado reconstruible para cantidades editables. El capital, las rutas y los
// diarios se recuentan desde cero cada vez (ningún material se cuenta dos veces).
import {routeProfitAtQuantity} from './depth.js';
import {journalSummary} from './journals.js';
export function rebuildPlan(rows,budget,focusLimit=null){
 const capital=Number(budget),focusBudget=focusLimit===null?Infinity:Number(focusLimit);
 const positive=(rows||[]).filter(r=>Number.isInteger(r.qty)&&r.qty>0);
 const matMap=new Map();let committed=0,netCost=0,focus=0;
 const output=[];
 for(const x of positive){
  if(!(x.capitalPerUnit>0&&x.qty>0)||x.maxCrafts!=null&&x.qty>x.maxCrafts)return {ok:false,reason:'La cantidad supera la capacidad estimada para '+x.id};
  const projected=routeProfitAtQuantity(x,x.qty);
  if(projected===null||projected<=0)return {ok:false,reason:'La cantidad supera los niveles rentables del libro de compra para '+x.id};
  committed+=x.qty*x.capitalPerUnit;netCost+=x.qty*x.cost;focus+=x.qty*(x.focusPerUnit||0);
  output.push({...x,totalProfit:projected,allocation:x.qty*x.capitalPerUnit});
  for(const m of x.materials||[]){const k=m.id+'|'+(m.city||'');const old=matMap.get(k)||{...m,qtyGross:0,qtyNet:0};old.qtyGross+=x.qty*m.count;old.qtyNet+=x.qty*m.used;matMap.set(k,old);}
 }
 const journal=journalSummary(output);
 const roundedReserve=journal.cost-journal.fractionalCost;
 // Se compran diarios ENTEROS. Solo los realmente completados cuentan como
 // ingresos; las fracciones de un diario lleno no se pueden vender todavía.
 const byJournal=new Map(journal.items.map(j=>[j.empty,j]));
 for(const r of output){const j=r.journal,group=byJournal.get(j?.empty);if(!group||!(group.partialAmount>0))continue;
  const share=(r.qty*j.ratio)/group.partialAmount;
  const remainder=Math.max(0,group.partialAmount-group.full);
  const adjustment=group.purchaseCost-group.partialAmount*group.price + remainder*Math.max(0,group.fullPrice||0)*(1-(group.fullTaxRate||0)/100);
  r.totalProfit-=adjustment*share;
 }
 const gross=committed+roundedReserve;
 if(gross>capital+.001)return {ok:false,reason:'Materiales y diarios completos exceden el presupuesto por '+Math.ceil(gross-capital)+' silver'};
 if(focus>focusBudget+.001)return {ok:false,reason:'Focus necesario excede el disponible'};
 if(output.some(r=>r.totalProfit<=0))return {ok:false,reason:'Hay una ruta con pérdidas al pagar diarios enteros; baja la cantidad o desactiva diarios.'};
 const cityMap=new Map();let profit=0;
 for(const r of output){profit+=r.totalProfit;const c=cityMap.get(r.city)||{city:r.city,qty:0,products:0,profit:0,capital:0};
  c.qty+=r.qty*Math.max(1,Number(r.craftAmount)||1);c.products++;c.profit+=r.totalProfit;c.capital+=r.allocation;cityMap.set(r.city,c);}
 return {ok:true,rows:output,totalCost:gross,totalNetCost:netCost,totalProfit:profit,remaining:Math.max(0,capital-gross),
  materials:[...matMap.values()].sort((a,b)=>a.city.localeCompare(b.city)||a.id.localeCompare(b.id)),cities:[...cityMap.values()].sort((a,b)=>b.profit-a.profit),focusUsed:focus,focusLimit,
  extraJournalCapital:roundedReserve,journalSummary:journal,capital};
}
export function fitPlan(rows,budget,focusLimit=null){
 let result=rebuildPlan(rows,budget,focusLimit);if(result.ok)return result;
 const working=rows.map(r=>({...r}));
 for(let i=0;i<15000;i++){
  const active=working.filter(r=>r.qty>0).sort((a,b)=>(a.profit/(a.capitalPerUnit||1))-(b.profit/(b.capitalPerUnit||1)));
  if(!active.length)break;active[0].qty--;
  result=rebuildPlan(working,budget,focusLimit);if(result.ok)return result;
 }
 const empty=journalSummary([]);
 return {ok:true,rows:[],totalCost:0,totalProfit:0,totalNetCost:0,remaining:budget,materials:[],cities:[],focusUsed:0,focusLimit,extraJournalCapital:0,journalSummary:empty,capital:budget};
}
