#!/usr/bin/env python3
"""Actualiza Gildem Craft Pro v8.7.0 sin sobrescribir datos personales.

Uso: descomprime la actualización FUERA del repositorio. Luego:
    python INSTALAR_DEMANDA.py "C:\\ruta\\gildem-craft-pro-live"
O ejecuta desde la carpeta del repo:
    python "C:\\ruta\\actualizacion\\INSTALAR_DEMANDA.py" .
"""
from pathlib import Path
import shutil, sys, subprocess

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path.cwd().resolve()
PKG = Path(__file__).resolve().parent
APP = ROOT / 'app.js'
CORE = ROOT / 'core' / 'always-plan.js'
if not APP.is_file() or not CORE.is_file():
    raise SystemExit('ERROR: Ejecuta el instalador desde la carpeta que contiene app.js y core/.\n'
                     'O pasa la ruta a esa carpeta como argumento.')
old = APP.read_text(encoding='utf-8')
if 'GCP_DEMAND_FIRST_871' in old:
    raise SystemExit('La actualización 8.7.1 de demanda ya está instalada en este código.')
if 'function conditionalResultsContent(p){' not in old or 'function savePlanPortfolio(){' not in old:
    raise SystemExit('Versión de app.js no reconocida: no se modificó nada.')

source = old

def once(old_text, new_text, label):
    global source
    count=source.count(old_text)
    if count != 1:
        raise RuntimeError(f'Instalación cancelada: marcador {label} aparece {count} veces (se requiere 1).')
    source=source.replace(old_text,new_text,1)

def region(start,end,replacement,label):
    global source
    a=source.find(start)
    b=source.find(end,a+len(start)) if a>=0 else -1
    if a<0 or b<0:
        raise RuntimeError('Instalación cancelada: sección '+label+' no encontrada.')
    if source.find(start,a+1)>=0:
        raise RuntimeError('Instalación cancelada: marcador duplicado para '+label)
    source=source[:a]+replacement.rstrip()+'\n'+source[b:]

# Motor nuevo: lee historial y costes sin eliminar artículos con margen bajo.
module=(PKG/'core'/'always-plan.js').read_text(encoding='utf-8')
new_view=(PKG/'RESULTADOS_DEMANDA.jsfrag').read_text(encoding='utf-8')
once("import {prepareAlwaysPlan} from './core/always-plan.js';",
     "import {prepareAlwaysPlan,draftPlanForLedger} from './core/always-plan.js';",'import')
region('function conditionalResultsContent(p){','// Gildem Craft Pro v8.5.5',new_view,'vista de demanda')

# Construir el plan por actividad aun si el motor de ROI ya encontró otra ruta.
old_marker='const conditionalProposal=!plan.rows.length?conditionalProductionFor('
if source.count(old_marker)!=2:
    raise RuntimeError('Instalación cancelada: faltan las dos entradas de plan por demanda.')
for _ in range(2):
    idx=source.index(old_marker)
    close=source.find('):null;',idx)
    if close<0 or close-idx>1500:
        raise RuntimeError('Instalación cancelada: cierre de plan por demanda no localizado.')
    source=source[:idx]+'const conditionalProposal=conditionalProductionFor('+source[idx+len(old_marker):close]+');'+source[close+len('):null;'):]
# El coste bruto debe incluir tarifa y transporte; no solo materias primas.
once('    costTotal:cost?.total??null,referencePrice:q?.price??null,ageHours:q?.ageHours??null,',
     '    costTotal:cost?.total??null,stationCost:Number(input.station)||0,referencePrice:q?.price??null,ageHours:q?.ageHours??null,','tarifa de estación')

once('if(current?.conditionalProposal?.rows?.length&&!current.plan?.rows?.length){main.innerHTML=conditionalResultsContent(current);return;}',
     'if(current?.conditionalProposal?.rows?.length){main.innerHTML=conditionalResultsContent(current);return;}','resultado principal')
once('function craftResult(p){if(p?.conditionalProposal?.rows?.length&&!p?.plan?.rows?.length)return conditionalResultsContent(p);',
     'function craftResult(p){if(p?.conditionalProposal?.rows?.length)return conditionalResultsContent(p);','resultado secundario')

save = '''function savePlanPortfolio(){
 const active=currentPlan(),byDemand=!!active?.conditionalProposal?.rows?.length;
 const p=byDemand?draftPlanForLedger(active.conditionalProposal):active?.plan;
 if(!p?.rows?.length)return showToast('No hay rutas con coste Y precio observados para guardar. Se mantiene el plan visible; actualiza cotizaciones para registrar lotes.',true);
 const name=window.prompt('Nombre para esta inversión','Craft '+new Date().toLocaleDateString('es-ES'));
 if(name===null)return;
 const all=loadPortfolios();
 const deduction=procurementPlan(p.materials,loadInventory(),all);
 all.push({...createPortfolioFromPlan(p,String(name||'Plan de crafting').slice(0,70)),started:false,
  planMode:byDemand?'demand':'profit',priceStatus:byDemand?'provisional':'observado',
  planningWarning:byDemand?'Ruta elegida por actividad AODP; precio y margen no garantizados, puede incluir pérdidas.':'',
  inventoryAllocations:deduction.allocations,inventoryCredit:deduction.cashSaved,
  recipeSnapshot:recipeSnapshot(p.rows,recipes),recipeRevision:recipeCatalogStatus().sourceRevision||null,patchChanges:[]});
 if(writeLocal(K_LEDGER,all))showToast('Plan guardado en Mi negocio como pendiente. No se ha descontado silver.'+(byDemand?' Revisa la pérdida prevista y confirma costes.':''));
}
'''
region('function savePlanPortfolio(){','function appendPlanAlert(index)',save,'guardar plan')

