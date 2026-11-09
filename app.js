import {normalizeOrderbook,enrichWithDepth,routeProfitAtQuantity} from './core/depth.js';
import {journalInfo,journalSummary,JOURNAL_NPC_REFERENCE} from './core/journals.js';
import {rebuildPlan,fitPlan} from './core/plan.js';
import {CITIES,ALL_CITIES,CITY_COLORS,fmt,short,h,qualityQuote,freshnessLabel,rowMap,quote,profitTrade,topTrades,craftCost,craftProfit,historyDaily,allocatePlan,craftingReturnRate,allocateCraftPlan,selectCraftSaleRoutes,itemTier,itemEnch,normalized} from './core/engine.js';
import {iconSources,nextIconSource,FALLBACK_ICON} from './core/icons.js';
import {BRANCHES,BRANCH_CATEGORIES,categoryForBranch,branchIsRoyalOnly,sortedBranches,branchByKey,recipesForBranch} from './core/branches.js';
import {blackMarketEligible,specialType} from './core/special-recipes.js';
import {prices,history,orderbook,pricesQuality,clearCache,cachedCount,HOUR} from './core/data.js';
import {historyMetrics,confidenceOf,scenarioProfit,qualityWeightedSale,allocateSmartPortfolio,focusPerSilver} from './core/optimizer.js';
import {createPortfolioFromPlan,summarizePortfolio,recordSale,setLotCost,overallDashboard} from './core/ledger.js';
import {addAlertFromRoute,evaluateAlert} from './core/alerts.js';
import {allocatePortfolioV6} from './core/allocator-v6.js';
import {normalizeSellBook,listingPressure} from './core/competition.js';
import {verifyPlannedPrices,breakEvenPrice} from './core/verify.js';
import {cashPosition,startPortfolio,adjustWallet} from './core/cashflow.js';
import {learnFromSales} from './core/personal-learning.js';
import {checkMaterialSupply} from './core/material-supply.js';
import {names,recipes,loadCatalog,loadSpecialCatalog,recipeCatalogStatus,itemName,findItems,GROUPS,craftable,loadAdvanced,journalFor,journalIds} from './core/catalog.js';
const $=(s)=>document.querySelector(s);
const main=$('#main-content');
const navNames={cartera:'Mi negocio',focuslab:'Focus y specs',alertas:'Mis alertas',inicio:'Resumen',precios:'Precios y mercados',comercio:'Oportunidades',negro:'Mercado Negro',crafting:'Plan de crafting',refino:'Refinamiento',transmutar:'Transmutación',encantar:'Encantamiento',ajustes:'Ajustes y datos'};
const prefs={region:'west',premium:true,tax:4,setup:2.5,maxAge:24,transport:0,rrr:24.8,station:0};
try{Object.assign(prefs,JSON.parse(localStorage.getItem('gildem-prefs')||'{}'));}catch{}
const state={preflight:null,page:'crafting',id:'T4_BAG',market:null,trade:null,plan:null,refine:null,enchant:null,transmute:null,catalogReady:false,loading:false,lastFetch:0,lastWarning:null,query:'',fullCatalog:false};
function save(){try{localStorage.setItem('gildem-prefs',JSON.stringify(prefs));}catch{}}
function control(id){return document.getElementById(id);}
function val(id,def=''){return control(id)?.value??def;}
function num(id,def=0){const v=Number(val(id,def));return Number.isFinite(v)?v:def;}
function checked(id){return !!control(id)?.checked;}
function opts(arr,selected){return arr.map(x=>{const [value,label]=Array.isArray(x)?x:[x,x];return `<option value="${h(value)}" ${String(value)===String(selected)?'selected':''}>${h(label)}</option>`}).join('');}
function cityOpts(selected,more=[]){return opts([...CITIES,...more],selected);}
function field(label,id,element,span=''){return `<div class="field ${span}"><label for="${id}">${label}</label>${element}</div>`;}
function selectField(label,id,entries,selected,span=''){return field(label,id,`<select id="${id}" class="form-select">${opts(entries,selected)}</select>`,span);}
function numberField(label,id,v,min=0,step=1,span=''){return field(label,id,`<input id="${id}" class="input" type="number" min="${min}" step="${step}" value="${v}">`,span);}
function blockTitle(title,desc,extras=''){return `<div class="section-head"><div><h2>${title}</h2><p>${desc}</p></div>${extras}</div>`;}
function stat(label,value,foot,cls='',mark='◈'){return `<div class="panel stat ${cls}"><span class="mark">${mark}</span><div class="label">${label}</div><div class="value number">${value}</div><div class="foot">${foot}</div></div>`;}
function itemimg(id,size=42,eager=false){
 const url=iconSources(id,size*2)[0];
 return `<img class="item-icon ${size>=64?'large':''}" loading="${eager?'eager':'lazy'}" decoding="async" referrerpolicy="no-referrer" width="${size}" height="${size}" src="${h(url)}" data-icon-id="${h(id)}" data-icon-size="${size*2}" data-icon-step="0" alt="">`;
}
function itemCell(id,label='',sub=''){return `<div class="item-cell">${itemimg(id,36)}<div><strong title="${h(itemName(id))}">${h(label||itemName(id))}</strong><small>${h(sub||id)}</small></div></div>`;}
function agePill(q){if(!q)return '<span class="pill red">Sin datos</span>';return `<span class="pill ${q.ageHours<1?'green':q.ageHours<=prefs.maxAge?'amber':'red'}">${freshnessLabel(q.at)}</span>`;}
function moneyCell(n,cls=''){return `<span class="number ${cls}">${Number.isFinite(n)?fmt(Math.round(n)):'—'}</span>`;}
function empty(msg='Sin resultados confiables',detail='Prueba con otros tiers, otra ciudad o un límite de antigüedad mayor.'){
 return `<div class="table-empty"><span class="symbol">◇</span><strong>${h(msg)}</strong><span>${h(detail)}</span></div>`;
}
function errorText(e){return `<div class="error-box"><strong>No pudimos completar la consulta.</strong><p>${h(e.message||e)}</p><small>Comprueba la conexión, la disponibilidad de la API o vuelve a intentar más tarde.</small></div>`;}
function showToast(msg,isError=false){const e=$('#toast');e.textContent=msg;e.className=(isError?'error ':'')+'show';clearTimeout(showToast.t);showToast.t=setTimeout(()=>e.className='',4500);}
function setBusy(id,text='Consultando datos del mercado…'){const e=control(id);if(e)e.innerHTML=`<div class="loading"><span class="spinner"></span><span>${h(text)}</span></div>`;}
function updateStatus(info){if(!info)return;state.lastFetch=info.fetchedAt||Date.now();state.lastWarning=info.warning||null;$('#sidebar-status').textContent=info.warning?'Caché de respaldo':info.cached?'Caché de 1 hora':'Consulta completada';$('#api-indicator').textContent=info.warning?'Datos en caché':info.cached?'Caché válida':'AODP consultado';}
function changePage(page){state.page=page;document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===page));$('#page-title').textContent=page==='inicio'?'Tu centro económico':navNames[page];$('#breadcrumb').textContent=navNames[page];document.querySelector('.sidebar').classList.remove('open');render();window.scrollTo({top:0,behavior:'smooth'});}
function render(){if(state.page==='inicio')home();if(state.page==='cartera')portfolioPage();if(state.page==='focuslab')focusPage();if(state.page==='alertas')alertsPage();if(state.page==='precios')marketPage();if(state.page==='comercio'||state.page==='negro')tradePage();if(state.page==='crafting')craftPage();if(state.page==='refino')refinePage();if(state.page==='encantar')enchantPage();if(state.page==='transmutar')transmutePage();if(state.page==='ajustes')settingsPage();}
function home(){
 const count=Object.keys(recipes).length, catalog=Object.keys(names).length, real=overallDashboard(loadPortfolios());
 main.innerHTML=`<div class="page-grid">
  <div class="col-12"><section class="hero"><div><span class="kicker">✦ MERCADOS · CRAFTING · PROFIT</span><h2>Convierte el mercado de Albion en decisiones inteligentes.</h2><p>Todo tu análisis económico en una sola app. Precios públicos con fecha, oportunidades entre ciudades y planes de fabricación sin búsquedas interminables.</p><div class="button-row"><button class="btn gold" data-nav="crafting">⚒ Crear plan de crafting</button><button class="btn ghost" data-nav="precios">⌕ Consultar mercado</button></div></div></section></div>
  <div class="col-3">${stat('Servidor',prefs.region==='west'?'AMÉRICA':prefs.region==='east'?'ASIA':'EUROPA','Fuente AODP · '+prefs.region,'gold','◎')}</div>
  <div class="col-3">${stat('Frecuencia','60 min','Caché de consultas actualizada por hora','jade','↻')}</div>
  <div class="col-3">${stat('Recetas disponibles',count?fmt(count):'Cargando',count?'Catálogo de equipamiento':'Sincronizando recetas…','blue','⚒')}</div>
  <div class="col-3">${stat('Objetos indexados',catalog?fmt(catalog):'Cargando',catalog?'Nombres en español':'Obteniendo catálogo…','','◈')}</div>
  <div class="col-12"><div class="panel"><div class="toggleline"><div><h3 class="subheading">Mi economía personal</h3><p class="tiny muted">Datos locales de ventas registradas</p></div><button class="btn sm" data-nav="cartera">Ver inversiones ↗</button></div><div class="cost-row"><span>Profit realmente cobrado</span><strong class="positive">${short(real.realizedProfit)}</strong></div><div class="cost-row"><span>Unidades todavía pendientes de venta</span><strong>${fmt(real.unsold)}</strong></div></div></div>
  <div class="col-7"><div class="panel"><h3 class="subheading">Tu siguiente movimiento</h3><div class="quick-grid">
   ${quick('precios','⌕','Explorador de precios','Compara compras y ventas entre ciudades')}
   ${quick('comercio','⇄','Oportunidades','Compra barato y vende con margen')}
   ${quick('crafting','⚒','Diversificador de crafting','Invierte por rama y controla saturación')}
   ${quick('cartera','▤','Mi negocio','Registra beneficios cobrados y stock pendiente')}
   ${quick('focuslab','✦','Focus y especialización','Crea perfiles con costo exacto de Focus')}
   ${quick('alertas','◉','Alertas de profit','Condiciones para nuevas oportunidades')}
   ${quick('refino','▦','Refinamiento inteligente','Costo de recursos y retorno del taller')}
   ${quick('negro','♜','Mercado Negro','Detecta órdenes de compra del BM')}
   ${quick('transmutar','⬡','Transmutación','Compara tiers y costes configurables')}
   ${quick('encantar','✧','Encantamiento','Compara equipo normal y encantado')}
   ${quick('ajustes','⚙','Ajustes de economía','Impuestos, servidor y caché')}
  </div></div></div>
  <div class="col-5"><div class="panel"><h3 class="subheading">Estado de tus datos</h3>
   <div class="cost-row"><span>Servidor</span><strong>${prefs.region==='west'?'América (West)':prefs.region==='east'?'Asia (East)':'Europa'}</strong></div>
   <div class="cost-row"><span>Intervalo de refresco</span><strong>1 hora</strong></div>
   <div class="cost-row"><span>Entradas en caché</span><strong>${cachedCount()}</strong></div>
   <div class="cost-row"><span>Máxima antigüedad admitida</span><strong>${prefs.maxAge} horas</strong></div>
   <div class="cost-row"><span>Historial de órdenes</span><strong>Observaciones 7 y 14 días UTC</strong></div>
   <div class="divider"></div><div class="notice neutral" id="scheduled-snapshot">Buscando última sincronización horaria en Netlify…</div><div class="notice neutral" style="margin-top:12px">Los precios provienen de jugadores que consultan mercados con AODP. La app consulta cada hora, pero <strong>no convierte una observación antigua en un precio reciente</strong>.</div>
  </div></div>
  <div class="col-12"><div class="panel"><h3 class="subheading">Hecha para la economía real de Albion</h3><p class="explain">Una cotización de compra instantánea es la orden de venta mínima. Una venta instantánea utiliza la mejor orden de compra disponible. Vender mediante una orden propia puede dar más silver, pero exige esperar comprador y pagar tarifas. Los cálculos muestran su método y rechazan precios desactualizados.</p></div></div>
 </div>`;
 refreshServerSnapshot();
}
async function refreshServerSnapshot(){const target=control('scheduled-snapshot');if(!target)return;try{const url=new URL('./.netlify/functions/snapshot',location.href);url.searchParams.set('region',prefs.region);const r=await fetch(url);if(!r.ok)throw new Error('sin snapshot');const snap=await r.json();const date=Date.parse(snap.fetchCompletedAt);const age=Number.isFinite(date)?((Date.now()-date)/3600000).toFixed(1)+' h':'sin fecha';target.innerHTML=`<strong>Monitor horario de Netlify</strong><br>${fmt(snap.rows?.length||0)} observaciones de ${fmt(snap.requested||0)} objetos vigilados · consulta ${h(age)} atrás.<br><small>Las fechas de cada precio pueden ser más antiguas que esta consulta.</small>`;}catch{target.innerHTML='<strong>Monitor horario no confirmado.</strong> La función programada requiere desplegar el repositorio en Netlify y esperar su primera ejecución. Las consultas normales siguen disponibles al usar la app.';}}
function quick(page,ico,title,desc){return `<button class="quick-button" data-nav="${page}"><span class="quick-icon">${ico}</span><span><strong>${title}</strong><small>${desc}</small></span><span class="chev">›</span></button>`;}
function marketPage(){main.innerHTML=`${blockTitle('Explorador de precios','Busca por nombre en español o ID del juego. Las cotizaciones indican la edad real de la observación.',`<button class="btn sm" data-action="lookup">↻ Consultar</button>`)}
 <div class="panel"><div class="search-wrap"><span class="search-mark">⌕</span><input id="item-search" class="input" type="search" autocomplete="off" value="${h(state.query||itemName(state.id))}" placeholder="Ej. botas de soldado, T4_BAG, fibra…"><div id="search-results" class="search-results" style="display:none"></div></div><div class="button-row" style="margin-top:13px"><span class="pill neutral">Calidad normal (1)</span><span class="pill neutral">8 mercados</span><span class="pill amber">Filtro: máximo ${prefs.maxAge} h</span></div></div>
 <div id="market-results" style="margin-top:18px">${state.market?marketResult(state.market):empty('Busca un objeto para ver las cotizaciones','Puedes introducir un ID exacto de Albion y presionar Enter.')}</div>`;}
function marketResult(m){const id=m.id,map=rowMap(m.rows),cities=ALL_CITIES;const costs=[];
 const rows=cities.map(city=>{const row=map.get(id+'|'+city+'|1');const ask=qualityQuote(row,'sell_price_min',prefs.maxAge),bid=qualityQuote(row,'buy_price_max',prefs.maxAge);if(ask?.fresh)costs.push({city,price:ask.price});return `<tr><td><span class="main-city" style="border-left:3px solid ${CITY_COLORS[city]};padding-left:9px">${city==='Black Market'?'Mercado Negro':city}</span></td><td>${ask?moneyCell(ask.price):'—'}</td><td>${bid?moneyCell(bid.price):'—'}</td><td>${agePill(ask)}</td><td>${agePill(bid)}</td><td>${ask?.fresh&&bid?.fresh?moneyCell(ask.price-bid.price):'—'}</td></tr>`;}).join('');
 const best=costs.sort((a,b)=>a.price-b.price)[0];const highest=[...ALL_CITIES].map(city=>({city,q:quote(map,id,city,'buy_price_max',prefs.maxAge)})).filter(x=>x.q).sort((a,b)=>b.q.price-a.q.price)[0];
 const max=Math.max(1,...costs.map(x=>x.price));const bars=costs.map(x=>`<div class="bar-row"><span>${x.city}</span><div class="bar-track"><span style="width:${100*x.price/max}%;background:${CITY_COLORS[x.city]}"></span></div><strong>${short(x.price)}</strong></div>`).join('');
 return `<div class="page-grid"><div class="col-12"><div class="panel"><div class="toggleline"><div class="item-heading">${itemimg(id,64)}<div><h3>${h(itemName(id))}</h3><small>${h(id)} · Tier ${itemTier(id)||'—'}${itemEnch(id)?'.'+itemEnch(id):''}</small></div></div><span class="pill ${m.warning?'amber':'green'}">${m.warning?'Caché de respaldo':m.cached?'Caché horaria':'Consulta AODP'}</span></div></div></div>
 <div class="col-4">${stat('Compra más barata',best?fmt(best.price):'—',best?.city||'No hay dato reciente','gold','↘')}</div>
 <div class="col-4">${stat('Mayor orden de compra',highest?fmt(highest.q.price):'—',highest?.city||'No hay dato reciente','jade','↗')}</div>
 <div class="col-4">${stat('Diferencial bruto',best&&highest?fmt(highest.q.price-best.price):'—','Sin descontar tarifas ni transporte','blue','⇄')}</div>
 <div class="col-8"><div class="panel"><h3 class="subheading">Precios por mercado</h3><div class="table-scroll"><table class="data-table"><thead><tr><th>Ciudad</th><th>Comprar ahora</th><th>Vender ahora</th><th>Edad venta</th><th>Edad compra</th><th>Spread</th></tr></thead><tbody>${rows}</tbody></table></div><p class="explain">Compra ahora = menor orden de venta. Vende ahora = mayor orden de compra. Datos caducados visibles, pero excluidos de recomendaciones.</p></div></div>
 <div class="col-4"><div class="panel"><h3 class="subheading">Comparación de precios de venta</h3>${bars?`<div class="mini-chart">${bars}</div>`:empty('No hay datos recientes','Modifica el filtro de antigüedad en Ajustes.')}</div></div>
 ${m.warning?`<div class="col-12"><div class="notice red">${h(m.warning)}</div></div>`:''}</div>`;
}
function tradePage(){const bm=state.page==='negro';main.innerHTML=`${blockTitle(bm?'Oportunidades del Mercado Negro':'Escáner de oportunidades',bm?'Encuentra oportunidades de venta inmediata para las órdenes de compra de Caerleon.':'Comparación de órdenes reales, beneficio neto y edad de precios. Incluye el Mercado Negro.')}
 <form id="trade-form" class="panel"><div class="form-grid">
 ${selectField('Qué buscar','trade-kind',[['popular','Objetos populares'],['boots','Botas y calzado'],['resources','Recursos refinados'],['luxury','Bienes de lujo'],['black','Mercado Negro: equipamiento']], bm?'black':'popular','span4')}
 ${selectField('Destino','trade-dest',[['all','Todas las ciudades'],['Black Market','Solo Mercado Negro'],...CITIES.map(x=>[x,x])], bm?'Black Market':'all','span4')}
 ${numberField('ROI mínimo (%)','trade-roi',5,0,.5,'span2')}
 ${numberField('Beneficio mínimo','trade-minprofit',500,0,100,'span2')}
 </div><div class="button-row" style="margin-top:18px"><button class="btn gold" type="submit">⌕ Buscar oportunidades</button><span class="muted tiny">Se compran unidades en órdenes de venta y se revenden en órdenes de compra o se publican.</span></div></form>
 <div id="trade-results" style="margin-top:18px">${state.trade?tradeResult(state.trade):empty('Ejecuta el escáner','Filtra precios anteriores a '+prefs.maxAge+' horas y calcula impuestos y transporte.')}</div>`;}
