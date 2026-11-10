import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {compareTier,tierFrom,tierLabel,orderedByTier} from '../v9/tier-sort.js';
const fromRoot=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('T4.0, T4.1, T4.2, T5.0 y T6.0 quedan en orden',()=>{
 const items=['T6.0','T4.2','T5.0','T4.0','T4.1'];
 assert.deepEqual(orderedByTier(items),['T4.0','T4.1','T4.2','T5.0','T6.0']);
});
test('el orden de IDs Albion se basa en tier y luego encantamiento',()=>{
 const ids=['T6_SHOES_PLATE_SET1','T4_SHOES_PLATE_SET1@2','T4_SHOES_PLATE_SET1','T4_SHOES_PLATE_SET1@1','T5_SHOES_PLATE_SET1'];
 assert.deepEqual(orderedByTier(ids),['T4_SHOES_PLATE_SET1','T4_SHOES_PLATE_SET1@1','T4_SHOES_PLATE_SET1@2','T5_SHOES_PLATE_SET1','T6_SHOES_PLATE_SET1']);
});
test('los materiales encantados usan su ID preciso',()=>{
 assert.deepEqual(tierFrom('T4_METALBAR_LEVEL2@2'),{tier:4,enchant:2});
 assert.equal(tierLabel('T5_METALBAR'),'T5.0');
 assert.equal(compareTier('T4.2','T5.0')<0,true);
});
test('el comparador respeta el orden original para tiers iguales',()=>{
 const list=[{id:'T5_A',marker:1},{id:'T4_A',marker:2},{id:'T5_B',marker:3}];
 assert.deepEqual(orderedByTier(list,x=>x.id).map(x=>x.marker),[2,1,3]);
});
test('tier ausente no se inventa ni queda por encima de los tiers conocidos',()=>{
 assert.equal(tierLabel('recurso sin ID'),'—');
 assert.deepEqual(orderedByTier(['recurso sin ID','T5.0','T4.1']),['T4.1','T5.0','recurso sin ID']);
});
test('v9 importa y organiza sin depender de frameworks o CDN',async()=>{
 await import('../v9/ui-tables.js');
 const ui=fromRoot('v9/ui-tables.js');
 assert(ui.includes('orderedByTier'));
 assert(ui.includes('MutationObserver'));
 assert(!ui.includes('fetch('));
});
test('fabricación por demanda se convierte en tabla y conserva iconos',()=>{
 const ui=fromRoot('v9/ui-tables.js');
 assert(ui.includes("'.gcp-conditional-card'"));
 assert(ui.includes("'.gcp-conditional-material'"));
 assert(ui.includes("'.gcp-conditional-product'"));
});
test('fabricación normal conserva las entradas editables sin duplicar inputs',()=>{
 const ui=fromRoot('v9/ui-tables.js');
 assert(ui.includes("'.gcp-production-card'"));
 assert(ui.includes("'.gcp-compact-quantity'"));
 assert(ui.includes('td.appendChild(content)'));
 assert(!ui.includes('cloneNode('));
});
test('lista de compras y logística se convierten sin alterar cálculos',()=>{
 const ui=fromRoot('v9/ui-tables.js');
 assert(ui.includes("'.gcp-shopping-card'"));
 assert(ui.includes("'.gcp-logistics-card'"));
 assert(ui.includes('const root=main.querySelector'));
});
test('tablas clásicas con columna Tier también se ordenan',()=>{
 const ui=fromRoot('v9/ui-tables.js');
 assert(ui.includes("x==='tier'"));
 assert(ui.includes('for(const tr of sorted)tbody.appendChild(tr)'));
});
test('HTML contiene el motor anterior y el módulo v9.0',()=>{
 const html=fromRoot('index.html');
 assert.match(html,/app\.js\?v=9\.0\.0/);
 assert.match(html,/v9\/ui-tables\.js\?v=9\.0\.0/);
 assert.match(html,/v9\/tables\.css\?v=9\.0\.0/);
 assert.match(html,/Gildem Craft Pro v9\.0/);
});
test('SW abandona la caché 8.7 y precarga archivos v9',()=>{
 const sw=fromRoot('sw.js');
 assert(sw.includes("VERSION='gildem-craft-pro-v9.0.0'"));
 assert(sw.includes('./v9/ui-tables.js'));
 assert(sw.includes('./v9/tier-sort.js'));
 assert(sw.includes('./v9/tables.css'));
});
test('todas las declaraciones públicas de versión coinciden',()=>{
 const pkg=JSON.parse(fromRoot('package.json'));
 const manifest=JSON.parse(fromRoot('manifest.webmanifest'));
 assert.equal(pkg.version,'9.0.0');
 assert(manifest.name.includes('v9.0'));
 assert(fromRoot('netlify/functions/health.mjs').includes("version:'9.0.0'"));
 assert(fromRoot('scripts/build.mjs').includes("version:'9.0.0'"));
});
test('Netlify sigue probando el código antes de publicar y verifica dist',()=>{
 const pkg=JSON.parse(fromRoot('package.json'));
 assert(pkg.scripts.build.includes('npm test'));
 assert(pkg.scripts.build.includes('check-v9-dist.mjs'));
 assert(fromRoot('scripts/check-deploy.mjs').includes('const must='));
});
test('v9 es archivo directo, no instalador ni reescritura de app.js',()=>{
 assert(!existsSync(new URL('../INSTALAR.py',import.meta.url)));
 assert(!existsSync(new URL('../app.js',import.meta.url)) || fromRoot('app.js').includes('GCP_DEMAND_FIRST_871'));
});
