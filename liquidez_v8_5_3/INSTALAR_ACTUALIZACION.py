#!/usr/bin/env python3
"""Aplica la actualización v8.5.3 al código COMPLETO de Gildem Craft Pro v8.5.2.
Ejemplo: python INSTALAR_ACTUALIZACION.py /ruta/al/repositorio
No conecta a Internet ni cambia archivos ajenos al proyecto.
"""
from pathlib import Path
import shutil, sys, json, re

SOURCE=Path(__file__).resolve().parent
DEST=Path(sys.argv[1]).expanduser().resolve() if len(sys.argv)>1 else Path.cwd()

def replace_once(text,old,new,label):
    found=text.count(old)
    if found!=1:
        raise RuntimeError(f'{label}: se esperó 1 coincidencia, hay {found}. Requiere v8.5.2.')
    return text.replace(old,new,1)

def update(path,callback):
    file=DEST/path
    if not file.exists(): raise FileNotFoundError(f'Falta {file}')
    original=file.read_text(encoding='utf-8')
    result=callback(original)
    file.write_text(result,encoding='utf-8')
    print('Actualizado',path)

if not (DEST/'app.js').is_file() or not (DEST/'core'/'allocator-v6.js').is_file():
    raise SystemExit('Indica la CARPETA EXTRAÍDA del proyecto completo (con app.js, core/, package.json).')
version=json.loads((DEST/'package.json').read_text(encoding='utf-8')).get('version')
if version!='8.5.2': raise SystemExit(f'Versión actual {version!r}. Esta actualización requiere exactamente 8.5.2.')

# Validar todas las sustituciones ANTES de modificar los archivos.
pending={}
def patch(path,callback):
    target=DEST/path
    if not target.exists(): raise FileNotFoundError(target)
    old=target.read_text(encoding='utf-8')
    pending[target]=callback(old)

def patch_allocator(s):
    s=replace_once(s,
        "import {routeProfitAtQuantity} from './depth.js';",
        "import {routeProfitAtQuantity} from './depth.js';\nimport {prudentListingCapacity,liquidityWeight} from './market-volume.js';",
        'import allocator')
    s=replace_once(s,
        "  const demand=Math.floor(Math.max(0,f(x.activity.observedDaily))*capFraction/Math.max(1,f(x.craftAmount,1)));",
        "  const demand=prudentListingCapacity(x,capFraction);",
        'volumen reciente allocator')
    s=replace_once(s,
        " const slippage=x.competition?.penalty??1;",
        " const slippage=(x.competition?.penalty??1)*liquidityWeight(x.activity,x.activity7);",
        'prioridad por actividad observada')
    return s
patch(Path('core/allocator-v6.js'),patch_allocator)

patch(Path('core/level-craft.js'),lambda s:replace_once(replace_once(s,
    "import {routeProfitAtQuantity} from './depth.js';",
    "import {routeProfitAtQuantity} from './depth.js';\nimport {prudentListingCapacity} from './market-volume.js';",
    'import level craft'),
    " const base=Math.floor(activity.observedDaily*capFraction/units);",
    " const base=prudentListingCapacity(route,capFraction)??0;",
    'volumen reciente level'))

# AODP item_count permite estimar dinero movilizado históricamente, no profundidad actual.
def patch_optimizer(s):
    s=replace_once(s," const byDay=new Map();let count=0;",
        " const byDay=new Map();let count=0,turnover=0;",'historial turnover')
    s=replace_once(s," const avg=Number(p.avg_price);if(avg>0)old.prices.push(avg);byDay.set(k,old);count+=n;}",
        " const avg=Number(p.avg_price);if(avg>0){old.prices.push(avg);turnover+=n*avg;}byDay.set(k,old);count+=n;}",
        'historial volumen por precio')
    s=replace_once(s,"  volatility:mean&&stdev!=null?stdev/mean:null,avgPrice:mean,",
        "  volatility:mean&&stdev!=null?stdev/mean:null,avgPrice:count>0&&turnover>0?turnover/count:mean,\n  observedTurnover:turnover,observedSilverDaily:turnover/days,",
        'historial precio ponderado')
    return s
patch(Path('core/optimizer.js'),patch_optimizer)

GUARD = '''// Rebalance plans against sampled raw-material turnover BEFORE showing the shopping list.
// AODP history is not live order depth; missing observations get a 1-craft cap.
async function guardMaterialPurchases(plan,region,force){
 if(!plan?.rows?.length||!plan.materials?.length)return {plan,warning:null};
 const important=[...plan.materials].sort((a,b)=>
  Number(b.qtyGross||0)*Number(b.unitPrice||0)-Number(a.qtyGross||0)*Number(a.unitPrice||0)).slice(0,35);
 const ids=[...new Set(important.map(m=>m.id).filter(Boolean))];
 let results=new Map(),warn=null;
 try{
  const response=await history(ids,region,force);
  const lookup=new Map();
  for(const r of response.rows||[]){if(Number(r.quality||1)!==1)continue;
   const k=r.item_id+'|'+(r.location||r.city),arr=lookup.get(k)||[];
   arr.push(...(r.data||[]));lookup.set(k,arr);
  }
  for(const m of important){const k=m.id+'|'+m.city,series=lookup.get(k)||[];
   results.set(k,{d14:historyMetrics(series,14),d7:historyMetrics(series,7)});
  }
  if(response.warning)warn='Historial de materiales posiblemente desactualizado: '+response.warning;
 }catch(e){warn='No se pudo consultar la rotación de los recursos: '+e.message;}
 const screened=limitRowsByMaterialVolume(plan.rows,results,{fraction:.08,unknownCraftCap:1});
 const constrained=screened.changed.length>0?fitPlan(screened.rows,plan.capital,plan.focusLimit):plan;
 const details=[];
 if(screened.changed.length)details.push(screened.changed.length+' rutas reducidas para no concentrar compras de recursos crudos');
 if(screened.unverified.length)details.push(screened.unverified.length+' materiales sin suficiente historial: máximo 1 craft provisional por ruta afectada');
 if(screened.priceAlerts.length)details.push(screened.priceAlerts.length+' materiales cuestan al menos 20% más que su mediana histórica: máximo 1 craft provisional');
 details.push('Topes basados en el 8% de la rotación diaria observada, NO en stock actual ni profundidad del libro; confirma precios y cantidades en el juego');
 return {plan:constrained,warning:[warn,...details].filter(Boolean).join(' · '),liquidity:screened};
}

'''