function tradeResult(r){return `<div class="page-grid"><div class="col-3">${stat('Oportunidades',fmt(r.all.length),'Con ganancia neta positiva','jade','↗')}</div><div class="col-3">${stat('ROI más alto',r.all.length?Math.max(...r.all.map(x=>x.roi)).toFixed(1)+'%':'—','No implica cantidad disponible','gold','%')}</div><div class="col-3">${stat('Profit máximo/unit.',r.all.length?short(Math.max(...r.all.map(x=>x.profit))):'—','Antes de riesgos y slippage','blue','◈')}</div><div class="col-3">${stat('Productos analizados',fmt(r.count),'Calidad normal, listado de muestra','','⌕')}</div>
 <div class="col-12"><div class="panel"><div class="toggleline"><h3 class="subheading">Oportunidades encontradas</h3><span class="pill neutral">${r.cached?'Caché horaria':'Datos consultados'}</span></div><div class="table-scroll">${r.all.length?`<table class="data-table"><thead><tr><th>Artículo</th><th>Comprar</th><th>Vender</th><th>Modo</th><th>Inversión</th><th>Profit neto</th><th>ROI</th><th>Antigüedad</th></tr></thead><tbody>${r.all.slice(0,75).map(x=>`<tr><td>${itemCell(x.id)}</td><td>${h(x.from)}</td><td>${h(x.to)}</td><td><span class="pill ${x.mode==='instant'?'green':'amber'}">${x.mode==='instant'?'Instantáneo':'Publicar'}</span></td><td>${moneyCell(x.cost)}</td><td>${moneyCell(x.profit,'positive')}</td><td class="positive">${x.roi.toFixed(1)}%</td><td>${x.ageHours.toFixed(1)} h</td></tr>`).join('')}</tbody></table>`:empty('No hay oportunidades verificadas','La API puede no tener precios recientes de estos artículos.')}</div><p class="explain">Un margen positivo no garantiza volumen ejecutable. El transporte se descuenta por unidad según Ajustes. Las oportunidades de publicación requieren esperar una compra.</p></div></div>${r.warning?`<div class="col-12"><div class="notice red">${h(r.warning)}</div></div>`:''}</div>`;}
