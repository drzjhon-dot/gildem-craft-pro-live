// Plan de crafting por movimiento observado, incluso sin margen positivo.
// AODP es evidencia de actividad, NO ventas ejecutadas ni ordenes reservadas.
// No se inventan cotizaciones, recetas, compras ni beneficios.
const numeric = x => x === null || x === undefined || x === '' ? null : Number.isFinite(Number(x)) ? Math.max(0,Number(x)) : null;
const money = x => Number.isFinite(x) ? Math.round(x) : null;
const pct = x => Math.max(0,Math.min(.3,Number(x)||0));
// GCP_MIN_BATCH_901: no crear ni recomendar lotes de una sola fabricacion.
export const MIN_CRAFT_BATCH = 2;
export const MIN_WEEKLY_ACTIVITY_FOR_PLAN = 50;

export function prepareAlwaysPlan(options,{budget=0,horizonDays=14,maxItems=14,minimumROI=0}={}) {
 const available=Math.max(0,Number(budget)||0);
 const horizon=Math.max(1,Math.min(30,Number(horizonDays)||14));
 const weeks=horizon/7;
 const seen=new Set();
 const ranked=(options||[]).filter(o=>o?.id&&o?.city&&o?.craftCity).map(o=>{
  const raw=numeric(o.rawMaterials),cost=numeric(o.costTotal),output=Math.max(1,numeric(o.craftAmount)||1);
  const station=numeric(o.stationCost)||0,travel=numeric(o.transportCost)||0;
  const rate=Math.min(.90,pct(o.taxRate)+pct(o.setupRate));
  const quote=numeric(o.referencePrice),weekly=numeric(o.weeklyObserved);
  const pendingMarketUnits=Math.max(0,Math.floor(numeric(o.pendingMarketUnits)||0));
  const upfront=raw!==null?raw+station+travel:null;
  // Solo informativo: el precio de equilibrio NUNCA elimina una ruta.
  const breakEven=cost!==null&&rate<1?Math.ceil((cost+travel)/(output*(1-rate))):null;
  const profit=cost!==null&&quote>0?quote*output*(1-rate)-cost-travel:null;
  const roi=profit!==null&&upfront>0?100*profit/upfront:null;
  const affordable=upfront!==null&&upfront>0&&upfront<=available;
  const warnings=[];
  if(raw===null||cost===null)warnings.push('Faltan precios de materias primas: confirmar compras');
  else if(!affordable)warnings.push('Una fabricación supera el presupuesto');
  if(!quote)warnings.push('Falta una cotización reciente de venta: profit no calculable');
  else if(profit<0)warnings.push('Precio observado debajo del equilibrio: pérdida prevista');
  else if(profit===0)warnings.push('Precio de equilibrio: margen neto nulo');
  else if(roi<8)warnings.push('Margen positivo pequeño: no se descarta por profit');
  if(weekly===null)warnings.push('Sin observaciones de actividad: máximo una fabricación de prueba');
  else if(weekly===0)warnings.push('Sin actividad positiva en el período consultado');
  else if(weekly<=50)warnings.push('Actividad baja: exposición inicial mínima');
  if(o.focusUnverified)warnings.push('Costo de Focus no verificado: revalidar devolución y consumo');
  if(o.ageHours==null||Number(o.ageHours)>24)warnings.push('Cotización sin fecha reciente: actualizar antes de comprar');
  // La actividad pesa mucho mas que el ROI. La rentabilidad solo desempata
  // y regula cuanto capital se expone a una perdida prevista.
  const activityScore=weekly>0?1000+Math.log1p(weekly)*100:weekly===0?50:0;
  const score=activityScore+(affordable?30:0)+(quote?10:0)+Math.max(-5,Math.min(5,roi||0));
  return {...o,score,rawMaterials:raw,costTotal:cost,referencePrice:quote,weeklyObserved:weekly,pendingMarketUnits,
   minSalePrice:breakEven,breakEvenPrice:breakEven,profitPerCraft:profit===null?null:money(profit),
   estimatedROI:roi,upfrontPerCraft:upfront,blockers:warnings,warnings,qty:0,capital:0,units:0,
   craftAmount:output,outputAmount:output,scenarioProfit:null,budgetVerified:false,
   requiresVerification:true,executable:false};
 }).sort((a,b)=>b.score-a.score||(b.weeklyObserved||0)-(a.weeklyObserved||0)||a.id.localeCompare(b.id));
 // Solo articulos con actividad suficiente para produccion repetida.
 const hasObserved=ranked.some(x=>x.weeklyObserved>=MIN_WEEKLY_ACTIVITY_FOR_PLAN);
 const selected=[];
 const maxSelected=Math.max(1,Math.min(30,maxItems));
 // Un producto muy activo pero demasiado caro no puede expulsar de la lista
 // a otros productos asequibles. Se elige y asigna en la misma pasada.
 const exposure=ranked.length>=10?.17:ranked.length>=5?.28:ranked.length>=3?.40:.65;
 let remaining=available;
 for(const r of ranked){
  if(selected.length>=maxSelected)break;
  if(!hasObserved||!(r.weeklyObserved>=MIN_WEEKLY_ACTIVITY_FOR_PLAN))continue;
  if(seen.has(r.id))continue;
  const unit=r.upfrontPerCraft;
  // Sin presupuesto de insumos no se inventa un lote de prueba.
  if(!(unit>0))continue;
  if(unit>remaining||unit>available)continue;
  const velocityCap=Math.floor(r.weeklyObserved*weeks*.06/r.outputAmount);
  const exposureCap=Math.floor(available*exposure/unit);
  const affordableCap=Math.floor(remaining/unit);
  // El inventario pendiente en Mi negocio también ocupa parte de la capacidad
  // prudente del mercado. Nunca volver a programar el mismo volumen.
  const headroom=Math.max(0,Math.floor((r.weeklyObserved*weeks*.06-r.pendingMarketUnits)/r.outputAmount));
  let cap=Math.min(2000,velocityCap,exposureCap,affordableCap,headroom);
  if(r.profitPerCraft!==null&&r.profitPerCraft<0){
   // Perdidas calculadas, nunca beneficios ficticios. Exposición muy
   // reducida para márgenes negativos; sin lotes unitarios de prueba.
   const loss=Math.abs(r.profitPerCraft);
   const lossCap=Math.max(1,Math.floor(available*.01/Math.max(1,loss)));
   const lossCapitalCap=Math.max(1,Math.floor(available*.05/unit));
   cap=Math.min(cap,lossCap,lossCapitalCap);
   if(r.estimatedROI < -10)cap=Math.min(cap,1);
   if(loss>available*.01)r.warnings.push('La pérdida prevista de UNA unidad supera el 1% del presupuesto; considera no comprar');
  }
  const qty=Math.max(0,cap);
  if(qty<MIN_CRAFT_BATCH)continue;
  r.qty=qty;r.units=qty*r.outputAmount;r.capital=money(qty*unit);
  r.budgetVerified=true;
  r.scenarioProfit=r.profitPerCraft===null?null:money(qty*r.profitPerCraft);
  remaining-=r.capital;
  selected.push(r);seen.add(r.id);
 }
 const rows=selected.filter(r=>r.qty>=MIN_CRAFT_BATCH);
 const scenarioCapital=rows.reduce((a,r)=>a+r.capital,0);
 const priced=rows.filter(r=>r.scenarioProfit!==null);
 return {status:'conditional',strategy:'demand_first',executable:false,rows,budget:available,scenarioCapital,
  remaining:Math.max(0,available-scenarioCapital),units:rows.reduce((a,r)=>a+r.units,0),
  estimatedProfit:priced.length===rows.length?priced.reduce((a,r)=>a+r.scenarioProfit,0):null,
  pricedRows:priced.length,horizonDays:horizon,scanned:options?.length||0,
  warning:'PLAN POR ACTIVIDAD OBSERVADA (mínimo dos fabricaciones y 50 observaciones semanales). Se permiten márgenes bajos o negativos, señalados como riesgo. El historial AODP no garantiza ventas. Comprueba cotizaciones, suministro y tasas antes de comprar.'};
}

