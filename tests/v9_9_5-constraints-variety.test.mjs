import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {exactVariantAllowed,validCraftBudget,validateCraftPlanSelections} from '../core/plan-constraints.js';
import {diversifiedRouteOrder,allocatePortfolioV6} from '../core/allocator-v6.js';

const candidate=(tier,enchant,ix)=>({
 id:`T${tier}_VARIANT_${ix}${enchant?'@'+enchant:''}`,
 city:'Black Market',craftCity:'Martlock',mode:'listed',cost:40_000,capitalPerUnit:50_000,profit:16_000,
 stressProfit:7_000,sell:75_000,saleTaxPercent:6.5,craftFame:200+tier*90+enchant*50,
 activity:{observations:14,activeDays:14,count:1400,observedDaily:100,coverage:1},
 activity7:{observations:7,activeDays:7,count:700,observedDaily:100,coverage:1},
 demandDaily:100,ageHours:2,confidence:{score:88},craftAmount:1
});

test('presupuesto acepta montos manuales válidos sin exceder tope',()=>{
 assert(validCraftBudget(1_000));assert(validCraftBudget(7_850_000));assert(validCraftBudget(1_000_000_000_000));
 for(const x of [0,-1,999,1000.5,1_000_000_000_001,'abc'])assert.equal(validCraftBudget(x),false);
});
test('se respeta .0, .1, .3 no consecutivos y tier exacto',()=>{
 assert(exactVariantAllowed('T4_MAIN_MACE',[4,6],[0,1,3]));
 assert(exactVariantAllowed('T6_MAIN_MACE@3',[4,6],[0,1,3]));
 assert(!exactVariantAllowed('T6_MAIN_MACE@2',[4,6],[0,1,3]));
 assert(!exactVariantAllowed('T5_MAIN_MACE@1',[4,6],[0,1,3]));
 assert(!exactVariantAllowed('T5_POTION_HEAL',[5],[1]));
});
test('validación bloquea items, tiers, encantamientos y exceso de capital',()=>{
 const row={id:'T6_MAIN_MACE@1',qty:3,capitalPerUnit:1000};
 const input={tiers:[4,6],enchants:[1,3],budget:50_000,allowedIds:['T6_MAIN_MACE@1']};
 assert.equal(validateCraftPlanSelections({rows:[row],totalCost:45_000},input).remaining,5_000);
 assert.throws(()=>validateCraftPlanSelections({rows:[{...row,id:'T5_MAIN_MACE@1'}],totalCost:40_000},input),/fuera/);
 assert.throws(()=>validateCraftPlanSelections({rows:[{...row,id:'T6_MAIN_MACE@2'}],totalCost:40_000},input),/fuera/);
 assert.throws(()=>validateCraftPlanSelections({rows:[{...row,id:'T6_MAIN_MACE@3'}],totalCost:40_000},input),/objetos/);
 assert.throws(()=>validateCraftPlanSelections({rows:[row],totalCost:50_001},input),/presupuesto/);
 assert.throws(()=>validateCraftPlanSelections({rows:[{...row,qty:1.5}],totalCost:40_000},input),/cantidad/);
});
test('orden diversificado cruza tiers y encantamientos sin introducir rutas nuevas',()=>{
 const routes=[];
 for(const tier of [4,5,6,7])for(const e of [0,1,2])routes.push(candidate(tier,e,routes.length));
 for(const by of ['tier','enchant']){
  const ordered=diversifiedRouteOrder(routes,{by,priority:r=>r.profit});
  assert.equal(ordered.length,routes.length);
  assert.equal(new Set(ordered).size,routes.length);
  assert.deepEqual(new Set(ordered),new Set(routes));
 }
});
test('plan diversificado respeta presupuesto, demanda y beneficio conservador',()=>{
 const routes=[];
 for(const tier of [4,5,6,7,8])for(const ench of [0,1,2])routes.push(candidate(tier,ench,routes.length));
 routes.push({...candidate(7,3,99),profit:-3,stressProfit:-20});
 const budget=2_200_000;
 const result=allocatePortfolioV6(routes,budget,{intelligent:true,bulkMode:true,rotationGuard:true,maxVariants:80,
  targetDifferentItems:35,capFraction:.22,horizonDays:7,saturation:2,fameWeight:.5,maxPerItemFraction:.20});
 assert(result.rows.length>=6);
 assert(result.totalCost<=budget);
 assert(!result.rows.some(x=>x.id.includes('VARIANT_99')));
 assert(result.rows.every(x=>x.qty<=x.intelligentCapacity&&x.totalProfit>0));
 const tiers=new Set(result.rows.map(x=>x.id.slice(1,2)));
 assert(tiers.size>=3);
});
test('ambos formularios tienen presupuesto manual, validación final y filtros guardados',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 for(const marker of ['qc-budget-custom','data-qc-custom-budget','validCraftBudget(budget)',"qcSync('auto')","qcSync('craft')", "qcChosen('craft','tier')","qcChosen('auto','tier')",'validateCraftPlanSelections(plan','filterSummary:', 'budget:input.budget,allowedIds:ids'])assert(app.includes(marker),marker);
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert(html.includes('v9.9.5'));
 assert(sw.includes('core/plan-constraints.js'));
});