// Persistent beginner-friendly crafting defaults. Advanced inputs are optional.
const craftDefaults={branch:'boots_plate',city:'auto',daily:0,focus:'no',budget:10000000,invest:'all',market:'mixed',tierMin:4,tierMax:7,ench:1,buy:'all',buyMode:'instant',saleMode:'listed',station:0,transport:0,cap:0,unknown:2,journals:true,goal:'balanced',minConfidence:0,focusBudget:10000,focusPerUnit:0,qualityMode:'normal',q1:100,q2:0,q3:0,q4:0,q5:0,priceStress:8,resourceStress:7,riskBM:0,riskRoyal:0,matShipping:0,bmTax:2.5,royalTax:4,listingFee:2.5,bmMode:'instant',requireBook:false,useWallet:false};
let craftPrefs={...craftDefaults};
try{Object.assign(craftPrefs,JSON.parse(localStorage.getItem('gildem-craft-simple-v2')||'{}'));}catch{}
function saveCraftPrefs(input){craftPrefs={...craftPrefs,...input};try{localStorage.setItem('gildem-craft-simple-v2',JSON.stringify(craftPrefs));}catch{}}
let branchCategory=categoryForBranch(craftPrefs.branch);
function branchPicker(){
 const selected=branchByKey(craftPrefs.branch);
 return `<div class="field branch-picker span6"><label>Rama de crafting</label>
 <input id="craft-branch" type="hidden" value="${h(selected.key)}">
 <div class="branch-group-grid" role="group" aria-label="Categoría de crafting">
 ${BRANCH_CATEGORIES.map(g=>`<button type="button" class="branch-group ${branchCategory===g.key?'active':''}" data-branch-group="${h(g.key)}" aria-pressed="${branchCategory===g.key}">${itemimg(g.iconId||'T4_BAG',34,true)}<div class="branch-group-copy"><strong>${h(g.label)}</strong><small>${h(g.description)}</small></div></button>`).join('')}</div>
 <div class="branch-filter"><input type="search" class="input" id="craft-branch-search" placeholder="Buscar subrama, por ejemplo Hachas o Leñador" aria-label="Buscar ramas de crafting" autocomplete="off"><span>⌕</span></div>
 <div class="branch-choice-grid" id="craft-branch-options" role="group" aria-label="Elige la rama">${branchOptions('')}</div>
 <p class="branch-choice-footer" id="craft-branch-selected">${itemimg(selected.iconId||'T4_BAG',30,true)} <span>Seleccionado: <strong>${h(selected.label)}</strong>${branchIsRoyalOnly(selected.key)?' · <span class="royal-only">Solo Royal Market</span>':''}</span></p>
 </div>`;
}
function branchOptions(query=''){
 const available=sortedBranches(branchCategory,query);
 return available.length?available.map(b=>`<button type="button" data-branch-choice="${h(b.key)}" class="branch-choice ${val('craft-branch',craftPrefs.branch)===b.key?'selected':''}">${itemimg(b.iconId||'T4_BAG',34,true)}<span>${h(b.label)}</span>${branchIsRoyalOnly(b.key)?'<small>Royal</small>':''}</button>`).join(''):'<p class="branch-no-results">No hay ramas con ese nombre en esta categoría.</p>';
}
function chooseBranch(key){const branch=branchByKey(key);if(branch.key!==key)return;
 control('craft-branch').value=key;branchCategory=categoryForBranch(key);
 control('craft-branch-options').innerHTML=branchOptions(val('craft-branch-search',''));
 const selected=control('craft-branch-selected');if(selected)selected.innerHTML=`${itemimg(branch.iconId||'T4_BAG',30,true)} <span>Seleccionado: <strong>${h(branch.label)}</strong>${branchIsRoyalOnly(key)?' · <span class="royal-only">Solo Royal Market</span>':''}</span>`;
 if(branchIsRoyalOnly(key)){
  control('craft-market').value='royal';
  for(const option of control('craft-market').options)option.disabled=option.value!=='royal';
  if(categoryForBranch(key)==='mounts')control('craft-daily').value='0';
  if(categoryForBranch(key)==='foods'){control('craft-tiermin').value='1';control('craft-tiermax').value='8';}
  else if(['mounts','potions'].includes(categoryForBranch(key))&&Number(control('craft-tiermin').value)>3)control('craft-tiermin').value='3';
  const compare=control('craft-city')?.querySelector('option[value=compare]');if(compare)compare.textContent=categoryForBranch(key)==='foods'?'Comparar Caerleon con Bridgewatch':'Comparar bono vs fabricar en Caerleon';
 }else{for(const option of control('craft-market').options)option.disabled=false;}
 saveCraftPrefs({branch:key,market:val('craft-market')});craftRateHelp();
}
function changeBranchGroup(group){if(!BRANCH_CATEGORIES.some(g=>g.key===group))return;
 branchCategory=group;
 for(const el of document.querySelectorAll('[data-branch-group]')){el.classList.toggle('active',el.dataset.branchGroup===group);el.setAttribute('aria-pressed',el.dataset.branchGroup===group?'true':'false');}
 if(control('craft-branch-search'))control('craft-branch-search').value='';
 const choices=sortedBranches(group);if(choices.length)chooseBranch(choices[0].key);
}
function craftRateHelp(){
 const branch=branchByKey(val('craft-branch',craftPrefs.branch));
 const city=val('craft-city',craftPrefs.city),daily=num('craft-daily',0),focus=val('craft-focus','no')==='yes';
 const mount=categoryForBranch(branch)==='mounts',food=categoryForBranch(branch)==='foods';
 const specialty=!mount&&(city==='auto'||city==='compare'||city===branch.city);
 const effectiveDaily=mount?0:daily;
 const r=craftingReturnRate({specialty,dailyBonus:effectiveDaily,focus});
 let reason=city==='auto'?(mount?'Monturas: no existe bono de especialidad; se comparan ciudades Royal para fabricar.':'Se usa la ciudad de especialidad de cada receta.'):city==='compare'?food?'Compara la especialidad en Caerleon frente a Bridgewatch sin especialidad.':'Compara ciudad de especialidad y Caerleon según retorno, transporte y riesgo.':`Ciudad elegida: ${city}.`;
 if(branch.city&&!['auto','compare',branch.city].includes(city))reason+=` No se aplicará bono de especialidad de ${branch.city} si fabricas en ${city}.`;
 const alt=city==='compare'?craftingReturnRate({specialty:false,dailyBonus:effectiveDaily,focus}).returnRate:null;
 const alternative=food?'Bridgewatch':'Caerleon';
 const el=control('craft-rate-preview');if(el)el.innerHTML=`<strong>${city==='compare'?`${r.returnRate.toFixed(1)}% con bono · ${alt.toFixed(1)}% en ${alternative} sin bono`:`${r.returnRate.toFixed(1)}% de retorno esperado`}</strong><span>Producción: ${r.productionBonus}% = base Royal 18% + especialidad ${specialty?15:0}% + diario ${effectiveDaily}% + Focus ${focus?59:0}%. ${mount?'Las monturas no tienen bono de ciudad ni bono diario. ':''}${h(reason)}</span>`;
 const market=control('craft-destination-preview');if(market){
  const v=branchIsRoyalOnly(branch.key)?'royal':val('craft-market','black');
  market.textContent=v==='royal'?'Buscará las mejores ciudades Royal y dividirá las cantidades según precio y ventas observadas.':v==='mixed'?'Comparará Mercado Negro y Royal para cada objeto. Te dirá exactamente cuántas unidades vender en cada destino, usando un solo presupuesto.':'Planificará ventas a órdenes de compra del Mercado Negro. Se contrasta con niveles de compra observados; las órdenes pueden cambiar.';
 }
 const use=control('craft-invest-preview');if(use)use.textContent=val('craft-invest','all')==='all'?'Intentaremos asignar todo el presupuesto sin fabricar objetos con pérdida ni ignorar la liquidez.':'Reservaremos capital y aplicaremos límites más conservadores por objeto y mercado.';
}
function craftPage(){const c=craftPrefs;
 main.innerHTML=`${blockTitle('Tu plan de crafting','Elige lo que quieres hacer. Nosotros calculamos el resto.',`<button class="btn sm" data-action="advanced">✧ Sincronizar diarios</button>`)}
 <form id="craft-form" class="panel craft-wizard">
 <div class="craft-step"><span class="craft-step-num">1</span><div><h3>¿Qué quieres fabricar?</h3><p>Armas, armaduras, recolección, pociones, monturas y comidas. Escoge tu rama y su ciudad.</p></div></div>
 <div class="form-grid craft-step-fields">
 ${branchPicker()}
 ${selectField('¿Dónde fabricar?','craft-city',[['auto','En ciudad de bono de cada objeto'],['compare',categoryForBranch(c.branch)==='foods'?'Comparar Caerleon con Bridgewatch':'Comparar bono vs fabricar en Caerleon'],...CITIES.map(x=>[x,x])],c.city,'span6')}
 </div>
 <div class="craft-step"><span class="craft-step-num">2</span><div><h3>¿Con qué bonificaciones?</h3><p>El retorno de materiales se calcula automáticamente.</p></div></div>
 <div class="form-grid craft-step-fields">
 ${selectField('Bono diario de producción','craft-daily',[[0,'Sin bono diario'],[10,'Bono diario +10%'],[20,'Bono diario +20%']],c.daily,'span6')}
 ${selectField('¿Usar Focus?','craft-focus',[['no','Sin Focus'],['yes','Con Focus']],c.focus,'span6')}
 </div><div class="craft-return-hint" id="craft-rate-preview"></div>
 <div class="craft-step"><span class="craft-step-num">3</span><div><h3>¿Cuánto quieres invertir y dónde vender?</h3><p>Elige el destino y deja que el sistema busque el margen neto y una distribución prudente.</p></div></div>
 <div class="form-grid craft-step-fields">
 ${numberField('Presupuesto en silver','craft-budget',c.budget,1000,1,'span4')}
 <div class="field span4"><label>Reinversión</label><label class="checkbox-row craft-checkbox"><input id="craft-use-wallet" type="checkbox" ${c.useWallet?'checked':''}> No superar el silver disponible en Mi negocio</label></div>
 ${selectField('Uso del presupuesto','craft-invest',[['all','Usar todo lo posible'],['safe','Invertir con cautela']],c.invest,'span4')}
 ${selectField('Destino de venta','craft-market',[['black','Mercado Negro'],['royal','Mejores mercados Royal'],['mixed','Black Market y Royal']],branchIsRoyalOnly(c.branch)?'royal':c.market,'span4')}
 </div><div class="form-grid craft-step-fields" style="margin-top:12px">
 ${selectField('Prioridad del plan','craft-goal',[['balanced','Profit + rotación (recomendado)'],['daily','Priorizar lo que rota bien según mis ventas'],['profit','Mayor beneficio total'],['roi','Mayor ROI (%)'],['focus','Mayor silver por Focus']],c.goal,'span6')}
 ${selectField('Confianza mínima','craft-confidence',[[0,'Mostrar también oportunidades de riesgo'],[45,'Media o alta'],[75,'Solo alta confianza']],c.minConfidence,'span6')}
 </div><div class="craft-simple-notes"><span id="craft-invest-preview"></span><span id="craft-destination-preview"></span></div>
 <details class="craft-advanced"><summary>⚙ Opciones avanzadas (opcional)</summary><div class="form-grid" style="margin-top:17px">
 ${selectField('Tier inicial','craft-tiermin',[1,2,3,4,5,6,7,8].map(x=>[x,'T'+x]),c.tierMin,'span2')}
 ${selectField('Tier final','craft-tiermax',[4,5,6,7,8].map(x=>[x,'T'+x]),c.tierMax,'span2')}
 ${selectField('Encantamiento máximo','craft-ench',[[0,'.0'],[1,'.1'],[2,'.2'],[3,'.3'],[4,'.4']],c.ench,'span2')}
 ${selectField('Comprar materiales en','craft-buy',[['all','Más barato en Royal'],...CITIES.map(x=>[x,x])],c.buy,'span6')}
 ${selectField('Cómo comprar materiales','craft-buy-mode',[['instant','Comprar al precio de venta (inmediato)'],['order','Poner órdenes de compra (no garantizadas)']],c.buyMode,'span6')}
 ${selectField('Forma de venta en Royal','craft-sale-mode',[['listed','Publicar orden de venta'],['instant','Vender inmediatamente']],c.saleMode,'span6')}
 ${numberField('Costo del taller por fabricación/lote','craft-station',c.station,0,1,'span4')}
 ${numberField('Transporte por unidad vendida y trayecto','craft-transport',c.transport,0,1,'span4')}
 ${numberField('Transporte de materiales por unidad fuera de la ciudad de fabricación','craft-mat-shipping',c.matShipping,0,1,'span4')}
 ${numberField('Riesgo estimado de pérdida BM (%)','craft-risk-bm',c.riskBM,0,.1,'span4')}
 ${numberField('Riesgo estimado Royal (%)','craft-risk-royal',c.riskRoyal,0,.1,'span4')}
 ${numberField('Máximo de ventas diarias (%) · 0 = automático','craft-cap',c.cap,0,1,'span4')}
 ${numberField('Tope si no hay historial · unidades','craft-unknown',c.unknown,0,1,'span4')}
 ${numberField('Focus disponible','craft-focus-budget',c.focusBudget,0,1,'span4')}
 ${selectField('Venta al Mercado Negro','craft-bm-mode',[['instant','Vender a órdenes de compra (preferido)'],['listed','Publicar orden de venta (no garantiza venta)']],c.bmMode,'span6')}
 ${numberField('Impuesto Mercado Negro (%)','craft-bm-tax',c.bmTax,0,.1,'span2')}
 ${numberField('Impuesto Royal (%)','craft-royal-tax',c.royalTax,0,.1,'span2')}
 ${numberField('Tarifa de publicación (%)','craft-listing-fee',c.listingFee,0,.1,'span2')}
 <div class="field span6"><label>Demanda BM</label><label class="checkbox-row craft-checkbox"><input type="checkbox" id="craft-require-book" ${c.requireBook?'checked':''}> Solo recomendar con profundidad observada (más conservador)</label></div>
 ${numberField('Focus por craft verificado en juego (0 = usar perfil)','craft-focus-unit',c.focusPerUnit,0,1,'span4')}
 ${selectField('Precios por calidad','craft-quality-mode',[['normal','Solo calidad Normal'],['mix','Mezcla de calidades personalizada']],c.qualityMode,'span4')}
 ${[1,2,3,4,5].map((i)=>numberField(['Normal %','Bueno %','Sobresaliente %','Excelente %','Obra maestra %'][i-1],'craft-q'+i,c['q'+i],0,.1,'span2')).join('')}
 ${numberField('Escenario: caída de precio (%)','craft-price-stress',c.priceStress,0,1,'span4')}
 ${numberField('Escenario: subida de materiales (%)','craft-resource-stress',c.resourceStress,0,1,'span4')}
 <div class="field span6"><label>Diarios de crafting</label><label class="checkbox-row craft-checkbox"><input id="craft-journals" type="checkbox" ${c.journals?'checked':''}> Incluir beneficio de diarios cuando haya precios y datos descargados</label></div>
 </div><div class="notice amber" style="margin-top:14px">Si taller o transporte están en 0, el plan supone que son gratis. Introduce tus tarifas reales antes de invertir. Si utilizas órdenes de compra, el costo estimado tampoco garantiza que se ejecuten.</div><p class="explain" style="margin-top:14px">Los bonos diarios del 10% o 20% solo se aplican si el juego muestra ese bono activo para la rama elegida. La opción Royal compara órdenes observadas y, si existe historial, actividad de órdenes observadas en los últimos 14 días completos (no ventas confirmadas).</p></details>
 <div class="craft-submit"><button class="btn gold craft-main-submit" type="submit">⚒ GENERAR MI PLAN DE CRAFTING</button><span class="muted tiny">Con verificación final antes de comprar materiales.</span></div>
 </form>
 <div class="notice neutral patch-notice"><div><strong>Datos del juego y parches</strong> · Parche contrastado al publicar esta versión: <strong>Dragonfire Patch 4 · 2 nov 2026</strong>. Las recetas se revalidan al consultarlas después de 24 h o manualmente; consulta también <a href="https://albiononline.com/update" target="_blank" rel="noopener noreferrer">los parches oficiales</a> para novedades posteriores.</div><button class="btn sm" type="button" data-action="refresh-game-recipes">↻ Actualizar recetas tras parche</button><span id="recipe-sync-status" class="muted tiny">La API de precios AODP no contiene recetas.</span></div>
 <div id="craft-results" style="margin-top:18px">${state.plan?craftResult(state.plan):empty('Tu plan aparecerá aquí','Verás objetos, tiers, cantidades, mejores mercados y tu lista de compras.')}</div>`;
 if(branchIsRoyalOnly(c.branch))for(const option of control('craft-market').options)option.disabled=option.value!=='royal';
 craftRateHelp();
}
function craftResult(p){const b=p.plan, journalTotals=new Map();
 for(const r of b.rows){if(r.journal?.prices){const key=r.journal.empty;const old=journalTotals.get(key)||{...r.journal,qty:0};old.qty+=r.qty*r.journal.ratio;journalTotals.set(key,old);}}
 const listRows=b.rows.map((r,index)=>`<tr><td>${itemCell(r.id,'',r.personalLearning?.qtySold>=3?`${r.personalLearning.qtySold} vendidas por ti · ${r.personalLearning.averageDays.toFixed(1)} días medios`:r.id)}</td><td><strong>T${itemTier(r.id)}.${itemEnch(r.id)}</strong></td><td class="main-city">${h(r.craftCity)}</td><td>${r.city==='Black Market'?'<span class="pill amber">Mercado Negro</span>':'<span class="pill green">Royal</span>'}</td><td>${h(r.city==='Black Market'?'Caerleon · Mercado Negro':r.city)}</td><td>${r.mode==='instant'?'Inmediata':'Orden de venta'}</td><td><input class="qty-input" type="number" data-plan-qty="${index}" min="0" max="${Number.isFinite(r.maxCrafts)?r.maxCrafts:999999}" step="1" value="${r.qty}" aria-label="Fabricaciones de ${h(itemName(r.id))}"></td><td><strong>${fmt(r.qty*(r.craftAmount||1))}</strong></td><td>${r.returnRate.toFixed(1)}%</td><td>${moneyCell(r.sell)}</td><td>${moneyCell(r.profit,r.profit>=0?'positive':'negative')}</td><td>${moneyCell(r.totalProfit,'positive')}</td><td>${r.activity?.observations?fmt(r.activity.activeDays)+' / 14 días · '+short(r.activity.observedDaily)+'/día observado':'Sin observaciones'}</td><td>${r.mode==='instant'?(r.depthVerified?`<span class="pill green">${h(r.bookCoverage||'Libro observado')}</span>`:`<span class="pill amber">${r.city==='Black Market'?'1 provisional':'Profundidad no verificada'}</span>`):'<span class="pill amber">Venta no garantizada</span>'}</td><td><span class="pill ${r.confidence?.tone||'red'}" title="${h((r.confidence?.reasons||[]).join(' · '))}">${h(r.confidence?.label||'Baja')} (${r.confidence?.score||0})</span></td><td>${moneyCell(r.stressProfit,r.stressProfit>=0?'positive':'negative')}</td><td>${r.focusPerUnit?fmt(r.focusPerUnit):'—'}</td><td>${moneyCell(breakEvenPrice(r))}</td><td>${r.competition?.known?`${fmt(r.competition.unitsAhead)} unidades delante · ${h(r.competition.risk)}`:'Sin datos de competencia'}</td><td><button class="btn sm ghost" data-action="watch-route" data-index="${index}" title="Crear alerta basada en esta ruta">◉ Alerta</button></td></tr>`).join('');
 const mats=b.materials.sort((a,b)=>a.city.localeCompare(b.city)||a.id.localeCompare(b.id)).map(m=>`<tr><td>${itemCell(m.id)}</td><td><strong>${fmt(Math.ceil(m.qtyGross))}</strong></td><td>${fmt(Math.ceil(m.qtyNet))}</td><td>${h(m.city||'—')}</td><td>${moneyCell(m.unitPrice)}</td><td>${moneyCell(Math.ceil(m.qtyGross)*m.unitPrice)}</td></tr>`).join('');
 const cities=b.cities.map(c=>`<tr><td>${c.city==='Black Market'?'<span class="pill amber">Mercado Negro</span>':'<span class="pill green">Royal</span>'}</td><td><strong>${h(c.city==='Black Market'?'Caerleon · Mercado Negro':c.city)}</strong></td><td>${fmt(c.qty)}</td><td>${fmt(c.products)}</td><td>${moneyCell(c.capital)}</td><td>${moneyCell(c.profit,'positive')}</td></tr>`).join('');
 const journals=(b.journalSummary?.items||[]).map(j=>`<tr><td>${itemCell(j.empty,j.name+' T'+j.tier)}</td><td><strong>${fmt(j.qty)}</strong></td><td>${fmt(j.full)} completos · ${j.partial} parcial</td><td>${h(j.buyCity)}</td><td>${moneyCell(j.purchaseCost)}</td><td>${j.exact?'<span class="pill green">Datos del juego</span>':'<span class="pill amber">Fama estimada</span>'}</td></tr>`).join('');
 const usedPct=p.budget?Math.min(100,b.totalCost/p.budget*100):0;
 const marketLabel=p.market==='royal'?'Royal':p.market==='mixed'?'Mercado Negro + Royal':'Mercado Negro';
 const totals={black:{qty:0,profit:0},royal:{qty:0,profit:0}};
 for(const r of b.rows){const t=r.city==='Black Market'?'black':'royal';totals[t].qty+=r.qty*(r.craftAmount||1);totals[t].profit+=r.totalProfit;}
 const mixedStats=p.market==='mixed'?`<div class="col-6">${stat('Destino: Mercado Negro',fmt(totals.black.qty)+' unidades','Profit estimado '+short(totals.black.profit),'gold','♜')}</div><div class="col-6">${stat('Destino: Royal',fmt(totals.royal.qty)+' unidades','Profit estimado '+short(totals.royal.profit),'jade','⌂')}</div>`:'';
 const missedSide=p.market==='mixed'&&b.rows.length&&(totals.black.qty===0||totals.royal.qty===0)?`<div class="col-12"><div class="notice neutral">${totals.black.qty===0?'No se asignaron unidades al Mercado Negro':'No se asignaron unidades a Royal'}. No hubo oportunidades rentables, con precios recientes y capacidad de presupuesto suficientes para incluir ambos destinos. No se inventan ventas para completar la distribución.</div></div>`:'';
 const context=`${h(p.branch)} · ${p.city==='auto'?'Bono de cada ciudad':p.city==='compare'?'Bono vs Caerleon':h(p.city)} · bono diario ${p.daily}% · ${p.focus?'con Focus':'sin Focus'} · ${marketLabel}`;
 return `<div class="page-grid"><div class="col-12"><div class="craft-summary"><div><span class="kicker">TU PLAN PERSONALIZADO</span><h3>${context}</h3><p>Precios observados, retorno esperado y cantidades limitadas por la liquidez disponible. No se garantizan ventas ni márgenes futuros.</p></div><div class="button-row"><button class="btn gold sm" data-action="save-investment" ${!b.rows.length?'disabled':''}>▤ Guardar como inversión</button><button class="btn sm" data-action="export-plan" ${!b.rows.length?'disabled':''}>↓ CSV del plan</button><button class="btn sm ghost" data-action="export-shopping" ${!b.rows.length?'disabled':''}>↓ Compras y diarios</button><button class="btn sm green" data-action="preflight" ${!b.rows.length?'disabled':''}>✓ Verificar antes de comprar</button></div></div></div>
 <div class="col-3">${stat('Capital necesario',short(b.totalCost),'Compra bruta y gastos · límite '+short(p.budget),'gold','◈')}</div><div class="col-3">${stat('Profit estimado',short(b.totalProfit),'Incluye retorno esperado','jade','↗')}</div><div class="col-3">${stat('Unidades a vender',fmt(b.rows.reduce((s,x)=>s+x.qty*(x.craftAmount||1),0)),b.rows.length+' rutas de venta','blue','⚒')}</div><div class="col-3">${stat('Presupuesto restante',short(b.remaining),p.invest==='all'?'Sin oportunidades verificables adicionales':'Reserva sin asignar','','◎')}</div>
 ${mixedStats}${missedSide}
 <div class="col-12"><div class="notice neutral"><strong>Economía del lote:</strong> capital bruto ${short(b.totalCost)} para comenzar · consumo neto esperado ${short(b.totalNetCost)} · profit proyectado ${short(b.totalProfit)}. La devolución de materiales depende del juego. ${p.solverMethod||''}. ${p.useWallet?'Este plan respeta el silver libre registrado en Mi negocio.':''}</div></div>
 <div class="col-12"><div id="preflight-results">${state.preflight?preflightResult(state.preflight):'<div class="notice neutral">Antes de comprar materiales, pulsa «Verificar antes de comprar» para recargar cotizaciones y órdenes sin confiar en la caché horaria.</div>'}</div></div>
 <div class="col-12"><div class="panel"><div class="toggleline"><h3 class="subheading">Lista exacta: qué fabricar y dónde vender</h3><span class="pill green">${b.rows.length} rutas · cantidades editables</span></div><div class="table-scroll">${listRows?`<table class="data-table"><thead><tr><th>Objeto</th><th>Tier</th><th>Fabricar</th><th>Mercado</th><th>Vender en</th><th>Tipo de venta</th><th>Fabricaciones</th><th>Unidades para vender</th><th>RRR</th><th>Precio por unidad</th><th>Profit por fabricación</th><th>Profit total</th><th>Actividad 14d (no ventas)</th><th>Libro de órdenes</th><th>Confianza</th><th>Profit estrés/fabricación</th><th>Focus/fabricación</th><th>Precio equilibrio/u</th><th>Competencia Royal</th><th>Alerta</th></tr></thead><tbody>${listRows}</tbody></table>`:empty('Sin candidatos rentables y verificables','Amplía tiers, cambia mercado o revisa si tu ciudad realmente tiene bono para la rama.')}</div></div></div>
 <div class="col-8"><div class="panel"><h3 class="subheading">🧺 Lista de compras para comenzar</h3><div class="table-scroll">${mats?`<table class="data-table"><thead><tr><th>Material</th><th>Comprar (bruto)</th><th>Consumo esperado</th><th>Ciudad de compra</th><th>Precio/u</th><th>Total bruto</th></tr></thead><tbody>${mats}</tbody></table>`:empty('Sin materiales')}</div><p class="explain">Compra las cantidades <strong>brutas</strong>. El retorno de recursos no ocurre antes de fabricar y se estima para varias fabricaciones; las cantidades netas no son una lista de compra inicial. Si usas diarios, presupuestar diarios enteros puede requerir capital adicional.</p></div></div>
 <div class="col-4"><div class="panel"><h3 class="subheading">Uso del presupuesto y riesgo</h3><div class="progress-track"><div class="progress-fill" style="width:${usedPct}%"></div></div><div class="cost-row"><span>Comprometido</span><strong>${short(b.totalCost)} (${usedPct.toFixed(1)}%)</strong></div><div class="cost-row"><span>Restante</span><strong>${short(b.remaining)}</strong></div><div class="cost-row"><span>Costo neto esperado</span><strong>${short(b.totalNetCost)}</strong></div><div class="cost-row"><span>Diarios vacíos a comprar</span><strong>${short(b.journalSummary?.cost||0)}</strong></div><div class="cost-row"><span>Profit bajo estrés</span><strong>${short(b.rows.reduce((s,r)=>s+r.stressProfit*r.qty,0))}</strong></div><div class="cost-row total"><span>ROI sobre capital bruto</span><strong>${b.totalCost?(100*b.totalProfit/b.totalCost).toFixed(1)+'%':'—'}</strong></div><div class="notice neutral" style="margin-top:16px">${p.invest==='all'?'Modo presupuesto completo: intenta asignar el máximo posible con profit y límites de demanda válidos.':'Modo cautela: máximo 30% del capital por objeto.'} <strong>El riesgo incluye precio de venta -${p.priceStress}% y materiales +${p.resourceStress}%. No se fuerzan compras ni se supone que las órdenes observadas se venderán.</strong></div></div></div>
 <div class="col-12"><div class="panel"><h3 class="subheading">Distribución de ventas ${marketLabel}</h3><div class="table-scroll">${cities?`<table class="data-table"><thead><tr><th>Tipo</th><th>Destino</th><th>Unidades para vender</th><th>Rutas</th><th>Capital</th><th>Profit estimado</th></tr></thead><tbody>${cities}</tbody></table>`:empty('Sin destinos')}</div><p class="explain">${p.market==='royal'?'El plan considera precios de las ciudades Royal y hasta 3 mercados por objeto, priorizando precios netos y ventas observadas. Los registros históricos no garantizan que una orden futura se venda.':p.market==='mixed'?'Mercado Negro usa niveles de órdenes de compra observadas cuando los hay; sin niveles verificados, limita a 1 craft provisional por objeto. Las cantidades pueden desaparecer antes de vender. Las rutas Royal usan precios y ventas históricas por ciudad, con hasta tres destinos por objeto. El capital y los recursos solo se cuentan una vez por unidad fabricada.':'AODP no confirma el volumen ni profundidad actual de todas las órdenes del Mercado Negro. Se aplica un tope de unidades por variante y no se presenta una demanda inventada.'}</p></div></div>
 <div class="col-12"><div class="panel"><h3 class="subheading">Diarios de crafting por tier y profesión</h3>${journals?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Diario vacío</th><th>Comprar</th><th>Se llenan</th><th>Ciudad de compra</th><th>Capital estimado</th><th>Exactitud</th></tr></thead><tbody>${journals}</tbody></table></div>`:`<div class="notice neutral">${p.journals?'No se pudo inferir la profesión o fama del diario en este plan. No se inventan cantidades.':'Puedes activar diarios en Opciones avanzadas.'}</div>`}<p class="explain">Diarios enteros presupuestados por profesión. Cuando no se conoce la fama exacta se usa una estimación, y el precio de trabajador es solo referencia si falta cotización. El profit no incluye vender diarios llenos sin precio válido. Cambia cantidades arriba para recalcular diarios, presupuesto y recursos.</p></div></div>
 <div class="col-12"><details class="panel craft-candidates"><summary>Otras oportunidades de la rama (opcional)</summary><p class="explain">Puedes añadir una unidad si hay presupuesto y capacidad. Las rutas sin precio reciente no se recomiendan.</p><div class="candidate-grid">${(p.availableCandidates||[]).filter(x=>!b.rows.some(r=>r.id===x.id&&r.city===x.city&&r.craftCity===x.craftCity)&&x.profit>0).slice(0,24).map((x,i)=>`<div class="candidate-item">${itemimg(x.id,36)}<div><strong>${h(itemName(x.id))}</strong><small>${h(x.city)} · ${fmt(x.profit)} silver/fabricación · ROI ${x.roi.toFixed(1)}%</small></div><button class="btn sm ghost" data-action="add-route" data-route-key="${h(x.id+'|'+x.city+'|'+x.craftCity)}">+ 1</button></div>`).join('')||'<p class="muted tiny">No hay más candidatos rentables con los filtros actuales.</p>'}</div></details></div>
 ${p.warning?`<div class="col-12"><div class="notice red">${h(p.warning)}</div></div>`:''}
 <div class="col-12"><div class="notice neutral">Las cantidades se pueden modificar en la tabla: al hacerlo se recalculan materiales, presupuesto y diarios sin volver a consultar la API. La columna «Actividad 14d» son <strong>unidades de órdenes observadas</strong> en AODP, no ventas verificadas. Los días para vender no pueden garantizarse con esta fuente. La calidad del escenario es ${h(p.qualityMode)}, los traslados de recursos se valoran a ${moneyCell(craftPrefs.matShipping||0)} silver/unidad fuera de la ciudad de fabricación, y la compra se presupuestó mediante ${p.buyMode==='order'?'órdenes de compra (no aseguradas)':'compra inmediata'}.</div><p class="explain">${fmt(p.scanned)} recetas examinadas. Para pociones y comidas, cada fabricación puede producir varias unidades: el cálculo usa el tamaño del lote declarado por el juego.  Cantidades editables en <strong>fabricaciones</strong>; la columna unidades indica el producto total, importante para pociones. Retornos calculados desde producción Royal 18% + especialidad 15% (solo cuando corresponde) + bono diario ${p.daily}% + ${p.focus?'59% de Focus':'0% de Focus'}. Margen neto después de tarifas configuradas y coste de transporte, sin garantizar precio ejecutable ni materiales disponibles en volumen. Precios filtrados por antigüedad máxima de ${prefs.maxAge} horas.</p></div></div>`;
}
function refinePage(){main.innerHTML=`${blockTitle('Refinamiento inteligente','Cálculo de 1 unidad refinada, comparando materias primas, refinado previo y retorno.')}<form id="refine-form" class="panel"><div class="form-grid">
 ${selectField('Material','refine-mat',[['WOOD','Madera → Tablones'],['ORE','Mineral → Lingotes'],['FIBER','Fibra → Tela'],['HIDE','Piel → Cuero'],['ROCK','Piedra → Bloques']],'ORE','span4')}
 ${selectField('Tier a producir','refine-tier',[4,5,6,7,8].map(x=>[x,'T'+x]),5,'span2')}
 ${selectField('Encantamiento','refine-ench',[0,1,2,3].map(x=>[x,'.'+x]),0,'span2')}
 ${selectField('Vender en','refine-city',[['auto','Mejor Royal'],...CITIES.map(x=>[x,x])],'auto','span4')}
 ${selectField('Comprar materiales','refine-buy',[['all','Royal más barato'],...CITIES.map(x=>[x,x])],'all','span4')}
 ${numberField('Retorno de recursos (%)','refine-rrr',36.7,0,.1,'span4')}
 ${numberField('Taller por unidad','refine-fee',0,0,1,'span4')}
 </div><div class="button-row" style="margin-top:19px"><button type="submit" class="btn gold">▦ Calcular refinamiento</button><span class="muted tiny">Sin Focus: configura tu retorno real. Con Focus: introduce el retorno que indica el juego.</span></div></form><div class="notice neutral" style="margin-top:13px">Receta base usada: T4 = 2 recursos sin refinar + 1 del tier anterior; T5 = 3 + 1; T6 = 4 + 1; T7 y T8 = 5 + 1. El cálculo puede no cubrir recetas alternativas, tokens o cambios de parche.</div><div id="refine-results" style="margin-top:18px">${state.refine?refineResult(state.refine):empty('Calcula tu refinamiento','Verás el costo del material, el retorno y el margen en cada Royal.')}</div>`;}
function refineResult(d){const rows=d.rows.map(x=>`<tr><td>${h(x.city)}</td><td>${moneyCell(x.price)}</td><td>${moneyCell(x.cost)}</td><td>${moneyCell(x.profit,x.profit>0?'positive':'negative')}</td><td>${x.roi.toFixed(1)}%</td><td>${agePill(x.q)}</td></tr>`).join('');
 return `<div class="page-grid"><div class="col-4">${stat('Costo unidad',fmt(d.cost),'Materiales con RRR + tarifa','gold','◈')}</div><div class="col-4">${stat('Mejor profit',d.rows.length?fmt(d.rows[0].profit):'—',d.rows[0]?.city||'Sin precio reciente','jade','↗')}</div><div class="col-4">${stat('ROI',d.rows.length?d.rows[0].roi.toFixed(1)+'%':'—','Estimación por unidad','blue','%')}</div><div class="col-5"><div class="panel"><div class="item-heading">${itemimg(d.output,64)}<div><h3>${h(itemName(d.output))}</h3><small>${h(d.output)}</small></div></div><div class="divider"></div>${d.parts.map(p=>`<div class="cost-row"><span>${h(itemName(p.id))} × ${p.qty}</span><strong>${fmt(p.qty*p.price)}</strong></div>`).join('')}<div class="cost-row"><span>Retorno (${d.rrr}%)</span><strong>− ${fmt(d.rawCost-d.refundCost)}</strong></div><div class="cost-row"><span>Tarifa del taller</span><strong>${fmt(d.fee)}</strong></div><div class="cost-row total"><span>Costo esperado</span><strong>${fmt(d.cost)}</strong></div></div></div><div class="col-7"><div class="panel"><h3 class="subheading">Mercados de venta</h3><div class="table-scroll">${rows?`<table class="data-table"><thead><tr><th>Mercado</th><th>Vender (orden)</th><th>Costo</th><th>Profit</th><th>ROI</th><th>Antigüedad</th></tr></thead><tbody>${rows}</tbody></table>`:empty('No hay datos recientes')}</div><p class="explain">Venta instantánea al precio de la mejor orden de compra; comisión configurada aplicada. El retorno es valor esperado. No se incluye transportar materiales entre ciudades a menos que se añada en Ajustes.</p></div></div></div>`;
}
function enchantPage(){main.innerHTML=`${blockTitle('Calculadora de encantamiento','Compara el costo de encantar un objeto frente a comprar directamente su versión encantada.')}
 <form id="enchant-form" class="panel"><div class="form-grid">
 ${field('Objeto base (ID exacto)','enchant-item',`<input class="input" id="enchant-item" value="T4_SHOES_PLATE_SET1" placeholder="Ej. T4_SHOES_PLATE_SET1">`,'span4')}
 ${selectField('Encantar hasta','enchant-level',[[1,'.1 con runas'],[2,'.2 con almas'],[3,'.3 con reliquias']],1,'span2')}
 ${numberField('Unidades de runas/almas/reliquias','enchant-count',0,0,1,'span4')}
 ${selectField('Ciudad','enchant-city',CITIES,'Caerleon','span2')}
 </div><p class="explain">La cantidad de runas/almas/reliquias depende del objeto; <strong>debes introducir la cantidad exacta que indica el juego</strong>. El valor 0 no genera un beneficio ficticio.</p><button class="btn gold" type="submit">✧ Comparar costos</button></form>
 <div id="enchant-results" style="margin-top:18px">${state.enchant?enchantResult(state.enchant):empty('Compara un encantamiento','Introduce el ID base y la cantidad de recursos de encantamiento.')}</div>`;}
function enchantResult(x){return `<div class="page-grid"><div class="col-4">${stat('Comprar encantado',fmt(x.enchPrice),'Venta mínima del objeto '+x.target,'gold','◈')}</div><div class="col-4">${stat('Encantar tú',fmt(x.total),'Costo base + recursos','blue','✧')}</div><div class="col-4">${stat('Ahorro estimado',fmt(x.enchPrice-x.total),x.enchPrice>x.total?'Conviene encantar':'Conviene comprar encantado',x.enchPrice>x.total?'jade':'red','↗')}</div><div class="col-12"><div class="panel"><div class="item-heading">${itemimg(x.target,64)}<div><h3>${h(itemName(x.target))}</h3><small>${h(x.target)} · ${h(x.city)}</small></div></div><div class="divider"></div><div class="cost-row"><span>Objeto base (${h(x.base)})</span><strong>${fmt(x.basePrice)}</strong></div><div class="cost-row"><span>${h(itemName(x.resource))} × ${x.qty}</span><strong>${fmt(x.runePrice*x.qty)}</strong></div><div class="cost-row total"><span>Costo de encantamiento</span><strong>${fmt(x.total)}</strong></div><p class="explain">Comparación de precio de compra instantánea. No incluye posibles tarifas adicionales o desperdicio. Ambas cotizaciones deben ser recientes.</p></div></div></div>`;}
function transmutePage(){main.innerHTML=`${blockTitle('Transmutación de recursos','Compara comprar directamente un recurso de tier superior frente a transmutarlo. Usa el costo real mostrado por el juego.')}
 <form id="transmute-form" class="panel"><div class="form-grid">
 ${selectField('Familia de recurso','transmute-family',[['ORE','Mineral'],['WOOD','Madera'],['FIBER','Fibra'],['HIDE','Piel'],['ROCK','Piedra']],'ORE','span4')}
 ${selectField('Tier objetivo','transmute-tier',[5,6,7,8].map(t=>[t,'T'+t]),5,'span2')}
 ${selectField('Ciudad','transmute-city',CITIES,'Caerleon','span4')}
 ${numberField('Recursos previos necesarios','transmute-qty',0,0,1,'span2')}
 ${numberField('Costo real de transmutar (silver/u)','transmute-fee',0,0,1,'span2')}
 </div><div class="notice neutral" style="margin:17px 0">Introduce el precio exacto de transmutación que aparece en tu juego. La app no presume una tarifa universal, ya que puede variar según el recurso y las reglas del juego.</div><button class="btn gold" type="submit">⬡ Comparar transmutación</button></form>
 <div id="transmute-results" style="margin-top:18px">${state.transmute?transmuteResult(state.transmute):empty('Calcula tus costos de transmutación','Los valores de mercado se obtienen de AODP; tú controlas la tarifa del juego.')}</div>`;}
function transmuteResult(x){return `<div class="page-grid"><div class="col-4">${stat('Compra directa',fmt(x.toPrice),'Una unidad de '+x.to,'gold','◈')}</div><div class="col-4">${stat('Transmutación',fmt(x.total),'Recurso anterior + tarifa','blue','⬡')}</div><div class="col-4">${stat('Ahorro',fmt(x.toPrice-x.total),'Directo menos transmutado',x.toPrice>x.total?'jade':'red','↗')}</div>
 <div class="col-12"><div class="panel"><div class="cost-row"><span>${h(itemName(x.from))} comprado en ${h(x.city)}</span><strong>${fmt(x.fromPrice)} × ${x.qty}</strong></div><div class="cost-row"><span>Tarifa de transmutación por unidad</span><strong>${fmt(x.fee)}</strong></div><div class="cost-row total"><span>Costo transmutado</span><strong>${fmt(x.total)}</strong></div><div class="cost-row"><span>Venta instantánea del resultado (neto)</span><strong>${fmt(x.bid*(1-prefs.tax/100))}</strong></div><div class="cost-row"><span>Profit potencial después de tarifa de venta</span><strong style="color:${x.profit>=0?'var(--jade)':'var(--red)'}">${fmt(x.profit)}</strong></div><p class="explain">Comparación para una unidad, con la cantidad de recursos previos que introdujiste. Confirma en el juego que la transformación seleccionada existe; no es una simulación de recetas ni de rendimiento del taller.</p></div></div></div>`;}
function settingsPage(){main.innerHTML=`${blockTitle('Ajustes y datos','Parámetros para adaptar los cálculos a tu economía y la actividad de cada servidor.')}
 <form id="settings-form" class="panel"><h3 class="subheading">Economía</h3><div class="form-grid">
 ${selectField('Servidor','settings-server',[['west','América (West)'],['europe','Europa'],['east','Asia (East)']],prefs.region,'span4')}
 ${selectField('Tipo de cuenta','settings-premium',[['premium','Premium'],['free','Sin Premium']],prefs.premium?'premium':'free','span4')}
 ${numberField('Máxima edad de cotización (horas)','settings-age',prefs.maxAge,1,1,'span4')}
 ${numberField('Tarifa del mercado (%)','settings-tax',prefs.tax,0,.1,'span4')}
 ${numberField('Tarifa de publicar orden (%)','settings-setup',prefs.setup,0,.1,'span4')}
 ${numberField('Transporte por unidad (silver)','settings-shipping',prefs.transport,0,100,'span4')}
 ${numberField('RRR de crafting (%)','settings-rrr',prefs.rrr,0,.1,'span4')}
 ${numberField('Taller por unidad (silver)','settings-station',prefs.station,0,100,'span4')}
 </div><div class="button-row" style="margin-top:19px"><button class="btn gold" type="submit">✓ Guardar ajustes</button><button class="btn danger" type="button" data-action="clear-cache">Eliminar caché de precios</button></div></form>
 <div class="page-grid" style="margin-top:18px"><div class="col-7"><div class="panel"><h3 class="subheading">Catálogo del juego y diarios</h3><div class="cost-row"><span>Objetos traducidos</span><strong>${fmt(Object.keys(names).length)}</strong></div><div class="cost-row"><span>Recetas extraídas del juego</span><strong>${fmt(Object.keys(recipes).length)}</strong></div><div class="cost-row"><span>Fama para diarios</span><strong>${state.fullCatalog?'Activada':'No descargada'}</strong></div><div class="cost-row"><span>Entradas locales de API</span><strong>${cachedCount()}</strong></div><div class="button-row" style="margin-top:18px"><button class="btn" data-action="sync-catalog">↻ Actualizar catálogo</button><button class="btn" data-action="refresh-game-recipes">♨ Actualizar recetas del juego</button><button class="btn" data-action="advanced">✧ Descargar diarios avanzados</button></div><div id="settings-info" class="muted tiny" style="margin-top:10px">Catálogo ligero ~2 MB · Diarios avanzados usan datos completos del juego (~24 MB).</div></div></div>
 <div class="col-5"><div class="panel"><h3 class="subheading">Cómo funciona el refresco horario</h3><p class="explain">1. Cada consulta guarda el resultado durante una hora. 2. Transcurrida una hora se solicita otra instantánea a AODP. 3. La página abierta repite la actualización cada hora. 4. Si estás sin conexión o la API limita peticiones, se muestra el último dato existente con su antigüedad real.</p><div class="notice neutral"><strong>Importante:</strong> ni el navegador ni AODP garantizan nuevos precios cada hora en cada mercado. Los precios solo cambian cuando la comunidad los observa.</div></div></div>
 <div class="col-12"><div class="panel"><h3 class="subheading">Diagnóstico de imágenes de Albion</h3><p class="explain">Las fotos se buscan en el CDN alternativo, el proxy de Netlify y el render oficial; si fallan, se muestra una imagen local de respaldo. No depende de la API de precios.</p><div class="button-row"><button class="btn" data-action="test-icons" type="button">▣ Comprobar servidores de imágenes</button></div><div id="icon-diagnostics" class="muted tiny" aria-live="polite" style="margin-top:12px">Puedes verificar la conexión de los iconos desde este navegador.</div></div></div>
 <div class="col-12"><div class="panel"><h3 class="subheading">Fuentes del proyecto</h3><p class="explain">Precios e historial: <a target="_blank" rel="noopener" href="https://west.albion-online-data.com/api-docs">Albion Online Data Project (AODP)</a>. Catálogo de nombres y recetas: <a target="_blank" rel="noopener" href="https://github.com/vkorne-web/albion-market">albion-market</a>, extraído de <a target="_blank" rel="noopener" href="https://github.com/ao-data/ao-bin-dumps">ao-bin-dumps</a>. Esta es una herramienta de fans, no oficial, sin afiliación con Albion Online ni con los desarrolladores de Albion Multi App.</p></div></div></div>`;}
async function runLookup(force=false){const t=val('item-search',state.id).trim();let id=state.id;
 if(t===itemName(state.id)){id=state.id;}else if(/^T\d+_[A-Z\d_]+(?:@\d)?$/i.test(t)){id=t.toUpperCase();}else if(t){const found=findItems(t,1)[0];if(found)id=found.id;else return showToast('Selecciona un objeto del buscador o introduce su ID',true);}
 if(!id)return showToast('Introduce un objeto',true);
 state.id=id;state.query=itemName(id);setBusy('market-results');
 try{const response=await prices([id],prefs.region,force);updateStatus(response);state.market={id,...response};control('market-results').innerHTML=marketResult(state.market);}
 catch(e){control('market-results').innerHTML=errorText(e);showToast(e.message,true);}}
function commonIds(kind){
 if(kind==='resources')return [4,5,6,7,8].flatMap(t=>['METALBAR','PLANKS','CLOTH','LEATHER','STONEBLOCK'].map(s=>'T'+t+'_'+s));
 if(kind==='luxury'){const ids=Object.keys(names).filter(s=>/^(T[4-8]_)?(TREASURE_|LUXURY_)/.test(s)).slice(0,65);return ids.length?ids:['TREASURE_SILVERWARE_RARITY1','TREASURE_TRIBAL_RARITY1','TREASURE_AVALON_RARITY1'];}
 if(kind==='boots'||kind==='black'){let ids=craftable(kind==='boots'?'botas':'todo',4,7,2,64);if(ids.length)return ids;}
 const ids=['T4_BAG','T5_BAG','T6_BAG','T7_BAG','T4_CAPE','T5_CAPE','T6_CAPE',...['SHOES_PLATE_SET1','SHOES_LEATHER_SET1','SHOES_CLOTH_SET1','HEAD_PLATE_SET1','HEAD_CLOTH_SET2','ARMOR_CLOTH_SET2','ARMOR_PLATE_SET1','MAIN_SWORD','MAIN_AXE','2H_BOW'].flatMap(s=>[4,5,6].map(t=>'T'+t+'_'+s))];
 return ids.slice(0,65);
}
async function runTrade(force=false){const kind=val('trade-kind','popular'),dest=val('trade-dest','all');const minROI=num('trade-roi',5),minProfit=num('trade-minprofit',500);const ids=commonIds(kind);
 if(!ids.length)return showToast('No hay objetos disponibles en ese grupo',true);
 setBusy('trade-results','Comparando '+ids.length+' objetos entre las ciudades…');
 try{const r=await prices(ids,prefs.region,force);updateStatus(r);const map=rowMap(r.rows);
 let all=topTrades(map,ids,{maxAge:prefs.maxAge,tax:prefs.tax/100,setup:prefs.setup/100,transport:prefs.transport,destinations:dest==='all'?(kind==='black'?['Black Market']:ALL_CITIES):[dest]}).filter(x=>x.roi>=minROI&&x.profit>=minProfit);
 if(kind==='black')all=all.filter(x=>x.to==='Black Market');
 state.trade={all,count:ids.length,cached:r.cached,warning:r.warning};control('trade-results').innerHTML=tradeResult(state.trade);
 }catch(e){control('trade-results').innerHTML=errorText(e);showToast(e.message,true);}}
function calcInputs(){const tierMin=num('craft-tiermin',4),tierMax=num('craft-tiermax',7);
 if(tierMin>tierMax)throw Error('El tier inicial no puede superar al final.');
 const selectedBranch=val('craft-branch','boots_plate');
 return {branch:selectedBranch,city:val('craft-city','auto'),daily:num('craft-daily',0),focus:val('craft-focus','no')==='yes',budget:num('craft-budget',10000000),invest:val('craft-invest','all'),market:branchIsRoyalOnly(selectedBranch)?'royal':val('craft-market','black'),tierMin,tierMax,ench:num('craft-ench',1),buy:val('craft-buy','all'),buyMode:val('craft-buy-mode','instant'),goal:val('craft-goal','balanced'),minConfidence:num('craft-confidence',0),focusBudget:num('craft-focus-budget',10000),focusPerUnit:num('craft-focus-unit',0),qualityMode:['mounts','potions','foods'].includes(categoryForBranch(selectedBranch))?'normal':val('craft-quality-mode','normal'),qualityWeights:[1,2,3,4,5].map(i=>num('craft-q'+i,i===1?100:0)),priceStress:num('craft-price-stress',8),resourceStress:num('craft-resource-stress',7),riskBM:num('craft-risk-bm',0),riskRoyal:num('craft-risk-royal',0),matShipping:num('craft-mat-shipping',0),bmTax:num('craft-bm-tax',2.5),royalTax:num('craft-royal-tax',4),listingFee:num('craft-listing-fee',2.5),bmMode:val('craft-bm-mode','instant'),requireBook:checked('craft-require-book'),useWallet:checked('craft-use-wallet'),saleMode:val('craft-sale-mode','listed'),station:num('craft-station',0),transport:num('craft-transport',0),cap:num('craft-cap',0),unknownCap:num('craft-unknown',2),journals:!['mounts','potions','foods'].includes(categoryForBranch(selectedBranch))&&checked('craft-journals')};}
function getMaterialFinder(map,input,craftCity=''){return id=>{const allowed=input.buy==='all'?CITIES:[input.buy];let best=null;
 const side=input.buyMode==='order'?'buy_price_max':'sell_price_min';
 for(const city of allowed){const q=quote(map,id,city,side,prefs.maxAge);if(!q)continue;const fee=input.buyMode==='order'?prefs.setup/100:0;const effective=q.price*(1+fee)+(city!==craftCity?input.matShipping:0);if(!best||effective<best.price)best={...q,price:effective,originalPrice:q.price,city,mode:input.buyMode,shippingPerUnit:city!==craftCity?input.matShipping:0};}return best;};}
async function runCraft(force=false){
 state.preflight=null;
 let input;
 try{
  input=calcInputs();
  if(!Number.isSafeInteger(input.budget)||input.budget<1000)throw Error('Introduce un presupuesto válido desde 1.000 silver.');
  if(input.useWallet){const wallet=cashPosition(loadWallet(),loadPortfolios());if(!wallet.configured)throw Error('Para reinvertir, introduce tu capital inicial en Mi negocio.');input.budget=Math.min(input.budget,Math.floor(wallet.available));if(input.budget<1000)throw Error('El silver libre de tu negocio es insuficiente para generar otro plan.');}
  if(![0,10,20].includes(input.daily))throw Error('El bono diario debe ser 0%, 10% o 20%.');
  if(!['balanced','daily','profit','roi','focus'].includes(input.goal))throw Error('Prioridad del plan no reconocida');
  if(input.cap<0||input.cap>100||input.unknownCap<0||!Number.isInteger(input.unknownCap))throw Error('Límite de volumen inválido');
  if([input.bmTax,input.royalTax,input.listingFee].some(x=>x<0||x>30))throw Error('Las tarifas de venta deben estar entre 0% y 30%.');
  if(input.matShipping<0||input.station<0||input.transport<0||input.focusBudget<0||input.focusPerUnit<0||input.riskBM<0||input.riskBM>100||input.riskRoyal<0||input.riskRoyal>100)throw Error('Gastos, Focus o riesgo fuera de rango');
  if(input.priceStress<0||input.priceStress>80||input.resourceStress<0||input.resourceStress>100)throw Error('Escenario de riesgo fuera de rango');
  if(input.qualityMode==='mix'&&Math.abs(input.qualityWeights.reduce((a,b)=>a+b,0)-100)>.001)throw Error('Los porcentajes de calidad deben sumar exactamente 100%.');
  if(input.goal==='focus'&&!input.focus)throw Error('Para maximizar silver/Focus, activa la opción Con Focus.');
  const profile=loadFocusProfile();
  if(input.focus&&!input.focusPerUnit&&!Object.values(profile).some(x=>Number(x.focus)>0))throw Error('Para evitar una recomendación falsa, introduce el Focus por craft que marca el juego, o guarda los valores por objeto en Focus y specs.');
 }catch(e){return showToast(e.message,true);}
 saveCraftPrefs({...input,budget:num('craft-budget',input.budget),focus:input.focus?'yes':'no',...Object.fromEntries(input.qualityWeights.map((x,i)=>['q'+(i+1),x]))});
 if(!Object.keys(recipes).length)return showToast('Todavía estamos descargando el catálogo de recetas.',true);
 const branch=branchByKey(input.branch);
 if(branchIsRoyalOnly(input.branch)){
  setBusy('craft-results','Cargando recetas reales del juego para '+branch.label+'…');
  try{await loadSpecialCatalog(t=>setBusy('craft-results',t));}
  catch(e){control('craft-results').innerHTML=errorText(e);return showToast(e.message,true);}
 }
 const ids=recipesForBranch(recipes,input.branch,input.tierMin,input.tierMax,input.ench,categoryForBranch(input.branch)==='foods'?260:150,'auto');
 if(!ids.length){control('craft-results').innerHTML=empty('No hay recetas de esa rama con la ciudad elegida','Intenta la ciudad automática o amplía los tiers.');return;}
 setBusy('craft-results','Consultando recetas y materiales de '+ids.length+' variantes…');
 try{
  const materialIds=[...new Set(ids.flatMap(id=>recipes[id].materials.map(m=>m.id)))];
  const journalSet=new Set();if(input.journals){for(const id of ids){const j=journalInfo(id,recipes[id],input.branch,journalFor(id));if(j&&j.ratio>0){journalSet.add(j.empty);journalSet.add(j.full);}}}
  const response=await prices([...new Set([...ids,...materialIds,...journalSet])],prefs.region,force);
  updateStatus(response);
  const map=rowMap(response.rows);
  let qualitiesMap=map;
  if(input.qualityMode==='mix'){
   setBusy('craft-results','Leyendo los cinco niveles de calidad del equipamiento…');
   const qualityData=await pricesQuality(ids,prefs.region,force);
   qualitiesMap=rowMap(qualityData.rows);
  }
  const candidates=[];let noFocusValues=0,noQualityQuotes=0;
  const salesExperience=learnFromSales(loadPortfolios());
  const profile=loadFocusProfile();
  for(const id of ids){
   const rec=recipes[id];if(!rec?.city)continue;
   const outputAmount=Math.max(1,Number(rec.amountCrafted)||1);
   const kind=specialType(id);
   const dailyForRecipe=rec.dailyEnabled===false?0:input.daily;
   const focusPerUnit=input.focus?(Number(profile[id]?.focus)||input.focusPerUnit):0;
   if(input.focus&&!(focusPerUnit>0)){noFocusValues++;continue;}
   const markets=branchIsRoyalOnly(input.branch)?CITIES:input.market==='black'?['Black Market']:input.market==='mixed'?['Black Market',...CITIES]:CITIES;
   const craftCities=input.city==='auto'?(rec.specialtyEnabled===false?CITIES:[rec.city]):input.city==='compare'?[...new Set([rec.city,kind==='food'?'Bridgewatch':'Caerleon'])]:[input.city];
   for(const city of craftCities){
    if(!city)continue;
    const find=getMaterialFinder(map,input,city);
    const specialty=rec.specialtyEnabled!==false&&city===rec.city;
    const rate=craftingReturnRate({specialty,dailyBonus:dailyForRecipe,focus:input.focus});
    const without=craftingReturnRate({specialty,dailyBonus:dailyForRecipe,focus:false});
    const costData=craftCost(rec,find,rate.returnRate,input.station);
    if(!costData)continue;
    const focusGain=input.focus?costData.materials.reduce((a,m)=>a+(m.ret?m.count*m.unitPrice*(rate.returnRate-without.returnRate)/100:0),0):0;
    // Diarios calculados por tier y profesión; preferimos la relación real del
    // dump del juego, y distinguimos las estimaciones cuando falta.
    let journal=null,journalBonus=0;
    const j=input.journals&&!['potion','mount','food'].includes(kind)?journalInfo(id,rec,input.branch,journalFor(id)):null;
    if(j&&j.ratio>0){
      const empty=find(j.empty);let bestFull=null;
      for(const c of CITIES){const q=quote(map,j.full,c,'buy_price_max',prefs.maxAge);if(q&&(!bestFull||q.price>bestFull.price))bestFull={...q,city:c};}
      const price=empty?.price||JOURNAL_NPC_REFERENCE[j.tier]||0;
      const fullRevenue=bestFull?.price?bestFull.price*(1-input.royalTax/100):0;
      journalBonus=(fullRevenue-price)*j.ratio;
      journal={...j,prices:!!(empty&&bestFull),price,buyCity:empty?.city||'Trabajador (referencia)',fullPrice:bestFull?.price||0,fullTaxRate:input.royalTax,
        sellCity:bestFull?.city||null};
    }

   for(const saleCity of markets){
    // No confiamos en los precios publicados para productos marcados como no transables en BM.
    if(saleCity==='Black Market'&&!blackMarketEligible(id))continue;
    const mode=saleCity==='Black Market'?input.bmMode:input.saleMode;
    const side=mode==='instant'?'buy_price_max':'sell_price_min';
    let sale=quote(map,id,saleCity,side,prefs.maxAge);
    if(!sale)continue;
    if(input.qualityMode==='mix'){
      const byQuality={};for(let k=1;k<=5;k++)byQuality[k]=quote(qualitiesMap,id,saleCity,side,prefs.maxAge,k);
      const weighted=qualityWeightedSale(byQuality,input.qualityWeights);
      if(!weighted){noQualityQuotes++;continue;}
      sale={...weighted,ageHours:(Date.now()-weighted.at)/3600000};
    }
    const sameLocation=saleCity==='Black Market'?city==='Caerleon':saleCity===city;
    const transit=sameLocation?0:input.transport*outputAmount;
    const lossPct=sameLocation?0:(saleCity==='Black Market'?input.riskBM:input.riskRoyal);
    const riskPenalty=costData.total*lossPct/100; // coste esperado, NO probabilidad comprobada
    const taxPct=saleCity==='Black Market'?input.bmTax:input.royalTax;
    const calc=craftProfit(costData,sale.price*outputAmount,{tax:taxPct/100,setup:input.listingFee/100,mode,transport:transit,journalBonus});
    if(!calc||calc.profit-riskPenalty<=0)continue;
    // Reserva conservadora para diarios enteros aunque las fracciones se agrupen al comprar.
    const upfrontJ=(journal?.ratio||0)*(journal?.price||0);
    const capitalPerUnit=costData.rawMaterials+input.station+transit+upfrontJ;
    if(!(capitalPerUnit>0))continue;
    const stress=scenarioProfit({sale:sale.price*outputAmount,cost:costData.total,tax:taxPct/100,setup:input.listingFee/100,mode,transport:transit,materialCost:costData.materialCost,journal:journalBonus,drop:input.priceStress/100,materialsRise:input.resourceStress/100});
    const oldAge=Math.max(sale.ageHours,...costData.materials.map(x=>x.at?(Date.now()-x.at)/3600000:0));
    candidates.push({id,itemName:itemName(id),craftCity:city,city:saleCity,mode,sell:sale.price,profit:calc.profit-riskPenalty,cost:calc.cost+riskPenalty,capitalPerUnit,roi:(calc.profit-riskPenalty)/(calc.cost+riskPenalty)*100,returnRate:rate.returnRate,materials:costData.materials,
      rawMaterials:costData.rawMaterials,at:sale.at,ageHours:oldAge,activity:null,confidence:null,personalLearning:salesExperience.get(id+'|'+saleCity)||null,focusPerUnit,focusGain,stressProfit:stress.stressed-riskPenalty,
      taxRate:taxPct/100,saleTaxPercent:taxPct,craftAmount:outputAmount,recipeKind:kind||'equipo',setupRate:mode==='listed'?input.listingFee/100:0,transportCost:transit,transportRiskPct:lossPct,expectedRiskCost:riskPenalty,stationCost:input.station,buyMode:input.buyMode,buySetup:prefs.setup/100,qualityMode:input.qualityMode,qualityWeights:input.qualityWeights,journal,journalBonus});
   }
   }
  }
  let warning=response.warning||null;
  if(candidates.length){
   setBusy('craft-results','Contrastando 7 y 14 días de actividad observada…');
   try{
     const hist=await history([...new Set(candidates.map(x=>x.id))],prefs.region,force);
     if(hist.warning)warning=hist.warning;
     const lookup=new Map();
     for(const r of hist.rows){
       if(Number(r.quality||1)!==1)continue;
       const city=r.location||r.city;const key=r.item_id+'|'+city;
       const old=lookup.get(key)||[];old.push(...(r.data||[]));lookup.set(key,old);
     }
     for(const x of candidates){
      const entries=lookup.get(x.id+'|'+x.city)||[];
      x.activity=historyMetrics(entries,14);
      x.activity7=historyMetrics(entries,7);
     }
   }catch(e){warning='No se pudo verificar la actividad histórica: '+e.message;}
  }
  // Del v6: comprobar niveles del libro de compra observados, no inferir
  // que el mejor precio podrá absorber todas las unidades sugeridas.
  let bookVerified=0,bookWarning=null;
  const instantCandidates=candidates.filter(x=>x.mode==='instant');
  const bookIds=[...new Set([...instantCandidates].sort((a,b)=>b.profit-a.profit).slice(0,100).map(x=>x.id))];
  let book=new Map();
  if(bookIds.length){
    try{
      setBusy('craft-results','Verificando profundidad real de órdenes de compra…');
      const destinations=[...new Set(instantCandidates.map(x=>x.city))];
      const depth=await orderbook(bookIds,prefs.region,force,destinations);
      if(depth.warning)bookWarning=depth.warning;
      book=normalizeOrderbook(depth.rows,bookIds,destinations,prefs.maxAge);
      bookVerified=book.size;
    }catch(e){bookWarning='No se pudo comprobar la profundidad de órdenes: '+e.message;}
  }
  for(let i=0;i<candidates.length;i++){
    const x=candidates[i];const levels=book.get(x.id+'|'+x.city);
    candidates[i]=enrichWithDepth(x,levels);
  }
  if(input.requireBook){for(let i=candidates.length-1;i>=0;i--)if(candidates[i].city==='Black Market'&&candidates[i].mode==='instant'&&!candidates[i].depthVerified)candidates.splice(i,1);}
  if(bookWarning)warning=(warning?warning+' · ':'')+bookWarning;
  if(!bookVerified&&instantCandidates.some(x=>x.city==='Black Market'))warning=(warning?warning+' · ':'')+'No se observó profundidad verificable: venta inmediata BM limitada a 1 craft provisional por objeto.';
  // Royal: órdenes competidoras al mismo precio o más barato. Son observaciones,
  // no un estimador de ventas futuras. Si falta libro, no fabricamos una cifra.
  const listed=candidates.filter(x=>x.mode==='listed'&&x.city!=='Black Market');
  let listingBook=new Map();
  if(listed.length){
   try{
    setBusy('craft-results','Comparando competencia y órdenes Royal observadas…');
    const ids=[...new Set([...listed].sort((a,b)=>b.profit-a.profit).slice(0,110).map(x=>x.id))];
    const places=[...new Set(listed.map(x=>x.city))];
    const result=await orderbook(ids,prefs.region,force,places);
    listingBook=normalizeSellBook(result.rows,ids,places,prefs.maxAge);
    if(result.warning)warning=(warning?warning+' · ':'')+result.warning;
   }catch(e){warning=(warning?warning+' · ':'')+'No se pudo comprobar competencia Royal: '+e.message;}
  }
  for(const x of candidates){if(x.mode==='listed'&&x.city!=='Black Market')x.competition=listingPressure(listingBook.get(x.id+'|'+x.city),x.sell);}

  for(const x of candidates){
   x.confidence=confidenceOf({ageHours:x.ageHours,activity:x.activity,market:x.city==='Black Market'?'Black Market':'Royal',depthVerified:x.depthVerified});
   x.dailySales=null; // No existe prueba de ventas ejecutadas en este endpoint.
  }
  // Las rutas sin actividad suficiente reciben topes conservadores.
  for(const x of candidates){if(x.competition?.known && x.activity?.observations && x.mode==='listed'){
   x.competitionNote='Órdenes Royal por delante: '+x.competition.unitsAhead+' (no equivalen a ventas).';
  }}
  const shortlisted=selectCraftSaleRoutes(candidates,input.market);
  const capFraction=input.cap>0?input.cap/100:(input.invest==='all'?.2:.07);
  const draft=allocatePortfolioV6(shortlisted,input.budget,{goal:input.goal,useAll:input.invest==='all',capFraction,unknownCap:input.unknownCap,ensureBothMarkets:input.market==='mixed',focusLimit:input.focus?input.focusBudget:null,minimumConfidence:input.minConfidence});
  const plan=fitPlan(draft.rows,input.budget,input.focus?input.focusBudget:null);
  const source=branchIsRoyalOnly(input.branch)?recipeCatalogStatus():null;
  const recipeAge=source?.downloadedAt?Date.now()-Date.parse(source.downloadedAt):Infinity;
  const recipeWarning=source&&(!Number.isFinite(recipeAge)||recipeAge>24*3600000)?'Recetas especiales sin verificación reciente después de un parche. Compruébalas dentro del juego antes de invertir.':null;
  const warnings=[warning,recipeWarning,input.goal==='daily'&&!salesExperience.size?'Sin ventas propias registradas todavía: la prioridad de rotación utiliza señales conservadoras del mercado.':null,branchIsRoyalOnly(input.branch)?(categoryForBranch(input.branch)==='mounts'?'Monturas: solo Royal; se incluye el ensillado, no la crianza ni alimentación.':categoryForBranch(input.branch)==='foods'?'Comidas: solo Royal; el precio incluye todos los ingredientes de la receta. Verifica las tarifas del cocinero y la fecha del catálogo tras cada parche.':'Esta rama solo admite venta en Royal.'):null,noFocusValues?`${noFocusValues} recetas omitidas: falta un costo de Focus verificado.`:null,noQualityQuotes?`${noQualityQuotes} precios por calidad incompletos o antiguos: excluidos.`:null,input.buyMode==='order'?'Materiales presupuestados con órdenes de compra no ejecutadas; pueden no completarse.':null].filter(Boolean);
  state.plan={plan,budget:input.budget,branch:branch.label,city:input.city,daily:input.daily,focus:input.focus,market:input.market,invest:input.invest,journals:input.journals,cap:capFraction,unknownCap:input.unknownCap,scanned:ids.length,advanced:state.fullCatalog,warning:warnings.join(' · '),goal:input.goal,focusBudget:input.focusBudget,buyMode:input.buyMode,availableCandidates:shortlisted,bmDepth:bookVerified,requireBook:input.requireBook,qualityMode:input.qualityMode,priceStress:input.priceStress,resourceStress:input.resourceStress,matShipping:input.matShipping,useWallet:input.useWallet,solverMethod:draft.method||'asignación de capital'};
  control('craft-results').innerHTML=craftResult(state.plan);
  if(!plan.rows.length)showToast('No hay rutas con margen, precios y filtros válidos. Amplía ajustes.',true);
  else{showToast('Plan generado: '+plan.rows.reduce((s,r)=>s+r.qty*(r.craftAmount||1),0)+' productos en '+plan.rows.length+' rutas.');checkAlerts(false).catch(()=>{});}
 }catch(e){control('craft-results').innerHTML=errorText(e);showToast(e.message,true);}
}

function preflightResult(report){const up=report.updates||[];
 const rows=up.map(x=>`<tr><td>${itemCell(x.previous.id,'',x.previous.city)}</td><td>${moneyCell(x.previous.sell)}</td><td>${moneyCell(x.new.sell)}</td><td>${Number.isFinite(x.priceChangePercent)?x.priceChangePercent.toFixed(1)+'%':'—'}</td><td>${moneyCell(x.new.profit,x.new.profit>0?'positive':'negative')}</td><td>${h(new Date(x.latestQuote).toLocaleString('es-ES'))}</td></tr>`).join('');
 return `<div class="panel preflight"><div class="toggleline"><div><h3 class="subheading">${report.ok?'✓ Comprobación favorable':'⚠ Hay cambios que requieren revisión'}</h3><p class="tiny muted">Datos reconsultados el ${h(new Date(report.at).toLocaleString('es-ES'))}. No reserva órdenes ni garantiza venta.</p></div><button class="btn sm" data-action="refresh-craft-now">↻ Regenerar con precios nuevos</button></div>
 <div class="page-grid"><div class="col-6">${stat('Profit recalculado',report.newTotal==null?'No verificable':short(report.newTotal),'Antes: '+short(report.previousTotal),report.ok?'jade':'red','↗')}</div><div class="col-6">${stat('Capital requerido actualizado',report.newCapital==null?'No verificable':short(report.newCapital),'Sujeto a presupuesto y diarios',report.ok?'gold':'red','◈')}</div></div>
 ${report.blockers.length?`<div class="notice red" style="margin:13px 0"><strong>No ejecutar sin revisar:</strong><ul>${report.blockers.slice(0,12).map(b=>`<li>${h(b)}</li>`).join('')}</ul></div>`:'<div class="notice neutral" style="margin:13px 0">No se detectó una pérdida de margen en las rutas revisadas. Confirma profundidad de materiales, tarifas, stock y venta dentro del juego antes de invertir.</div>'}
 ${report.notes?.length?`<div class="notice neutral" style="margin:13px 0"><strong>Advertencias:</strong> ${report.notes.map(h).join(' · ')}</div>`:''}
 <div class="table-scroll"><table class="data-table"><thead><tr><th>Objeto / destino</th><th>Venta anterior</th><th>Venta nueva</th><th>Variación</th><th>Profit/fabricación actualizado</th><th>Fecha observación</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
