import {CITIES,MARKETS,money,n,safe} from './util.mjs';
import {selectRecipes} from './catalog.mjs';
import {priceIndex,weeklyObserved,requiredMaterials} from './market.mjs';
import {getMarket,loadCatalog} from './data.mjs';
import {getConfig,buildPlan,validatePlan} from './engine.mjs';
import {downloadCSV,safeStorage} from './store.mjs';
import {tabNames,plannerPage,settingsPage} from './ui.mjs';
const storage=safeStorage();
const el=id=>document.getElementById(id);
const readJSON=(key,def)=>{try{return JSON.parse(storage.getItem(key)||'null')??def;}catch{return def;}};
const defaultFilter={category:'Todas',budget:10000000,minTier:4,maxTier:7,maxEnchant:2,search:'',focus:false,saleCities:CITIES};
export const state={tab:'black',catalog:null,catalogError:null,settings:getConfig(readJSON('gildem-nova-settings',{})),filters:{black:{...defaultFilter,...readJSON('gildem-nova-black',{})},royal:{...defaultFilter,...readJSON('gildem-nova-royal',{})}},lastPlans:{black:null,royal:null},busy:false,runId:0,progress:'',warning:null};
const flash=(message)=>{const node=el('toast');node.textContent=message;node.classList.add('show');setTimeout(()=>node.classList.remove('show'),3500);};
function nav(tab){if(!tabNames[tab])return;state.tab=tab;document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-current',b.dataset.tab===tab?'page':'false');});el('crumb').textContent=tabNames[tab].toUpperCase();render();}
function render(){const tab=state.tab;let view;
 if(tab==='black'||tab==='royal')view=plannerPage(tab,state);
 else view=settingsPage(state);
 el('main').innerHTML=view;
 if(state.catalogError&&tab!=='settings')el('main').insertAdjacentHTML('afterbegin',`<div class="alert error">${safe(state.catalogError)} <button type="button" class="btn small" id="retry-catalog">Reintentar catálogo</button></div>`);
 if(state.busy&&['black','royal'].includes(tab))el('main').insertAdjacentHTML('afterbegin',`<div id="progress" class="loading" role="status">${safe(state.progress||'Consultando AODP West…')}</div>`);
 if(state.warning)el('main').insertAdjacentHTML('afterbegin',`<div class="alert">${safe(state.warning)}</div>`);
}
async function initCatalog(force=false){state.catalogError=null;render();try{
 const catalog=await loadCatalog({force,storage,onProgress:message=>{state.progress=message;if(['black','royal'].includes(state.tab))el('main').querySelector('#plan-outlet')?.setAttribute('aria-label',message);}});
 state.catalog=catalog;state.catalogError=null;
 }catch(e){state.catalogError=String(e.message||e);state.catalog=null;}
 render();}
function evenlySample(recipes,limit=120){if(recipes.length<=limit)return recipes;
 const groups=new Map();for(const rec of recipes){const key=(rec.category+'|'+(rec.id.match(/^T\d+/)?.[0]||'other'));if(!groups.has(key))groups.set(key,[]);groups.get(key).push(rec);}const out=[],items=[...groups.values()];let rounds=0;while(out.length<limit&&items.some(g=>g.length)&&rounds<limit){for(const bucket of items){const rec=bucket.shift();if(rec)out.push(rec);if(out.length>=limit)break;}rounds++;}return out;
}
function formValue(f,name){return f.elements.namedItem(name)?.value??'';}
function readPlanFilters(form,market){return {category:formValue(form,'category'),budget:Math.max(0,n(formValue(form,'budget'))),minTier:Number(formValue(form,'minTier')),maxTier:Number(formValue(form,'maxTier')),maxEnchant:Number(formValue(form,'maxEnchant')),search:formValue(form,'search').trim(),focus:!!form.querySelector('#focus')?.checked,saleCities:market==='royal'?[...form.querySelectorAll('[data-royal-city]:checked')].map(x=>x.dataset.royalCity):CITIES};}
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
  const plan=buildPlan(selected,{market,saleCities:cities,priceRows:p,historyRows:h,config:{...state.settings,budget:f.budget,rrr:f.focus?state.settings.rrrFocus:state.settings.rrr}});
  if(!validatePlan(plan))throw Error('Validación del plan: cantidades, capital o lista de materiales inconsistentes');
  state.lastPlans[market]=plan;
  const warnings=[f.focus?'Focus: retorno simulado según porcentaje configurado; el consumo real de puntos no se ha verificado.':null,histories.warning,prices.warning,histories.stale?'Historial en caché antigua. Revisar fechas antes de comprar.':null,prices.stale?'Precios en caché antigua. Revisar fechas antes de comprar.':null,all.length>selected.length?`Cobertura: ${selected.length} de ${all.length} recetas seleccionadas. Reduce los filtros para escanear más a fondo.`:null,plan.remaining>0?`Se dejó sin asignar ${money(plan.remaining)} silver para no forzar rutas con poca rotación.`:null].filter(Boolean);
  state.warning=warnings.join(' · ')||null;flash(`Análisis listo: ${plan.rows.length} objetos con 2+ fabricaciones`);
 }catch(e){state.warning='No se completó la consulta. '+String(e.message||e);} finally{if(id===state.runId){state.busy=false;render();}}
}
function downloadFile(name,content,type='text/csv;charset=utf-8'){const a=document.createElement('a'),blob=new Blob(['\ufeff',content],{type}),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function downloadPlan(plan,type='craft'){const rows=type==='craft'?[['Objeto','Tier','Fabricaciones','Unidades','Craft','Venta','Actividad por semana','Precio venta','Beneficio estimado'],...plan.rows.map(r=>[r.id,r.id.match(/^T\d+/)?.[0],r.qty,r.units,r.craftCity,r.city,r.weekly,r.salePrice??'',r.profit??''])]:[['Material','Unidades brutas','Ciudad','Precio/u','Total'],...plan.shopping.map(m=>[m.id,m.qty,m.city,m.price,m.qty*m.price]),[],['Diarios sugeridos'],['Nombre','Tier','Cantidad','Nota'],...(plan.journals||[]).map(j=>[j.name,'T'+j.tier,j.qty,'Estimado por lote'])];downloadFile('Gildem_'+type+'_'+plan.market+'.csv',downloadCSV(rows));}
function copyPlan(plan){const journals=(plan.journals||[]).map(j=>`${j.name}: ${j.qty}`).join('\n');const text=plan.shopping.map(m=>`${m.id} | ${m.qty} uds. | ${m.city} | ${money(m.price)} silver/u`).join('\n')+(journals?`\n\nDiarios sugeridos\n${journals}`:'')+'\n\nCompras por tramos. Precios no garantizados.';if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>flash('Lista copiada')).catch(()=>flash('El navegador bloqueó el portapapeles'));else flash('Copia no disponible en esta conexión');}
function saveSettings(form){const values=Object.fromEntries(new FormData(form));const settings=getConfig({...state.settings,minimumWeekly:values.minimumWeekly,minimumCrafts:values.minimumCrafts,share:Number(values.share)/100,perItemBudget:Number(values.perItemBudget)/100,rrr:Number(values.rrr)/100,rrrFocus:Number(values.rrrFocus)/100,maxAge:values.maxAge,station:values.station,transport:values.transport,bmTax:Number(values.bmTax)/100,royalTax:Number(values.royalTax)/100,listingFee:Number(values.listingFee)/100,maxItems:values.maxItems});state.settings=settings;storage.setItem('gildem-nova-settings',JSON.stringify(settings));flash('Ajustes guardados');render();}
function interaction(event){const button=event.target.closest('button');if(!button)return;
 if(button.dataset.tab)return nav(button.dataset.tab);
 if(button.dataset.categorySelect){const form=button.closest('form');if(form){const hidden=form.querySelector('#category');if(hidden){hidden.value=button.dataset.categorySelect;form.querySelectorAll('[data-category-select]').forEach(x=>{x.classList.toggle('active',x.dataset.categorySelect===button.dataset.categorySelect);x.setAttribute('aria-pressed',x.dataset.categorySelect===button.dataset.categorySelect?'true':'false');});}}return;}
 if(button.id==='refresh-data'||button.id==='reload-catalog'||button.id==='retry-catalog'){void initCatalog(true);return;}
 if(button.id==='export-plan'||button.id==='export-buys'){const p=state.lastPlans[state.tab];if(p)downloadPlan(p,button.id==='export-plan'?'craft':'buy');return;}
 if(button.id==='copy-buys'){const p=state.lastPlans[state.tab];if(p)copyPlan(p);return;}
}
function formSubmit(event){if(event.target.id==='plan-form'){event.preventDefault();if(!state.busy)void scanPlan(event.target);}if(event.target.id==='settings-form'){event.preventDefault();saveSettings(event.target);}}
document.addEventListener('click',interaction);document.addEventListener('submit',formSubmit);nav('black');void initCatalog();
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