# Advertencia explícita en Mi negocio si los resultados se seleccionaron por movimiento.
needle='  ${p.patchChanges?.length?`<div class="notice red">'
once(needle,'  ${p.planMode===\'demand\'?`<div class="notice amber">Plan creado por actividad observada: puede tener margen negativo. Guardarlo NO equivale a comprar. Confirma el coste real antes de marcar una compra.</div>`:\'\'}\n'+needle,'aviso en Mi negocio')

# El usuario marca la compra solo cuando ya la hizo; confirmación adicional.
once(' const inventory=consumeAllocations(loadInventory(),active?.inventoryAllocations||[]);',
     " if(active?.planMode==='demand'&&!confirm('Este plan se basó en actividad observada, no en un margen mínimo. Algunas rutas podrían tener pérdidas. ¿Confirmas que YA compraste los materiales y quieres descontar ese capital de Mi negocio?'))return;\n const inventory=consumeAllocations(loadInventory(),active?.inventoryAllocations||[]);",'confirmación de compra')

copy_handler=''' if(action==='copy-demand-shopping'){
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
   'Historial no equivale a ventas. Revisar precios y profundidad antes de comprar.',
   ...[...materials.values()].sort((a,b)=>a.city.localeCompare(b.city)||a.id.localeCompare(b.id))
    .map(m=>itemName(m.id)+' | '+m.city+' | '+Math.ceil(m.qty)+' uds. | '+(m.price===null?'Sin precio':Math.round(m.price)+' silver/u'))];
  if(!navigator.clipboard?.writeText){showToast('El navegador no permite copiar automáticamente.',true);return;}
  void navigator.clipboard.writeText(lines.join('\\n')).then(()=>showToast('Lista de compras copiada; revalida las cotizaciones.')).catch(()=>showToast('No fue posible copiar.',true));return;
 }
'''
once(" if(action==='results-copy'){void resultsCopyShopping();return;}",
     copy_handler+" if(action==='results-copy'){void resultsCopyShopping();return;}",'copiar compras')

# Mensajes finales: la selección visible es por rotación incluso cuando hay profit.
once("  showToast(plan.rows.length?`Encontradas ${plan.rows.length} rutas rentables.`:conditionalProposal?.rows?.length?'Plan condicionado listo: verificar precios antes de fabricar.':'Faltan recetas o precios para preparar un plan.',!plan.rows.length);",
     "  showToast(conditionalProposal?.rows?.length?`Plan por actividad: ${conditionalProposal.rows.length} objetos y ${conditionalProposal.units} unidades.`:plan.rows.length?`Encontradas ${plan.rows.length} rutas.`:'Faltan recetas o datos para preparar un plan.',!conditionalProposal?.rows?.length&&!plan.rows.length);",'aviso Royal')
once("  if(!plan.rows.length)showToast(conditionalProposal?.rows?.length?'Plan condicionado generado; verifica los precios antes de comprar o fabricar.':'No hay recetas suficientes para generar una propuesta. Amplía los filtros.',!conditionalProposal?.rows?.length);",
     "  if(conditionalProposal?.rows?.length)showToast('Plan por actividad: '+conditionalProposal.rows.length+' objetos, '+conditionalProposal.units+' unidades. Revisar pérdida o beneficio previsto.');\n  else if(!plan.rows.length)showToast('No hay recetas suficientes para generar una propuesta. Amplía los filtros.',true);",'aviso Black')

source='// GCP_DEMAND_FIRST_871: planificación por actividad con profit informativo.\n'+source
# No toca localStorage ni otros datos personales.
run_backup=ROOT.parent/(ROOT.name+'_backup_antes_demanda_8_7_1')
run_backup.mkdir(exist_ok=True)
shutil.copy2(APP,run_backup/'app.js')
shutil.copy2(CORE,run_backup/'always-plan.js')
try:
    APP.write_text(source,encoding='utf-8')
    CORE.write_text(module,encoding='utf-8')
    # Una actualización que no compila NO debe quedar instalada.
    node=shutil.which('node')
    if node:
        for path in (APP,CORE):
            check=subprocess.run([node,'--check',str(path)],cwd=ROOT,
                                 capture_output=True,text=True)
            if check.returncode:
                raise RuntimeError('Error de sintaxis en '+path.name+': '+check.stderr)
    # Pruebas adicionales (sin eliminar las anteriores).
    new_test=PKG/'tests'/'v8_7_1-demand-first.test.mjs'
    if new_test.is_file():
        (ROOT/'tests').mkdir(exist_ok=True)
        shutil.copy2(new_test,ROOT/'tests'/'v8_7_1-demand-first.test.mjs')
except Exception:
    shutil.copy2(run_backup/'app.js',APP)
    shutil.copy2(run_backup/'always-plan.js',CORE)
    raise
print('Actualización de demanda instalada en',ROOT)
print('Copia de seguridad:',run_backup)
print('Comprueba: node --check app.js  y  npm test')
print('Luego commit/push desde GitHub Desktop para que Netlify despliegue el cambio.')