async function runPreflight(){const p=state.plan;if(!p?.plan?.rows?.length)return showToast('Genera primero un plan.',true);
 const target=control('preflight-results');if(target)setBusy('preflight-results','Reconsultando productos, materiales, diarios y órdenes observadas…');
 try{
  const rows=p.plan.rows;
  const ids=[...new Set(rows.flatMap(r=>[r.id,...r.materials.map(m=>m.id),...(r.journal?.prices?[r.journal.empty,r.journal.full]:[])]))];
  const response=await (p.qualityMode==='mix'?pricesQuality:prices)(ids,prefs.region,true);
  if(response.warning)throw Error('No se pudo confirmar información nueva en AODP: '+response.warning);
  let book=new Map();const instant=rows.filter(r=>r.mode==='instant');
  if(instant.length){const products=[...new Set(instant.map(r=>r.id))],cities=[...new Set(instant.map(r=>r.city))];
   const depth=await orderbook(products,prefs.region,true,cities);
   if(depth.warning)throw Error('Profundidad de órdenes sin confirmar: '+depth.warning);
   book=normalizeOrderbook(depth.rows,products,cities,prefs.maxAge);
  }
  const report=verifyPlannedPrices(rows,response.rows,{budget:p.budget,focusLimit:p.focus?p.focusBudget:null,maxAgeHours:prefs.maxAge,materialShipping:p.matShipping||0,book});
  report.notes=[];
  if(p.qualityMode==='mix')report.notes.push('Las calidades son una mezcla estimada, no resultados asegurados.');
  if(rows.some(r=>r.mode==='listed'))report.notes.push('Royal: publicar orden de venta no garantiza compradores ni plazo de venta.');
  if(rows.some(r=>r.stationCost===0))report.notes.push('Tarifa del taller configurada en cero: verifica que no falte un gasto.');
  if(rows.some(r=>r.transportCost===0&&r.craftCity!==r.city&&(r.city!=='Black Market'||r.craftCity!=='Caerleon')))report.notes.push('Transporte entre ciudades en cero: revisa el costo y riesgo del traslado.');
  if(rows.some(r=>r.city==='Black Market'&&r.mode==='instant'&&!r.depthVerified))report.notes.push('BM sin profundidad verificada inicialmente; comprueba las órdenes personalmente.');
  // Verificación parcial de profundidad de materias primas, además de cotización.
  // Solo aplica a compra INMEDIATA; no se confunde con órdenes de compra propuestas.
  if(p.buyMode==='order')report.notes.push('Compra por órdenes: no se puede prometer ejecución; revisa el volumen y espera a que se completen.');
  else try{
   const liveMap=rowMap(response.rows);
   const mostRelevant=[...(report.plan?.materials||p.plan.materials)].map(m=>{
    const latest=quote(liveMap,m.id,m.city,'sell_price_min',prefs.maxAge);
    return {...m,originalPrice:latest?.price||m.originalPrice};
   }).sort((a,b)=>(b.qtyGross*b.unitPrice)-(a.qtyGross*a.unitPrice)).slice(0,30);
   const ids=[...new Set(mostRelevant.map(m=>m.id))],places=[...new Set(mostRelevant.map(m=>m.city))].filter(x=>CITIES.includes(x));
   if(ids.length&&places.length){const supply=await orderbook(ids,prefs.region,true,places);
    if(supply.warning)report.notes.push('La profundidad de materiales no se pudo actualizar: '+supply.warning);
    else{const levels=normalizeSellBook(supply.rows,ids,places,prefs.maxAge);
     const checked=checkMaterialSupply(mostRelevant,levels);
     report.blockers.push(...checked.warnings);
     if(checked.missing.length)report.notes.push(`${checked.missing.length} materiales sin profundidad de órdenes de venta verificable; el precio unitario no garantiza disponibilidad del lote.`);
     if(p.plan.materials.length>30)report.notes.push('Se consultaron los 30 materiales de mayor coste; confirma el resto en el juego.');
    }
   }
  }catch(e){report.notes.push('No pudo verificarse la profundidad de materiales: '+e.message);}
  report.ok=report.ok&&report.blockers.length===0;

  if(report.blockers.length)report.ok=false;
  state.preflight=report;if(control('preflight-results'))control('preflight-results').innerHTML=preflightResult(report);
  showToast(report.ok?'Cotizaciones verificadas; revisa el resultado.':'Se detectaron advertencias que requieren revisión.',!report.ok);
 }catch(e){state.preflight=null;if(control('preflight-results'))control('preflight-results').innerHTML=errorText(e);showToast(e.message,true);}
}
function refineBase(material){return ({WOOD:['WOOD','PLANKS'],ORE:['ORE','METALBAR'],FIBER:['FIBER','CLOTH'],HIDE:['HIDE','LEATHER'],ROCK:['ROCK','STONEBLOCK']})[material]||['ORE','METALBAR'];}
function enrichedId(t,base,ench=0){return 'T'+t+'_'+base+(ench?'_LEVEL'+ench+'@'+ench:'');}
async function runRefine(force=false){const t=num('refine-tier',5),ench=num('refine-ench',0),rrr=num('refine-rrr',36.7),fee=num('refine-fee',0),city=val('refine-city','auto'),buy=val('refine-buy','all');
 if(rrr<0||rrr>=100)return showToast('Retorno inválido',true);
 const [raw,bar]=refineBase(val('refine-mat','ORE'));const output=enrichedId(t,bar,ench),rawId=enrichedId(t,raw,ench),prevId=enrichedId(t-1,bar,ench);
 const rawAmount=({4:2,5:3,6:4,7:5,8:5})[t];setBusy('refine-results','Consultando precios de recursos y refinado…');
 try{const p=await prices([output,rawId,prevId],prefs.region,force);updateStatus(p);const map=rowMap(p.rows);const places=buy==='all'?CITIES:[buy];
 function cheapest(id){let best=null;for(const c of places){const q=quote(map,id,c,'sell_price_min',prefs.maxAge);if(q&&(!best||q.price<best.price))best={...q,city:c};}return best;}
 const raws=cheapest(rawId),prev=cheapest(prevId);
 if(!raws||!prev)throw Error('No existen cotizaciones suficientemente recientes para los materiales '+rawId+' y '+prevId+'.');
 const parts=[{id:rawId,qty:rawAmount,price:raws.price,city:raws.city},{id:prevId,qty:1,price:prev.price,city:prev.city}];
 const rawCost=rawAmount*raws.price+prev.price;const refundCost=rawCost*(1-rrr/100);const cost=refundCost+fee+prefs.transport;
 const cities=city==='auto'?CITIES:[city];const rows=[];
 for(const c of cities){const q=quote(map,output,c,'buy_price_max',prefs.maxAge);if(!q)continue;const income=q.price*(1-prefs.tax/100);rows.push({city:c,q,price:q.price,cost,profit:income-cost,roi:cost?(income-cost)/cost*100:0});}
 rows.sort((a,b)=>b.profit-a.profit);
 state.refine={rows,parts,rawCost,refundCost,cost,fee,output,rrr,warning:p.warning};control('refine-results').innerHTML=refineResult(state.refine);
 }catch(e){control('refine-results').innerHTML=errorText(e);showToast(e.message,true);}}
