import {CITIES,MARKETS,CATEGORY_KEYS,fmt,money,n,safe,itemIcon} from './util.mjs';
import {selectRecipes,itemName} from './catalog.mjs';
import {priceIndex,weeklyObserved,requiredMaterials} from './market.mjs';
import {getMarket,loadCatalog} from './data.mjs';
import {getConfig,buildPlan,validatePlan} from './engine.mjs';
import {readPlans,savePlan,removePlan,markStarted,pendingUnits,downloadCSV,safeStorage} from './store.mjs';
import {tabNames,plannerPage,analyzerPage,settingsPage,savedPage,planPage,errorBox} from './ui.mjs';
const storage=safeStorage();
const el=id=>document.getElementById(id);
const $=sel=>document.querySelector(sel);
const readJSON=(key,def)=>{try{return JSON.parse(storage.getItem(key)||'null')??def;}catch{return def;}};
const defaultFilter={category:'Todas',budget:10000000,minTier:4,maxTier:7,maxEnchant:2,search:'',focus:false,saleCities:CITIES};
export const state={tab:'black',catalog:null,catalogError:null,settings:getConfig(readJSON('gildem-nova-settings',{})),filters:{black:{...defaultFilter,...readJSON('gildem-nova-black',{})},royal:{...defaultFilter,...readJSON('gildem-nova-royal',{})}},lastPlans:{black:null,royal:null},busy:false,analysis:null,runId:0,progress:'',warning:null};
const flash=(message)=>{const node=el('toast');node.textContent=message;node.classList.add('show');setTimeout(()=>node.classList.remove('show'),3500);};
function nav(tab){if(!tabNames[tab])return;state.tab=tab;document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-current',b.dataset.tab===tab?'page':'false');});el('crumb').textContent=tabNames[tab].toUpperCase();render();}
function render(){const tab=state.tab,names=state.catalog?.names||{};let view;
 if(tab==='black'||tab==='royal')view=plannerPage(tab,state);
 else if(tab==='analyzer')view=analyzerPage(state);
 else if(tab==='saved')view=savedPage(readPlans(),names);
 else view=settingsPage(state);
 el('main').innerHTML=view;
 if(state.catalogError&&tab!=='saved')el('main').insertAdjacentHTML('afterbegin',`<div class="alert error">${safe(state.catalogError)} <button type="button" class="btn small" id="retry-catalog">Reintentar catálogo</button></div>`);
 if(state.busy&&['black','royal','analyzer'].includes(tab))el('main').insertAdjacentHTML('afterbegin',`<div id="progress" class="loading" role="status">${safe(state.progress||'Consultando AODP West…')}</div>`);
 if(state.warning)el('main').insertAdjacentHTML('afterbegin',`<div class="alert">${safe(state.warning)}</div>`);
}
async function initCatalog(force=false){state.catalogError=null;render();try{
 const catalog=await loadCatalog({force,storage,onProgress:message=>{state.progress=message;if(['black','royal'].includes(state.tab))el('main').querySelector('#plan-outlet')?.setAttribute('aria-label',message);}});
 state.catalog=catalog;state.catalogError=null;
 }catch(e){state.catalogError=String(e.message||e);state.catalog=null;}
 render();}
function evenlySample(recipes,limit=120){if(recipes.length<=limit)return recipes;
 const groups=new Map();for(const rec of recipes){const key=rec.category+'|'+rec.id.match(/^T\d+/)?.[0]||'other';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(rec);}
 const out=[],items=[...groups.values()];let rounds=0;while(out.length<limit&&items.some(g=>g.length)&&rounds<limit){for(const bucket of items){const rec=bucket.shift();if(rec)out.push(rec);if(out.length>=limit)break;}rounds++;}return out;
}
function formValue(f,name){return f.elements.namedItem(name)?.value??'';}
function readPlanFilters(form,market){const fields={category:formValue(form,'category'),budget:Math.max(0,n(formValue(form,'budget'))),minTier:Number(formValue(form,'minTier')),maxTier:Number(formValue(form,'maxTier')),maxEnchant:Number(formValue(form,'maxEnchant')),search:formValue(form,'search').trim(),focus:!!form.querySelector('#focus')?.checked,saleCities:market==='royal'?[...form.querySelectorAll('[data-royal-city]:checked')].map(x=>x.dataset.royalCity):CITIES};return fields;}
async function scanPlan(form){const market=form.dataset.market;const f=readPlanFilters(form,market);state.filters[market]=f;storage.setItem('gildem-nova-'+market,JSON.stringify(f));
 if(f.minTier>f.maxTier)return flash('El tier mínimo no puede superar al máximo');
 if(!(f.budget>0))return flash('Introduce un presupuesto mayor que 0');
 if(market==='royal'&&!f.saleCities.length)return flash('Elige al menos una ciudad Royal');
 if(!state.catalog?.recipes?.length)return flash('No hay catálogo oficial cargado. Reintenta desde Datos y ajustes.');
 const all=selectRecipes(state.catalog.recipes,f,state.catalog.names);
 if(!all.length)return flash('No hay recetas de esa rama y tiers en el catálogo verificable.');
 const selected=evenlySample(all,120),cities=market==='black'?['Black Market']:f.saleCities;
 state.busy=true;state.warning=null;state.progress=`Consultando movimiento de ${selected.length} variantes y ${cities.length} mercados…`;const id=++state.runId;render();
 try{
  const histories=await getMarket('history',selected.map(r=>r.id),cities);
  if(id!==state.runId)return;
  state.progress='Calculando materiales y cotizaciones recientes…';render();
  const materials=requiredMaterials(selected),quoted=[...new Set([...selected.map(x=>x.id),...materials])];
  const prices=await getMarket('prices',quoted,MARKETS);
  if(id!==state.runId)return;
  const h=weeklyObserved(histories.rows),p=priceIndex(prices.rows);
  const pending=pendingUnits(readPlans());
  const plan=buildPlan(selected,{market,saleCities:cities,priceRows:p,historyRows:h,config:{...state.settings,budget:f.budget,rrr:f.focus?state.settings.rrrFocus:state.settings.rrr},pending});
  if(!validatePlan(plan))throw Error('Validación del plan: cantidades, capital o lista de materiales inconsistentes');
  state.lastPlans[market]=plan;
  const warnings=[f.focus?'Focus: retorno simulado según porcentaje configurado; el consumo real de puntos no se ha verificado.':null,histories.warning,prices.warning,histories.stale?'Historial en caché antigua. Revisar fechas antes de comprar.':null,prices.stale?'Precios en caché antigua. Revisar fechas antes de comprar.':null,all.length>selected.length?`Cobertura: ${selected.length} de ${all.length} recetas seleccionadas. Reduce los filtros para escanear más a fondo.`:null].filter(Boolean);
  state.warning=warnings.join(' · ')||null;flash(`Análisis listo: ${plan.rows.length} objetos con 2+ fabricaciones`);
 }catch(e){state.warning='No se completó la consulta. '+String(e.message||e);}
 finally{if(id===state.runId){state.busy=false;render();}}
}
function downloadFile(name,content,type='text/csv;charset=utf-8'){const a=document.createElement('a'),blob=new Blob(['\ufeff',content],{type}),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function downloadPlan(plan,type='craft'){const rows=type==='craft'?[['Objeto','Tier','Fabricaciones','Unidades','Craft','Venta','Actividad por semana','Precio venta','Beneficio estimado'],...plan.rows.map(r=>[r.id,r.id.match(/^T\d+/)?.[0],r.qty,r.units,r.craftCity,r.city,r.weekly,r.salePrice??'',r.profit??''])]:[['Material','Unidades brutas','Ciudad','Precio/u','Total'],...plan.shopping.map(m=>[m.id,m.qty,m.city,m.price,m.qty*m.price])];downloadFile('Gildem_'+type+'_'+plan.market+'.csv',downloadCSV(rows));}
function copyPlan(plan){const text=plan.shopping.map(m=>`${m.id} | ${m.qty} uds. | ${m.city} | ${money(m.price)} silver/u`).join('\n')+'\nCompras por tramos. Precios no garantizados.';if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>flash('Lista copiada')).catch(()=>flash('El navegador bloqueó el portapapeles'));else flash('Copia no disponible en esta conexión');}
async function analyze(form){const q=form.querySelector('#analyzer-id')?.value?.trim();if(!q)return flash('Introduce un objeto');const catalog=state.catalog||{recipes:[],names:{}};
 let found=catalog.recipes.find(r=>r.id.toLowerCase()===q.toLowerCase());if(!found){const matching=catalog.recipes.filter(r=>itemName(r.id,catalog.names).toLocaleLowerCase('es').includes(q.toLocaleLowerCase('es')));if(matching.length===1)found=matching[0];}
 if(!found){state.analysis={id:q,rows:[],error:'No encontramos un ID exacto en las recetas cargadas. Elige el código de la lista de objetos.'};render();return;}
 state.analysis={id:found.id,rows:[],error:null};state.busy=true;state.warning=null;state.progress='Consultando cotizaciones y actividad…';const id=++state.runId;render();
 try{const [prices,histories]=await Promise.all([getMarket('prices',[found.id],MARKETS),getMarket('history',[found.id],MARKETS)]);if(id!==state.runId)return;state.analysis={id:found.id,rows:prices.rows.filter(x=>x.item_id===found.id),history:weeklyObserved(histories.rows),error:null};if(!state.analysis.rows.length)state.analysis.error='AODP no dispone de cotizaciones para este objeto en West.';state.warning=[prices.warning,histories.warning].filter(Boolean).join(' · ')||null;}
 catch(e){state.analysis.error=String(e.message||e);}finally{if(id===state.runId){state.busy=false;render();}}
}
function saveSettings(form){const values=Object.fromEntries(new FormData(form));const settings=getConfig({...state.settings,minimumWeekly:values.minimumWeekly,minimumCrafts:values.minimumCrafts,share:Number(values.share)/100,perItemBudget:Number(values.perItemBudget)/100,rrr:Number(values.rrr)/100,rrrFocus:Number(values.rrrFocus)/100,maxAge:values.maxAge,station:values.station,transport:values.transport,bmTax:Number(values.bmTax)/100,royalTax:Number(values.royalTax)/100,listingFee:Number(values.listingFee)/100,maxItems:values.maxItems});state.settings=settings;storage.setItem('gildem-nova-settings',JSON.stringify(settings));flash('Ajustes guardados');render();}
function interaction(event){const button=event.target.closest('button');if(!button)return;
 if(button.dataset.tab)return nav(button.dataset.tab);
 if(button.id==='refresh-data'||button.id==='reload-catalog'||button.id==='retry-catalog'){void initCatalog(true);return;}
 if(button.id==='save-plan'){const p=state.lastPlans[state.tab];if(!p?.rows?.length)return flash('No hay rutas para guardar');try{savePlan(p);flash('Borrador guardado en Mi negocio');}catch(e){flash(e.message);}return;}
 if(button.id==='export-plan'||button.id==='export-buys'){const p=state.lastPlans[state.tab];if(p)downloadPlan(p,button.id==='export-plan'?'craft':'buy');return;}
 if(button.id==='copy-buys'){const p=state.lastPlans[state.tab];if(p)copyPlan(p);return;}
 if(button.dataset.removeSaved){if(!confirm('¿Eliminar este plan guardado?'))return;removePlan(button.dataset.removeSaved);render();return;}
 if(button.dataset.startSaved){if(!confirm('Marca como comprado SOLO si ya realizaste esa compra en el juego. ¿Confirmas?'))return;markStarted(button.dataset.startSaved);flash('Estado actualizado. Silver no conectado al juego.');render();return;}
 if(button.dataset.exportSaved){const p=readPlans().find(x=>x.id===button.dataset.exportSaved);if(p)downloadFile('Gildem_guardado.csv',downloadCSV([['ID','Unidades','Ciudad','Capital'],...p.rows.map(r=>[r.id,r.units,r.city,r.capital])]));return;}
}
function formSubmit(event){if(event.target.id==='plan-form'){event.preventDefault();if(!state.busy)void scanPlan(event.target);}if(event.target.id==='analyzer-form'){event.preventDefault();if(!state.busy)void analyze(event.target);}if(event.target.id==='settings-form'){event.preventDefault();saveSettings(event.target);}}
document.addEventListener('click',interaction);document.addEventListener('submit',formSubmit);nav('black');void initCatalog();
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
