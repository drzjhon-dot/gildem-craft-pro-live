#!/usr/bin/env python3
"""Repara integración demanda + ao-bin-dumps en Gildem Craft Pro.

Para evitar otro despliegue fallido: NO deja cambios parciales. Solo finaliza
si sintaxis, TODOS los tests actuales y el build pasan en la copia local.
"""
from pathlib import Path
import os
import shutil
import subprocess
import sys
import tempfile
import datetime

HERE = Path(__file__).resolve().parent
ROOT = Path(sys.argv[1] if len(sys.argv)>1 else '.').expanduser().resolve()
CHECKS = [ROOT/'app.js', ROOT/'core/always-plan.js', ROOT/'scripts/build.mjs',
          ROOT/'scripts/check-deploy.mjs', ROOT/'package.json', ROOT/'tests', ROOT/'index.html']
for path in CHECKS:
    if not path.exists():
        raise SystemExit(f'ERROR: La ruta no es el repositorio completo de Gildem Craft Pro. Falta: {path}')
for tool in ('node', 'npm'):
    if not shutil.which(tool):
        raise SystemExit(f'ERROR: Falta {tool}. Instala Node.js 22 y ejecuta de nuevo. No se modificó nada.')

app = (ROOT/'app.js').read_text(encoding='utf-8')
builder = (ROOT/'scripts/build.mjs').read_text(encoding='utf-8')
check_deploy = (ROOT/'scripts/check-deploy.mjs').read_text(encoding='utf-8')

# El fallo de Netlify provenía de agregar tests ANTES de actualizar app.js.
# Si la prueba 8.7.1 ya existe, se conserva/reemplaza junto con su implementación.
if 'GCP_DEMAND_FIRST_871' not in app:
    if "import {prepareAlwaysPlan} from './core/always-plan.js';" not in app:
        raise SystemExit('ERROR: app.js no coincide con v8.7.0; no se alteró el repositorio.')
    if app.count('const conditionalProposal=!plan.rows.length?conditionalProductionFor(')!=2:
        raise SystemExit('ERROR: la estructura de ambos motores cambió; no se alteró el repositorio.')

def once(text, needle, replacement, label):
    occurrences=text.count(needle)
    if occurrences!=1:
        raise ValueError(f'{label}: esperado 1 marcador; encontrados {occurrences}. Sin cambios.')
    return text.replace(needle,replacement,1)

def region(text, start, end, replacement, label):
    a=text.find(start)
    b=text.find(end,a+len(start)) if a>=0 else -1
    if a<0 or b<0 or text.find(start,a+1)>=0:
        raise ValueError(f'{label}: la estructura del proyecto ya cambió. Sin cambios.')
    return text[:a]+replacement.rstrip()+'\n'+text[b:]