async function runTransmute(force=false){const tier=num('transmute-tier',5),family=val('transmute-family','ORE'),city=val('transmute-city','Caerleon'),fee=num('transmute-fee',0),qty=num('transmute-qty',0);
 if(fee<0||qty<=0)return showToast('Introduce la cantidad real de recursos previos y una tarifa válida.',true);const from='T'+(tier-1)+'_'+family,to='T'+tier+'_'+family;
 setBusy('transmute-results','Comparando los precios de ambos tiers…');
 try{const info=await prices([from,to],prefs.region,force);updateStatus(info);const map=rowMap(info.rows),a=quote(map,from,city,'sell_price_min',prefs.maxAge),b=quote(map,to,city,'sell_price_min',prefs.maxAge),bid=quote(map,to,city,'buy_price_max',prefs.maxAge);
 if(!a||!b||!bid)throw Error('Faltan cotizaciones recientes de '+from+' o '+to+' en '+city+'.');
 const total=a.price*qty+fee;state.transmute={from,to,city,fee,qty,fromPrice:a.price,toPrice:b.price,bid:bid.price,total,profit:bid.price*(1-prefs.tax/100)-total};control('transmute-results').innerHTML=transmuteResult(state.transmute);
 }catch(e){control('transmute-results').innerHTML=errorText(e);showToast(e.message,true);}}