// Solo los lotes con coste y precio observados pueden guardarse en Mi negocio.
// Guardar = borrador; el silver NO se descuenta hasta que el jugador confirme
// por separado que ya realizó la compra, tal como funciona la caja actual.
export function draftPlanForLedger(proposal) {
 const rows=(proposal?.rows||[]).filter(r=>r.qty>=MIN_CRAFT_BATCH&&r.budgetVerified&&r.upfrontPerCraft>0&&
  r.costTotal!==null&&r.referencePrice>0&&r.profitPerCraft!==null).map(r=>({
  ...r,capitalPerUnit:r.upfrontPerCraft,cost:r.costTotal,sell:r.referencePrice,
  profit:r.profitPerCraft,mode:r.city==='Black Market'?'listed':'listed',
  taxRate:pct(r.taxRate),setupRate:pct(r.setupRate)
 }));
 const materialMap=new Map();
 for(const row of rows)for(const m of row.materials||[]){
  if(!(m.id&&Number(m.count)>0))continue;
  const city=m.city||row.craftCity,key=m.id+'|'+city;
  const prev=materialMap.get(key)||{...m,id:m.id,city,qtyGross:0,qtyNet:0,unitPrice:Number(m.unitPrice)||0};
  prev.qtyGross+=row.qty*Number(m.count);
  prev.qtyNet+=row.qty*(Number.isFinite(Number(m.used))?Number(m.used):Number(m.count));
  materialMap.set(key,prev);
 }
 return {rows,materials:[...materialMap.values()],totalCost:rows.reduce((a,r)=>a+r.qty*r.capitalPerUnit,0),
  totalProfit:rows.reduce((a,r)=>a+r.qty*r.profit,0),journalSummary:{items:[],cost:0,fractionalCost:0}};
}
