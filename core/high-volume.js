// Gildem Craft Pro 8.6.6 · volumen realista para Black Craft y Royal Craft.
// El historial AODP contiene observaciones, NO certifica ventas ejecutadas.
const finite=(v)=>(v===null||v===undefined||v==='')?null:Number.isFinite(Number(v))?Math.max(0,Number(v)):null;
export const MIN_WEEKLY_ACTIVITY=50;
export function observedWeeklyActivity(route){
 if(!route)return null;
 // Un ranking externo fechado y confirmado West es una estimación manual,
 // nunca una orden ejecutada. El dato se conserva separado del precio AODP.
 if(route.externalDemand&&finite(route.demandDaily)!==null)
  return {units:finite(route.demandDaily)*7,source:route.demandSource||'Importación manual West',provisional:true};
 const recent=route.activity7;
 if(recent?.observations>0&&finite(recent.count)!==null)
  return {units:finite(recent.count),source:'AODP West · observaciones últimos 7 días',provisional:true};
 const daily=finite(route.demandDaily??(route.activity?.observations>0?route.activity.observedDaily:null));
 if(daily!==null)return {units:daily*7,source:'AODP West · promedio histórico extrapolado a 7 días',provisional:true};
 return null;
}
export function bulkMarketCandidates(routes,{minWeekly=MIN_WEEKLY_ACTIVITY,requireStress=true}={}){
 const accepted=[],rejected=[];
 for(const route of routes||[]){
  const signal=observedWeeklyActivity(route);
  const positive=Number(route?.profit)>0&&Number(route?.cost)>0&&Number(route?.capitalPerUnit)>0;
  const stressed=!requireStress||Number(route?.stressProfit)>0;
  if(positive&&stressed&&signal&&signal.units>minWeekly){
   accepted.push({...route,weeklyObserved:signal.units,weeklySource:signal.source,bulkQualified:true});
  }else rejected.push({id:route?.id,city:route?.city,reason:!signal?'Sin observaciones semanales':signal.units<=minWeekly?'Actividad semanal insuficiente':!positive?'Sin margen neto positivo':'Margen negativo en escenario conservador'});
 }
 return {accepted,rejected,minWeekly};
}
// Más rutas viables => diversificar más. Menos rutas NO significa saturar:
// sigue existiendo límite por producto y sobre todo capacidad por rotación.
export function bulkItemExposureFraction(routes){
 const count=new Set((routes||[]).map(x=>x.id).filter(Boolean)).size;
 if(count>=12)return .12;
 if(count>=9)return .15;
 if(count>=7)return .18;
 if(count>=5)return .22;
 if(count>=4)return .27;
 if(count>=3)return .34;
 if(count>=2)return .40;
 return .50;
}
export function portfolioFillSummary(plan,budget,{minWeekly=MIN_WEEKLY_ACTIVITY,eligible=0}={}){
 const capital=Math.max(0,Number(budget)||0),used=Math.max(0,Number(plan?.totalCost)||0);
 const remaining=Math.max(0,capital-used),percent=capital?used/capital*100:0;
 return {budget:capital,used,remaining,percent,eligible,minWeekly,
  explanation:remaining<=Math.max(1,capital*.01)?'Presupuesto prácticamente asignado':'El capital no asignado se conserva porque las oportunidades verificables, los topes de saturación o las cantidades enteras no permiten invertirlo de forma prudente.'};
}
