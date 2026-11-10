import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareAlwaysPlan} from '../core/always-plan.js';

const obj=(id,weeklyObserved=1000,overrides={})=>({id,city:'Black Market',craftCity:'Lymhurst',craftAmount:1,rawMaterials:12000,
 costTotal:9200,referencePrice:9000,taxRate:.025,setupRate:.025,weeklyObserved,materials:[{id:'T5_PLANKS',count:8,unitPrice:1000}],...overrides});

test('Siempre devuelve propuesta condicionada si el precio de venta está por debajo del mínimo',()=>{
 const p=prepareAlwaysPlan([obj('T5_2H_BOW')],{budget:1000000});
 assert.equal(p.status,'conditional');assert.equal(p.executable,false);assert.equal(p.rows.length,1);
 assert(p.rows[0].minSalePrice>p.rows[0].referencePrice);
 assert(p.rows[0].blockers.some(x=>x.includes('debajo')));
 assert.equal(p.rows[0].executable,false);
});
test('Sin cotización de venta no inventa precio ni beneficio',()=>{
 const p=prepareAlwaysPlan([obj('T5_2H_BOW',1000,{referencePrice:null})],{budget:1000000});
 assert.equal(p.rows.length,1);assert.equal(p.rows[0].referencePrice,null);
 assert(p.rows[0].minSalePrice>0);assert.equal(p.executable,false);
});
test('Sin costos de materiales entrega objetivo mínimo pero 0 silver autorizado',()=>{
 const p=prepareAlwaysPlan([obj('T5_2H_BOW',1000,{rawMaterials:null,costTotal:null})],{budget:1000000});
 assert.equal(p.rows.length,1);assert.equal(p.rows[0].qty,1);
 assert.equal(p.rows[0].minSalePrice,null);assert.equal(p.scenarioCapital,0);
 assert.equal(p.rows[0].scenarioProfit,null);
});
test('No asigna más silver que el presupuesto ni recomienda ventas ejecutables',()=>{
 const p=prepareAlwaysPlan(Array.from({length:12},(_,i)=>obj('T5_ITEM_'+i,9000)),{budget:1000000});
 assert(p.scenarioCapital<=1000000);assert.equal(p.remaining,1000000-p.scenarioCapital);
 assert(p.rows.every(x=>!x.executable));
});
test('Sin evidencia semanal mantiene lote unitario; con alta actividad deja más unidades',()=>{
 const p=prepareAlwaysPlan([obj('T5_A',12),obj('T5_B',2000)],{budget:1000000});
 assert.equal(p.rows.find(x=>x.id==='T5_A').qty,1);
 assert(p.rows.find(x=>x.id==='T5_B').qty>1);
});
test('No duplica el mismo item entre ciudades; usa la ruta con mejor evidencia',()=>{
 const p=prepareAlwaysPlan([obj('T5_BOW',60,{city:'Martlock'}),obj('T5_BOW',2100,{city:'Thetford'})],{budget:1000000});
 assert.equal(p.rows.length,1);assert.equal(p.rows[0].city,'Thetford');
});
test('Sin ninguna receta real no crea items ficticios',()=>{
 const p=prepareAlwaysPlan([],{budget:1000000});
 assert.equal(p.rows.length,0);assert.equal(p.scenarioCapital,0);
});
test('Black y Royal tienen salida condicionada independiente de estados vacíos',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
 assert(app.includes('function conditionalProductionFor('));
 assert(app.includes('function conditionalResultsContent('));
 assert(app.includes('state.plan={conditionalProposal,smartPortfolio:'));
 assert(app.includes('state.autoPlan={conditionalProposal,smartPortfolio:'));
 assert(app.includes('if(plan.rows.length||conditionalProposal?.rows?.length)'));
 assert(css.includes('.gcp-conditional-wrap{width:100%'));
});