async function runEnchant(force=false){let base=val('enchant-item','').trim().toUpperCase(),level=num('enchant-level',1),qty=num('enchant-count',0),city=val('enchant-city','Caerleon');
 if(!/^T[4-8]_[A-Z0-9_]+(?:@\d)?$/.test(base))return showToast('Introduce un ID de equipo válido',true);
 if(!(qty>0))return showToast('Introduce la cantidad exacta de runas, almas o reliquias.',true);
 const prev=Number(base.split('@')[1]||0);if(prev!==level-1)return showToast(`Para pasar a .${level}, introduce el objeto actual .${level-1} como base.`,true);
 const target=base.split('@')[0]+'@'+level;const type=({1:'RUNE',2:'SOUL',3:'RELIC'})[level];const resource='T'+itemTier(base)+'_'+type;
 setBusy('enchant-results','Comparando el equipo y los recursos del encantamiento…');
 try{const p=await prices([base,target,resource],prefs.region,force);updateStatus(p);const map=rowMap(p.rows);
 const a=quote(map,base,city,'sell_price_min',prefs.maxAge),b=quote(map,target,city,'sell_price_min',prefs.maxAge),r=quote(map,resource,city,'sell_price_min',prefs.maxAge);
 if(!a||!b||!r)throw Error('No hay precios recientes para al menos uno de los materiales u objetos seleccionados.');
 state.enchant={base,target,resource,city,qty,basePrice:a.price,enchPrice:b.price,runePrice:r.price,total:a.price+r.price*qty};control('enchant-results').innerHTML=enchantResult(state.enchant);
 }catch(e){control('enchant-results').innerHTML=errorText(e);showToast(e.message,true);}}
async function syncCatalog(force=false){const info=control('settings-info');if(info)info.textContent='Sincronizando nombres y recetas…';try{const stats=await loadCatalog(force);state.catalogReady=true;if(info)info.textContent=`Listos: ${fmt(stats.names)} objetos · ${fmt(stats.recipes)} recetas.`;else if(state.page==='inicio')render();showToast('Catálogo en español sincronizado');}catch(e){if(info)info.textContent='Error: '+e.message;showToast('Catálogo temporalmente no disponible: '+e.message,true);}}
async function syncGameRecipes(){
 const status=control('recipe-sync-status')||control('settings-info');
 const report=t=>{if(status)status.textContent=t;};
 report('Buscando las últimas recetas en los datos del juego…');
 try{
  const amount=await loadSpecialCatalog(report,true);
  const source=recipeCatalogStatus();
  report('Recetas: '+fmt(amount)+' variantes · revisión '+(source.sourceRevision?.slice(0,10)||'no disponible')+' · consulta '+(source.downloadedAt?new Date(source.downloadedAt).toLocaleString('es-ES'):'sin fecha')+'. Regenera tu plan.');
  showToast('Catálogo actualizado desde el archivo público del juego.');
 }catch(e){report('No se pudieron validar recetas nuevas: '+e.message);showToast(e.message,true);}
}
async function syncAdvanced(){const info=control('settings-info')||control('craft-results');if(info)info.textContent='Descargando datos de diarios…';try{const total=await loadAdvanced(text=>{if(info)info.textContent=text;});state.fullCatalog=true;if(state.page==='ajustes')settingsPage();if(state.page==='crafting'){if(state.plan){state.plan.advanced=true;control('craft-results').innerHTML=craftResult(state.plan);}else craftPage();}showToast('Diarios sincronizados: '+fmt(total)+' entradas. Vuelve a generar el plan para incluirlos.');}catch(e){if(info)info.textContent='Error: '+e.message;showToast(e.message,true);}}
function applySettings(){prefs.region=val('settings-server','west');prefs.premium=val('settings-premium','premium')==='premium';prefs.maxAge=num('settings-age',24);prefs.tax=num('settings-tax',4);prefs.setup=num('settings-setup',2.5);prefs.transport=num('settings-shipping',0);prefs.rrr=num('settings-rrr',24.8);prefs.station=num('settings-station',0);
 if(prefs.maxAge<1||prefs.maxAge>720||prefs.tax<0||prefs.tax>50||prefs.setup<0||prefs.setup>50||prefs.rrr<0||prefs.rrr>=100)return showToast('Uno de los parámetros está fuera de rango.',true);
 save();$('#server-select').value=prefs.region;render();showToast('Ajustes guardados. Próximos cálculos usarán los nuevos valores.');}
