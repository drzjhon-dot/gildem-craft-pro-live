// Guardarraíl final, independiente de la puntuación, ranking y fallback.
// Un plan nunca debe fabricar fuera de filtros explícitos o superar silver disponible.
export const validCraftBudget = value => Number.isSafeInteger(Number(value)) && Number(value)>=1_000 && Number(value)<=1_000_000_000_000;
export function exactVariantAllowed(id, tiers, enchants) {
 const match=String(id||'').match(/^T([1-8])_/);
 if(!match)return false;
 const tier=Number(match[1]);
 const part=String(id).split('@');
 const enchant=part.length>1?Number(part[1]):0;
 return Number.isSafeInteger(enchant)&&Array.isArray(tiers)&&Array.isArray(enchants)&&tiers.includes(tier)&&enchants.includes(enchant);
}
export function validateCraftPlanSelections(plan,{tiers,enchants,budget,allowedIds=null}={}) {
 if(!validCraftBudget(budget))throw Error('Presupuesto incorrecto; no se puede aprobar el plan.');
 if(!Array.isArray(tiers)||!tiers.length||!Array.isArray(enchants)||!enchants.length)throw Error('Debes elegir al menos un tier y encantamiento.');
 const ids=allowedIds==null?null:new Set(allowedIds);
 for(const row of plan?.rows||[]) {
  if(!exactVariantAllowed(row.id,tiers,enchants))throw Error('Plan bloqueado: '+row.id+' está fuera de los tiers o encantamientos seleccionados.');
  if(ids&&!ids.has(row.id))throw Error('Plan bloqueado: '+row.id+' no pertenece a los objetos seleccionados.');
  if(!Number.isSafeInteger(row.qty)||row.qty<1)throw Error('Plan bloqueado: cantidad inválida de '+row.id+'.');
 }
 const actual=Number(plan?.totalCost||0);
 if(!Number.isFinite(actual)||actual<0||actual>budget+.001)throw Error('Plan bloqueado: materiales y diarios superan el presupuesto seleccionado.');
 return {ok:true,rows:plan?.rows?.length||0,capital:actual,remaining:budget-actual};
}