if 'GCP_DEMAND_FIRST_871' not in app:
    app=once(app,"import {prepareAlwaysPlan} from './core/always-plan.js';",
        "import {prepareAlwaysPlan,draftPlanForLedger} from './core/always-plan.js';",'importar motor por demanda')
    view=(HERE/'RESULTADOS_DEMANDA.jsfrag').read_text(encoding='utf-8')
    app=region(app,'function conditionalResultsContent(p){','// Gildem Craft Pro v8.5.5',view,'vista única de Resultados')
    token='const conditionalProposal=!plan.rows.length?conditionalProductionFor('
    for _ in range(2):
        idx=app.index(token)
        ending=app.find('):null;',idx)
        if ending<0 or ending-idx>1700:
            raise ValueError('No pudo localizarse el final de la ruta por demanda. Sin cambios.')
        app=app[:idx]+'const conditionalProposal=conditionalProductionFor('+app[idx+len(token):ending]+');'+app[ending+len('):null;'):]
    # Considerar los lotes todavía pendientes en Mi negocio para no saturar
    # el mismo mercado al generar un nuevo plan.
    app=once(app," const options=[];\n for(const id of ids||[]){",
        " const options=[];\n const pendingMarket=pendingUnitsByMarket(loadPortfolios());\n for(const id of ids||[]){",'inventario pendiente')
    app=once(app,'    taxRate,setupRate,weeklyObserved:weekly,transportCost:',
        '    taxRate,setupRate,weeklyObserved:weekly,pendingMarketUnits:pendingMarket.get(id+\'|\'+saleCity)||0,transportCost:',
        'capacidad de mercado neta')
    app=once(app,' return prepareAlwaysPlan(options,{budget,horizonDays,maxItems:14});',
        ' return prepareAlwaysPlan(options.map(o=>({...o,pendingMarketUnits:o.pendingMarketUnits??pendingMarket.get(o.id+\'|\'+o.city)??0})),{budget,horizonDays,maxItems:14});',
        'inventario pendiente también en refinado')
    app=once(app,'    costTotal:cost?.total??null,referencePrice:q?.price??null,ageHours:q?.ageHours??null,',
        '    costTotal:cost?.total??null,stationCost:Number(input.station)||0,referencePrice:q?.price??null,ageHours:q?.ageHours??null,','cargo del taller')
    app=once(app,'if(current?.conditionalProposal?.rows?.length&&!current.plan?.rows?.length){main.innerHTML=conditionalResultsContent(current);return;}',
        'if(current?.conditionalProposal?.rows?.length){main.innerHTML=conditionalResultsContent(current);return;}','resultado principal')
    app=once(app,'function craftResult(p){if(p?.conditionalProposal?.rows?.length&&!p?.plan?.rows?.length)return conditionalResultsContent(p);',
        'function craftResult(p){if(p?.conditionalProposal?.rows?.length)return conditionalResultsContent(p);','resultado auxiliar')
    save='''function savePlanPortfolio(){
 const active=currentPlan(),byDemand=!!active?.conditionalProposal?.rows?.length;
 const p=byDemand?draftPlanForLedger(active.conditionalProposal):active?.plan;
 if(!p?.rows?.length)return showToast('No hay rutas con costo y precio observados para guardar. Actualiza las cotizaciones.',true);
 const name=window.prompt('Nombre para esta inversión','Craft '+new Date().toLocaleDateString('es-ES'));
 if(name===null)return;
 const all=loadPortfolios();
 const deduction=procurementPlan(p.materials,loadInventory(),all);
 all.push({...createPortfolioFromPlan(p,String(name||'Plan de crafting').slice(0,70)),started:false,
  planMode:byDemand?'demand':'profit',priceStatus:byDemand?'provisional':'observado',
  planningWarning:byDemand?'Ruta elegida por actividad AODP; puede incluir pérdidas.':'',
  inventoryAllocations:deduction.allocations,inventoryCredit:deduction.cashSaved,
  recipeSnapshot:recipeSnapshot(p.rows,recipes),recipeRevision:recipeCatalogStatus().sourceRevision||null,patchChanges:[]});
 if(writeLocal(K_LEDGER,all))showToast('Plan guardado como pendiente. No se ha descontado silver.');
}
'''
    app=region(app,'function savePlanPortfolio(){','function appendPlanAlert(index)',save,'Mi negocio')
    needle='  ${p.patchChanges?.length?`<div class="notice red">'
    app=once(app,needle,'''  ${p.planMode==='demand'?`<div class="notice amber">Plan por actividad: el beneficio previsto puede ser negativo. Guardar el plan no es comprar materiales. Comprueba los precios reales antes de iniciar.</div>`:''}
'''+needle,'cartel de riesgos')
    app=once(app,' const inventory=consumeAllocations(loadInventory(),active?.inventoryAllocations||[]);',
        " if(active?.planMode==='demand'&&!confirm('Esta cartera se creó por actividad de mercado y podría ocasionar pérdidas. ¿Confirmas que YA pagaste los materiales y quieres descontar el capital?'))return;\n const inventory=consumeAllocations(loadInventory(),active?.inventoryAllocations||[]);",'confirmación de silver')
    handler=''' if(action==='copy-demand-shopping'){
  const rows=currentPlan()?.conditionalProposal?.rows||[],materials=new Map();
  for(const row of rows)for(const m of row.materials||[]){
   if(!(m.id&&Number(m.count)>0))continue;
   const city=m.city||row.craftCity,k=m.id+'|'+city;
   const old=materials.get(k)||{id:m.id,city,qty:0,price:null};
   old.qty+=Number(m.count)*row.qty;
   if(Number(m.unitPrice)>0)old.price=Number(m.unitPrice);
   materials.set(k,old);
  }
  const lines=['GILDEM CRAFT PRO | COMPRAS POR ACTIVIDAD OBSERVADA',
   'Actividad no significa ventas realizadas. Revisar profundidad de compras.',
   ...[...materials.values()].sort((a,b)=>a.city.localeCompare(b.city)||a.id.localeCompare(b.id))
    .map(m=>itemName(m.id)+' | '+m.city+' | '+Math.ceil(m.qty)+' uds. | '+(m.price===null?'Sin precio':Math.round(m.price)+' silver/u'))];
  if(!navigator.clipboard?.writeText){showToast('El navegador no permite copiar automáticamente.',true);return;}
  void navigator.clipboard.writeText(lines.join('\\n')).then(()=>showToast('Compras copiadas. Revalida las ofertas.')).catch(()=>showToast('No se pudo copiar.',true));return;
 }
'''
    app=once(app," if(action==='results-copy'){void resultsCopyShopping();return;}",
        handler+" if(action==='results-copy'){void resultsCopyShopping();return;}",'botón copiar')
    app=once(app,"  showToast(plan.rows.length?`Encontradas ${plan.rows.length} rutas rentables.`:conditionalProposal?.rows?.length?'Plan condicionado listo: verificar precios antes de fabricar.':'Faltan recetas o precios para preparar un plan.',!plan.rows.length);",
        "  showToast(conditionalProposal?.rows?.length?`Plan por movimiento: ${conditionalProposal.rows.length} objetos.`:plan.rows.length?`Encontradas ${plan.rows.length} rutas.`:'Faltan recetas o datos.',!conditionalProposal?.rows?.length&&!plan.rows.length);",'notificación Royal')
    app=once(app,"  if(!plan.rows.length)showToast(conditionalProposal?.rows?.length?'Plan condicionado generado; verifica los precios antes de comprar o fabricar.':'No hay recetas suficientes para generar una propuesta. Amplía los filtros.',!conditionalProposal?.rows?.length);",
        "  if(conditionalProposal?.rows?.length)showToast('Plan por movimiento: '+conditionalProposal.rows.length+' objetos y '+conditionalProposal.units+' unidades.');\n  else if(!plan.rows.length)showToast('Faltan recetas o datos para generar el plan.',true);",'notificación Black')
    app='// GCP_DEMAND_FIRST_871: el movimiento determina qué se fabrica; beneficio informativo.\n'+app