function exportPlan(){if(!state.plan?.plan.rows.length)return showToast('Genera primero un plan de crafting',true);
 const fields=[['TIPO','NOMBRE','ID','TIER','FABRICACIONES','UNIDADES_A_VENDER','CIUDAD_FABRICACION','CIUDAD_VENTA_O_COMPRA','RETORNO_PORCENTAJE','COSTO_BRUTO_POR_FABRICACION','COSTO_NETO_POR_FABRICACION','PRECIO_VENTA','PROFIT_POR_FABRICACION','PROFIT_TOTAL','TIPO_MERCADO','MODO_VENTA','CONFIANZA','ESTRES_PROFIT_FABRICACION','FOCUS_POR_FABRICACION','ACTIVIDAD_ORDENES_DIARIAS']];
 for(const r of state.plan.plan.rows)fields.push(['CRAFT',itemName(r.id),r.id,`${itemTier(r.id)}.${itemEnch(r.id)}`,r.qty,r.qty*(r.craftAmount||1),r.craftCity,r.city,r.returnRate.toFixed(2),Math.round(r.capitalPerUnit),Math.round(r.cost),r.sell,Math.round(r.profit),Math.round(r.totalProfit),r.city==='Black Market'?'MERCADO NEGRO':'ROYAL',r.mode==='instant'?'INMEDIATA':'ORDEN',r.confidence?.label,Math.round(r.stressProfit),r.focusPerUnit,r.activity?.observedDaily??'']);
 for(const m of state.plan.plan.materials)fields.push(['COMPRA',itemName(m.id),m.id,itemTier(m.id),Math.ceil(m.qtyGross),'','',m.city,'',Math.round(m.unitPrice),'','','','','','']);
 const csv='\ufeff'+fields.map(row=>row.map(s=>'"'+String(s??'').replaceAll('"','""')+'"').join(';')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='gildem-plan-royal-blackmarket-unificado.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function exportShopping(){
 const p=state.plan?.plan;if(!p?.rows.length)return showToast('Genera un plan primero.',true);
 const lines=[['TIPO','NOMBRE','ID','CIUDAD','COMPRAR_CANTIDAD_BRUTA','CONSUMO_ESTIMADO','PRECIO_UNITARIO','COSTO_BRUTO','PRECISION']];
 for(const m of p.materials)lines.push(['MATERIAL',itemName(m.id),m.id,m.city,Math.ceil(m.qtyGross),Math.ceil(m.qtyNet),Math.round(m.unitPrice),Math.round(Math.ceil(m.qtyGross)*m.unitPrice),'Cotización AODP']);
 for(const j of p.journalSummary?.items||[])lines.push(['DIARIO VACÍO',j.name+' T'+j.tier,j.empty,j.buyCity,j.qty,'',j.price,Math.round(j.purchaseCost),j.exact?'Dato del juego':'Estimación de fama / precio referencia']);
 const csv='\ufeff'+lines.map(row=>row.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(';')).join('\r\n');
 downloadText(csv,'gildem-compras-y-diarios-royal-bm.csv','text/csv;charset=utf-8;');
}
function changePlanQty(index,qty){
 const current=state.plan?.plan;if(!current)return;
 if(!Number.isInteger(qty)||qty<0)return showToast('Introduce una cantidad entera de 0 o más.',true);
 const rows=current.rows.map(x=>({...x}));if(!rows[index])return;
 rows[index].qty=qty;
 const result=rebuildPlan(rows,state.plan.budget,state.plan.focus?state.plan.focusBudget:null);
 if(!result.ok){showToast(result.reason,true);control('craft-results').innerHTML=craftResult(state.plan);return;}
 state.preflight=null;state.plan.plan=result;control('craft-results').innerHTML=craftResult(state.plan);
 showToast('Cantidades, diarios y compra actualizados.');
}
function addPlanRoute(key){
 const p=state.plan;if(!p?.plan)return;
 const x=(p.availableCandidates||[]).find(r=>r.id+'|'+r.city+'|'+r.craftCity===key);
 if(!x)return showToast('Ruta no encontrada',true);
 if(p.plan.rows.some(r=>r.id===x.id&&r.city===x.city&&r.craftCity===x.craftCity))return showToast('Esa ruta ya está en tu plan.',true);
 if(x.marketCapacity===0)return showToast('El libro no soporta una unidad rentable.',true);
 const next=rebuildPlan([...p.plan.rows,{...x,qty:1,maxCrafts:Number.isFinite(x.marketCapacity)?x.marketCapacity:(x.city==='Black Market'&&x.mode==='instant'?1:(x.activity?.observations?Math.max(1,Math.floor(x.activity.observedDaily*p.cap)):p.unknownCap))}],p.budget,p.focus?p.focusBudget:null);
 if(!next.ok)return showToast(next.reason,true);
 state.preflight=null;p.plan=next;control('craft-results').innerHTML=craftResult(p);showToast('Se añadió una fabricación y se recalcularon las compras.');
}
function suggestItems(text){const wrap=control('search-results');if(!wrap)return;
 const matches=findItems(text,10);if(!text.trim()||!matches.length){wrap.style.display='none';return;}
 wrap.style.display='block';wrap.innerHTML=matches.map(o=>`<button class="search-result" data-select-id="${h(o.id)}" type="button">${itemimg(o.id,42)}<span><strong>${h(o.name)}</strong><small>${h(o.id)}</small></span></button>`).join('');}
function currentAction(force=false){if(state.page==='precios'&&state.market)return runLookup(force);if((state.page==='comercio'||state.page==='negro')&&state.trade)return runTrade(force);if(state.page==='crafting'&&state.plan)return runCraft(force);if(state.page==='refino'&&state.refine)return runRefine(force);if(state.page==='encantar'&&state.enchant)return runEnchant(force);if(state.page==='transmutar'&&state.transmute)return runTransmute(force);showToast('Selecciona una herramienta y ejecuta tu primera consulta.');}
// ─── Mi negocio, datos de Focus y alertas locales ──────────────────────────
const K_LEDGER='gildem-v4-ledger',K_FOCUS='gildem-v4-focus',K_ALERTS='gildem-v4-alerts',K_WALLET='gildem-v6-wallet';
function readLocal(key,defaultValue){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):defaultValue;}catch{return defaultValue;}}
function writeLocal(key,v){try{localStorage.setItem(key,JSON.stringify(v));return true;}catch{showToast('No se pudo guardar. Libera espacio en este navegador.',true);return false;}}
function loadPortfolios(){const p=readLocal(K_LEDGER,[]);return Array.isArray(p)?p:[];}
function loadWallet(){return readLocal(K_WALLET,{initial:null,adjustments:[]});}
function loadFocusProfile(){const p=readLocal(K_FOCUS,{});return p&&typeof p==='object'&&!Array.isArray(p)?p:{};}
function loadAlerts(){const a=readLocal(K_ALERTS,[]);return Array.isArray(a)?a:[];}
function unfilledLots(){return loadPortfolios().flatMap(p=>(p.lots||[]).map(l=>({p,l,remaining:l.qty-(l.sales||[]).reduce((s,x)=>s+x.qty,0)})).filter(x=>x.remaining>0));}
function portfolioPage(){
 const all=loadPortfolios(),summ=overallDashboard(all),lots=unfilledLots().filter(x=>x.p.started===true),totalPlans=all.length;
 const wallet=loadWallet(),cash=cashPosition(wallet,all);
 const options=lots.map(x=>[`$${x.p.id}::${x.l.lotId}`,`${x.l.itemName} · ${x.l.market} (${x.remaining} pendientes)`]);
 const cards=all.slice().reverse().map(p=>{
 const sm=summarizePortfolio(p);
 return `<div class="panel"><div class="toggleline"><div><h3 class="subheading">${h(p.title)}</h3><p class="tiny muted">${h(new Date(p.createdAt).toLocaleDateString('es-ES'))} · ${p.lots.length} lotes · ${fmt(sm.sold)}/${fmt(sm.qty)} unidades vendidas</p></div><span class="pill ${p.started?'green':'amber'}">${p.started?'Compra confirmada':'Plan pendiente'}</span>${!p.started?`<button class="btn sm gold" data-action="start-portfolio" data-pid="${h(p.id)}">✓ Marcar compra realizada</button>`:''}<button class="btn sm ghost" data-action="delete-portfolio" data-pid="${h(p.id)}" aria-label="Eliminar plan">Eliminar</button></div>
  <div class="progress-track"><div class="progress-fill" style="width:${Math.max(0,Math.min(100,sm.progress*100))}%"></div></div><div class="tags" style="margin:13px 0 8px"><span class="pill green">Realizado ${short(sm.realizedProfit)}</span><span class="pill amber">Potencial restante ${short(sm.unrealizedEst)}</span><span class="pill neutral">Capital inicial bruto ${short(sm.upfront)}</span></div>
  <div class="table-scroll"><table class="data-table"><thead><tr><th>Objeto / destino</th><th>Fabricadas</th><th>Vendidas</th><th>Pendientes</th><th>Costo/u</th><th>Origen</th><th>Acciones</th></tr></thead><tbody>${p.lots.map(l=>{
  const sold=(l.sales||[]).reduce((s,x)=>s+x.qty,0);
  return `<tr><td>${itemCell(l.id,'',l.market)}</td><td>${fmt(l.qty)}</td><td>${fmt(sold)}</td><td>${fmt(l.qty-sold)}</td><td>${moneyCell(l.unitCost)}</td><td>${h(l.costSource)}</td><td><button class="btn sm ghost" data-action="edit-lot" data-pid="${h(p.id)}" data-lot="${h(l.lotId)}">Ajustar costo</button></td></tr>`;}).join('')}</tbody></table></div></div>`;
 }).join('');
 main.innerHTML=`${blockTitle('Mi negocio de crafting','Aquí registrarás lo vendido de verdad. El sistema no confunde profit previsto con ganancias cobradas.',`<button class="btn sm" data-action="backup-data">↓ Copia de seguridad</button>`)}
 <div class="page-grid">
 <div class="col-12"><div class="panel"><div class="toggleline"><div><h3 class="subheading">Mi caja y reinversión</h3><p class="tiny muted">Solo se descuentan los lotes que marcas como realmente comprados. Las ventas cobradas se suman al saldo.</p></div><span class="pill ${cash.configured?'green':'amber'}">${cash.configured?'Balance configurado':'Configurar saldo'}</span></div>
 <div class="page-grid" style="margin-top:12px"><div class="col-3">${stat('Silver disponible',cash.configured?short(cash.available):'Sin configurar','Saldo estimado para próximos planes','jade','◈')}</div><div class="col-3">${stat('Capital comprometido',short(cash.committed),'Compras confirmadas','gold','▤')}</div><div class="col-3">${stat('Ventas cobradas',short(cash.collected),'Neto efectivamente anotado','blue','↗')}</div><div class="col-3">${stat('Planes por ejecutar',short(cash.planned),'No descontados aún','','◎')}</div></div>
 <form id="wallet-form" class="form-grid" style="margin-top:14px">${numberField('Capital inicial disponible (silver)','wallet-initial',cash.configured?cash.starting:'',0,1,'span4')}${numberField('Añadir / retirar silver (+ o −)','wallet-adjust',0,-1000000000000,1,'span4')}${field('Motivo del movimiento','wallet-note','<input class="input" id="wallet-note" placeholder="Ej. depósito / compra exterior">','span4')}<div class="field span12"><button class="btn sm gold" type="submit">Guardar saldo / movimiento</button></div></form><p class="explain">El saldo se almacena únicamente en este navegador, no está sincronizado con tu personaje. Si ya compraste materiales antes de configurar el saldo inicial, introduce el capital que tenías antes de esas compras o registra los ajustes. Un plan guardado no equivale a dinero gastado.</p></div></div>
 <div class="col-3">${stat('Planes guardados',fmt(totalPlans),'Solo este navegador','gold','▤')}</div>
 <div class="col-3">${stat('Silver cobrado neto',short(summ.netRevenue),'Después de comisiones registradas','blue','◈')}</div>
 <div class="col-3">${stat('Profit realizado',short(summ.realizedProfit),'Ventas menos costo de los lotes','jade','↗')}</div>
 <div class="col-3">${stat('Unidades pendientes',fmt(summ.unsold),'No se consideran vendidas','', '◎')}</div>
 <div class="col-7"><div class="panel"><h3 class="subheading">Registrar una venta completada</h3>
 <form id="sale-form" class="form-grid">
 ${selectField('Objeto y mercado','sale-lot',options,options[0]?.[0]||'','span6')}
 ${numberField('Unidades vendidas','sale-qty',1,1,1,'span2')}
 ${numberField('Precio recibido por unidad','sale-price',0,0,1,'span4')}
 ${numberField('Tarifas totales pagadas (0 = calcular impuesto)','sale-fees',0,0,1,'span6')}
 ${numberField('Costo total de transporte de esta venta','sale-shipping',0,0,1,'span6')}
 <div class="field span12"><button class="btn gold" type="submit" ${!options.length?'disabled':''}>✓ Registrar venta real</button></div>
 </form><p class="explain">Si introduces 0 en tarifas, se estima el impuesto desde tus ajustes actuales. El costo unitario del lote comienza como una estimación; cámbialo por tu gasto real para obtener el profit exacto.</p>
 </div></div>
 <div class="col-5"><div class="panel"><h3 class="subheading">Cómo interpretar las ganancias</h3>
 <div class="cost-row"><span>Capital de compras planificado</span><strong>${short(summ.upfront)}</strong></div>
 <div class="cost-row"><span>Costo neto de inventario</span><strong>${short(summ.spent)}</strong></div>
 <div class="cost-row"><span>Costo imputado a lo vendido</span><strong>${short(summ.realizedCost)}</strong></div>
 <div class="cost-row total"><span>Beneficio ya realizado</span><strong>${short(summ.realizedProfit)}</strong></div>
 <div class="notice neutral" style="margin-top:12px">El capital bruto de compra no equivale al costo neto después de devoluciones. Ajusta el costo de tus lotes al costo real y guarda tus ventas para medir resultados.</div>
 <div class="button-row" style="margin-top:13px"><button class="btn sm" data-action="export-ledger">↓ CSV de ventas</button><label class="btn sm ghost" style="cursor:pointer">Restaurar JSON <input type="file" id="restore-data" accept=".json,application/json" style="display:none"></label></div>
 </div></div>
 <div class="col-12">${cards||empty('Aún no tienes inversiones guardadas','Genera un plan de crafting y pulsa «Guardar como inversión» para crear tu primera cartera.')}</div></div>`;
}
function focusPage(){const profile=loadFocusProfile(),rows=Object.entries(profile).map(([id,v])=>`<tr><td>${itemCell(id)}</td><td>${fmt(v.focus)}</td><td>${fmt(v.spec)}</td><td><button class="btn sm ghost" data-action="remove-focus" data-id="${h(id)}">Eliminar</button></td></tr>`).join('');
 main.innerHTML=`${blockTitle('Optimizador de Focus y especializaciones','Indica el consumo de Focus por craft que ves dentro del juego. Después, usa «Mayor silver por Focus» en el planificador.')}
 <div class="page-grid"><div class="col-7"><div class="panel"><h3 class="subheading">Mi perfil de crafting</h3>
 <form id="focus-form" class="form-grid">
 ${field('ID del objeto (ej. T4_SHOES_PLATE_SET1)','focus-item','<input class="input" id="focus-item" placeholder="T4_SHOES_PLATE_SET1" required>','span6')}
 ${numberField('Focus real que cuesta fabricar 1','focus-cost',0,1,1,'span3')}
 ${numberField('Spec (solo registro)','focus-spec',0,0,1,'span3')}
 <div class="field span12"><button class="btn gold" type="submit">Guardar costo de Focus</button></div></form>
 <p class="explain">El costo real depende del árbol de especializaciones y la receta. La spec registrada se usa para identificar tu progreso, pero no para inventar una fórmula exacta. Puedes definir un costo general en el planificador o valores individuales aquí.</p></div></div>
 <div class="col-5"><div class="panel"><h3 class="subheading">Cómo encuentra el mejor uso</h3>
 <p class="explain">1. Calcula el aumento de devolución de materiales al utilizar Focus.<br>2. Convierte esa devolución adicional a silver según el costo de materiales más reciente.<br>3. Divide ese beneficio adicional entre el Focus verificado por craft.<br>4. Respeta tu Focus disponible y el capital de fabricación.</p>
 <div class="notice neutral">La valoración es <strong>silver adicional por Focus</strong>, no profit total de la pieza. No incluye beneficios hipotéticos sin datos verificables.</div></div></div>
 <div class="col-12"><div class="panel"><h3 class="subheading">Valores guardados (${Object.keys(profile).length})</h3><div class="table-scroll">${rows?`<table class="data-table"><thead><tr><th>Objeto</th><th>Focus/craft</th><th>Spec</th><th>Acción</th></tr></thead><tbody>${rows}</tbody></table>`:empty('Sin valores guardados','Puedes consultar el Focus exacto en la ventana de crafting del juego.')}</div></div></div>
 </div>`;
}
function alertsPage(){const alerts=loadAlerts();let routes=state.plan?.plan.rows||[];
 const routeOpts=routes.map((x,i)=>[String(i),`${itemName(x.id)} → ${x.city} · ${Math.round(x.roi)}% ROI`]);
 const items=alerts.map(a=>`<tr><td>${itemCell(a.itemId)}</td><td>${h(a.city)}</td><td>ROI ≥ ${a.minRoi.toFixed(1)}%</td><td>${moneyCell(a.minProfit)}</td><td>${a.lastResult?`<span class="pill ${a.lastResult.trigger?'green':'neutral'}">${a.lastResult.trigger?'Supera umbrales':'Sin señal'}</span>`:'<span class="pill amber">Pendiente</span>'}</td><td><button class="btn sm ghost" data-action="toggle-alert" data-aid="${h(a.id)}">${a.enabled?'Pausar':'Reanudar'}</button> <button class="btn sm ghost" data-action="remove-alert" data-aid="${h(a.id)}">Eliminar</button></td></tr>`).join('');
 main.innerHTML=`${blockTitle('Mis alertas económicas','Vigila precios y márgenes de crafting cuando utilices la app. No son avisos garantizados con la página cerrada.',`<button class="btn sm" data-action="check-alerts">↻ Revisar ahora</button>`)}
 <div class="page-grid"><div class="col-6"><div class="panel"><h3 class="subheading">Crear alerta desde mi último plan</h3>
 <form id="alert-form" class="form-grid">
 ${selectField('Objeto + mercado','alert-route',routeOpts,routeOpts[0]?.[0]||'','span12')}
 ${numberField('ROI mínimo (%)','alert-roi',10,0,1,'span6')}
 ${numberField('Profit mínimo por unidad','alert-profit',3000,0,1,'span6')}
 <div class="field span12"><button type="submit" class="btn gold" ${!routes.length?'disabled':''}>Crear alerta</button></div></form>
 <p class="explain">Primero crea un plan de crafting. La alerta reevaluará el precio de venta, los materiales y los impuestos al consultar nuevamente AODP.</p></div></div>
 <div class="col-6"><div class="panel"><h3 class="subheading">Cómo te avisará</h3><p class="explain">Las alertas se comprueban al abrir esta página, pulsar Revisar o cuando la app refresca sus datos mientras está abierta. Si concedes permiso, puedes recibir una notificación del navegador mientras la app se encuentra activa.</p>
 <button class="btn sm ghost" data-action="enable-notify">Habilitar notificaciones locales</button><div class="notice neutral" style="margin-top:15px">Para recibir alertas garantizadas con la aplicación cerrada necesitaríamos un sistema de usuarios, almacenamiento de reglas por cuenta y un canal de envío de notificaciones. La tarea de Netlify incluida actualiza solamente una lista pública de productos vigilados.</div></div></div>
 <div class="col-12"><div class="panel"><h3 class="subheading">Alertas guardadas (${alerts.length})</h3><div class="table-scroll">${items?`<table class="data-table"><thead><tr><th>Objeto</th><th>Mercado</th><th>ROI mínimo</th><th>Profit mínimo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${items}</tbody></table>`:empty('Aún no tienes alertas','Crea primero un plan y luego guarda tus condiciones de oportunidad.')}</div></div></div></div>`;
}
function savePlanPortfolio(){const p=state.plan?.plan;
 if(!p?.rows.length)return showToast('Necesitas generar un plan primero.',true);
 const name=window.prompt('Nombre para esta inversión','Craft '+new Date().toLocaleDateString('es-ES'));
 if(name===null)return;
 const all=loadPortfolios();all.push({...createPortfolioFromPlan(p,String(name||'Plan de crafting').slice(0,70)),started:false});
 if(writeLocal(K_LEDGER,all))showToast('Plan guardado en Mi negocio. Registra las ventas al cobrarlas.');
}
function appendPlanAlert(index){const r=state.plan?.plan.rows[Number(index)];if(!r)return showToast('No existe esa ruta.',true);
 const list=loadAlerts();const alert=addAlertFromRoute(r,{minRoi:Math.max(0,Math.floor(r.roi*.8)),minProfit:Math.max(0,Math.floor(r.profit*.8))});list.push(alert);
 if(writeLocal(K_ALERTS,list))showToast('Alerta creada para '+itemName(r.id)+' en '+r.city);
}
async function checkAlerts(report=false){const alerts=loadAlerts(),active=alerts.filter(x=>x.enabled);
 if(!active.length){if(report)showToast('No hay alertas activas');return;}
 const ids=[...new Set(active.flatMap(x=>[x.itemId,...x.materials.map(m=>m.id)]))];
 let response;
 try{response=await prices(ids,prefs.region,false);}catch(e){if(report)showToast('No se pudo comprobar alertas: '+e.message,true);return;}
 let merged=response.rows;
 if(active.some(a=>a.qualityMode==='mix')){
  try{const list=[...new Set(active.filter(a=>a.qualityMode==='mix').map(a=>a.itemId))];const special=await pricesQuality(list,prefs.region,false);merged=[...merged,...special.rows];}
  catch(e){if(report)showToast('No se pudieron leer precios por calidad: '+e.message,true);}
 }
 const map=rowMap(merged),time=Date.now();let hits=0;
 for(const a of active){const result=evaluateAlert(a,map,prefs.maxAge,time);a.lastResult=result;a.lastCheck=new Date(time).toISOString();
  if(result?.trigger){hits++;
   if(!a.lastTriggered||time-Date.parse(a.lastTriggered)>3600000){a.lastTriggered=new Date(time).toISOString();
    if(typeof Notification!=='undefined'&&Notification.permission==='granted'){
      try{new Notification('Gildem Craft Planner',{body:`${itemName(a.itemId)} en ${a.city}: ROI ${result.roi.toFixed(1)}% · ${fmt(result.profit)} silver/u`});}catch{}
    }
   }
  }
 }
 writeLocal(K_ALERTS,alerts);
 if(state.page==='alertas')alertsPage();
 if(report)showToast(hits?`${hits} alerta(s) alcanzan los umbrales. Comprueba los precios antes de invertir.`:'No hay alertas confirmadas ahora.');
}
function downloadText(text,name,type){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function exportBackup(){downloadText(JSON.stringify({version:7,exported:new Date().toISOString(),portfolios:loadPortfolios(),alerts:loadAlerts(),focus:loadFocusProfile(),wallet:loadWallet()},null,2),'gildem-craft-respaldo.json','application/json');}
function exportLedger(){const data=[['PLAN','FECHA','ITEM','MERCADO','FABRICADAS','VENDIDAS','COSTO_UNITARIO','PRECIO_VENTA_UNITARIO','TARIFAS','TRANSPORTE','PROFIT_REAL_VENTA']];
 for(const p of loadPortfolios())for(const lot of p.lots)for(const s of lot.sales||[]){const profit=s.qty*(s.price-lot.unitCost)-s.fees-s.transport;data.push([p.title,s.at,lot.id,lot.market,lot.qty,s.qty,lot.unitCost,s.price,s.fees,s.transport,profit]);}
 const csv='\ufeff'+data.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(';')).join('\r\n');downloadText(csv,'gildem-ventas-reales-v6.csv','text/csv;charset=utf-8;');}
