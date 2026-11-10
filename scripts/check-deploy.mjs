import {access,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const must=['package.json','netlify.toml','index.html','app.js','styles.css','sw.js','manifest.webmanifest',
'v9/ui-tables.js','v9/tables.css','v9/tier-sort.js','scripts/check-v9-dist.mjs',
'core/catalog.js','core/special-recipes.js','core/market-discovery.js','core/demand-first.js','core/market-proof.js','core/external-demand.js','core/royal-sale-markets.js','core/server-policy.js','core/west-ai-brief.js','core/procurement-liquidity.js','core/high-volume.js','core/bm-listing-prices.js','scripts/build.mjs',
'netlify/functions/health.mjs','netlify/functions/market.mjs','netlify/functions/recipes.mjs','netlify/functions/catalog.mjs','netlify/functions/item-image.mjs','netlify/functions/market-references.mjs','netlify/functions/hourly-prices.mjs','netlify/functions/snapshot.mjs'];
for(const path of must)await access(join(process.cwd(),path));
const pkg=JSON.parse(await readFile('package.json','utf8'));
assert.equal(pkg.version,'9.0.0','La distribución debe declarar la versión 9.0.0');
const [html,source,sw,builder,css,ui,theme]=await Promise.all(['index.html','app.js','sw.js','scripts/build.mjs','styles.css','v9/ui-tables.js','v9/tables.css'].map(f=>readFile(f,'utf8')));
assert.ok(html.includes('data-nav="resultados"')&&source.includes('function resultsPage(){'),'La pantalla Resultados no está completa');
assert.ok(source.includes('GCP_DEMAND_FIRST_871')&&source.includes('draftPlanForLedger'),'Motor por movimiento no instalado en app.js');
assert.ok(builder.includes('GCP_AO_DUMPS_GEAR_872'),'Falta la integración RAW de ao-bin-dumps');
await access('core/ao-gear-recipes.js');
assert.ok(source.includes('royalSaleCitiesHtml()')&&source.includes('selectedRoyalSaleCities()'),'Royal Craft debe permitir elegir destinos de venta');
assert.ok(css.includes('.gcp-results .gcp-market-audit')&&css.includes('.gcp-results .gcp-panel-budget'),'La página de Resultados perdió estilos base');
assert.ok(source.includes("qcControls('craft')")&&source.includes("qcControls('auto')"),'Faltan controles de Black/Royal');
assert.ok(!source.includes('researchPlanHtml(')&&source.includes('historicalBmListingTarget('),'Se restauró un flujo de investigación obsoleto');
assert.ok(source.includes('marketCoverageHtml(p)')&&source.includes('chosenDemandIds('),'Falta la exploración por demanda');
assert.ok(source.includes('evidenceForPlan(b,')&&source.includes('marketCoverage.historyObserved='),'Falta auditoría del mercado');
assert.ok(source.includes('pendingUnitsByMarket(loadPortfolios())')&&source.includes('intelligent:true'),'Falta gestión de inventario pendiente');
assert.ok(!source.includes('qc-reserve')&&source.includes('bulkMarketCandidates(')&&source.includes('materialDepthAssessment('),'Faltan filtros de volumen y suministro');
assert.ok(html.includes('v9.0')&&sw.includes('gildem-craft-pro-v9.0.0')&&html.includes('v9/ui-tables.js?v=9.0.0'),'Versión o carga de v9.0 incorrecta');
assert.ok(html.includes('v9/tables.css?v=9.0.0')&&theme.includes('.gcp-v9-table'),'No se instalaron tablas compactas v9.0');
assert.ok(ui.includes('compareTier')&&ui.includes('MutationObserver')&&ui.includes('.gcp-conditional-grid'),'El orden dinámico por tier no está integrado');
assert.ok(builder.includes("version:'"+pkg.version+"'")&&builder.includes("'v9'"),'v9 no se incluye en dist');
assert.ok(!source.includes('vanatoliyv.github.io')&&!html.includes('value="europe"'),'La app debe continuar usando West');
for(const file of ['core/results-view.js','core/market-references.js','core/market-volume.js','core/procurement-liquidity.js','assets/results-banner.webp','assets/results-sidebar.webp'])await access(file);
const health=await readFile('netlify/functions/health.mjs','utf8');
assert.ok(health.includes("version:'"+pkg.version+"'"),'Health no coincide con package.json');
assert.equal(pkg.dependencies['@netlify/blobs'],'11.1.7');
assert.equal(pkg.overrides['@netlify/otel'],'7.0.6');
const config=await readFile('netlify.toml','utf8');
assert.match(config,/command\s*=\s*"npm run build"/);
assert.match(config,/publish\s*=\s*"dist"/);
assert.match(config,/functions\s*=\s*"netlify\/functions"/);
assert.match(config,/GILDEM_PREFETCH_ICONS\s*=\s*"0"/);
console.log('PRECHECK v9.0 OK: interfaz por tier, motores, versión y Netlify consistentes.');