else:
    # Protección contra un proyecto que declare el marcador pero no implemente la vista.
    for required in ('draftPlanForLedger','PLAN POR ROTACIÓN · SIN FILTRO DE PROFIT MÍNIMO','planMode:byDemand?',
                     'data-action="copy-demand-shopping"'):
        if required not in app:
            raise SystemExit('ERROR: marcador 8.7.1 presente, pero implementación incompleta: '+required)

# Extraer recetas directas desde RAW ao-bin-dumps durante Netlify build.
# Si ao-data/CDN no responde, el build usa el catálogo anterior y LO DECLARA.
if 'GCP_AO_DUMPS_GEAR_872' not in builder:
    new_block='''// GCP_AO_DUMPS_GEAR_872: sincroniza recetas de equipo a partir del RAW
// ao-data/ao-bin-dumps/items.json, separado de precios/actividad de AODP.
const prefetchCatalog=!!process.env.NETLIFY&&process.env.GILDEM_PREFETCH_CATALOG!=='0';
const catalogStored=[];
if(prefetchCatalog){
 const sources=['https://raw.githubusercontent.com/vkorne-web/albion-market/main/',
  'https://cdn.jsdelivr.net/gh/vkorne-web/albion-market@main/'];
 const fetchJson=async file=>{
  for(const origin of sources)try{
   const res=await fetch(origin+file,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(9500)});
   if(!res.ok)continue;
   const raw=await res.text();
   if(raw.length<1000||raw.length>10_000_000)continue;
   const data=JSON.parse(raw);
   if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).length<100)continue;
   return data;
  }catch{}
  return null;
 };
 const legacy=await Promise.all(['names_es.json','recipes.json'].map(fetchJson));
 if(legacy[0]){
  await mkdir(join(OUTPUT,'catalog'),{recursive:true});
  await writeFile(join(OUTPUT,'catalog/names_es.json'),JSON.stringify(legacy[0]));
  catalogStored.push('names_es.json');
 }
 let recipes=legacy[1];
 const info={source:recipes?'vkorne-web/albion-market (respaldo)':'no disponible',
  raw:'ao-data/ao-bin-dumps/master/items.json',fetchedAt:new Date().toISOString(),
  direct:0,retired:0,legacyFallback:recipes?Object.keys(recipes).length:0};
 if(process.env.GILDEM_DIRECT_BIN_DUMPS!=='0'){
  const dumps=['https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json',
   'https://cdn.jsdelivr.net/gh/ao-data/ao-bin-dumps@master/items.json'];
  for(const url of dumps){
   try{
    const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(22000)});
    if(!response.ok)throw Error('HTTP '+response.status);
    const raw=await response.json();
    const merged=overlayGearRecipes(recipes||{},raw);
    if(merged.statistics.direct<300)throw Error('Menos de 300 recetas de equipo verificables');
    recipes=merged.recipes;
    Object.assign(info,{source:url,direct:merged.statistics.direct,retired:merged.statistics.retired,
     legacyFallback:merged.statistics.legacyFallback,unknownCity:merged.statistics.unknownCity});
    break;
   }catch(e){console.warn('ao-bin-dumps no disponible en build; se mantendrá catálogo de respaldo:',String(e.message||e));}
  }
 }
 if(recipes&&Object.keys(recipes).length>100){
  await mkdir(join(OUTPUT,'catalog'),{recursive:true});
  await writeFile(join(OUTPUT,'catalog/recipes.json'),JSON.stringify(recipes));
  catalogStored.push('recipes.json');
 }
 if(catalogStored.length){
  await writeFile(join(OUTPUT,'catalog/ao-bin-source.json'),JSON.stringify(info,null,2)+'\\n');
  console.log('Catálogo crafting:',JSON.stringify(info));
 }
}
'''
    builder=region(builder,'const prefetchCatalog=!!process.env.NETLIFY','await writeFile(join(OUTPUT,\'version.json\')',new_block,'prefetch del catálogo')
    builder=once(builder,"import {imageUpstreams} from '../netlify/functions/item-image.mjs';",
        "import {imageUpstreams} from '../netlify/functions/item-image.mjs';\nimport {overlayGearRecipes} from '../core/ao-gear-recipes.js';",'importar conversor de bin dumps')

