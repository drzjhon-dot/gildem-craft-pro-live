import {access,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const must=['package.json','netlify.toml','index.html','app.js','styles.css',
'core/catalog.js','core/special-recipes.js','scripts/build.mjs',
'netlify/functions/health.mjs','netlify/functions/market.mjs',
'netlify/functions/recipes.mjs','netlify/functions/item-image.mjs',
'netlify/functions/hourly-prices.mjs','netlify/functions/snapshot.mjs'];
for(const path of must)await access(join(process.cwd(),path));
const pkg=JSON.parse(await readFile('package.json','utf8'));
assert.equal(pkg.version,'8.4.6');
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
