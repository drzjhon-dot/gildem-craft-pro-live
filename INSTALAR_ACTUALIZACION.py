#!/usr/bin/env python3
"""Actualiza el proyecto COMPLETO Gildem Craft Pro a v8.5.5.

Acepta repositorios 8.5.2, 8.5.3, 8.5.4: para las dos primeras versiones
encadena el actualizador oficial del paquete 8.5.4 incluido en este archivo.
El paquete no es la web completa: conserva todo tu proyecto existente.
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

BASE=Path(__file__).resolve().parent
DEST=Path(sys.argv[1]).expanduser().resolve() if len(sys.argv)>1 else Path.cwd()


def replace_exact(source,old,new,label):
    count=source.count(old)
    if count!=1:raise RuntimeError(f'{label}: se esperaban 1 coincidencia, encontradas {count}. El proyecto quizás sea de otra versión.')
    return source.replace(old,new,1)


def patch_app(source):
    source=replace_exact(source,
        "import {groupProduction, groupSales, distributeProductionQuantity} from './core/production-view.js';",
        "import {resultsSummary, budgetGroups, shoppingWithCeilings, preflightOverview, shoppingListText} from './core/results-view.js';\nimport {groupProduction, groupSales, distributeProductionQuantity} from './core/production-view.js';",'importación de resultados')
    source=replace_exact(source,"const navNames={autocraft:'Royal Craft'","const navNames={resultados:'Resultados',autocraft:'Royal Craft'",'navegación')
    source=replace_exact(source,"const state={autoPlan:null,","const state={resultSource:'crafting',autoPlan:null,",'estado del plan')
    source=replace_exact(source,
        "state.page=page;document.querySelectorAll('[data-nav]').forEach",
        "state.page=page;document.body.classList.toggle('gcp-results-active',page==='resultados');document.querySelectorAll('[data-nav]').forEach",'aplicar tema al navegar')
    source=replace_exact(source,
        "function render(){if(state.page==='inicio')home();",
        "function render(){if(state.page==='resultados')resultsPage();if(state.page==='inicio')home();",'renderizado de Resultados')
    source=replace_exact(source,
        "function currentPlan(){return state.page==='autocraft'?state.autoPlan:state.plan;}",
        "function currentPlan(){return (state.page==='autocraft'||(state.page==='resultados'&&state.resultSource==='autocraft'))?state.autoPlan:state.plan;}",'seleccionar el plan activo')
    source=replace_exact(source,
        "function redrawCurrentPlan(){const p=currentPlan(),el=currentResultElement();if(p&&el)el.innerHTML=state.page==='autocraft'?autoResults(p):craftResult(p);}",
        "function redrawCurrentPlan(){if(state.page==='resultados'){resultsPage();return;}const p=currentPlan(),el=currentResultElement();if(p&&el)el.innerHTML=state.page==='autocraft'?autoResults(p):craftResult(p);}",
        'ediciones recalculables')
    anchor='function craftResult(p){'
    source=replace_exact(source,anchor,(BASE/'parts/results-page.jsfrag').read_text(encoding='utf-8')+'\n'+anchor,'insertar tab Resultados')
    source=replace_exact(source,
        "control('auto-results').innerHTML=autoResults(state.autoPlan);",
        "control('auto-results').innerHTML=autoResults(state.autoPlan);\n   if(plan.rows.length){state.resultSource='autocraft';changePage('resultados');}",'redireccionar Royal Craft')
    source=replace_exact(source,
        "\n  control('craft-results').innerHTML=craftResult(state.plan);\n  if(!plan.rows.length)",
        "\n  control('craft-results').innerHTML=craftResult(state.plan);\n  if(plan.rows.length){state.resultSource='crafting';changePage('resultados');}\n  if(!plan.rows.length)",
        'redireccionar Black Craft')
    source=replace_exact(source,
        "state.preflight=report;if(control('preflight-results'))control('preflight-results').innerHTML=preflightResult(report);",
        "state.preflight=report;if(state.page==='resultados')resultsPage();else if(control('preflight-results'))control('preflight-results').innerHTML=preflightResult(report);",
        'comprobación previa verificada')
    source=replace_exact(source,
        "function currentAction(force=false){",
        "function currentAction(force=false){if(state.page==='resultados'){if(!force)return;const source=state.resultSource==='autocraft'?'autocraft':'crafting';changePage(source);return source==='autocraft'?runAutoScan(true):runCraft(true);}",
        'actualizar desde Resultados')
    source=replace_exact(source,
        "if(action==='refresh-craft-now'){if(state.page==='autocraft')runAutoScan(true);else runCraft(true);}",
        "if(action==='refresh-craft-now'){const source=state.page==='resultados'?(state.resultSource==='autocraft'?'autocraft':'crafting'):state.page;if(state.page==='resultados')changePage(source);if(source==='autocraft')runAutoScan(true);else runCraft(true);}",
        'regenerar después de comprobación previa')
    source=replace_exact(source,
        'const action=btn.dataset.action;',
        """const action=btn.dataset.action;
 if(action==='results-source'){if(['crafting','autocraft'].includes(btn.dataset.source)){state.resultSource=btn.dataset.source;state.preflight=null;resultsPage();}return;}
 if(action==='results-edit'){changePage(state.resultSource==='autocraft'?'autocraft':'crafting');return;}
 if(action==='results-copy'){void resultsCopyShopping();return;}""",
        'acciones de Resultados')
    if 'gcp-results' not in source or 'itemCell(m.id)' not in source:
        raise RuntimeError('El dashboard no se integró correctamente')
    return source


def patch_index(content):
    old='<button data-nav="levelcraft" class="nav-item"'
    new='<button data-nav="resultados" class="nav-item"><span class="nav-glyph">▤</span><span>Resultados</span></button>\n       '+old
    return replace_exact(content,old,new,'tab Resultados en el menú')


def patch_sw(content):
    anchor="'./core/production-view.js',"
    return replace_exact(content,anchor,anchor+"'./core/results-view.js','./assets/results-banner.webp','./assets/results-sidebar.webp',",'recursos sin conexión')


def migrate_if_needed(version):
    if version not in ('8.5.2','8.5.3'):
        return
    nested=BASE/'compat/Gildem_Craft_Pro_v8_5_4_BLACK_ROYAL_COMPACTO.zip'
    if not nested.is_file():raise RuntimeError('No está incluida la actualización previa 8.5.4')
    with tempfile.TemporaryDirectory(prefix='gildem-compat-') as work:
        with zipfile.ZipFile(nested) as z:z.extractall(work)
        prior=Path(work)/'INSTALAR_ACTUALIZACION.py'
        if not prior.is_file():raise RuntimeError('Actualizador 8.5.4 incompleto')
        print('Primero instalando formularios compactos 8.5.4 sobre la versión '+version+'...')
        subprocess.run([sys.executable,str(prior),str(DEST)],check=True)


def main():
    required=['app.js','styles.css','index.html','package.json','sw.js','core/allocator-v6.js']
    if not all((DEST/file).is_file() for file in required):
        raise RuntimeError('Arrastra el directorio COMPLETO de Gildem Craft Pro con app.js, core/ y package.json.')
    package=DEST/'package.json'
    version=str(json.loads(package.read_text(encoding='utf-8')).get('version'))
    if version=='8.5.5':
        print('Gildem Craft Pro 8.5.5 ya parece instalado. No se sobrescribió nada.');return
    if version not in ('8.5.2','8.5.3','8.5.4'):
        raise RuntimeError(f'Versión no soportada ({version}). Se admiten las bases 8.5.2, 8.5.3 o 8.5.4.')
    migrate_if_needed(version)
    new_version=str(json.loads(package.read_text(encoding='utf-8')).get('version'))
    if new_version!='8.5.4':raise RuntimeError('No se pudo preparar la base 8.5.4')

    changes={}
    app=DEST/'app.js';changes[app]=patch_app(app.read_text(encoding='utf-8'))
    css=DEST/'styles.css';styles=css.read_text(encoding='utf-8')
    if 'Gildem Craft Pro v8.5.5' in styles:raise RuntimeError('Estilos 8.5.5 ya presentes: revisión manual requerida')
    changes[css]=styles+'\n'+(BASE/'parts/results.css').read_text(encoding='utf-8')
    index=DEST/'index.html';changes[index]=patch_index(index.read_text(encoding='utf-8'))
    sw=DEST/'sw.js';changes[sw]=patch_sw(sw.read_text(encoding='utf-8'))
    for rel in ['index.html','sw.js','manifest.webmanifest','scripts/build.mjs','netlify/functions/health.mjs']:
        f=DEST/rel
        if rel=='index.html':content=changes[f]
        elif rel=='sw.js':content=changes[f]
        else:content=f.read_text(encoding='utf-8')
        if rel=='scripts/build.mjs':
            content=replace_exact(content,"const folders=['core','icons'];","const folders=['core','icons','assets'];",'incluir imágenes decorativas en la compilación')
        if '8.5.4' not in content:
            raise RuntimeError(f'{rel} no contiene la versión 8.5.4 esperada')
        changes[f]=content.replace('8.5.4','8.5.5')
    spec=json.loads(package.read_text(encoding='utf-8'));spec['version']='8.5.5';changes[package]=json.dumps(spec,ensure_ascii=False,indent=2)+'\n'
    for rel in ['core/results-view.js','assets/results-banner.webp','assets/results-sidebar.webp','tests/v8_5_5-results.test.mjs','tests/v8_5_5-render.test.mjs']:
        src=BASE/rel
        if not src.is_file():raise RuntimeError(f'Falta {rel} en el ZIP')
        target=DEST/rel
        if target.exists():raise RuntimeError(f'Archivo nuevo {rel} ya existe, no se sobrescribió')
        changes[target]=src.read_bytes()

    # Respaldo previo de archivos editados. Se mantienen todos los datos locales del navegador.
    backup=DEST/'.gildem-respaldo-antes-v8.5.5'
    if backup.exists():raise RuntimeError('Ya hay un respaldo de una actualización 8.5.5. Revísalo antes de continuar.')
    backup.mkdir()
    for f in changes:
        if f.is_file():
            target=backup/f.relative_to(DEST)
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(f,target)
    for f,content in changes.items():
        f.parent.mkdir(parents=True,exist_ok=True)
        if isinstance(content,bytes):f.write_bytes(content)
        else:f.write_text(content,encoding='utf-8')
        print('Actualizado',f.relative_to(DEST))
    print('\nTab Resultados 8.5.5 instalada. Ejecuta: npm test && npm run build')
    print('Si ambos terminan bien, publica los cambios en GitHub para activar Netlify.')

if __name__=='__main__':
    try:main()
    except (OSError,ValueError,RuntimeError,subprocess.CalledProcessError,zipfile.BadZipFile) as error:
        raise SystemExit('No se pudo completar la actualización: '+str(error))