if 'GCP_AO_DUMPS_GEAR_872' not in check_deploy:
    check_deploy=once(check_deploy,"assert.ok(source.includes('function resultsPage(){'),'La pantalla Resultados falta en app.js');",
      "assert.ok(source.includes('function resultsPage(){'),'La pantalla Resultados falta en app.js');\n"+
      "// GCP_AO_DUMPS_GEAR_872: no permitir tests de demanda sin implementación.\n"+
      "assert.ok(source.includes('GCP_DEMAND_FIRST_871')&&source.includes('draftPlanForLedger'),'Motor por movimiento no instalado en app.js');\n"+
      "assert.ok(builder.includes('GCP_AO_DUMPS_GEAR_872'),'Falta integración del catálogo RAW ao-bin-dumps');\n"+
      "await access('core/ao-gear-recipes.js');",'preflight obligatorio de demanda y catálogo')

# Tests and implementation arrive together. Existing broken test remains fixed;
# using same paths avoids duplicate tests or deploy state ambiguity.
payload={
 ROOT/'app.js':app,
 ROOT/'core/always-plan.js':(HERE/'core/always-plan.js').read_text(encoding='utf-8'),
 ROOT/'core/ao-gear-recipes.js':(HERE/'core/ao-gear-recipes.js').read_text(encoding='utf-8'),
 ROOT/'scripts/build.mjs':builder,
 ROOT/'scripts/check-deploy.mjs':check_deploy,
 ROOT/'tests/v8_7_1-demand-first.test.mjs':(HERE/'tests/v8_7_1-demand-first.test.mjs').read_text(encoding='utf-8'),
 ROOT/'tests/v8_7_2-ao-bin-dumps.test.mjs':(HERE/'tests/v8_7_2-ao-bin-dumps.test.mjs').read_text(encoding='utf-8')
}
if '<strong>No hay beneficio neto verificable actualmente.</strong>' in payload[ROOT/'app.js']:
    raise SystemExit('ERROR: el mensaje bloqueante sigue presente en app.js. No se modificó nada.')

