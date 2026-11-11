import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {completeUtcHistoryRange} from '../core/data.js';
import {normalizeNatsOrders,parseNatsFrames,ticksToUnixMilliseconds} from '../workers/aodp-nats-utils.mjs';
import {validateNatsSnapshot} from '../netlify/functions/aodp-feed-validation.mjs';

test('Ticks oficiales de NATS a epoch sin redondeo',()=>{
 assert.equal(ticksToUnixMilliseconds('638181504000000000'),1682553600000);
 assert.equal(ticksToUnixMilliseconds('no'),null);
});

test('AODP West: history completo en UTC, sin mezclar el día en curso',()=>{
 assert.deepEqual(completeUtcHistoryRange(7,Date.UTC(2026,10,11,15)),{date:'2026-11-04',end_date:'2026-11-11'});
 assert.deepEqual(completeUtcHistoryRange(14,Date.UTC(2026,10,11,0)),{date:'2026-10-28',end_date:'2026-11-11'});
});
test('Top Mercado usa rango explícito y el histórico normal de craft se conserva',()=>{
 const src=readFileSync(new URL('../core/data.js',import.meta.url),'utf8');
 assert(src.includes('...completeUtcHistoryRange(days)'));
 assert(src.includes("export const history=(ids,region='west',force=false)=>api('history',ids,region"));
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert(app.includes('historyTopMarket(ids,prefs.region,force,input.cities,input.days)'));
 assert(app.includes('ordenes NATS')||app.includes('órdenes NATS'));
});
test('West NATS: normaliza solo los mercados de América y las calidades válidas',()=>{
 const values=normalizeNatsOrders({Orders:[
  {ItemTypeId:'T5_2H_FLAIL',LocationId:'3003',QualityLevel:2,Id:'151'},
  {ItemTypeId:'T5_2H_FLAIL',LocationId:'1002',QualityLevel:5,Id:'152'},
  {ItemTypeId:'T5_2H_FLAIL',LocationId:'999999',QualityLevel:1},
  {ItemTypeId:'T4_MAIN_MACE',LocationId:'3003',QualityLevel:6}
 ]},'2026-11-11T16:00:00.000Z');
 assert.deepEqual(values.map(x=>[x.itemId,x.city,x.quality]),[
  ['T5_2H_FLAIL','Black Market',2],['T5_2H_FLAIL','Lymhurst',5]
 ]);
});
test('NATS: parsea bytes UTF8 y mensajes divididos por TCP',()=>{
 const payload=Buffer.from('{"Orders":[],"note":"cañón"}');
 const all=Buffer.concat([Buffer.from(`PING\r\nMSG marketorders.deduped 1 ${payload.length}\r\n`),payload,Buffer.from('\r\n')]);
 const half=parseNatsFrames(all.subarray(0,all.length-4));
 assert.deepEqual(half.frames.map(f=>f.type),['PING']);
 const done=parseNatsFrames(Buffer.concat([half.rest,all.subarray(all.length-4)]));
 assert.equal(done.frames.length,1);
 assert.equal(done.frames[0].payload.toString('utf8'),payload.toString('utf8'));
});
test('NATS: snapshots requieren West, frescura y formato exacto',()=>{
 const now=Date.UTC(2026,10,11,15),date=new Date(now).toISOString();
 const good={region:'west',source:'AODP-NATS-marketorders.deduped',generatedAt:date,lastEventAt:date,connected:true,observedMessages:12,orders:[{itemId:'T5_2H_FLAIL',city:'Black Market',quality:1,observedOrders:5,lastSeenAt:date}]};
 assert.equal(validateNatsSnapshot(good,now).orders.length,1);
 assert.equal(validateNatsSnapshot({...good,region:'east'},now),null);
 assert.equal(validateNatsSnapshot({...good,generatedAt:'2020-01-01T00:00:00Z'},now),null);
 assert.equal(validateNatsSnapshot({...good,orders:[{...good.orders[0],observedOrders:-4}]},now),null);
});
test('Netlify: proxy permite date y end_date, respeta reset de 429 y NATS no altera el profit',()=>{
 const proxy=readFileSync(new URL('../netlify/functions/market.mjs',import.meta.url),'utf8');
 assert(proxy.includes("['date','end_date']")&&proxy.includes("'ratelimit-reset'"));
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert(app.includes('aodp-feed')&&app.includes('no altera los promedios'));
 const server=readFileSync(new URL('../netlify/functions/aodp-feed-ingest.mjs',import.meta.url),'utf8');
 assert(server.includes('secretMatches')&&server.includes('GILDEM_NATS_INGEST_SECRET'));
});


test('Proxy REST: transmite rango y calidades oficiales de West',async()=>{
 const handler=(await import('../netlify/functions/market.mjs?regression=1')).default;
 const original=globalThis.fetch;let requested;
 globalThis.fetch=async(url,opts)=>{requested={url:String(url),opts};return new Response('[]',{status:200,headers:{'content-type':'application/json'}});};
 try{
  const query=new URLSearchParams({region:'west',kind:'history',items:'T5_2H_FLAIL,T4_MAIN_MACE',locations:'Black Market',qualities:'1,2,3,4,5','time-scale':'24',date:'2026-11-04',end_date:'2026-11-11'});
  const res=await handler(new Request('https://example.netlify.app/.netlify/functions/market?'+query));
  assert.equal(res.status,200);
  const url=new URL(requested.url);
  assert.equal(url.hostname,'west.albion-online-data.com');
  assert.equal(url.searchParams.get('date'),'2026-11-04');
  assert.equal(url.searchParams.get('end_date'),'2026-11-11');
  assert.equal(url.searchParams.get('qualities'),'1,2,3,4,5');
  assert.match(requested.opts.headers['Accept-Encoding'],/gzip/);
  const invalid=await handler(new Request('https://example.netlify.app/.netlify/functions/market?kind=history&items=T4_MAIN_MACE&date=2026-01-01&end_date=2026-04-01'));
  assert.equal(invalid.status,400);
  const notWest=await handler(new Request('https://example.netlify.app/.netlify/functions/market?region=east&items=T4_MAIN_MACE'));
  assert.equal(notWest.status,400);
 }finally{globalThis.fetch=original;}
});

test('Ingesta NATS: secreto privado y comparación en tiempo constante antes de escribir blobs',()=>{
 const source=readFileSync(new URL('../netlify/functions/aodp-feed-ingest.mjs',import.meta.url),'utf8');
 assert(source.includes("process.env.GILDEM_NATS_INGEST_SECRET"));
 assert(source.includes('timingSafeEqual'));
 assert(source.includes("secret.length<32"));
 assert(source.includes("if(!secretMatches"));
 assert(source.indexOf('if(!secretMatches')<source.indexOf('getStore('));
});
