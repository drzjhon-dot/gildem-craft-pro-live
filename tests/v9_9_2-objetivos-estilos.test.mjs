import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {allocatePortfolioV6} from '../core/allocator-v6.js';
import {rotationStyleProfile,rotationCapacity} from '../core/market-impact.js';
import {fameSaleEvidence,bulkMarketCandidates} from '../core/high-volume.js';

const route=(i,daily=220,opts={})=>({
 id:`T${4+i%5}_PLAN_${i}`,city:'Black Market',craftCity:'Martlock',mode:'listed',
 cost:27000+i*1000,capitalPerUnit:35000+i*1000,profit:8500+(i%4)*1300,
 stressProfit:3000,sell:51000+i*800,saleTaxPercent:6.5,craftFame:220+i*170,
 activity:{observations:14,activeDays:14,count:daily*14,observedDaily:daily},
 activity7:{observations:7,activeDays:7,count:daily*7,observedDaily:daily},
 demandDaily:daily,ageHours:2,confidence:{score:90},craftAmount:1,
 competition:{penalty:1},...opts
});
const routes=Array.from({length:14},(_,i)=>route(i,220+(i%3)*30));
const plan=(style,fameWeight,budget=3_500_000)=>allocatePortfolioV6(routes,budget,{
 intelligent:true,bulkMode:true,rotationGuard:true,maxPerItemFraction:.25,
 capFraction:.22,horizonDays:7,saturation:style,fameWeight,maxVariants:65,
 targetDifferentItems:28
});

test('estilos prudente, equilibrado y agresivo cambian límites de cantidad y concentración',()=>{
 const r=route(0,100);
 assert.deepEqual([1,2,3].map(i=>rotationStyleProfile(i).share),[.05,.08,.11]);
 assert.deepEqual([1,2,3].map(i=>rotationCapacity(r,{days:7,share:rotationStyleProfile(i).share})),[35,56,77]);
 assert.deepEqual([1,2,3].map(i=>rotationStyleProfile(i).maxItemFraction),[.12,.18,.22]);
});

test('las 3 selecciones de estilo y objetivos producen ajustes reales sin exceder rotación',()=>{
 const matrix=[];
 for(const style of [1,2,3])for(const fame of [0,.5,1]){
  const p=plan(style,fame);
  assert(p.rows.length>0);
  assert(p.totalCost<=3_500_000);
  assert(p.rows.every(r=>r.totalProfit>0&&r.qty>0));
  assert(p.rows.every(r=>r.qty<=rotationCapacity(r,{days:7,share:rotationStyleProfile(style).share})));
  const limit=style===1?.12:style===2?.18:.22;
  assert(p.rows.every(r=>r.allocation<=limit*3_500_000+1e-7));
  matrix.push(p.rows.map(r=>`${r.id}:${r.qty}`).sort().join('|'));
 }
 assert(new Set(matrix).size>=5,'nueve combinaciones deben repartir distinto cuando existen rutas viables');
 for(const style of [1,2,3]){
  const silver=plan(style,0),mixed=plan(style,.5),fame=plan(style,1);
  assert(fame.totalFame>silver.totalFame*1.04,`fama mayor para estilo ${style}`);
  assert(mixed.totalFame>=silver.totalFame,`fama equilibrada no cae debajo de plata para estilo ${style}`);
 }
});

test('más fama admite variedad moderada solo con movimiento reciente y beneficio conservador',()=>{
 const active=route(9,6,{activity:{observations:14,activeDays:6,observedDaily:6},activity7:{observations:7,activeDays:4,count:40,observedDaily:40/7}});
 assert.equal(bulkMarketCandidates([active],{minWeekly:50}).accepted.length,0);
 assert.equal(bulkMarketCandidates([active],{minWeekly:35}).accepted.length,1);
 assert.equal(fameSaleEvidence(active),true);
 for(const changes of [
  {activity:{...active.activity,activeDays:2}},
  {activity7:{...active.activity7,count:0}},
  {stressProfit:-1},
  {externalDemand:true},
  {ageHours:26}
 ])assert.equal(fameSaleEvidence({...active,...changes}),false,JSON.stringify(changes));
});

test('Black Craft y Royal Craft conectan ambos selectores al plan y no cambian recetas',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const marker of ["mk('style','Estilo del plan'","mk('fame','Objetivo del plan'",'rotationStyleProfile(p.style)',
  'const fameFirst=Number(fameGoal)===2','fameSaleEvidence(x)','rotationGuard:craftPrefs.rotationGuard!==false',
  'rotationGuard:autoPrefs.rotationGuard!==false','style:craftPrefs.style,fameGoal:craftPrefs.fameGoal',
  'style:autoPrefs.style,fameGoal:autoPrefs.fameGoal'])assert(app.includes(marker),marker);
 assert(html.includes('v9.9.6'));
});