log=[]
backup_root=ROOT.parent/(ROOT.name+'_backup_revision_'+datetime.datetime.now().strftime('%Y%m%d_%H%M%S'))
backup_root.mkdir(exist_ok=False)
preexisting={}
for path in payload:
    preexisting[path]=path.exists()
    if preexisting[path]:
        relative=path.relative_to(ROOT)
        target=backup_root/relative
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(path,target)

def restore():
    for path in payload:
        if preexisting[path]:shutil.copy2(backup_root/path.relative_to(ROOT),path)
        elif path.exists():path.unlink()

def execute(name,command,env=None):
    p=subprocess.run(command,cwd=ROOT,capture_output=True,text=True,env=env)
    log.append('===== '+name+' =====\n'+p.stdout+'\n'+p.stderr)
    if p.returncode:
        tail='\n'.join((p.stdout+'\n'+p.stderr).splitlines()[-45:])
        raise RuntimeError(name+' falló (exit '+str(p.returncode)+'):\n'+tail)
    print('OK:',name)

try:
    for path,contents in payload.items():
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(contents,encoding='utf-8')
    for path in [ROOT/'app.js',ROOT/'core/always-plan.js',ROOT/'core/ao-gear-recipes.js',ROOT/'scripts/build.mjs',ROOT/'scripts/check-deploy.mjs']:
        execute('Sintaxis '+str(path.relative_to(ROOT)),['node','--check',str(path)])
    execute('Preflight Netlify',['node','scripts/check-deploy.mjs'])
    execute('Todas las pruebas',['npm','test'])
    build_env=os.environ.copy()
    build_env.pop('NETLIFY',None) # build reproducible sin descarga externa durante la instalación
    build_env['GILDEM_PREFETCH_ICONS']='0'
    build_env['GILDEM_PREFETCH_CATALOG']='0'
    execute('Build completo, sin dependencias de red',['npm','run','build'],build_env)
except Exception as error:
    restore()
    print('ERROR:',error,file=sys.stderr)
    print('Se restauraron TODOS los archivos modificados. Respaldo en:',backup_root,file=sys.stderr)
    print('No hagas commit ni push. Corrige el error indicado y vuelve a ejecutar.',file=sys.stderr)
    (backup_root/'revision-log.txt').write_text('\n\n'.join(log)+'\nERROR: '+str(error),encoding='utf-8')
    sys.exit(1)
(backup_root/'revision-log.txt').write_text('\n\n'.join(log)+'\nSTATUS: OK\n',encoding='utf-8')
print('\nREVISIÓN OK. Todos los tests y el build local pasaron.')
print('Repositorio:',ROOT)
print('Respaldo:',backup_root)
print('Ahora sí puedes hacer commit de TODOS los archivos cambiados y push a GitHub Desktop.')
print('Netlify puede volver a compilar, ahora sin la prueba 306 huérfana.')
