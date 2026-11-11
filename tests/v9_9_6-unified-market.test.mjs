import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sharedMarketActivity,hasListingEvidence} from '../core/shared-market-activity.js';
import {aggregateTopMarket} from '../core/top-market.js';
import {evaluateCraftViability} from '../core/viability.js';
const DAY=86400000,now=Date.parse('2026-11-11T13:00:00Z');
const point=(offset,count,price)=>({timestamp:new Date(now-offset*DAY).toISOString().slice(0,10)+'T00:00:00',item_count:count,avg_price:price});
const row=(id,quality,counts,city='Black Market')=>({item_id:id,quality,location:city,data:counts.map((count,i)=>point(i+1,count,9000+quality*200))});
const ids=['T4_MAIN_MACE','T4_2H_MACE','T4_2H_FLAIL','T5_MAIN_MACE@1','T6_MAIN_MACE_HELL','T4_2H_MACE@1'];
const raw=[
 row(ids[0],1,[80,80,80,80,80,80,80]),row(ids[0],2,[20,20,20,20,20,20,20]),
 row(ids[1],1,[60,60,60,60,60,60,60]),
 row(ids[2],1,[38,38,38,38,38,38,38]),row(ids[2],2,[5,5,5,5,5,5,5]),
 row(ids[3],1,[12,12,12,12,12,12,12]),
 row(ids[4],1,[4,0,0,0,0,0,0]),
 row(ids[5],1,[16,16,16,16,16,16,16])
];
const route=(id,activity,activity7,demandDaily)=>({id,city:'Black Market',mode:'listed',capitalPerUnit:1100,cost:1000,sell:2000,profit:900,stressProfit:450,
 ageHours:1,referenceSide:'buy_price_max',activity,activity7,demandDaily,marketEvidenceSource:'Top Mercado · AODP West',marketRecentAddressableDaily:activity7?.normalObservedDaily??null,confidence:{score:80},craftCity:'Thetford',craftAmount:1});
test('Top Mercado y generador comparten el mismo agregador de actividad calidades 1-5',()=>{
 const top=aggregateTopMarket(raw,{days:7,now});
 const shared=sharedMarketActivity(raw,{now});
 for(const item of top){
  const a=shared.byMarket.get(item.id+'|'+item.city);
  assert(a,item.id);
  assert.equal(a.activity7.observedDaily,item.dailyAmount,item.id);
 }
 assert.equal(shared.byMarket.get(ids[2]+'|Black Market').activity7.observedDaily,43);
 assert.equal(shared.byMarket.get(ids[2]+'|Black Market').daily,21.5); // ventana de 14 días, no confundir con 7 días
});
test('duplicados de respuesta no inflan la actividad ni la suma de calidades',()=>{
 const duplicate=[...raw,structuredClone(raw[0])];
 const a=sharedMarketActivity(raw,{now}).byMarket.get(ids[0]+'|Black Market');
 const b=sharedMarketActivity(duplicate,{now}).byMarket.get(ids[0]+'|Black Market');
 assert.equal(a.activity.observedDaily,b.activity.observedDaily);
 assert.equal(a.activity7.observedDaily,b.activity7.observedDaily);
});
test('precio por calidad superior no se usa como precio mediano de puja Normal',()=>{
 const a=sharedMarketActivity(raw,{now}).byMarket.get(ids[0]+'|Black Market');
 assert.equal(a.activity.medianPrice,9200);
 assert.equal(a.marketObserved7Daily,100);
 assert(a.daily<=a.marketObservedDaily);
});
test('Mangual con datos Top recibe evidencia; Íncubo sin cobertura NO entra en un plan por su precio',()=>{
 const index=sharedMarketActivity(raw,{now}).byMarket;
 const flail=index.get(ids[2]+'|Black Market');
 assert(flail.activity.observations>0);
 assert(hasListingEvidence(route(ids[2],flail.activity,flail.activity7,flail.daily),{minWeekly:5}));
 const absent=route('T6_MAIN_MACE_HELL',null,null,null);
 assert.equal(hasListingEvidence(absent),false);
 assert(evaluateCraftViability(absent,{budget:10_000_000,mode:'black'}).reasons.some(x=>x.includes('Top Mercado')));
 const good=route(ids[2],flail.activity,flail.activity7,flail.daily);
 assert(!evaluateCraftViability(good,{budget:10_000_000,mode:'black'}).reasons.some(x=>x.includes('Top Mercado')));
});
test('sin historia de calidad Normal no se presume que un craft Normal pueda venderse a calidad 2',()=>{
 const a=sharedMarketActivity([row('T4_FAKE',2,[40,40,40,40,40,40,40])],{now}).byMarket.get('T4_FAKE|Black Market');
 assert.equal(a.activity7.observedDaily,40);
 assert.equal(a.daily,null);
});
test('si calidad Normal desaparece de últimos 7 días se bloquea el lote aunque otras calidades estén activas',()=>{
 const early=row('T4_TEST',1,[0,0,0,0,0,0,0,30,30,30,30,30,30,30]);
 const recent=row('T4_TEST',2,[30,30,30,30,30,30,30]);
 const a=sharedMarketActivity([early,recent],{now}).byMarket.get('T4_TEST|Black Market');
 const r={...route('T4_TEST',a.activity,a.activity7,a.daily),marketRecentAddressableDaily:a.recentDaily};
 assert(a.activity7.observations>0);
 assert.equal(a.recentDaily,0);
 assert.equal(hasListingEvidence(r),false);
});
test('se bloquea la ruta paciente si no superó el control estricto de liquidez',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert(app.includes('const patientSource=volume.accepted.map(x=>'));
 assert(!app.includes('}).filter(Boolean):volume.accepted;'));
 assert(app.includes('sharedMarketActivity(historyRows)'));
 assert(app.includes('historyCraftMarket(marketHistoryIds,prefs.region,force'));
 assert(app.includes('validateCraftPlanSelections(plan'));
 assert(app.includes('const historyPriceLookup=demandHistoryIndex(histRows)'));
 assert(app.includes("historicalBmListingTarget(historyPriceLookup.get(id+'|Black Market')"));
});
test('cualquier consulta de crafting emplea exactamente las calidades y fechas de Top Mercado',()=>{
 const data=readFileSync(new URL('../core/data.js',import.meta.url),'utf8');
 assert(data.includes('historyCraftMarket='));
 assert(data.includes('historyTopMarket(ids,region,force,cities,days)'));
 assert(data.includes("qualities:'1,2,3,4,5'"));
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert(sw.includes('shared-market-activity.js'));
});
