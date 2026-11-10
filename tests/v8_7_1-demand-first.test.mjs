import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareAlwaysPlan,draftPlanForLedger} from '../core/always-plan.js';

const route=(id,weekly=1000,overrides={})=>({
 id,city:'Black Market',craftCity:'Lymhurst',craftAmount:1,rawMaterials:12000,
 costTotal:9200,referencePrice:9000,taxRate:.025,setupRate:.025,
 weeklyObserved:weekly,stationCost:250,transportCost:200,ageHours:3,
 materials:[{id:'T5_PLANKS',city:'Lymhurst',count:8,used:6,unitPrice:1500}],...overrides
});

test('Una pérdida no impide un plan por actividad',()=>{
 const p=prepareAlwaysPlan([route('T5_2H_BOW')],{budget:1_000_000});
 assert.equal(p.rows.length,1);
 assert(p.rows[0].profitPerCraft<0);
 assert(p.rows[0].scenarioProfit<0);
 assert(p.rows[0].breakEvenPrice>p.rows[0].referencePrice);
 assert(p.rows[0].qty>=1);
 assert(p.rows[0].warnings.some(x=>x.includes('pérdida prevista')));
});

test('Mayor actividad prevalece ante mayor margen por unidad',()=>{
 const p=prepareAlwaysPlan([
  route('T5_CARO',12,{referencePrice:18000}),
  route('T5_RAPIDO',5000,{referencePrice:9000})
 ],{budget:1_000_000});
 assert.equal(p.rows[0].id,'T5_RAPIDO');
 assert(p.rows.find(r=>r.id==='T5_RAPIDO').units>p.rows.find(r=>r.id==='T5_CARO').units);
});

test('Si es rentable, el motor sigue mostrando beneficio real',()=>{
 const p=prepareAlwaysPlan([route('T5_2H_BOW',1000,{referencePrice:14000})],{budget:1_000_000});
 assert(p.rows[0].profitPerCraft>0);
 assert(p.rows[0].estimatedROI>0);
 assert(p.estimatedProfit>0);
});

test('No se inventa beneficio ni compra cuando faltan cotizaciones de materiales',()=>{
 const p=prepareAlwaysPlan([route('T5_2H_BOW',700,{rawMaterials:null,costTotal:null,referencePrice:null})],{budget:1_000_000});
 assert.equal(p.rows.length,1);
 assert.equal(p.rows[0].qty,1);
 assert.equal(p.rows[0].scenarioProfit,null);
 assert.equal(p.scenarioCapital,0);
 assert.equal(draftPlanForLedger(p).rows.length,0);
});

test('La exposición a pérdidas y el presupuesto siempre quedan limitados',()=>{
 const p=prepareAlwaysPlan(Array.from({length:12},(_,i)=>route('T5_PRODUCTO_'+i,15000,{rawMaterials:11000,costTotal:18000,referencePrice:10000})),{budget:1_000_000});
 assert(p.rows.length>0);
 assert(p.scenarioCapital<=1_000_000);
 assert(p.rows.every(r=>r.qty>=1&&r.capital>=0));
 assert(p.rows.every(r=>r.profitPerCraft<0&&r.qty<=1_000_000*.01/Math.abs(r.profitPerCraft)+1));
 assert.equal(p.remaining,1_000_000-p.scenarioCapital);
});

test('Un artículo muy popular pero inaccesible no desplaza a productos asequibles',()=>{
 const list=Array.from({length:20},(_,i)=>route('T8_CARISIMO_'+i,10000-i,{rawMaterials:20_000_000,costTotal:18_000_000,referencePrice:19_000_000}));
 list.push(route('T5_ASEQUIBLE',230,{rawMaterials:10000,costTotal:8000,referencePrice:8200}));
 const p=prepareAlwaysPlan(list,{budget:1_000_000,maxItems:14});
 assert(p.rows.some(r=>r.id==='T5_ASEQUIBLE'));
 assert(p.scenarioCapital<=1_000_000);
});

test('Si hay historial, descarta rutas que solo tienen cotizaciones sin actividad',()=>{
 const p=prepareAlwaysPlan([route('T5_SE_VE',450),route('T5_SIN_HISTORIA',null,{referencePrice:999999})],{budget:1_000_000});
 assert.equal(p.rows.length,1);
 assert.equal(p.rows[0].id,'T5_SE_VE');
});

test('Entre ciudades prioriza actividad y no duplica la misma fabricación',()=>{
 const p=prepareAlwaysPlan([route('T5_SWORD',30,{city:'Martlock'}),route('T5_SWORD',500,{city:'Thetford'})],{budget:1_000_000});
 assert.equal(p.rows.length,1);
 assert.equal(p.rows[0].city,'Thetford');
});

test('Borrador Mi negocio solo incluye rutas calculables y no ejecuta compras',()=>{
 const proposal=prepareAlwaysPlan([
  route('T5_OK',1000),
  route('T5_NO_QUOTE',1400,{referencePrice:null})
 ],{budget:1_000_000});
 const draft=draftPlanForLedger(proposal);
 assert.equal(draft.rows.length,1);
 assert.equal(draft.rows[0].id,'T5_OK');
 assert.equal(draft.rows[0].cost,9200);
 assert.equal(draft.rows[0].capitalPerUnit,12450);
 assert(draft.materials.length>0);
 assert(draft.totalProfit<0);
 assert(draft.totalCost<=proposal.scenarioCapital);
});

test('La instalación integra en pantalla el motor por demanda y elimina el mensaje bloqueante',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert(app.includes('GCP_DEMAND_FIRST_871'));
 assert(app.includes('draftPlanForLedger'));
 assert(app.includes('function conditionalResultsContent(p){'));
 assert(app.includes('PLAN POR ROTACIÓN · SIN FILTRO DE PROFIT MÍNIMO'));
 assert(!app.includes('<strong>No hay beneficio neto verificable actualmente.</strong>'));
 assert(app.includes('planMode:byDemand?'));
 assert(app.includes('data-action="copy-demand-shopping"'));
});