async function importBackup(file){if(!file)return;if(file.size>2000000)return showToast('El respaldo supera el tamaño permitido (2 MB).',true);
 try{const payload=JSON.parse(await file.text());if(![4,6,7].includes(payload.version)||!Array.isArray(payload.portfolios)||!Array.isArray(payload.alerts)||!payload.focus||typeof payload.focus!=='object')throw Error('Formato de respaldo inválido.');
  if(!confirm('¿Reemplazar tus inversiones, alertas y valores de Focus actuales por este respaldo?'))return;
  writeLocal(K_LEDGER,payload.portfolios.slice(0,500));writeLocal(K_ALERTS,payload.alerts.slice(0,500));writeLocal(K_FOCUS,payload.focus);if(payload.wallet)writeLocal(K_WALLET,payload.wallet);render();showToast('Respaldo recuperado en este navegador.');
 }catch(e){showToast('No se pudo restaurar: '+e.message,true);}}
function registerRealSale(){const raw=val('sale-lot'),s=raw.indexOf('::');if(s<0)return showToast('Selecciona un lote de una inversión.',true);
 const pid=raw.slice(1,s),lotId=raw.slice(s+2),all=loadPortfolios(),i=all.findIndex(x=>x.id===pid);
 if(i<0)return showToast('No se encontró el plan.',true);
 if(all[i].started!==true)return showToast('Primero marca los materiales de ese plan como comprados.',true);
 const qty=num('sale-qty',0),price=num('sale-price',0);let fees=num('sale-fees',0);if(fees===0)fees=price*qty*prefs.tax/100;
 try{all[i]=recordSale(all[i],lotId,{qty,price,fees,transport:num('sale-shipping',0)});if(writeLocal(K_LEDGER,all)){showToast('Venta registrada correctamente.');portfolioPage();}}
 catch(e){showToast(e.message,true);}
}
function updateLotCost(pid,lotId){const all=loadPortfolios(),i=all.findIndex(x=>x.id===pid);if(i<0)return;
 const lot=all[i].lots.find(x=>x.lotId===lotId);if(!lot)return;
 const input=window.prompt('Costo neto REAL de fabricar cada unidad (después de devolver materiales), en silver:',String(Math.round(lot.unitCost)));
 if(input===null)return;
 try{all[i]=setLotCost(all[i],lotId,input);if(writeLocal(K_LEDGER,all)){portfolioPage();showToast('Costo corregido: ahora se reflejará en el beneficio realizado.');}}catch(e){showToast(e.message,true);}
}

// Los fallos de imagen no se confunden con errores de precios ni generan bucles.
document.addEventListener('error',e=>{
 const el=e.target;if(el?.tagName!=='IMG'||!el.dataset?.iconId)return;
 const step=Number(el.dataset.iconStep||0);
 if(step>=iconSources(el.dataset.iconId,Number(el.dataset.iconSize||84)).length-1)return;
 const next=nextIconSource(el.dataset.iconId,Number(el.dataset.iconSize||84),step);
 if(next.final)el.classList.add('icon-placeholder');
 if(new URL(next.src,location.href).href===el.src||next.step<=step)return;
 el.dataset.iconStep=String(next.step);
 el.src=next.src;
},true);
function probeImage(url,timeoutMs=5000){return new Promise(resolve=>{
 const img=new Image();let finished=false;
 const finish=ok=>{if(finished)return;finished=true;clearTimeout(t);img.onload=null;img.onerror=null;resolve(ok);};
 const t=setTimeout(()=>finish(false),timeoutMs);
 img.onload=()=>finish(img.naturalWidth>0);img.onerror=()=>finish(false);img.src=url;
});}
async function runIconDiagnostics(){
 const el=control('icon-diagnostics');if(!el)return;el.textContent='Probando fuentes de imágenes…';
 const sources=iconSources('T4_BAG',84).filter(src=>src!==FALLBACK_ICON&&!src.startsWith('./item-icons/'));
 const labels=['CDN alternativo','Proxy Netlify','Render oficial'];
 const results=await Promise.all(sources.map(src=>probeImage(src)));
 const dest=control('icon-diagnostics');if(!dest)return;
 dest.innerHTML=results.map((ok,i)=>`<span class="pill ${ok?'green':'red'}">${h(labels[i]||'Fuente '+(i+1))}: ${ok?'Funciona':'No disponible'}</span>`).join(' ') + '<p class="explain">Si todas fallan, revisa extensiones de bloqueo, tu red o utiliza la versión completa con iconos guardados durante el despliegue.</p>';
}

document.addEventListener('click',e=>{
 const group=e.target.closest('[data-branch-group]');if(group){changeBranchGroup(group.dataset.branchGroup);return;}
 const choice=e.target.closest('[data-branch-choice]');if(choice){chooseBranch(choice.dataset.branchChoice);return;}
 const nav=e.target.closest('[data-nav]');if(nav){changePage(nav.dataset.nav);return;}
 const s=e.target.closest('[data-select-id]');if(s){state.id=s.dataset.selectId;state.query=itemName(state.id);const input=control('item-search');if(input)input.value=state.query;const list=control('search-results');if(list)list.style.display='none';runLookup();return;}
 const btn=e.target.closest('[data-action]');if(!btn)return;
 const action=btn.dataset.action;
 if(action==='save-investment')savePlanPortfolio();
 if(action==='watch-route')appendPlanAlert(btn.dataset.index);
 if(action==='backup-data')exportBackup();
 if(action==='export-ledger')exportLedger();
 if(action==='check-alerts')checkAlerts(true);
 if(action==='enable-notify'){if(typeof Notification==='undefined')showToast('Este navegador no admite notificaciones.',true);else Notification.requestPermission().then(p=>showToast(p==='granted'?'Notificaciones activadas.':'Permiso no concedido.'));}
 if(action==='start-portfolio'){try{const all=startPortfolio(loadPortfolios(),btn.dataset.pid,loadWallet());if(writeLocal(K_LEDGER,all)){portfolioPage();showToast('Compra registrada; el capital se descuenta de tu caja.');}}catch(e){showToast(e.message,true);}}
 if(action==='delete-portfolio'){if(confirm('¿Borrar este plan con todas sus ventas registradas?')){writeLocal(K_LEDGER,loadPortfolios().filter(x=>x.id!==btn.dataset.pid));portfolioPage();}}
 if(action==='edit-lot')updateLotCost(btn.dataset.pid,btn.dataset.lot);
 if(action==='remove-focus'){const p=loadFocusProfile();delete p[btn.dataset.id];writeLocal(K_FOCUS,p);focusPage();}
 if(action==='toggle-alert'){const a=loadAlerts();const r=a.find(x=>x.id===btn.dataset.aid);if(r){r.enabled=!r.enabled;writeLocal(K_ALERTS,a);alertsPage();}}
 if(action==='remove-alert'){writeLocal(K_ALERTS,loadAlerts().filter(x=>x.id!==btn.dataset.aid));alertsPage();}
 if(action==='lookup')runLookup(true);
 if(action==='refresh')currentAction(true);
 if(action==='export-plan')exportPlan();
 if(action==='export-shopping')exportShopping();
 if(action==='preflight')runPreflight();
 if(action==='refresh-craft-now')runCraft(true);
 if(action==='add-route')addPlanRoute(btn.dataset.routeKey);
 if(action==='clear-cache'){if(confirm('¿Eliminar los precios almacenados en este dispositivo?')){clearCache();showToast('Caché eliminada');settingsPage();}}
 if(action==='test-icons')runIconDiagnostics();
 if(action==='sync-catalog')syncCatalog(true);
 if(action==='refresh-game-recipes')syncGameRecipes();
 if(action==='advanced')syncAdvanced();
});
document.addEventListener('input',e=>{if(e.target.id==='craft-branch-search'){const el=control('craft-branch-options');if(el)el.innerHTML=branchOptions(e.target.value);return;}if(e.target.id==='item-search'){state.query=e.target.value;suggestItems(state.query);}});
document.addEventListener('change',e=>{if(e.target.matches('[data-plan-qty]')){changePlanQty(Number(e.target.dataset.planQty),Number(e.target.value));return;}if(e.target.id==='restore-data')importBackup(e.target.files?.[0]);if(e.target.closest('#craft-form')){craftRateHelp();try{saveCraftPrefs({...calcInputs(),focus:val('craft-focus','no'),unknown:num('craft-unknown',2)});}catch{}}if(e.target.id==='settings-premium'){const tax=control('settings-tax');if(tax)tax.value=e.target.value==='premium'?4:8;}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='craft-branch-search'){e.preventDefault();const first=sortedBranches(branchCategory,e.target.value)[0];if(first)chooseBranch(first.key);return;}if(e.key==='Enter'&&e.target.id==='item-search'){e.preventDefault();control('search-results').style.display='none';runLookup();}});
document.addEventListener('submit',e=>{e.preventDefault();const id=e.target.id;if(id==='trade-form')runTrade();if(id==='craft-form')runCraft();if(id==='refine-form')runRefine();if(id==='transmute-form')runTransmute();if(id==='enchant-form')runEnchant();if(id==='settings-form')applySettings();
 if(id==='sale-form')registerRealSale();
 if(id==='wallet-form'){try{const initial=Number(val('wallet-initial',''));if(!Number.isFinite(initial)||initial<0)throw Error('Capital inicial inválido');let wallet=loadWallet();wallet={...wallet,initial,adjustments:Array.isArray(wallet.adjustments)?wallet.adjustments:[]};const extra=num('wallet-adjust',0);if(extra)wallet=adjustWallet(wallet,extra,val('wallet-note','Ajuste manual'));if(writeLocal(K_WALLET,wallet)){portfolioPage();showToast('Saldo actualizado.');}}catch(err){showToast(err.message,true);}}
 if(id==='alert-form'){const index=num('alert-route',-1),route=state.plan?.plan.rows[index];if(!route){showToast('Genera un plan primero.',true);return;}const all=loadAlerts();all.push(addAlertFromRoute(route,{minRoi:num('alert-roi',10),minProfit:num('alert-profit',3000)}));if(writeLocal(K_ALERTS,all)){showToast('Alerta guardada.');alertsPage();}}
 if(id==='focus-form'){const id=val('focus-item').trim().toUpperCase();const focus=num('focus-cost',0),spec=num('focus-spec',0);if(!/^T[2-8]_[A-Z0-9_]+(?:@[1-4])?$/.test(id)||!(focus>0)||spec<0||spec>120){showToast('Introduce un ID válido, un costo positivo y spec de 0 a 120.',true);return;}const p=loadFocusProfile();p[id]={focus,spec};if(writeLocal(K_FOCUS,p)){focusPage();showToast('Perfil de Focus actualizado.');}}
 });
$('#mobile-menu').addEventListener('click',()=>document.querySelector('.sidebar').classList.toggle('open'));
$('#server-select').value=prefs.region;
$('#server-select').addEventListener('change',e=>{prefs.region=e.target.value;save();state.market=null;state.trade=null;state.plan=null;state.refine=null;state.enchant=null;state.transmute=null;render();showToast('Servidor actualizado');});
render();syncCatalog();
if('serviceWorker'in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
window.setInterval(()=>{if(document.visibilityState==='visible'){currentAction(false);checkAlerts(false).catch(()=>{});}},HOUR);
window.addEventListener('focus',()=>{if(state.lastFetch&&Date.now()-state.lastFetch>HOUR)currentAction(false);});
