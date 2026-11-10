import {mkdir,cp,rm,readFile,writeFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
const root=new URL('../',import.meta.url);
const dist=new URL('../dist/',import.meta.url);
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
for(const [name,ok] of [
 ['HTML scripts',html.includes('src/app.mjs')],['Versión HTML',html.includes(pkg.version)],
 ['Versión Service Worker',sw.includes(`gildem-nova-${pkg.version}`)],
 ['Funciones Netlify',await stat(new URL('../netlify/functions/market.mjs',import.meta.url)).then(()=>true)]
])if(!ok)throw Error('INTEGRIDAD: '+name);
await rm(dist,{recursive:true,force:true}); await mkdir(dist,{recursive:true});
for(const file of ['index.html','styles.css','sw.js','manifest.webmanifest'])await cp(new URL('../'+file,import.meta.url),new URL('../dist/'+file,import.meta.url));
for(const folder of ['src','assets'])await cp(new URL('../'+folder,import.meta.url),new URL('../dist/'+folder,import.meta.url),{recursive:true});
await writeFile(new URL('../dist/version.json',import.meta.url),JSON.stringify({version:pkg.version,source:'Gildem Craft Pro NOVA',builtAt:new Date().toISOString()},null,2));
for(const file of ['index.html','styles.css','src/app.mjs','src/engine.mjs','src/catalog.mjs','src/market.mjs','src/ui.mjs','src/store.mjs','assets/crest.svg'])await stat(new URL('../dist/'+file,import.meta.url));
console.log(`BUILD OK · Gildem Craft Pro ${pkg.version} · sitio completo en dist/`);
