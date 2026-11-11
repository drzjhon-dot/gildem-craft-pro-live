import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rotationCapacity,FAST_ROTATION} from '../core/market-impact.js';
import {allocatePortfolioV6} from '../core/allocator-v6.js';

const route=(i,daily=120,more={})=>({
 id:`T${4+i%5}_ROTATION_TEST_${i}`,city:'Black Market',craftCity:'Martlock',mode:'listed',
 cost:40000,capitalPerUnit:50000,profit:9500,stressProfit:5200,sell:70000,saleTaxPercent:6.5,
 activity:{observations:14,activeDays:14,count:daily*14,observedDaily:daily,coverage:1},
 activity7:{observations:7,activeDays:7,count:daily*7,observedDaily:daily,coverage:1},
 demandDaily:daily,ageHours:2,confidence:{score:86},competition:{known:false,penalty:1},craftAmount:1,...more
});
test('rotación rápida limita la cuota al 8% de 7 días, aunque se elija un horizonte de 30',()=>{
 const r=route(0,100);
 assert.equal(rotationCapacity(r,{days:30}),56);
 assert.equal(rotationCapacity(r,{days:3}),24);
 assert.equal(rotationCapacity({...r,activity:{...r.activity,activeDays:2}},{days:7}),28);
 assert.equal(rotationCapacity({...r,externalDemand:true},{days:7}),28);
 assert.equal(rotationCapacity({...r,craftAmount:2},{days:7}),28);
 assert.equal(rotationCapacity({...r,demandDaily:null,activity:{observations:0},activity30:{observations:0},activity7:{observations:0}}),0);
 assert.equal(rotationCapacity({...r,mode:'instant',depthVerified:true,orderLevels:[{price:70000,amount:150}]}),Infinity);
});
test('la protección diversifica y NO fuerza llenar presupuesto aunque la ruta gane silver',()=>{
 const routes=Array.from({length:14},(_,i)=>route(i,150,{
  profit:12500-i*250,stressProfit:7500-i*110
 }));
 const total=100_000_000;
 const protectedPlan=allocatePortfolioV6(routes,total,{intelligent:true,bulkMode:true,useAll:true,
  maxPerItemFraction:.75,targetDifferentItems:28,rotationGuard:true,
  horizonDays:30,capFraction:.22,saturation:2});
 assert(protectedPlan.rows.length>=10,'debe considerar al menos 10 objetos rentables distintos');
 assert(protectedPlan.rows.every(r=>r.qty<=rotationCapacity(r,{days:30})),'ninguna ruta excede el horizonte rápido');
 assert(protectedPlan.rows.every(r=>r.allocation<=total*FAST_ROTATION.maxItemFraction),'ningún objeto inmoviliza demasiado silver');
 assert(protectedPlan.remaining>0,'deja capital libre en vez de inventar demanda');
 const legacy=allocatePortfolioV6(routes,total,{intelligent:true,bulkMode:true,useAll:true,
  maxPerItemFraction:.75,targetDifferentItems:28,rotationGuard:false,
  horizonDays:30,capFraction:.22,saturation:2});
 assert(legacy.rows.reduce((s,r)=>s+r.qty,0)>protectedPlan.rows.reduce((s,r)=>s+r.qty,0),
  'el modo normal puede hacer lotes mayores, pero no el protegido');
});
test('la protección del usuario está disponible en ambas pestañas y no cambia la ruta de copia',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert(app.includes('Rotación rápida y más variedad'));
 assert(app.includes('rotationGuard:craftPrefs.rotationGuard!==false'));
 assert(app.includes('rotationGuard:autoPrefs.rotationGuard!==false'));
 assert(app.includes("data-copy-item-name"));
 assert(html.includes('v9.9.2'));
});
