import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calcBatch,calcPriceIds,quoteIndex} from '../core/craft-calc.js';
import {craftingReturnRate} from '../core/engine.js';
const now=Date.now(),at=new Date(now-3600000).toISOString();
const recipes={
 T5_SHOES_PLATE_SET1:{city:'Fort Sterling',materials:[{id:'T5_METALBAR',count:8}]},
 'T5_SHOES_PLATE_SET1@1':{city:'Fort Sterling',materials:[{id:'T5_METALBAR_LEVEL1@1',count:8}]},
 T4_SHOES_PLATE_SET1:{city:'Fort Sterling',materials:[{id:'T4_METALBAR',count:8}]},
};
const price=(id,city,ask,bid=0)=>({item_id:id,city,quality:1,sell_price_min:ask,sell_price_min_date:at,buy_price_max:bid,buy_price_max_date:at});
const rows=[
 price('T5_METALBAR','Thetford',3600),price('T5_METALBAR','Martlock',3900),
 price('T4_METALBAR','Fort Sterling',1100),
 price('T5_SHOES_PLATE_SET1','Lymhurst',52000),price('T5_SHOES_PLATE_SET1','Martlock',56000),
 price('T5_SHOES_PLATE_SET1','Black Market',0,64000),
 price('T4_SHOES_PLATE_SET1','Martlock',11000),
 price('T5_JOURNAL_WARRIOR_EMPTY','Fort Sterling',2500),
 price('T4_JOURNAL_WARRIOR_EMPTY','Fort Sterling',900),
];
const quotes=quoteIndex(rows,{now});
const opts={recipes,quotes,journalLookup:()=>null,premium:true,focus:false,tax:4,setup:2.5,stationFee:0};

test('cotizaciones: material al precio más barato Royal, venta Royal a la mejor orden y puja del Mercado Negro',()=>{
 const r=calcBatch([{id:'T5_SHOES_PLATE_SET1',qty:10}],opts).rows[0];
 assert.equal(r.ok,true);
 assert.equal(r.royalCity,'Martlock');assert.equal(r.royalAsk,56000);assert.equal(r.bmBid,64000);
 const rate=craftingReturnRate({specialty:true,focus:false}).returnRate;
 const used=8*(1-rate/100);
 assert(Math.abs(r.unitCost-used*3600)<1e-6,'coste neto con retorno de ciudad y material de Thetford');
 assert(Math.abs(r.profitBM-(64000*.96-r.unitCost)*10)<1e-6,'Mercado Negro: venta inmediata, solo impuesto');
 assert(Math.abs(r.profitRoyal-(56000*.935-r.unitCost)*10)<1e-6,'Royal: impuesto + publicación');
 assert(r.fameTotal>0&&r.journalsNeeded>0&&r.journalEmpty==='T5_JOURNAL_WARRIOR_EMPTY');
});
test('el Focus sube el retorno y baja el coste',()=>{
 const sin=calcBatch([{id:'T5_SHOES_PLATE_SET1',qty:1}],opts).rows[0];
 const con=calcBatch([{id:'T5_SHOES_PLATE_SET1',qty:1}],{...opts,focus:true}).rows[0];
 assert(con.unitCost<sin.unitCost&&con.returnRate>sin.returnRate);
});
test('materiales y diarios agregados: brutos con «sobran», totales y a quién sirven',()=>{
 const out=calcBatch([{id:'T5_SHOES_PLATE_SET1',qty:10},{id:'T4_SHOES_PLATE_SET1',qty:5}],opts);
 const t5=out.materials.find(m=>m.id==='T5_METALBAR');
 assert.equal(t5.gross,80);assert(t5.spare>0&&t5.city==='Thetford');
 assert.deepEqual(t5.usedBy,['T5_SHOES_PLATE_SET1']);
 const j5=out.journals.find(j=>j.empty==='T5_JOURNAL_WARRIOR_EMPTY');
 assert(j5&&j5.count>=1&&j5.unitPrice===2500&&j5.totalCost===j5.count*2500);
 assert.equal(out.totals.crafts,15);
 assert(out.totals.grossCapital>=t5.grossCost);
 assert(out.totals.profitBM!==null&&out.totals.royalMissing===0&&out.totals.bmMissing===1,'el T4 no tiene puja BM');
});
test('sin cotización no se inventa nada: fila sin receta avisa y material sin precio invalida la fila',()=>{
 const out=calcBatch([{id:'T9_NO_EXISTE',qty:3},{id:'T5_SHOES_PLATE_SET1@1',qty:2}],opts);
 assert.equal(out.rows[0].ok,false);
 assert.equal(out.rows[1].ok,false,'el material encantado no tiene precio en las cotizaciones');
 assert(out.rows[1].reason.includes('AODP'));
 assert.equal(out.totals.crafts,0);
});
test('cotizaciones viejas quedan fuera según la ventana de Ajustes',()=>{
 const stale=[price('T5_METALBAR','Thetford',3600)].map(x=>({...x,sell_price_min_date:new Date(now-30*3600000).toISOString()}));
 assert.equal(quoteIndex(stale,{maxAgeHours:24,now}).get('T5_METALBAR').ask.size,0);
 assert.equal(quoteIndex(stale,{maxAgeHours:48,now}).get('T5_METALBAR').ask.size,1);
});
test('calcPriceIds reúne objeto, materiales y diario; la app tiene la pestaña cableada',()=>{
 const ids=calcPriceIds([{id:'T5_SHOES_PLATE_SET1',qty:1}],recipes,()=>null);
 assert.deepEqual(ids.sort(),['T5_JOURNAL_WARRIOR_EMPTY','T5_METALBAR','T5_SHOES_PLATE_SET1'].sort());
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 for(const t of ["if(state.page==='craftcal')calcPage();",'data-cal-add','data-cal-remove','data-cal-qty','calcBatch(calcPrefs.items','Profit Royal','Usar Focus'])assert(app.includes(t),t);
 assert(readFileSync(new URL('../index.html',import.meta.url),'utf8').includes('data-nav="craftcal"'));
 assert(readFileSync(new URL('../sw.js',import.meta.url),'utf8').includes('./core/craft-calc.js'));
});
