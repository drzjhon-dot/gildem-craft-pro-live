import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareAlwaysPlan,draftPlanForLedger,MIN_CRAFT_BATCH,MIN_WEEKLY_ACTIVITY_FOR_PLAN} from '../core/always-plan.js';
const route=(id,weekly,extra={})=>({id,city:'Black Market',craftCity:'Martlock',craftAmount:1,rawMaterials:1000,costTotal:900,referencePrice:2500,taxRate:.04,setupRate:.02,ageHours:2,weeklyObserved:weekly,materials:[{id:'T4_METALBAR',count:8,used:7,unitPrice:125}],...extra});
test('El minimo de fabricaciones es 2; el de movimiento es 50 observado/semana',()=>{
 assert.equal(MIN_CRAFT_BATCH,2);assert.equal(MIN_WEEKLY_ACTIVITY_FOR_PLAN,50);
});
test('1 unidad por insuficiente actividad: no entra en el plan',()=>{
 const plan=prepareAlwaysPlan([route('T4_BOW',12)],{budget:100000,horizonDays:14});
 assert.equal(plan.rows.length,0);assert.equal(plan.scenarioCapital,0);assert.equal(draftPlanForLedger(plan).materials.length,0);
});
test('1 unidad por presupuesto insuficiente: se descarta, no se cambia a 2 artificialmente',()=>{
 const plan=prepareAlwaysPlan([route('T4_BOW',500)],{budget:1000,horizonDays:14});
 assert.equal(plan.rows.length,0);assert.equal(plan.scenarioCapital,0);
});
test('Al menos 2 fabricaciones: la compra coincide con los lotes',()=>{
 const p=prepareAlwaysPlan([route('T4_BOW',500),route('T5_BOW',600)],{budget:100000});
 assert(p.rows.length>=1);assert(p.rows.every(r=>r.qty>=2));
 const draft=draftPlanForLedger(p);
 assert(draft.rows.every(r=>r.qty>=2));
 assert.equal(draft.materials.reduce((n,m)=>n+m.qtyGross,0),draft.rows.reduce((n,r)=>n+8*r.qty,0));
 assert(draft.totalCost<=100000);
});
test('Sin precios de materiales, ni lotes de prueba ni compras inventadas',()=>{
 const p=prepareAlwaysPlan([route('T4_BOW',1000,{rawMaterials:null,costTotal:null})],{budget:100000});
 assert.equal(p.rows.length,0);assert.equal(draftPlanForLedger(p).rows.length,0);
});
test('La demanda no permite saturar un mercado con inventario pendiente',()=>{
 const without=prepareAlwaysPlan([route('T4_BOW',500)],{budget:100000});
 const withStock=prepareAlwaysPlan([route('T4_BOW',500,{pendingMarketUnits:59})],{budget:100000});
 assert(without.rows.length===1);assert.equal(withStock.rows.length,0);
});
test('Pérdidas grandes no fuerzan una sola fabricación',()=>{
 const p=prepareAlwaysPlan([route('T5_RIESGO',2000,{rawMaterials:9000,costTotal:9000,referencePrice:1000})],{budget:100000});
 assert.equal(p.rows.length,0);
});
