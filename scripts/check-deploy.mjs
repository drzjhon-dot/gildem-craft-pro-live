import {access,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const must=['package.json','netlify.toml','index.html','app.js','styles.css',
'core/catalog.js','core/special-recipes.js','core/market-discovery.js','core/procurement-liquidity.js','scripts/build.mjs',
'netlify/functions/health.mjs','netlify/functions/market.mjs',
'netlify/functions/recipes.mjs','netlify/functions/item-image.mjs','netlify/functions/market-references.mjs',
'netlify/functions/hourly-prices.mjs','netlify/functions/snapshot.mjs'];
for(const path of must)await access(join(process.cwd(),path));
const pkg=JSON.parse(await readFile('package.json','utf8'));
assert.match(pkg.version,/^8\.5\.7$/,'La distribución debe declarar la versión 8.5.7');
// Prevent the regression that sent only test files to GitHub while keeping
// app.js/index.html on an older version. These checks run in every Netlify build.
const html=await readFile('index.html','utf8');
const source=await readFile('app.js','utf8');
const sw=await readFile('sw.js','utf8');
const builder=await readFile('scripts/build.mjs','utf8');
assert.ok(html.includes('data-nav="resultados"'),'La pestaña Resultados falta en index.html');
assert.ok(source.includes('function resultsPage(){'),'La pantalla Resultados falta en app.js');
assert.ok(source.includes("qcControls('craft')")&&source.includes("qcControls('auto')"),'Black/Royal no tienen controles compactos');
assert.ok(source.includes('marketCoverageHtml(p)')&&source.includes('marketAuditIds('),'Falta la exploración de mercados de la versión 8.5.7');
assert.ok(html.includes('v'+pkg.version)&&sw.includes('gildem-craft-pro-v'+pkg.version),'Versión incorrecta en HTML o caché del navegador');
assert.ok(builder.includes("version:'"+pkg.version+"'"),'Versión incorrecta en scripts/build.mjs');
for(const file of ['core/results-view.js','core/market-references.js','core/market-volume.js','core/procurement-liquidity.js','assets/results-banner.webp','assets/results-sidebar.webp'])await access(file);
const health=await readFile('netlify/functions/health.mjs','utf8');
assert.ok(health.includes("version:'"+pkg.version+"'"),'La función health tiene una versión distinta al package.json');
assert.equal(pkg.dependencies['@netlify/blobs'],'11.1.7');
assert.equal(pkg.overrides['@netlify/otel'],'7.0.6');
const config=await readFile('netlify.toml','utf8');
assert.match(config,/command\s*=\s*"npm run build"/);
assert.match(config,/publish\s*=\s*"dist"/);
assert.match(config,/functions\s*=\s*"netlify\/functions"/);
assert.match(config,/GILDEM_PREFETCH_ICONS\s*=\s*"0"/);
console.log('PRECHECK OK: repositorio completo, JSON válido, dependencias fijadas, Netlify listo.');
