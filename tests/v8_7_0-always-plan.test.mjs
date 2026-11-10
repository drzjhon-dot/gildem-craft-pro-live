import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareAlwaysPlan,MIN_CRAFT_BATCH,MIN_WEEKLY_ACTIVITY_FOR_PLAN} from '../core/always-plan.js';
const obj=(id,weeklyObserved=1000,overrides={})=>({id,city:'Black Market',craftCity:'Lymhurst',craftAmount:1,rawMaterials:12000,
 costTotal:9200,referencePrice:9000,taxRate:.025,setupRate:.025,weeklyObserved,materials:[{id:'T5_PLANKS',count:8,unitPrice:1000}],...overrides});
test('Una pérdida pequeña no elimina los lotes con movimiento suficiente',()=>{
 const p=prepareAlwaysPlan([obj('T5_2H_BOW')],{budget:1000000});
 assert.equal(p.status,'conditional');assert.equal(p.executable,false);assert.equal(p.rows.length,1);
 assert(p.rows[0].minSalePrice>p.rows[0].referencePrice);
 assert(p.rows[0].blockers.some(x=>x.includes('debajo')));
 assert(p.rows[0].qty>=MIN_CRAFT_BATCH);
});
test('Sin cotización de venta no inventa precio ni beneficio',()=>{
 const p=prepareAlwaysPlan([obj('T5_2H_BOW',1000,{referencePrice:null})],{budget:1000000});
 assert.equal(p.rows.length,1);assert.equal(p.rows[0].referencePrice,null);
 assert(p.rows[0].minSalePrice>0);assert.equal(p.rows[0].scenarioProfit,null);
});
test('Sin costos de materiales no fabrica lotes ficticios ni aparta silver',()=>{
 const p=prepareAlwaysPlan([obj('T5_2H_BOW',1000,{rawMaterials:null,costTotal:null})],{budget:1000000});
 assert.equal(p.rows.length,0);assert.equal(p.scenarioCapital,0);
});
test('No asigna más silver que el presupuesto',()=>{
 const p=prepareAlwaysPlan(Array.from({length:12},(_,i)=>obj('T5_ITEM_'+i,9000)),{budget:1000000});
 assert(p.scenarioCapital<=1000000);assert.equal(p.remaining,1000000-p.scenarioCapital);
 assert(p.rows.every(x=>x.qty>=2&&!x.executable));
});
test('Descarta rotación insuficiente y mantiene lotes con buena actividad',()=>{
 const p=prepareAlwaysPlan([obj('T5_A',12),obj('T5_B',2000)],{budget:1000000});
 assert.equal(p.rows.find(x=>x.id==='T5_A'),undefined);
 assert(p.rows.find(x=>x.id==='T5_B').qty>=2);
});
test('No duplica el mismo objeto entre ciudades y elige mejor actividad',()=>{
 const p=prepareAlwaysPlan([obj('T5_BOW',60,{city:'Martlock'}),obj('T5_BOW',2100,{city:'Thetford'})],{budget:1000000});
 assert.equal(p.rows.length,1);assert.equal(p.rows[0].city,'Thetford');
});
test('Nunca crea objetos ficticios ni lotes de una sola fabricación',()=>{
 assert.equal(prepareAlwaysPlan([],{budget:1000000}).rows.length,0);
 assert.equal(prepareAlwaysPlan([obj('T5_ITEM',MIN_WEEKLY_ACTIVITY_FOR_PLAN-1)],{budget:1000000}).rows.length,0);
});
test('Black y Royal comparten la vista de rotación y Mi negocio',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
 assert(app.includes('function conditionalProductionFor('));
 assert(app.includes('function conditionalResultsContent('));
 assert(app.includes('state.plan={conditionalProposal,smartPortfolio:'));
 assert(app.includes('state.autoPlan={conditionalProposal,smartPortfolio:'));
 assert(app.includes('draftPlanForLedger'));
 assert(css.includes('.gcp-conditional-wrap{width:100%'));
});