def patch_app(s):
    s=replace_once(s,
       "import {checkMaterialSupply} from './core/material-supply.js';",
       "import {checkMaterialSupply} from './core/material-supply.js';\nimport {limitRowsByMaterialVolume} from './core/procurement-liquidity.js';\nimport {volumeTrend} from './core/market-volume.js';",
       'imports app')
    s=replace_once(s,"function craftResult(p){",GUARD+"function craftResult(p){",'helper precaución app')
    s=replace_once(s,
      "    for(const r of routes)r.activity=historyMetrics(by.get(r.id+'|'+r.city)||[],14);",
      "    for(const r of routes){const data=by.get(r.id+'|'+r.city)||[];r.activity=historyMetrics(data,14);r.activity7=historyMetrics(data,7);}",
      'level historial 7 días')
    s=replace_once(s,
      "  const plan=fitPlan(allocation.rows,budget,focus?Number(craftPrefs.focusBudget||10000):null);\n  let supplyNote='';",
      "  let plan=fitPlan(allocation.rows,budget,focus?Number(craftPrefs.focusBudget||10000):null);\n  const purchasing=await guardMaterialPurchases(plan,prefs.region,force);\n   plan=purchasing.plan;\n   let supplyNote=purchasing.warning||'';",
      'Royal/Auto precaución compras')
    s=replace_once(s,
      "  const plan=fitPlan(draft.rows,input.budget,input.focus||input.refiningFocus?input.focusBudget:null);\n  const source=",
      "  let plan=fitPlan(draft.rows,input.budget,input.focus||input.refiningFocus?input.focusBudget:null);\n  const purchasing=await guardMaterialPurchases(plan,prefs.region,force);\n   plan=purchasing.plan;\n   const source=",
      'Black Craft precaución compras')
    s=replace_once(s,"  const warnings=[warning,viable.rejected.length?",
      "  const warnings=[warning,purchasing.warning,viable.rejected.length?",'Black advertencias compras')
    s=replace_once(s,
      "  const gap=Number.isFinite(s.spreadPercent)?s.spreadPercent.toFixed(0)+'%':'No comparable';",
      "  const gap=Number.isFinite(s.spreadPercent)?s.spreadPercent.toFixed(0)+'%':'No comparable';\n  const movement=volumeTrend(r.activity,r.activity7);\n  const sales14=activity.observations?short(activity.observedDaily):'Sin datos';\n  const sales7=r.activity7?.observations?short(r.activity7.observedDaily):'Sin datos';\n  const silver14=activity.observations?short(activity.observedSilverDaily):'Sin datos';",
      'auditoría actividad histórica')
    s=replace_once(s,"<td>${historical}</td><td>${h(gap)}</td><td>${h(seen)}</td></tr>`;",
      "<td>${historical}</td><td>${sales7} / ${sales14}</td><td>${silver14}</td><td>${h(movement)}</td><td>${h(gap)}</td><td>${h(seen)}</td></tr>`;",
      'tabla histórica 7d 14d')
    s=replace_once(s,"<th>Referencia 14 días</th><th>Spread</th>",
      "<th>Referencia 14 días</th><th>Volumen observado 7d / 14d por día</th><th>Silver histórico diario 14d</th><th>Tendencia</th><th>Spread</th>",
      'cabeceras análisis mercado')
    return s
patch(Path('app.js'),patch_app)

def patch_package(s):
    p=json.loads(s)
    p['version']='8.5.3'
    return json.dumps(p,ensure_ascii=False,indent=2)+'\n'
patch(Path('package.json'),patch_package)
for asset in ['index.html','sw.js','scripts/build.mjs','netlify/functions/health.mjs','manifest.webmanifest']:
    patch(Path(asset),lambda s: s.replace('8.5.2','8.5.3'))
# Make new modules available offline after the Service Worker updates.
p=DEST/'sw.js'
s=pending[p]
s=replace_once(s,"'./core/material-supply.js',",
    "'./core/material-supply.js','./core/market-volume.js','./core/procurement-liquidity.js',",'precache nuevos motores')
pending[p]=s

# Do not touch repository if any anchor is absent: all checks have passed.
for file,content in pending.items():file.write_text(content,encoding='utf-8');print('Actualizado',file.relative_to(DEST))
for relative in ['core/market-volume.js','core/procurement-liquidity.js','tests/v8_5_3-liquidity.test.mjs']:
    dst=DEST/relative
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(SOURCE/relative,dst)
    print('Añadido',relative)
print('Completado v8.5.3. Ejecuta: npm test && npm run build')
