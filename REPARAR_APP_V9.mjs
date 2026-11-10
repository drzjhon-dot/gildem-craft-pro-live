// Un solo cambio atómico para conectar el motor existente con la interfaz v9.
// No instala dependencias, no ejecuta git y no publica en GitHub.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=resolve(process.argv[2]||process.cwd()),file=join(root,'app.js');
const enginePath=join(root,'core/always-plan.js');
if(!existsSync(enginePath)){console.error('Falta core/always-plan.js. Copia primero todos los archivos del ZIP.');process.exit(1);}
const engine=readFileSync(enginePath,'utf8');
if(!engine.includes('GCP_MIN_BATCH_901')){console.error('Falta copiar core/always-plan.js de esta actualización. No se modificó app.js.');process.exit(1);}
const instructions=JSON.parse(readFileSync(new URL('./actualizar/app-v9-operations.json',import.meta.url),'utf8'));
const originalBytes=readFileSync(file,'utf8');
const src=originalBytes.replace(/\r\n/g,'\n'); // Windows puede extraer archivos CRLF.
const sha=(content)=>{const bytes=Buffer.from(content,'utf8');return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');};
const actual=sha(src);
if(actual!==instructions.expectedSourceSha){
 if(['GCP_DEMAND_FIRST_871','draftPlanForLedger','PLAN POR ROTACIÓN · SIN FILTRO DE PROFIT MÍNIMO','data-action="copy-demand-shopping"','planMode:byDemand?'].every(x=>src.includes(x))&&!src.includes('<strong>No hay beneficio neto verificable actualmente.</strong>')){
  console.log('app.js ya contiene la integración. No se ha modificado.');process.exit(0);
 }
 console.error('DETENIDO SIN MODIFICAR NADA: app.js no coincide con la versión base verificada.');
 console.error('SHA actual:',actual,'| esperado:',instructions.expectedSourceSha);
 console.error('Sincroniza el repositorio desde GitHub Desktop; no combines archivos parcialmente.');
 process.exit(1);
}
let updated=src;
try{
 for(const [i,op] of instructions.ops.entries()){
  if(op.type==='replace'){
   const count=updated.split(op.old).length-1;
   if(count!==op.count)throw Error(`Cambio ${i+1}: se esperaban ${op.count} coincidencias, hay ${count}`);
   updated=updated.split(op.old).join(op.new);
  }else if(op.type==='region'){
   const start=updated.indexOf(op.start),end=updated.indexOf(op.end,start+op.start.length);
   if(start<0||end<0||updated.indexOf(op.start,start+1)>=0)throw Error(`Cambio ${i+1}: región incompatible`);
   updated=updated.slice(0,start)+op.new+'\n'+updated.slice(end);
  }else if(op.type==='prepend')updated=op.new+updated;
  else throw Error(`Operación ${i+1} desconocida`);
 }
 for(const needed of ['GCP_DEMAND_FIRST_871','draftPlanForLedger','PLAN POR ROTACIÓN · SIN FILTRO DE PROFIT MÍNIMO','planMode:byDemand?', 'data-action="copy-demand-shopping"']){
  if(!updated.includes(needed))throw Error('Integración incompleta: '+needed);
 }
 if(updated.includes('<strong>No hay beneficio neto verificable actualmente.</strong>'))throw Error('Aviso bloqueante todavía presente');
}catch(error){console.error('DETENIDO. app.js permanece intacto:',error.message);process.exit(1);}
const testFiles=['tests/v8_7_0-always-plan.test.mjs','tests/v8_7_1-demand-first.test.mjs','tests/v9_0_1-min-batch.test.mjs'];
for(const relative of testFiles){if(!existsSync(join(root,relative))){console.error('Falta '+relative+'. Copia todos los archivos antes de ejecutar.');process.exit(1);}}
const backup=resolve(dirname(root),'app_respaldo_antes_v9_movimiento.js');
writeFileSync(backup,originalBytes,'utf8');
writeFileSync(file,updated,'utf8');
const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
if(check.status!==0){writeFileSync(file,originalBytes,'utf8');console.error(check.stderr);console.error('Sintaxis fallida. app.js restaurado.');process.exit(1);}
for(const [name,args] of [['25 pruebas dirigidas',['--test',...testFiles]],['Preflight Netlify',['scripts/check-deploy.mjs']]]){
 const run=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
 if(run.status!==0){writeFileSync(file,originalBytes,'utf8');console.error('FALLO:',name,'\n',run.stdout,'\n',run.stderr);console.error('app.js restaurado. NO publiques.');process.exit(1);}
 console.log('OK:',name);
}
console.log('OK: app.js integrado con el motor por actividad y las listas de compras.');
console.log('Respaldo fuera del repositorio:',backup);
console.log('Siguiente paso: npm run build con Node.js 22; solo publica si todas las pruebas pasan.');
