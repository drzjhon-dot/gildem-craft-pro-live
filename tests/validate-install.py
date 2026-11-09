"""Ejecútese desde el ZIP para verificar instalación sobre una estructura 8.5.4 de prueba."""
from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess,sys,json
BASE=Path(__file__).resolve().parent.parent

app="""import {groupProduction, groupSales, distributeProductionQuantity} from './core/production-view.js';
const navNames={autocraft:'Royal Craft',crafting:'Black Craft'};
const state={autoPlan:null,plan:null,preflight:null,page:'crafting'};
function changePage(page){if(page!==state.page)state.preflight=null;state.page=page;document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===page));render();}
function render(){if(state.page==='inicio')home();}
function currentPlan(){return state.page==='autocraft'?state.autoPlan:state.plan;}
function currentResultElement(){return control(state.page==='autocraft'?'auto-results':'craft-results');}
function redrawCurrentPlan(){const p=currentPlan(),el=currentResultElement();if(p&&el)el.innerHTML=state.page==='autocraft'?autoResults(p):craftResult(p);}
function autoResults(){}
function runAutoScan(){const plan={rows:[{id:'T4_AXE'}]}; control('auto-results').innerHTML=autoResults(state.autoPlan);}
function runCraft(){const plan={rows:[{id:'T4_AXE'}]};
  control('craft-results').innerHTML=craftResult(state.plan);
  if(!plan.rows.length)showToast('sin plan');}
function craftResult(p){return p;}
function preflightResult(report){return report;}
function runPreflight(){const report={ok:true};state.preflight=report;if(control('preflight-results'))control('preflight-results').innerHTML=preflightResult(report);}
function currentAction(force=false){showToast('Selecciona una herramienta y ejecuta tu primera consulta.');}
function events(){const btn={dataset:{action:'foo'}};const action=btn.dataset.action;
if(action==='refresh-craft-now'){if(state.page==='autocraft')runAutoScan(true);else runCraft(true);}
}
"""

def make_fixture(root):
 for parent in ['core','scripts','netlify/functions']:(root/parent).mkdir(parents=True,exist_ok=True)
 (root/'app.js').write_text(app)
 (root/'core/allocator-v6.js').write_text('//test')
 (root/'styles.css').write_text('/* original */')
 (root/'index.html').write_text('''<title>Gildem v8.5.4</title><button data-nav="levelcraft" class="nav-item">Level</button>''')
 (root/'sw.js').write_text('''const VERSION="8.5.4";const SHELL=['./core/production-view.js',];''')
 (root/'manifest.webmanifest').write_text('''{"name":"Gildem v8.5.4"}''')
 (root/'scripts/build.mjs').write_text("""const folders=['core','icons']; // 8.5.4""")
 (root/'netlify/functions/health.mjs').write_text('''// 8.5.4''')
 (root/'package.json').write_text(json.dumps({'name':'gildem-test','type':'module','version':'8.5.4','scripts':{'test':'node --test tests/*.test.mjs'}}))

with TemporaryDirectory() as d:
 root=Path(d);make_fixture(root)
 subprocess.run([sys.executable,str(BASE/'INSTALAR_ACTUALIZACION.py'),str(root)],check=True)
 subprocess.run(['node','--check',str(root/'app.js')],check=True)
 subprocess.run(['npm','test'],cwd=root,check=True)
 assert (root/'.gildem-respaldo-antes-v8.5.5/app.js').is_file()
 assert (root/'assets/results-banner.webp').is_file()
 assert (root/'assets/results-sidebar.webp').is_file()
 assert "'assets'" in (root/'scripts/build.mjs').read_text()
 assert (root/'core/results-view.js').is_file()
 assert (root/'package.json').read_text().find('8.5.5')!=-1
 assert (root/'index.html').read_text().count('data-nav="resultados"')==1
 assert 'gcp-results-active' in (root/'app.js').read_text()
 print('VALIDACIÓN OK: integración, sintaxis, tests y respaldo')
