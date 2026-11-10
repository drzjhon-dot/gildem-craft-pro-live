// Third-stage fallback: a conditional production PROPOSAL, never an executable
// order or an assertion of present profit. AODP activity is NOT verified sales.
// No fabricated quotes, material costs or confirmed demand are allowed here.
const numeric = x => (x===null||x===undefined||x==='')?null:Number.isFinite(Number(x))?Math.max(0,Number(x)):null;
const money = x => Number.isFinite(x)?Math.round(x):null;

export function prepareAlwaysPlan(options,{budget=0,horizonDays=14,maxItems=14,minimumROI=.08}={}){
 const available=Math.max(0,Number(budget)||0);
 const weeks=Math.max(1,Math.min(30,Number(horizonDays)||14))/7;
 const seen=new Set();
 const ranked=(options||[]).filter(o=>o?.id&&o?.city&&o?.craftCity).map(o=>{
  const gross=numeric(o.rawMaterials),cost=numeric(o.costTotal),output=Math.max(1,numeric(o.craftAmount)||1);
  const rate=Math.max(0,Math.min(.30,Number(o.taxRate)||0)) + Math.max(0,Math.min(.30,Number(o.setupRate)||0));
  const travel=numeric(o.transportCost)||0;
  const minimumUnit=cost!==null&&rate<1?Math.ceil((cost+travel)*(1+minimumROI)/(output*(1-rate))):null;
  const quoted=numeric(o.referencePrice);
  const weekly=numeric(o.weeklyObserved);
  const feasibleCost=gross!==null&&gross>0&&gross<=available;
  const gap=minimumUnit&&quoted?quoted/minimumUnit:0;
  const score=(weekly!==null?Math.log1p(weekly)*20:0)+(feasibleCost?28:0)+
   (minimumUnit&&quoted?Math.min(30,gap*23):0)-(gross===null?28:0);
  const blockers=[];
  if(gross===null||cost===null)blockers.push('Faltan precios verificables de los materiales');
  else if(gross>available)blockers.push('Una fabricación supera el presupuesto');
  if(!quoted)blockers.push('Falta una cotización de venta reciente');
  else if(minimumUnit!==null&&quoted<minimumUnit)blockers.push('Precio observado por debajo del mínimo rentable');
  else blockers.push('No superó las comprobaciones estrictas de beneficio, riesgo o liquidez');
  if(weekly===null)blockers.push('Sin actividad semanal contrastable');
  else if(weekly<=50)blockers.push('Actividad limitada: no ampliar el lote sin confirmar demanda');
  if(o.focusUnverified)blockers.push('Consumo de Focus sin verificar');
  return {...o,score,referencePrice:quoted,rawMaterials:gross,costTotal:cost,weeklyObserved:weekly,
   minSalePrice:minimumUnit,blockers,qty:0,capital:0,units:0,craftAmount:output,outputAmount:output,
   scenarioProfit:null,requiresVerification:true,executable:false};
 }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const selected=[];
 for(const x of ranked){if(seen.has(x.id))continue;seen.add(x.id);selected.push(x);if(selected.length>=Math.max(1,Math.min(30,maxItems)))break;}
 // A plausible *target* lot, based on a small share of observed activity. It is
 // NOT an instruction to buy: observed listings != realized sales or stock.
 const exposure=selected.length>=10?.17:selected.length>=5?.28:selected.length>=3?.40:.65;
 let remaining=available;
 for(const row of selected){
  const gross=row.rawMaterials;
  if(gross===null||gross<=0||gross>available){row.qty=1;row.budgetVerified=false;continue;}
  const velocityCap=row.weeklyObserved===null?1:row.weeklyObserved<=50?1:
   Math.max(1,Math.floor(row.weeklyObserved*weeks*.06/row.outputAmount));
  const capitalCap=Math.floor(available*exposure/gross);
  const affordable=Math.floor(remaining/gross);
  const qty=Math.max(0,Math.min(2000,velocityCap,capitalCap,affordable));
  row.qty=qty;row.budgetVerified=true;
  row.capital=money(qty*gross);
  row.units=qty*row.outputAmount;
  remaining-=row.capital;
  if(row.minSalePrice!==null&&row.costTotal!==null){
   const net=(1-Math.min(.95,(Number(row.taxRate)||0)+(Number(row.setupRate)||0)))*row.minSalePrice*row.outputAmount;
   row.scenarioProfit=money(qty*(net-row.costTotal-(Number(row.transportCost)||0)));
  }
 }
 const rows=selected.filter(x=>x.qty>0);
 const scenarioCapital=rows.reduce((a,r)=>a+r.capital,0);
 return {status:'conditional',executable:false,rows,budget:available,scenarioCapital,
  remaining:Math.max(0,available-scenarioCapital),units:rows.reduce((a,r)=>a+r.units,0),
  horizonDays,scanned:options?.length||0,
  warning:'PROPUESTA CONDICIONADA. Ninguna orden de compra o venta está garantizada. NO compres materiales ni fabriques hasta verificar precios, costes y margen neto en el juego.'};
}
