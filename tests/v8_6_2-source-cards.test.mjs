import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {MARKET_REFERENCES,marketReferenceSnapshot} from '../core/market-references.js';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const start=source.indexOf('function marketReferencesPanel(data){');
const end=source.indexOf('function marketCoverageHtml(p){',start);
assert(start>=0&&end>start,'No se encontró la pantalla de fuentes');
const fragment=source.slice(start,end);
const h=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function draw(data){
 const context={marketReferenceSnapshot,h,Date,data};
 vm.runInNewContext(fragment+';globalThis.rendered=marketReferencesPanel(data);',context,{timeout:1500});
 return context.rendered;
}
test('Las 5 tarjetas identifican correctamente su pagina y su finalidad',()=>{
 const checkedAt='2026-11-10T01:00:00Z';
 const data={region:'west',checkedAt,checks:MARKET_REFERENCES.map((r,i)=>({key:r.key,status:i===1?'unavailable':'accessible',checkedAt}))};
 const page=draw(data);
 for(const s of MARKET_REFERENCES){assert(page.includes(h(s.title)));assert(page.includes(h(s.uses)));}
 assert(page.includes('4 de 5 páginas respondieron'));
 assert(page.includes('0 de 5 referencias externas aportaron estadísticas al cálculo'));
 assert(page.includes('data-nav="ajustes"'));
 assert(!page.includes('undefined'));
});
test('Si las webs no respondieron, la UI no sugiere datos importados',()=>{
 const page=draw(null);
 assert(page.includes('No se pudo comprobar la accesibilidad'));
 assert(page.includes('AODP América (West)'));
 assert(!page.includes('integradas: 5'));
 assert(marketReferenceSnapshot(null).every(s=>s.name&&s.description&&s.numericImported===false));
});
