import {specFameGoal,craftingFameFromRecipe,planLevelCraft,eligibleToStudy,createStudyOnlyCandidates} from './core/level-craft.js';
import {resultsSummary, budgetGroups, shoppingWithCeilings, preflightOverview, shoppingListText} from './core/results-view.js';
import {groupProduction, groupSales, groupLogistics, distributeProductionQuantity} from './core/production-view.js';
import {normalizeOrderbook,enrichWithDepth,routeProfitAtQuantity} from './core/depth.js';
import {journalInfo,journalSummary,JOURNAL_NPC_REFERENCE} from './core/journals.js';
import {rebuildPlan,fitPlan} from './core/plan.js';
import {CITIES,ALL_CITIES,CITY_COLORS,fmt,short,h,qualityQuote,freshnessLabel,rowMap,quote,profitTrade,topTrades,craftCost,craftProfit,historyDaily,allocatePlan,craftingReturnRate,allocateCraftPlan,selectCraftSaleRoutes,itemTier,itemEnch,normalized} from './core/engine.js';
import {iconSources,nextIconSource,FALLBACK_ICON} from './core/icons.js';
import {BRANCHES,BRANCH_CATEGORIES,categoryForBranch,branchIsRoyalOnly,sortedBranches,branchByKey,recipesForBranch,registerPotionFamilies,registerMountFamilies,visibleRoyalBranches,refiningBranchFamilies} from './core/branches.js';
import {refiningInputsFor,compareRefining,plannedRefining,refiningReturnRate} from './core/refining-integration.js';
import {materialPurchaseCities} from './core/material-cities.js';
import {REFINERY_CHOICES,refinementScanIds,refiningPriceIds,createRefiningCandidates} from './core/refining-opportunities.js';
import {itemStem,itemMatches,familyChoices} from './core/item-selection.js';
import {blackMarketEligible,specialType} from './core/special-recipes.js';
import {prices,history,orderbook,pricesQuality,clearCache,cachedCount,HOUR} from './core/data.js';
import {historyMetrics,confidenceOf,scenarioProfit,qualityWeightedSale,allocateSmartPortfolio,focusPerSilver} from './core/optimizer.js';
import {createPortfolioFromPlan,summarizePortfolio,recordSale,setLotCost,overallDashboard} from './core/ledger.js';
import {addAlertFromRoute,evaluateAlert} from './core/alerts.js';
import {allocatePortfolioV6} from './core/allocator-v6.js';
import {pendingUnitsByMarket,investmentBudget,portfolioDiversityStats,materialDepthAssessment,stagedMaterialNeeds,observedRotation,validateIntelligentEdits} from './core/intelligent-portfolio.js';
import {MIN_WEEKLY_ACTIVITY,observedWeeklyActivity,bulkMarketCandidates,bulkItemExposureFraction,portfolioFillSummary} from './core/high-volume.js';
import {selectPatientRoutes} from './core/adaptive-planner.js';
import {historicalBmListingTarget,chooseBmListingPrice} from './core/bm-listing-prices.js';
import {normalizeSellBook,listingPressure} from './core/competition.js';
import {verifyPlannedPrices,breakEvenPrice} from './core/verify.js';
import {cashPosition,startPortfolio,adjustWallet} from './core/cashflow.js';
import {learnFromSales} from './core/personal-learning.js';
import {checkMaterialSupply} from './core/material-supply.js';
import {limitRowsByMaterialVolume,limitRowsByMaterialBook} from './core/procurement-liquidity.js';
import {coverageByMarket,diagnoseScan,marketResearchIds,marketAuditIds} from './core/market-discovery.js';
import {volumeTrend} from './core/market-volume.js';
import {chosenDemandIds,demandHistoryIndex,discoverDemand,demandExplanation} from './core/demand-first.js';
import {evidenceForPlan} from './core/market-proof.js';
import {MARKET_SNAPSHOT_KEY,parseMarketRanking,validMarketSnapshot,externalDaily,conflictingServerLabel} from './core/external-demand.js';
import {MARKET_REFERENCES,marketReferenceSnapshot} from './core/market-references.js';
import {REGION,requireWest,sourceLabel} from './core/server-policy.js';
import {makeWestResearchBrief} from './core/west-ai-brief.js';
import {selectUniversalRecipes,createUniversalCandidates,verifiedRotation} from './core/opportunity-scan.js';
import {chooseRoyalSaleCities,filterRoyalSaleRoutes} from './core/royal-sale-markets.js';
import {filterViableCraftRoutes} from './core/viability.js';
import {attachMarketIntelligence} from './core/market-intelligence.js';
import {chooseCraftingCities} from './core/city-consolidation.js';
import {validateEntry,availableInventory,procurementPlan,consumeAllocations} from './core/inventory.js';
import {planLogistics} from './core/logistics.js';
import {recipeSnapshot,compareSnapshot,flagChangedPortfolios} from './core/patch-watch.js';
import {newSyncCode,syncId,encryptPayload,decryptPayload} from './core/sync-crypto.js';
import {names,recipes,loadCatalog,loadSpecialCatalog,recipeCatalogStatus,itemName,findItems,GROUPS,craftable,loadAdvanced,journalFor,journalIds} from './core/catalog.js';
const $=(s)=>document.querySelector(s);
const main=$('#main-content');
const navNames={resultados:'Resultados',autocraft:'Royal Craft',cartera:'Mi negocio',focuslab:'Focus y specs',alertas:'Mis alertas',inicio:'Resumen',precios:'Precios y mercados',comercio:'Oportunidades',negro:'Mercado Negro',crafting:'Black Craft',refino:'Refinamiento',transmutar:'Transmutación',encantar:'Encantamiento',ajustes:'Ajustes y datos'};
const prefs={region:'west',premium:true,tax:4,setup:2.5,maxAge:24,transport:0,rrr:24.8,station:0};
try{Object.assign(prefs,JSON.parse(localStorage.getItem('gildem-prefs')||'{}'));}catch{}
prefs.region=REGION; // Corrige preferencias antiguas que apuntaban a Europa/Asia.
const state={resultSource:'crafting',autoPlan:null,autoRunning:false,autoInfo:null,levelPlan:null,levelRunning:false,preflight:null,page:'crafting',id:'T4_BAG',market:null,trade:null,plan:null,refine:null,enchant:null,transmute:null,catalogReady:false,loading:true,lastFetch:0,lastWarning:null,query:'',fullCatalog:false};
function save(){prefs.region=REGION;try{localStorage.setItem('gildem-prefs',JSON.stringify(prefs));}catch{}}
function importedMarketVolume(){try{const data=JSON.parse(localStorage.getItem(MARKET_SNAPSHOT_KEY)||'null');return validMarketSnapshot(data,{region:prefs.region})?data:null;}catch{return null;}}
function demandEvidence(candidates,historyRows,ids,cities){
 const byMarket=discoverDemand(ids,historyRows,cities).byMarket,snapshot=importedMarketVolume();
 for(const x of candidates){
  const market=byMarket.get(x.id+'|'+x.city);
  x.activity=market?.activity||historyMetrics([],14);
  x.activity7=market?.activity7||historyMetrics([],7);
  x.activity30=market?.activity30||historyMetrics([],30);
  const imported=externalDaily(snapshot,x.id,x.city,{region:prefs.region});
  const aodp=market?.daily??null;
  // A user-pasted report may cover more history than AODP's sampled feed.
  // Source, date and provisional status remain visible. NEVER import its prices.
  if(imported&&imported.daily>(aodp??0)){
   x.demandDaily=imported.daily;x.demandSource=imported.source+' · importación manual';x.externalDemand=true;
  }else{
   x.demandDaily=aodp;x.demandSource=market?.verified?'AODP · historial del servidor':'Sin historial de mercado';x.externalDemand=false;
  }
 }
 return {importedRows:snapshot?.rows.length||0,observedAt:snapshot?.observedAt||null};
}
function saveExternalMarketVolume(){
 const field=val('market-volume-paste','').trim(),source=val('market-volume-source','hub');
 const date=val('market-volume-date','');
 const market=val('market-volume-market','Black Market');
 const region='west';
 if(!checked('market-volume-west-proof'))return showToast('No se pueden importar cantidades sin confirmar expresamente que la tabla corresponde a América (West).',true);
 if(conflictingServerLabel(field))return showToast('La tabla menciona Europa o Asia: no se importará a América West.',true);
 if(!date||!Number.isFinite(Date.parse(date+'T12:00:00Z')))return showToast('Indica la fecha real que muestra la página para no usar datos viejos.',true);
 const rows=parseMarketRanking(field,{source,market});
 if(!rows.length)return showToast('No pude leer IDs y cantidades. Copia una tabla con la columna de unidades diarias.',true);
 const snapshot={source,region,serverProof:'user-confirmed-west',observedAt:date+'T12:00:00Z',rows};
 if(!validMarketSnapshot(snapshot,{region}))return showToast('Solo se permiten tablas confirmadas de América (West), con fecha de hasta 14 días.',true);
 try{localStorage.setItem(MARKET_SNAPSHOT_KEY,JSON.stringify(snapshot));settingsPage();showToast('Guardadas '+rows.length+' estadísticas por objeto y ciudad. Son referencias manuales, NO precios live.');}
 catch{return showToast('El navegador no permite guardar estas estadísticas en este dispositivo.',true);}
}

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
 const px=size>=64?192:96;const url=iconSources(id,px)[0];
 return `<img class="item-icon ${size>=64?'large':''}" loading="${eager?'eager':'lazy'}" decoding="async" referrerpolicy="no-referrer" width="${size}" height="${size}" src="${h(url)}" data-icon-id="${h(id)}" data-icon-size="${px}" data-icon-step="0" alt="">`;
}
function itemCell(id,label='',sub=''){const detail=String(sub||'');const show=detail&&!/^T[1-8]_[A-Z0-9_]+(?:@[1-4])?$/.test(detail);return `<div class="item-cell">${itemimg(id,36)}<div><strong title="${h(itemName(id))}">${h(label||itemName(id))}</strong>${show?`<small>${h(detail)}</small>`:''}</div></div>`;}
function agePill(q){if(!q)return '<span class="pill red">Sin datos</span>';return `<span class="pill ${q.ageHours<1?'green':q.ageHours<=prefs.maxAge?'amber':'red'}">${freshnessLabel(q.at)}</span>`;}
function moneyCell(n,cls=''){return `<span class="number ${cls}">${Number.isFinite(n)?fmt(Math.round(n)):'—'}</span>`;}
function empty(msg='Sin resultados confiables',detail='Prueba con otros tiers, otra ciudad o un límite de antigüedad mayor.'){
 return `<div class="table-empty"><span class="symbol">◇</span><strong>${h(msg)}</strong><span>${h(detail)}</span></div>`;
}
function errorText(e){return `<div class="error-box"><strong>No pudimos completar la consulta.</strong><p>${h(e.message||e)}</p><small>Comprueba la conexión, la disponibilidad de la API o vuelve a intentar más tarde.</small></div>`;}
function showToast(msg,isError=false){const e=$('#toast');e.textContent=msg;e.className=(isError?'error ':'')+'show';clearTimeout(showToast.t);showToast.t=setTimeout(()=>e.className='',4500);}
function setBusy(id,text='Consultando datos del mercado…'){const e=control(id);if(e)e.innerHTML=`<div class="loading"><span class="spinner"></span><span>${h(text)}</span></div>`;}
function updateStatus(info){if(!info)return;state.lastFetch=info.fetchedAt||Date.now();state.lastWarning=info.warning||null;$('#sidebar-status').textContent=info.warning?'Caché de respaldo':info.cached?'Caché de 1 hora':'Consulta completada';$('#api-indicator').textContent=info.warning?'Datos en caché':info.cached?'Caché válida':'AODP consultado';}
function changePage(page){if(page==='levelcraft')page='crafting';if(page!==state.page)state.preflight=null;state.page=page;document.body.classList.toggle('gcp-results-active',page==='resultados');document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===page));$('#page-title').textContent=page==='inicio'?'Tu centro económico':navNames[page];$('#breadcrumb').textContent=navNames[page];document.querySelector('.sidebar').classList.remove('open');render();window.scrollTo({top:0,behavior:'smooth'});}
function render(){if(state.page==='resultados')resultsPage();if(state.page==='inicio')home();if(state.page==='cartera')portfolioPage();if(state.page==='autocraft')autoPage();if(state.page==='focuslab')focusPage();if(state.page==='alertas')alertsPage();if(state.page==='precios')marketPage();if(state.page==='comercio'||state.page==='negro')tradePage();if(state.page==='crafting')craftPage();if(state.page==='refino')refinePage();if(state.page==='encantar')enchantPage();if(state.page==='transmutar')transmutePage();if(state.page==='ajustes')settingsPage();}
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
   ${quick('crafting','⚒','Plan por rama','Sube specs y planifica una línea concreta')}
   ${quick('autocraft','✦','Encontrar oportunidades','Mezcla ramas y mercados con un presupuesto')}
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
const craftDefaults={branch:'boots_plate',city:'auto',daily:0,focus:'no',budget:10000000,invest:'all',market:'black',tierMin:4,tierMax:7,ench:4,buy:'bonus',buyMode:'instant',saleMode:'listed',station:0,transport:0,cap:0,unknown:2,journals:true,goal:'balanced',minConfidence:0,focusBudget:10000,focusPerUnit:0,qualityMode:'normal',q1:100,q2:0,q3:0,q4:0,q5:0,priceStress:8,resourceStress:7,riskBM:0,riskRoyal:0,matShipping:0,bmTax:2.5,royalTax:4,listingFee:2.5,bmMode:'listed',requireBook:false,useWallet:false,refiningMode:'off',refiningFee:0,refiningDaily:0,refiningFocus:false,refiningFocusUnit:0,tierExact:'all',enchExact:'all'};
let craftPrefs={...craftDefaults};
try{Object.assign(craftPrefs,JSON.parse(localStorage.getItem('gildem-craft-simple-v2')||'{}'));}catch{}
// v8.4: no interpretar preferencias antiguas como permiso para refinar insumos del crafting.
craftPrefs.refiningMode='off'; craftPrefs.refiningFocus=false; craftPrefs.ench=4; craftPrefs.bmMode='listed';craftPrefs.saleMode='listed'; if(craftPrefs.buy==='all')craftPrefs.buy='bonus';
// Los filtros antiguos permanecen guardados, pero el plan manual ya no muestra ramas Royal-only ni agregados.
// Plan de crafting manual: solo categorías pensadas para Mercado Negro.
const BM_CATEGORIES=['armor','weapons','accessories','offhands'];
const isAggregateBranch=key=>key==='weapons_all'||key.endsWith('_all');
const isManualBranch=key=>BM_CATEGORIES.includes(categoryForBranch(key))&&!isAggregateBranch(key);
if(!isManualBranch(craftPrefs.branch)){craftPrefs.branch='boots_plate';craftPrefs.market='black';}
const manualBranches=(category,query='')=>sortedBranches(category,query).filter(b=>isManualBranch(b.key));
function saveCraftPrefs(input){craftPrefs={...craftPrefs,...input};try{localStorage.setItem('gildem-craft-simple-v2',JSON.stringify(craftPrefs));}catch{}}
const ITEM_PICK_KEY='gildem-v8.2-craft-item-filters';
let craftItemPrefs={};try{craftItemPrefs=JSON.parse(localStorage.getItem(ITEM_PICK_KEY)||'{}')||{};}catch{}
function craftItemChoice(branch){const v=craftItemPrefs&&typeof craftItemPrefs==='object'&&!Array.isArray(craftItemPrefs)?craftItemPrefs[branch]:null;return v&&typeof v==='object'?{mode:v.mode==='selected'?'selected':'all',stems:Array.isArray(v.stems)?v.stems:[]}:{mode:'all',stems:[]};}
function saveCraftItemChoice(branch,choice){craftItemPrefs[branch]={mode:choice.mode==='selected'?'selected':'all',stems:[...new Set(choice.stems||[])]};try{localStorage.setItem(ITEM_PICK_KEY,JSON.stringify(craftItemPrefs));}catch{}}
// Un único control "Todos los objetos". Desmarcar una tarjeta genera una selección parcial.
function itemPickerHtml(prefix){const all=prefix==='craft'?craftItemChoice(val('craft-branch',craftPrefs.branch)).mode!=='selected':autoPrefs.itemMode!=='selected';
 return `<section class="qc-items"><div class="qc-title"><div><h3>Objetos de esta rama</h3><p>Marca los que quieras analizar.</p></div><label class="qc-toggle qc-all"><input type="checkbox" data-qc-all="${prefix}" ${all?'checked':''}><span>Todos los objetos</span></label></div><div id="${prefix}-item-options" class="qc-items-grid"><p class="muted tiny">Cargando objetos de la rama…</p></div><p class="qc-small" id="${prefix}-item-help"></p><span class="qc-count" id="${prefix}-item-total"></span></section>`;
}
function renderItemChoices(prefix){const el=control(prefix+'-item-options');if(!el)return;
 const key=prefix==='craft'?val('craft-branch',craftPrefs.branch):(autoPrefs.branchKeys||[])[0];
 if(prefix==='auto'&&categoryForBranch(key)==='refining'){
  const chosen=refiningBranchFamilies(key);
  const names={METALBAR:'Lingotes',PLANKS:'Tablones',CLOTH:'Tela',LEATHER:'Cuero',STONEBLOCK:'Bloques de piedra'};
  el.innerHTML=chosen.map(f=>`<div class="qc-item qc-refining-item">${itemimg('T4_'+f,34,true)}<span>${h(names[f]||f)}</span></div>`).join('');
  const counter=control('auto-item-total');if(counter)counter.textContent=chosen.length+' materiales de refinamiento';
  const hint=control('auto-item-help');if(hint)hint.textContent='Se comparan las recetas reales, ciudades Royal y sus órdenes de venta; sin duplicar materiales.';
  const all= document.querySelector('[data-qc-all="auto"]');if(all){all.checked=true;all.disabled=true;}
  return;
 }
 const pickerAllSwitch=document.querySelector(`[data-qc-all="${prefix}"]`);if(pickerAllSwitch)pickerAllSwitch.disabled=false;
 const branch=branchByKey(key||'boots_plate');
 const ids=Object.keys(recipes).filter(id=>branch.test(id)&&recipes[id]?.materials?.length&&recipes[id]?.city);
 const families=familyChoices(ids,itemName),selected=prefix==='craft'?craftItemChoice(key):{mode:autoPrefs.itemMode||'all',stems:autoPrefs.itemKeys||[]};
 el.innerHTML=families.length?families.map(x=>`<label class="qc-item"><input type="checkbox" data-pick-item="${prefix}" value="${h(x.stem)}" ${selected.mode!=='selected'||(Array.isArray(selected.stems)&&selected.stems.includes(x.stem))?'checked':''}>${itemimg(x.iconId,34)}<span>${h(x.label)}</span></label>`).join(''):
  !Object.keys(recipes).length&&state.loading?'<p class="catalog-loading">Sincronizando las recetas de Albion. Las ramas ya están disponibles.</p>':
  !Object.keys(recipes).length?`<div class="catalog-recovery" role="alert"><strong>No se cargaron las recetas de Albion.</strong><p>Puede ser un bloqueo del navegador, del CDN o de la conexión. Las ramas siguen disponibles, pero no se pueden calcular cantidades sin recetas reales.</p><button type="button" class="btn gold" data-action="retry-catalog">↻ Reintentar catálogo</button></div>`:
  '<p class="muted tiny">No hay recetas verificadas en esta rama. Prueba otra rama o vuelve a sincronizar el catálogo.</p>';
 const all=control(prefix+'-item-options')?.querySelectorAll('input[data-pick-item]').length||0;
 const chosen=[...el.querySelectorAll('input[data-pick-item]:checked')].length;
 const allSwitch=document.querySelector(`[data-qc-all="${prefix}"]`);if(allSwitch)allSwitch.checked=all>0&&all===chosen;
 const total=control(prefix+'-item-total');if(total)total.textContent=`${chosen} de ${all} objetos seleccionados`;
 const help=control(prefix+'-item-help');if(help)help.textContent=!chosen?'Selecciona al menos un objeto para generar un plan.':'Los tiers y encantamientos se filtrarán al calcular, no necesitas elegir cada variante.';
}
function qcSaveObjectChecks(prefix){
 const el=control(prefix+'-item-options');if(!el)return;
 const options=[...el.querySelectorAll('input[data-pick-item]')];const stems=options.filter(x=>x.checked).map(x=>x.value);
 const all=options.length>0&&stems.length===options.length;
 if(prefix==='craft')saveCraftItemChoice(val('craft-branch',craftPrefs.branch),{mode:all?'all':'selected',stems});
 else{autoPrefs.itemMode=all?'all':'selected';autoPrefs.itemKeys=stems;saveAutoSelections();}
 renderItemChoices(prefix);
}

// v8.5.4: Controles compactos compartidos por Black Craft y Royal Craft.
// Las casillas exclusivas ofrecen una sola elección, las de tier/encantamiento son múltiples.
const QC_TIERS=[4,5,6,7,8];
const QC_ENCH=[1,2,3,4]; // Las opciones de encantamiento de la interfaz original
const QC_ENCH_OPTIONS=[0,...QC_ENCH]; // También existe .0: alta rotación en BM y Royal.
const QC_BUDGETS=[5000000,10000000,15000000,20000000];
const QC_HORIZON=[7,14,30];
function qcArray(value,allowed,defaults){
 const values=Array.isArray(value)?value.map(Number).filter(v=>allowed.includes(v)):[];
 return values.length?[...new Set(values)]:[...defaults];
}
function qcSource(prefix){return prefix==='craft'?craftPrefs:autoPrefs;}
function qcChoices(prefix,key,entries,selected,{multiple=false}={}){
 const choices=Array.isArray(selected)?selected.map(Number):[Number(selected)];
 return `<div class="qc-options" role="group" aria-label="${h(key)}">${entries.map(([v,label])=>`<label class="qc-option"><input type="checkbox" data-qc-${multiple?'multi':'single'}="${prefix}-${key}" value="${v}" ${choices.includes(Number(v))?'checked':''}><span>${h(label)}</span></label>`).join('')}</div>`;
}
function qcChosen(prefix,key){return [...document.querySelectorAll(`[data-qc-multi="${prefix}-${key}"]:checked, [data-qc-single="${prefix}-${key}"]:checked`)].map(x=>Number(x.value));}
function qcSelectedSettings(prefix){const p=qcSource(prefix);return {
 tiers:qcArray(p.tiersSelected,QC_TIERS,QC_TIERS),
 enchants:qcArray(p.enchSelected,QC_ENCH_OPTIONS,QC_ENCH_OPTIONS),
 budget:QC_BUDGETS.includes(Number(p.budget))?Number(p.budget):10000000,
 horizon:QC_HORIZON.includes(Number(p.horizonDays))?Number(p.horizonDays):14,
 daily:[0,10,20].includes(Number(p.daily))?Number(p.daily):0,
 focus:p.focus===true||p.focus==='yes',
 bonus:p.bonusCity!==false&&(p.city==='auto'||p.city==='compare'||p.bonusCity===true),
 invest:p.invest!=='safe'
};}
function qcWithoutBonusCity(prefix){
 const branchKey=prefix==='craft'?val('craft-branch',craftPrefs.branch):(autoPrefs.branchKeys||[])[0];
 const favorite=branchByKey(branchKey||'boots_plate')?.city;
 return favorite==='Caerleon'?'Bridgewatch':'Caerleon';
}
function qcSetValue(id,value){const el=control(id);if(el)el.value=String(value);}
function qcSync(prefix){
 const tiers=qcChosen(prefix,'tier'),enchants=qcChosen(prefix,'ench');
 if(!tiers.length||!enchants.length)return false;
 const budget=qcChosen(prefix,'budget')[0]||10000000,daily=qcChosen(prefix,'daily')[0]??0,horizonDays=qcChosen(prefix,'horizon')[0]||14;
 const bonus=checked(prefix+'-qc-bonus'),focus=checked(prefix+'-qc-focus'),all=checked(prefix+'-qc-invest');
 const city=bonus?'auto':qcWithoutBonusCity(prefix);
 qcSetValue(prefix+'-city',city);qcSetValue(prefix+'-tiermin',Math.min(...tiers));qcSetValue(prefix+'-tiermax',Math.max(...tiers));
 qcSetValue(prefix+'-ench-exact','all');qcSetValue(prefix+'-daily',daily);qcSetValue(prefix+'-focus',prefix==='craft'?(focus?'yes':'no'):(focus?'yes':'no'));
 qcSetValue(prefix+'-budget',budget);qcSetValue(prefix+'-invest',all?'all':'safe');
 if(prefix==='craft'){
  qcSetValue('craft-market','black');
  saveCraftPrefs({city,bonusCity:bonus,focus:focus?'yes':'no',tiersSelected:tiers,enchSelected:enchants,budget,daily,horizonDays,invest:all?'all':'safe',tierMin:Math.min(...tiers),tierMax:Math.max(...tiers)});
  craftRateHelp();
 }else{
  qcSetValue('auto-market','royal');
  Object.assign(autoPrefs,{city,bonusCity:bonus,focus,tiersSelected:tiers,enchSelected:enchants,budget,daily,horizonDays,invest:all?'all':'safe',tierMin:Math.min(...tiers),tierMax:Math.max(...tiers),market:'royal',branchMode:'selected'});
  saveAutoSelections();
 }
 return true;
}
function qcVariantIncluded(prefix,id,branchKey){
 const src=qcSource(prefix);
 const tiers=qcChosen(prefix,'tier').length?qcChosen(prefix,'tier'):qcArray(src.tiersSelected,QC_TIERS,QC_TIERS);
 const enchants=qcChosen(prefix,'ench').length?qcChosen(prefix,'ench'):qcArray(src.enchSelected,QC_ENCH_OPTIONS,QC_ENCH_OPTIONS);
 const tier=itemTier(id),enchant=itemEnch(id),cat=categoryForBranch(branchKey);
 const naturallyUnenchanted=['potions','mounts','foods','kits','siege','gathering'].includes(cat);
 return tiers.includes(tier)&&(enchants.includes(enchant)||(naturallyUnenchanted&&enchant===0));
}
function qcControls(prefix){const p=qcSelectedSettings(prefix);
 const mk=(key,title,entries,selected,multiple=false)=>`<section class="qc-field"><h4>${h(title)}</h4>${qcChoices(prefix,key,entries,selected,{multiple})}</section>`;
 return `<div class="qc-config">
 <div class="qc-title"><h3>Configuración del plan</h3><span class="qc-automatic">Cálculos automáticos</span></div>
 <div class="qc-settings-grid">
 <section class="qc-field qc-full"><h4>Ciudad de fabricación</h4><label class="qc-toggle"><input type="checkbox" id="${prefix}-qc-bonus" data-qc-toggle="${prefix}" ${p.bonus?'checked':''}><span>Fabricar en ciudad de bono</span></label><small>Se calcula el retorno de recursos automáticamente.</small></section>
 ${mk('tier','Tiers',QC_TIERS.map(x=>[x,'T'+x]),p.tiers,true)}
 ${mk('ench','Encantamiento',QC_ENCH_OPTIONS.map(x=>[x,x===0?'Normal .0':'.'+x]),p.enchants,true)}
 ${mk('daily','Bono diario de producción',[[0,'Sin bono'],[10,'10%'],[20,'20%']],p.daily)}
 <section class="qc-field"><h4>Focus</h4><label class="qc-toggle"><input type="checkbox" id="${prefix}-qc-focus" data-qc-toggle="${prefix}" ${p.focus?'checked':''}><span>Usar Focus</span></label><small>Requiere consumo de Focus verificado en Ajustes.</small></section>
 ${mk('budget','Presupuesto de silver',QC_BUDGETS.map(x=>[x,(x/1e6)+'M']),p.budget)}
 ${mk('horizon','Horizonte de venta por órdenes',QC_HORIZON.map(x=>[x,x+' días']),p.horizon)}
 <section class="qc-field"><h4>Uso del presupuesto</h4><label class="qc-toggle"><input type="checkbox" id="${prefix}-qc-invest" data-qc-toggle="${prefix}" ${p.invest?'checked':''}><span>Usar todo lo posible</span></label><small>Solo oportunidades con margen calculable.</small></section>
 <section class="qc-field"><h4>Crafting de volumen</h4><small>Sin reserva automática. Solo rutas con más de ${MIN_WEEKLY_ACTIVITY} unidades de actividad semanal observada, profit positivo y escenario conservador positivo. Diversificación y compras por etapas.</small></section>
 </div>
 <input type="hidden" id="${prefix}-city" value="${p.bonus?'auto':qcWithoutBonusCity(prefix)}">
 <input type="hidden" id="${prefix}-tiermin" value="${Math.min(...p.tiers)}"><input type="hidden" id="${prefix}-tiermax" value="${Math.max(...p.tiers)}">
 <input type="hidden" id="${prefix}-ench-exact" value="all"><input type="hidden" id="${prefix}-daily" value="${p.daily}">
 <input type="hidden" id="${prefix}-focus" value="${p.focus?'yes':'no'}"><input type="hidden" id="${prefix}-budget" value="${p.budget}"><input type="hidden" id="${prefix}-invest" value="${p.invest?'all':'safe'}">
 <input type="hidden" id="${prefix}-market" value="${prefix==='craft'?'black':'royal'}">
 </div>`;
}
function qcOnChange(target){
 const key=target.dataset.qcSingle||target.dataset.qcMulti;
 const prefix=key?.split('-')[0]||target.dataset.qcToggle;
 if(!prefix||!['craft','auto'].includes(prefix))return false;
 if(target.dataset.qcSingle){
  // El presupuesto y bono diario son mutuamente excluyentes.
  for(const x of document.querySelectorAll(`[data-qc-single="${key}"]`))x.checked=x===target;
 }else if(target.dataset.qcMulti){
  const others=qcChosen(prefix,key.slice(prefix.length+1));
  if(!others.length)target.checked=true; // No dejar una búsqueda vacía accidentalmente.
 }
 qcSync(prefix);
 return true;
}

async function refreshCraftItems(){const el=control('craft-item-options');if(!el)return;
 const key=val('craft-branch',craftPrefs.branch);
 if(branchIsRoyalOnly(key)){
  el.innerHTML='<p class="muted tiny">Cargando recetas de pociones, monturas, comidas o recolección…</p>';
  try{await loadSpecialCatalog(()=>{});registerPotionFamilies(recipes,names);registerMountFamilies(recipes,names);}catch(e){if(state.page==='crafting')el.innerHTML=`<p class="notice amber">No se pudieron cargar las recetas especiales: ${h(e.message)}</p>`;return;}
  if(state.page!=='crafting'||val('craft-branch')!==key)return;
  const options=control('craft-branch-options');if(options)options.innerHTML=branchOptions(val('craft-branch-search',''));
 }
 renderItemChoices('craft');
}
let branchCategory=categoryForBranch(craftPrefs.branch);
// Categoría -> una rama individual, sin búsqueda de texto.
function branchPicker(){
 const selected=branchByKey(craftPrefs.branch);
 return `<section class="qc-branch"><div class="qc-title"><h3>1. Elige una rama</h3><span class="qc-count">Individual</span></div><input id="craft-branch" type="hidden" value="${h(selected.key)}"><div class="qc-category-tabs">${BRANCH_CATEGORIES.filter(g=>BM_CATEGORIES.includes(g.key)).map(g=>`<button type="button" class="qc-category ${branchCategory===g.key?'active':''}" data-branch-group="${h(g.key)}">${itemimg(g.iconId||'T4_BAG',29,true)}<span>${h(g.label)}</span></button>`).join('')}</div><div class="qc-branches" id="craft-branch-options">${branchOptions()}</div><div id="craft-branch-selected" class="qc-small">Rama: <strong>${h(selected.label)}</strong></div></section>`;
}
function branchOptions(){return manualBranches(branchCategory).map(b=>`<button type="button" class="qc-branch-choice ${val('craft-branch',craftPrefs.branch)===b.key?'selected':''}" data-branch-choice="${h(b.key)}">${itemimg(b.iconId||'T4_BAG',32,true)}<span>${h(b.label)}</span></button>`).join('')||'<p class="qc-small">No hay ramas en esta categoría.</p>';}
function chooseBranch(key){const b=branchByKey(key);if(!isManualBranch(key)||b.key!==key)return;
 control('craft-branch').value=key;branchCategory=categoryForBranch(key);
 document.querySelectorAll('[data-branch-group]').forEach(el=>el.classList.toggle('active',el.dataset.branchGroup===branchCategory));
 const options=control('craft-branch-options');if(options)options.innerHTML=branchOptions();
 const selected=control('craft-branch-selected');if(selected)selected.innerHTML=`Rama: <strong>${h(b.label)}</strong>`;
 saveCraftPrefs({branch:key,market:'black'});qcSync('craft');void refreshCraftItems();
}
function changeBranchGroup(group){if(!BM_CATEGORIES.includes(group))return;
 branchCategory=group;const first=manualBranches(group)[0];if(first)chooseBranch(first.key);
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
 const use=control('craft-invest-preview');if(use)use.textContent='Crafting de volumen: utilizar todo lo posible, sin reserva fija; controlar actividad semanal, beneficio, saturación e inventario pendiente.';
}
function craftPage(){const c=craftPrefs;
 main.innerHTML=`${blockTitle('Black Craft','Un solo destino: Mercado Negro de Caerleon. Elige tu rama y las casillas esenciales; el motor revisa profit, costos y liquidez.')}
 <form id="craft-form" class="panel qc-form">
 ${branchPicker()}
 ${itemPickerHtml('craft')}
 ${qcControls('craft')}
 <div class="qc-bottom-note"><span id="craft-rate-preview" class="qc-return"></span><span>Venta automática: <strong>Mercado Negro</strong>. La rentabilidad se verifica antes de recomendar.</span></div>
 <div class="craft-submit"><button class="btn gold craft-main-submit" type="submit">Generar mi plan Black Craft</button></div>
 </form>
 <div id="craft-results" style="margin-top:18px">${state.plan?craftResult(state.plan):empty('Tu plan aparecerá aquí','Objetos, cantidades, costos, diarios y lista de compras según las condiciones del mercado.')}</div>`;
 qcSync('craft');void refreshCraftItems();
}

const AUTO_CATEGORIES=[['armor','Armaduras','Botas, cascos y pecheras'],['weapons','Armas','Todas las líneas de armas'],['accessories','Accesorios','Capas y bolsas'],['offhands','Manos secundarias','Escudos, antorchas, orbes y secundarios'],['kits','Kits','Kits de rastreo · Royal'],['siege','Asedio','Martillos y estandartes · Royal'],['gathering','Recolección','Equipo, mochilas y herramientas · Royal'],['potions','Pociones','Alquimia · Royal'],['mounts','Monturas','Ensillado · Royal'],['foods','Comidas','Cocina · Royal'],['refining','Refinamiento','Recursos refinados · Royal']];
const autoDefaults={saleCities:[...CITIES],budget:20000000,invest:'all',city:'auto',maxCraftCities:'1',market:'mixed',goal:'balanced',focus:false,deep:false,daily:0,tierMin:4,tierMax:8,ench:4,requireBook:false,categories:AUTO_CATEGORIES.map(x=>x[0]),refineFamilies:REFINERY_CHOICES.map(x=>x.key),refineSale:'listed',refineDaily:0,refineStation:0,refineFreight:0,refineDelivery:0,branchMode:'all',branchKeys:[],itemMode:'all',itemKeys:[],tierExact:'all',enchExact:'all',refiningMode:'off',refiningFee:0,focusUnit:0};
const autoPrefs={...autoDefaults};try{const stored=JSON.parse(localStorage.getItem('gildem-v8-autocraft')||'{}');if(stored&&typeof stored==='object'&&!Array.isArray(stored))Object.assign(autoPrefs,stored);}catch{}
if(!Array.isArray(autoPrefs.branchKeys))autoPrefs.branchKeys=[];
if(!Array.isArray(autoPrefs.categories))autoPrefs.categories=[...autoDefaults.categories];
if(!Array.isArray(autoPrefs.itemKeys))autoPrefs.itemKeys=[];
autoPrefs.saleCities=chooseRoyalSaleCities(autoPrefs.saleCities);
// El escáner también compra refinados para el crafting; refinar para vender sigue disponible como categoría independiente.
autoPrefs.ench=4; autoPrefs.refiningMode='off';
function saveAutoSelections(){try{localStorage.setItem('gildem-v8-autocraft',JSON.stringify(autoPrefs));}catch{}}
// Configuración Royal: seleccionar mercados de VENTA no limita las ciudades
// usadas para encontrar el precio de compra más barato de los materiales.
function selectedRoyalSaleCities(){
 const inputs=[...document.querySelectorAll('#auto-form input[data-royal-sale-city]')];
 return inputs.length?CITIES.filter(city=>inputs.some(x=>x.value===city&&x.checked)):chooseRoyalSaleCities(autoPrefs.saleCities);
}
function royalSaleCitiesHtml(){
 const chosen=new Set(chooseRoyalSaleCities(autoPrefs.saleCities));
 return `<section class="qc-config qc-royal-market-config" aria-labelledby="royal-sale-market-title">
 <div class="qc-title"><h3 id="royal-sale-market-title">¿En qué ciudades Royal quieres vender?</h3><button type="button" class="btn ghost sm" data-action="royal-select-all">Marcar todas</button></div>
 <div class="qc-royal-market-grid" role="group" aria-label="Mercados Royal permitidos">${CITIES.map(city=>`<label class="qc-option qc-royal-market-option"><input type="checkbox" data-royal-sale-city value="${h(city)}" ${chosen.has(city)?'checked':''}><span>${h(city)}</span></label>`).join('')}</div>
 <p class="qc-royal-market-help" id="auto-sale-city-help">${chosen.size} de ${CITIES.length} mercados seleccionados. Solo se recomendarán ventas en las ciudades marcadas. Las compras de materiales siguen comparándose entre ciudades.</p>
 </section>`;
}
function saveRoyalSaleCities(){
 const selected=selectedRoyalSaleCities();
 if(!selected.length)return false;
 autoPrefs.saleCities=selected;
 saveAutoSelections();
 const info=control('auto-sale-city-help');if(info)info.textContent=`${selected.length} de ${CITIES.length} mercados seleccionados. Solo se recomendarán ventas en las ciudades marcadas. Las compras de materiales siguen comparándose entre ciudades.`;
 return true;
}
function readAutoCategories(){const inputs=[...document.querySelectorAll('input[name="auto-category"]')];return inputs.length?inputs.filter(x=>x.checked).map(x=>x.value):autoPrefs.categories;}
// Royal Craft: solo una rama a la vez, nunca una búsqueda en categorías completas.
let autoBranchCategory='armor';
function qcAutoBranchInit(){
 // Migración única del selector antiguo (categorías múltiples) al modo de una rama.
 if(autoPrefs.compactUiVersion!=='8.5.4'){autoPrefs.itemMode='all';autoPrefs.itemKeys=[];autoPrefs.compactUiVersion='8.5.4';saveAutoSelections();}
 const existing=(autoPrefs.branchKeys||[])[0];
 const valid=BRANCHES.some(b=>b.key===existing&&visibleRoyalBranches(categoryForBranch(b.key)).some(x=>x.key===existing));
 const selected=valid?existing:(BRANCHES.find(b=>b.key==='boots_plate')||visibleRoyalBranches('armor')[0])?.key;
 if(!selected)return;
 autoBranchCategory=categoryForBranch(selected);
 autoPrefs.branchMode='selected';autoPrefs.branchKeys=[selected];autoPrefs.categories=[autoBranchCategory];autoPrefs.market='royal';
}
function renderAutoBranches(){const el=control('auto-branch-options');if(!el)return;
 qcAutoBranchInit();
 const all=visibleRoyalBranches(autoBranchCategory);
 const selected=autoPrefs.branchKeys[0];
 el.innerHTML=all.map(b=>`<label class="qc-branch-check"><input type="checkbox" data-auto-branch value="${h(b.key)}" ${selected===b.key?'checked':''}>${itemimg(b.iconId||'T4_BAG',30,true)}<span>${h(b.label)}</span></label>`).join('')||'<span class="qc-small">No hay ramas en esta categoría.</span>';
 document.querySelectorAll('[data-auto-group]').forEach(x=>x.classList.toggle('active',x.dataset.autoGroup===autoBranchCategory));
 const help=control('auto-branch-help');if(help)help.textContent='Una rama individual por plan. Puedes marcar sus objetos abajo.';
}
function qcChooseAutoBranch(key){const b=BRANCHES.find(x=>x.key===key&&visibleRoyalBranches(categoryForBranch(x.key)).some(v=>v.key===key));if(!b)return;
 autoPrefs.branchMode='selected';autoPrefs.branchKeys=[key];autoPrefs.categories=[categoryForBranch(key)];autoBranchCategory=categoryForBranch(key);
 autoPrefs.itemMode='all';autoPrefs.itemKeys=[];saveAutoSelections();
 renderAutoBranches();renderItemChoices('auto');qcSync('auto');void refreshAutoPickers();
}
function qcChooseAutoGroup(group){
 const first=visibleRoyalBranches(group)[0];
 if(first)qcChooseAutoBranch(first.key);
}
function qcRoyalBranchPicker(){qcAutoBranchInit();
 return `<section class="qc-branch"><div class="qc-title"><h3>1. Elige una rama</h3><span class="qc-count">Solo una rama por plan</span></div><div class="qc-category-tabs">${AUTO_CATEGORIES.map(([key,label])=>{const g=BRANCH_CATEGORIES.find(x=>x.key===key);return `<button type="button" class="qc-category ${autoBranchCategory===key?'active':''}" data-auto-group="${h(key)}">${itemimg(g?.iconId||'T4_BAG',27,true)}<span>${h(label)}</span></button>`;}).join('')}</div><div id="auto-branch-options" class="qc-branches"></div><p class="qc-small" id="auto-branch-help"></p></section>`;
}

function refreshAutoCategoryPanels(){
 const cats=readAutoCategories(),hasCraft=cats.some(x=>x!=='refining');
 const onlyCraft=control('auto-craft-only-filters'),refinery=control('auto-refinery-category-panel'),inputMode=control('auto-input-refining');
 if(onlyCraft)onlyCraft.hidden=!hasCraft;
 if(refinery)refinery.hidden=!cats.includes('refining');
 if(inputMode)inputMode.hidden=!hasCraft;
 const notice=control('auto-refine-market-tip');if(notice)notice.hidden=val('auto-market','mixed')!=='black';
}
async function refreshAutoPickers(){refreshAutoCategoryPanels();renderAutoBranches();renderItemChoices('auto');
 const cats=readAutoCategories();if(!cats.some(x=>['gathering','potions','mounts','foods','kits','siege'].includes(x)))return;
 const info=control('auto-item-help');if(info)info.textContent='Sincronizando familias especiales de Albion…';
 try{await loadSpecialCatalog(()=>{});registerPotionFamilies(recipes,names);registerMountFamilies(recipes,names);}catch(e){if(state.page==='autocraft'&&info)info.textContent='Recetas especiales no disponibles: '+e.message;return;}
 if(state.page==='autocraft'){renderAutoBranches();renderItemChoices('auto');}
}
function autoPage(){qcAutoBranchInit();
 main.innerHTML=`${blockTitle('Royal Craft','Busca oportunidades en los mercados Royal, sin mezclar ventas del Mercado Negro. Selecciona una rama, sus objetos y las opciones esenciales.')}
 <form id="auto-form" class="panel qc-form">
 ${qcRoyalBranchPicker()}
 ${itemPickerHtml('auto')}
 ${qcControls('auto')}
 ${royalSaleCitiesHtml()}
 <input type="hidden" id="auto-goal" value="balanced">
 <input type="hidden" id="auto-focus-unit" value="${Number(autoPrefs.focusUnit)||0}">
 <input type="hidden" id="auto-deep" value="wide">
 <input type="hidden" id="auto-max-cities" value="all">
 <input type="hidden" id="auto-branch-mode" value="selected">
 <div class="qc-bottom-note">Destino fijo: <strong>Mercados Royal</strong>. Ventas por <strong>órdenes de venta</strong>: precio observado de publicación menos impuestos y 2,5% de configuración. Refinamiento es una categoría independiente con su ciudad de bono.</div>
 <div class="craft-submit"><button class="btn gold craft-main-submit" type="submit" ${state.autoRunning?'disabled':''}>Generar mi plan Royal Craft</button></div>
 </form>
 <div id="auto-results" style="margin-top:18px">${state.autoPlan?autoResults(state.autoPlan):empty('Tu plan Royal aparecerá aquí','La herramienta buscará oportunidades dentro de la rama seleccionada.')}</div>`;
 qcSync('auto');void refreshAutoPickers();
}

// Level Craft uses the same verified catalog and AODP price engine as Royal Craft.
const LEVEL_KEY='gildem-v8-level-craft';
const levelDefaults={category:'weapons',stem:'',spec:0,exactRemaining:'',budget:20000000,market:'mixed',
 tierMin:4,tierMax:8,enchExact:'all',city:'auto',goal:'balanced',study:'no',studyFee:0,focus:'no',focusUnit:0,focusBudget:10000,
 capPct:10,maxStages:8,manualCraftFame:''};
const levelPrefs={...levelDefaults};try{Object.assign(levelPrefs,JSON.parse(localStorage.getItem(LEVEL_KEY)||'{}'));}catch{}
levelPrefs.maxStages=Math.min(8,Math.max(1,Number(levelPrefs.maxStages)||8));
function saveLevel(){try{localStorage.setItem(LEVEL_KEY,JSON.stringify(levelPrefs));}catch{}}
function levelCategories(){return BRANCH_CATEGORIES.filter(c=>c.key!=='refining');}
function levelItemIds(){return Object.keys(recipes).filter(id=>recipes[id]?.materials?.length&&recipes[id]?.city&&
 BRANCHES.some(b=>b.test(id)&&categoryForBranch(b.key)===levelPrefs.category&&!isAggregateBranch(b.key)));}
let levelFamilyCache={category:null,size:-1,choices:[]};
function levelItems(){const size=Object.keys(recipes).length;if(levelFamilyCache.category===levelPrefs.category&&levelFamilyCache.size===size)return levelFamilyCache.choices;
 const choices=familyChoices(levelItemIds(),itemName);levelFamilyCache={category:levelPrefs.category,size,choices};return choices;}
function levelFamilyChoices(){const el=control('level-item-options');if(!el)return;
 const text=normalized(val('level-item-search','')).trim(),families=levelItems();
 const selected=families.find(f=>f.stem===levelPrefs.stem);
 const filtered=families.filter(f=>normalized(f.label+' '+f.stem).includes(text)).slice(0,90);
 el.innerHTML=filtered.length?filtered.map(f=>`<button type="button" class="branch-choice level-family ${f.stem===levelPrefs.stem?'selected':''}" data-level-family="${h(f.stem)}" title="${h(f.label)}">${itemimg(f.iconId,34)}<span>${h(f.label)}</span></button>`).join(''):
 '<p class="muted tiny">No se encontraron objetos con recetas verificadas. Busca otro nombre o sincroniza el catálogo.</p>';
 const info=control('level-selected');if(info)info.innerHTML=selected?`${itemimg(selected.iconId,38,true)}<strong>${h(selected.label)}</strong>`:'Elige un objeto para planificar su especialización.';
 const count=control('level-family-count');if(count)count.textContent=`${families.length} familias · ${filtered.length} visibles`;
}
async function refreshLevelFamilies(){
 if(state.page!=='levelcraft'||!control('level-item-options'))return;
 if(['gathering','kits','siege','potions','mounts','foods'].includes(levelPrefs.category)){
  const el=control('level-item-options');el.innerHTML='<p class="muted tiny">Sincronizando recetas del juego…</p>';
  try{await loadSpecialCatalog(text=>{if(el)el.textContent=text;});registerPotionFamilies(recipes,names);registerMountFamilies(recipes,names);}
  catch(err){if(el)el.innerHTML=`<p class="notice amber">${h(err.message)}</p>`;return;}
 }
 if(state.page==='levelcraft')levelFamilyChoices();
}
function levelPage(){
 main.innerHTML=`${blockTitle('Level Craft','Sube una especialización de crafting al 100. Prioridad: fabricar y vender sin saturar mercados; estudiar es opcional.')}
 <form id="level-form" class="panel craft-wizard">
 <div class="craft-step"><span class="craft-step-num">1</span><div><h3>¿Qué objeto quieres subir al 100?</h3><p>Selecciona la categoría y un objeto, tal como en Royal Craft. Todas las variantes de tier pertenecen a la misma especialización.</p></div></div>
 <div class="auto-category-grid level-categories">${levelCategories().map(c=>`<label class="auto-category"><input type="radio" name="level-category" value="${h(c.key)}" ${levelPrefs.category===c.key?'checked':''}><span class="auto-category-art">${itemimg(c.iconId,39,true)}</span><span class="auto-category-copy"><strong>${h(c.label)}</strong></span><span class="auto-category-mark" aria-hidden="true">✓</span></label>`).join('')}</div>
 <div class="item-picker level-family-panel"><div class="item-picker-head"><div><strong>Elegir objeto específico</strong><small>Escoge la familia; la calculadora comparará sus tiers y encantamientos disponibles.</small></div><span id="level-family-count" class="pill neutral">Cargando…</span></div>
 <div class="branch-filter"><input type="search" id="level-item-search" class="input" placeholder="Buscar chaqueta, espada, casco…" autocomplete="off"><span>⌕</span></div>
 <div id="level-item-options" class="branch-choice-grid level-family-grid"></div><div id="level-selected" class="level-picked">Selecciona tu objeto</div></div>
 <div class="craft-step"><span class="craft-step-num">2</span><div><h3>Tu especialización actual y presupuesto</h3><p>La meta es spec 100. Para obtener una cifra exacta, copia la fama pendiente de tu Destiny Board.</p></div></div>
 <div class="form-grid">
 ${numberField('Spec actual (0–100)','level-spec',levelPrefs.spec,0,1,'span3')}
 ${numberField('Fama pendiente exacta (opcional)','level-fame',levelPrefs.exactRemaining,0,1,'span4')}
 ${numberField('Presupuesto disponible (silver)','level-budget',levelPrefs.budget,1000,1,'span5')}
 ${selectField('Tier inicial','level-tiermin',[4,5,6,7,8].map(t=>[t,'T'+t]),levelPrefs.tierMin,'span3')}
 ${selectField('Tier máximo desbloqueado','level-tiermax',[4,5,6,7,8].map(t=>[t,'T'+t]),levelPrefs.tierMax,'span3')}
 ${selectField('Encantamiento','level-ench',[['all','Todos los encantamientos'],...Array.from({length:5},(_,n)=>[String(n),'.'+n+' exacto'])],levelPrefs.enchExact,'span3')}
 ${selectField('¿Dónde fabricar?','level-city',[['auto','Ciudad con bono de la receta'],['compare','Comparar bono y Caerleon'],...CITIES.map(x=>[x,x])],levelPrefs.city,'span3')}
 </div>
 <div class="craft-step"><span class="craft-step-num">3</span><div><h3>Cómo quieres progresar</h3><p>Ventas primero. Si no alcanza el presupuesto o la demanda observada, se crearán rondas solo cuando hagan falta.</p></div></div>
 <div class="form-grid">
 ${selectField('Mercados de venta','level-market',[['mixed','Royal + Mercado Negro'],['royal','Solo Royal'],['black','Solo Mercado Negro']],levelPrefs.market,'span4')}
 ${selectField('Prioridad','level-goal',[['balanced','Equilibrio fama + beneficio'],['cheap','Menor costo neto por fama'],['fast','Subir fama con rapidez']],levelPrefs.goal,'span4')}
 ${selectField('¿Estudiar objetos?','level-study',[['no','No, fabricar y vender (recomendado)'],['yes','Sí, si hace falta para avanzar']],levelPrefs.study,'span4')}
 ${numberField('Tarifa de estudio por objeto (si se usa)','level-study-fee',levelPrefs.studyFee,0,1,'span4')}
 ${selectField('¿Usar Focus?','level-focus',[['no','No'],['yes','Sí, con costo real por fabricación']],levelPrefs.focus,'span4')}
 ${numberField('Focus por fabricación (si se usa)','level-focus-unit',levelPrefs.focusUnit,0,1,'span4')}
 ${numberField('Focus disponible (si se usa)','level-focus-budget',levelPrefs.focusBudget,0,1,'span4')}
 </div>
 <details class="craft-advanced"><summary>⚙ Opciones avanzadas (opcional)</summary><div class="form-grid" style="margin-top:12px">
 ${numberField('Máximo % de actividad observada por ronda','level-cap',levelPrefs.capPct,1,1,'span4')}
 ${numberField('Máximo de rondas a proyectar','level-stages',levelPrefs.maxStages,1,1,'span4')}
 ${numberField('Fama base exacta por fabricación, sin Premium (opcional)','level-craft-fame',levelPrefs.manualCraftFame,0,1,'span4')}
 </div><p class="explain">El dato manual de fama por fabricación solo puede aplicarse al elegir un único tier y encantamiento. El sistema usa Premium de Ajustes, y no consume LP automáticamente.</p></details>
 <div class="craft-submit"><button class="btn gold craft-main-submit" type="submit" ${state.levelRunning?'disabled':''}>✧ CALCULAR MI CAMINO A SPEC 100</button><span class="muted tiny">Precios fechados · no presupone ventas confirmadas · no contabiliza LP.</span></div>
 </form>
 <div id="level-results">${state.levelPlan?levelResults(state.levelPlan):empty('Tu plan de especialización aparecerá aquí','Elige un objeto e introduce tu spec y presupuesto.')}</div>`;
 void refreshLevelFamilies();
}
function levelResults(result){const plan=result.plan,goal=result.goal,spent=plan.peakCapital;
 const rows=plan.items.map(x=>`<tr><td>${itemCell(x.id)}</td><td>${h(x.craftCity||'—')}</td><td>${x.method==='study'?'Estudiar (se destruye)':'Vender'}</td><td>${fmt(x.qty)}</td><td>${fmt(Math.round(x.fame))}</td></tr>`).join('');
 const dist=plan.sales.map(x=>`<tr><td>${itemCell(x.id)}</td><td>${h(x.city==='Black Market'?'Mercado Negro':x.city)}</td><td>${fmt(x.units)}</td><td>${moneyCell(x.profit,x.profit>=0?'positive':'negative')}</td></tr>`).join('');
 const mats=plan.materials.map(x=>`<tr><td>${itemCell(x.id)}</td><td>${h(x.city||'—')}</td><td>${fmt(Math.ceil(x.qtyGross))}</td><td>${fmt(Math.ceil(x.qtyNet))}</td></tr>`).join('');
 const rounds=plan.stages.length>1?`<details class="craft-advanced"><summary>Rondas de fabricación y venta (${plan.stages.length})</summary><div class="table-scroll"><table class="data-table"><thead><tr><th>Ronda</th><th>Fabricar</th><th>Fama</th><th>Capital inicial</th><th>Beneficio neto estimado</th></tr></thead><tbody>${plan.stages.map(x=>`<tr><td>${x.number}</td><td>${fmt(x.rows.reduce((s,r)=>s+r.qty,0))} fabricaciones</td><td>${fmt(Math.round(x.fame))}</td><td>${moneyCell(x.investment)}</td><td>${moneyCell(x.netProfit,x.netProfit>=0?'positive':'negative')}</td></tr>`).join('')}</tbody></table></div><p class="explain">Las rondas siguientes solo son viables si cobras las ventas anteriores. No equivalen a días ni garantizan reposición de órdenes.</p></details>`:'';
 return `<div class="page-grid level-results" style="margin-top:16px">
 <div class="col-4">${stat('Fama pendiente al comenzar',fmt(goal.required),goal.estimate?'Estimación por spec: confirma en el Destiny Board':'Dato de referencia o introducido','blue','✧')}</div>
 <div class="col-4">${stat('Fama proyectada',fmt(plan.earnedFame),plan.completed?'Objetivo cubierto':'Aún falta '+fmt(plan.remainingFame)+' fama',plan.completed?'jade':'gold','↗')}</div>
 <div class="col-4">${stat('Beneficio neto estimado',fmt(Math.round(plan.netProfit))+' silver','Capital bruto mayor por ronda: '+short(spent),plan.netProfit>=0?'jade':'gold','◇')}</div>
 <div class="col-12"><div class="panel"><div class="toggleline"><h3 class="subheading">${plan.completed?'Plan estimado hasta spec 100':'Plan parcial: aún no alcanza spec 100'}</h3><span class="pill ${plan.completed?'green':'amber'}">${plan.stages.length} ${plan.stages.length===1?'ronda':'rondas'} · ${plan.studyCount} estudiados</span></div>
 ${plan.completed?'<p class="explain">La fama proyectada cubre el objetivo configurado. Confirma la fama exacta del Destiny Board y los bonos antes de fabricar.</p>':`<p class="notice amber">No se puede afirmar que llegarás a 100 con los precios, límites de actividad y presupuesto indicados. Faltan ~${fmt(plan.remainingFame)} de fama. Prueba otros tiers, más presupuesto o permite estudiar.</p>`}
 <p class="explain">${result.selection?.study==='yes'&&result.selection?.studyFee===0?'La tarifa de estudio está puesta en 0: el cálculo no descuenta el cargo real del taller. ':''}${goal.estimate?'Fama pendiente estimada mediante una curva interpolada; introduce la fama exacta para ajustar cantidades. ':''}${plan.hasEstimatedFame?'Algunos artefactos pueden dar fama adicional: revisa en el juego su fama por fabricación. ':''}${h(plan.warning)}</p>
 <h3 class="subheading" style="margin-top:15px">Lista exacta: qué fabricar</h3><div class="table-scroll"><table class="data-table"><thead><tr><th>Objeto y tier</th><th>Ciudad de craft</th><th>Uso</th><th>Cantidad</th><th>Fama</th></tr></thead><tbody>${rows||'<tr><td colspan="5">No hay rutas con cotizaciones verificables para estos filtros.</td></tr>'}</tbody></table></div>
 <h3 class="subheading" style="margin-top:16px">Lista de compras de materiales</h3><div class="table-scroll"><table class="data-table"><thead><tr><th>Material</th><th>Comprar en</th><th>Bruto</th><th>Neto estimado</th></tr></thead><tbody>${mats||'<tr><td colspan="4">Sin materiales calculados.</td></tr>'}</tbody></table></div>
 <h3 class="subheading" style="margin-top:16px">Distribución de ventas Royal y Mercado Negro</h3><div class="table-scroll"><table class="data-table"><thead><tr><th>Objeto</th><th>Destino</th><th>Unidades</th><th>Beneficio</th></tr></thead><tbody>${dist||'<tr><td colspan="4">No hay ventas planificadas.</td></tr>'}</tbody></table></div>
 ${rounds}${marketReferencesPanel(result.marketReferences)}<p class="explain">Inversión por primera ronda: ${short(plan.stages[0]?.investment||0)} silver. El valor de reventa se calcula con precios observados y puede cambiar. Estudiar destruye el objeto: nunca se incluye en ventas. Los diarios de crafting y LP no están incluidos en estos cálculos.</p></div></div></div>`;
}
async function runLevelCraft(force=false){if(state.levelRunning)return;
 const p={...levelPrefs};Object.assign(p,{spec:num('level-spec',0),exactRemaining:val('level-fame',''),budget:num('level-budget',20000000),market:val('level-market','mixed'),
 tierMin:num('level-tiermin',4),tierMax:num('level-tiermax',8),enchExact:val('level-ench','all'),city:val('level-city','auto'),goal:val('level-goal','balanced'),
 study:val('level-study','no'),studyFee:num('level-study-fee',0),focus:val('level-focus','no'),focusUnit:num('level-focus-unit',0),focusBudget:num('level-focus-budget',10000),
 capPct:num('level-cap',10),maxStages:num('level-stages',8),manualCraftFame:val('level-craft-fame','')});
 if(!p.stem)return showToast('Primero elige el objeto específico que quieres subir.',true);
 if(!Number.isSafeInteger(p.budget)||p.budget<1000||p.spec<0||p.spec>100||!Number.isInteger(p.spec)||p.tierMin>p.tierMax||p.capPct<1||p.capPct>25||p.maxStages<1||p.maxStages>8)return showToast('Revisa spec, presupuesto, tiers y límites de rondas.',true);
 if(p.manualCraftFame!==''&&(p.tierMin!==p.tierMax||p.enchExact==='all'))return showToast('Para fijar fama exacta por fabricación, selecciona un único tier y encantamiento.',true);
 if(p.focus==='yes'&&(p.focusUnit<=0||p.focusBudget<=0))return showToast('Introduce el costo real de Focus por fabricación.',true);
 const sample='T4_'+p.stem;let target;try{target=specFameGoal({itemId:sample,spec:p.spec,exactRemaining:p.exactRemaining});}catch(err){showToast(err.message,true);return;}
 Object.assign(levelPrefs,p);saveLevel();
 if(p.market==='black'&&['gathering','kits','siege','foods','potions','mounts'].includes(p.category))return showToast('Esta categoría no se planifica para el Mercado Negro. Elige Royal o combinado.',true);
 if(target.required===0){state.levelPlan={goal:target,plan:planLevelCraft({goalFame:0,budget:p.budget})};levelPage();return;}
 const marketReferencesPromise=checkMarketReferences();
 state.levelRunning=true;setBusy('level-results','Cargando recetas y cotizaciones de tu especialización…');
 const status=text=>setBusy('level-results',text);
 try{
  if(['gathering','kits','siege','potions','mounts','foods'].includes(p.category))await loadSpecialCatalog(status);
  const all=Object.keys(recipes).filter(id=>itemStem(id)===p.stem&&recipes[id]?.materials?.length&&itemTier(id)>=p.tierMin&&itemTier(id)<=p.tierMax&&
   (p.enchExact==='all'||itemEnch(id)===Number(p.enchExact)));
  if(!all.length)throw Error('No hay recetas verificadas para el objeto, tier y encantamiento elegidos.');
  const available=all.map(id=>({id,branch:BRANCHES.find(b=>b.test(id)&&categoryForBranch(b.key)===p.category)?.key||p.category}));
  const needed=[...new Set([...all,...all.flatMap(id=>recipes[id].materials.map(m=>m.id))])];
  status('Consultando precios de materiales y destinos de venta…');
  const priceResult=await prices(needed,prefs.region,force);updateStatus(priceResult);
  const inputs={...craftPrefs,market:p.market,city:p.city,focus:p.focus==='yes',focusPerUnit:p.focusUnit,cities:CITIES,
   materialPurchase:'bonus',buyMode:'instant',refiningMode:'off',daily:0,station:Number(craftPrefs.station)||0,transport:Number(craftPrefs.transport)||0,
   materialShipping:Number(craftPrefs.matShipping)||0,saleMode:'listed',bmMode:'listed',listingFee:Number(craftPrefs.listingFee)||2.5,
   bmTax:Number(craftPrefs.bmTax)||2.5,royalTax:Number(craftPrefs.royalTax)||4,riskBM:Number(craftPrefs.riskBM)||0,riskRoyal:Number(craftPrefs.riskRoyal)||0,
   priceStress:8,resourceStress:7,allowLoss:false};
  const levelPriceMap=rowMap(priceResult.rows);
  let routes=createUniversalCandidates({selected:available,recipes,priceMap:levelPriceMap,inputs,nameOf:itemName,maxAge:prefs.maxAge}).candidates;
  if(p.study==='yes')routes.push(...createStudyOnlyCandidates({ids:all,recipes,priceMap:levelPriceMap,inputs,maxAge:prefs.maxAge}));
  if(!routes.length)throw Error('No hay precios verificables para los materiales y mercados elegidos. Prueba otro tier, ciudad o activa estudio si corresponde.');
  status('Revisando actividad observada y órdenes BM…');
  try{const hs=await history(all,prefs.region,force);const by=new Map();for(const r of hs.rows){if(Number(r.quality||1)!==1)continue;const key=r.item_id+'|'+(r.location||r.city);by.set(key,[...(by.get(key)||[]),...(r.data||[])]);}
    for(const r of routes){const data=by.get(r.id+'|'+r.city)||[];r.activity=historyMetrics(data,14);r.activity7=historyMetrics(data,7);}
  }catch{for(const r of routes)r.activity=null;}
  const immediate=routes.filter(x=>!x.studyOnly&&x.mode==='instant');
  if(immediate.length){try{
   const ids=[...new Set(immediate.map(x=>x.id))],cities=[...new Set(immediate.map(x=>x.city))];
   const books=await orderbook(ids,prefs.region,force,cities);
   const map=normalizeOrderbook(books.rows,ids,cities,prefs.maxAge);
   routes=routes.map(r=>r.mode==='instant'&&!r.studyOnly?enrichWithDepth(r,map.get(r.id+'|'+r.city)):r);
  }catch{routes=routes.map(r=>r.mode==='instant'&&!r.studyOnly?enrichWithDepth(r,null):r);}}
  // A listed Royal ask is not proof that anyone will buy it. Compare current
  // competitors and market activity before recommending expensive crafts.
  const listed=routes.filter(r=>!r.studyOnly&&r.mode==='listed'&&r.city!=='Black Market');
  if(listed.length){try{
   const ids=[...new Set(listed.map(x=>x.id))],cities=[...new Set(listed.map(x=>x.city))];
   const books=await orderbook(ids,prefs.region,force,cities);
   const sellBook=normalizeSellBook(books.rows,ids,cities,prefs.maxAge);
   for(const r of listed)r.competition=listingPressure(sellBook.get(r.id+'|'+r.city),r.sell);
  }catch{for(const r of listed)r.competition={known:false};}}
  attachMarketIntelligence(routes,levelPriceMap,prefs.maxAge);
  for(const r of routes)if(!r.studyOnly)r.confidence=confidenceOf({ageHours:r.ageHours,activity:r.activity,market:r.city==='Black Market'?'Black Market':'Royal',depthVerified:r.depthVerified,listed:r.mode==='listed'});
  const plan=planLevelCraft({routes,recipes,goalFame:target.required,budget:p.budget,premium:prefs.premium,study:p.study==='yes',studyFee:p.studyFee,
   manualCraftFame:p.manualCraftFame,goal:p.goal,capFraction:p.capPct/100,maxStages:p.maxStages,focusBudget:p.focus==='yes'?p.focusBudget:0});
  if(plan.qualifyingRoutes===0&&plan.studyCount===0&&plan.earnedFame===0)throw Error(plan.rejectedRoutes>0?`No hay una ruta suficientemente segura para invertir: ${plan.safetySummary||'falta margen y demanda observable'}. Prueba otros tiers o aumenta el margen, pero evita fabricar estos objetos a pérdida.`:'No hay suficiente fama calculable con estas recetas. Comprueba la fama por fabricación en el juego.');
  state.levelPlan={goal:target,plan,warnings:priceResult.warning||null,selection:p,marketReferences:await marketReferencesPromise};
  const el=control('level-results');if(el)el.innerHTML=levelResults(state.levelPlan);
 }catch(err){const el=control('level-results');if(el)el.innerHTML=errorText(err);showToast(err.message,true);}finally{state.levelRunning=false;}
}
function autoResults(p){const meta=p.autoMeta||{};
 return `<div class="panel" style="margin-bottom:14px"><div class="toggleline"><h3 class="subheading">Cobertura del escaneo</h3><span class="pill ${meta.partial?'amber':'green'}">${meta.partial?'Muestreo, NO todo el catálogo':'Todas las recetas elegibles encontradas'}</span></div>
 <div class="cost-row"><span>Recetas de crafting examinadas</span><strong>${fmt(meta.scanned||0)} de ${fmt(meta.eligible||0)} elegibles</strong></div><div class="cost-row"><span>Ramas cubiertas</span><strong>${fmt(meta.branches||0)}</strong></div><div class="cost-row"><span>Objetos elegidos</span><strong>${meta.itemsSelected?.length?meta.itemsSelected.length+' familias específicas':'Todos los permitidos por los filtros'}</strong></div><div class="cost-row"><span>Productos de refinamiento analizados</span><strong>${fmt(meta.refiningChecked||0)} · ${fmt(meta.refiningAllocated||0)} rutas elegidas</strong></div><div class="cost-row"><span>Rutas viables</span><strong>${fmt(meta.candidates||0)}</strong></div><div class="cost-row"><span>Ciudades para fabricar</span><strong>${h(meta.craftCities?.join(', ')||'Sin rutas viables')}</strong></div><p class="explain">La cobertura depende de los filtros y límites de AODP. Los recursos refinados, comidas, pociones, monturas y recolección se venden solo en Royal. Las ventas del plan son órdenes de venta, no ventas instantáneas. Las cantidades son conservadoras y los precios observados no garantizan ventas.</p></div>`+craftResult(p);
}
async function runAutoScan(force=false){
 if(state.autoRunning)return;
 const budget=num('auto-budget',20000000),market=val('auto-market','mixed'),goal=val('auto-goal','balanced'),focus=val('auto-focus','no')==='yes',city=val('auto-city','auto');
 const saleCities=selectedRoyalSaleCities();
 if(!saleCities.length){showToast('Selecciona al menos una ciudad Royal donde vender los objetos.',true);return;}
 const tierMin=num('auto-tiermin',4),tierMax=num('auto-tiermax',8),enchant=4,deep=val('auto-deep','quick')==='wide',daily=num('auto-daily',0),maxCraftCities=val('auto-max-cities','1');
  const cats=readAutoCategories();
 const craftCats=cats.filter(x=>x!=='refining'),wantsRefining=cats.includes('refining');
 const refineFamilies=refiningBranchFamilies((autoPrefs.branchKeys||[])[0]);
 const refineSale='listed',refineDaily=daily,refineStation=Number(autoPrefs.refineStation)||0,refineFreight=Number(autoPrefs.refineFreight)||0,refineDelivery=Number(autoPrefs.refineDelivery)||0;
 const branchMode=val('auto-branch-mode','all'),branchKeys=(autoPrefs.branchKeys||[]).filter(x=>BRANCHES.some(b=>b.key===x&&cats.includes(categoryForBranch(x))));
 const itemMode=wantsRefining?'all':autoPrefs.itemMode||'all',itemKeys=wantsRefining?[]:autoPrefs.itemKeys||[];
 const refiningMode='off',refiningFee=0,enchExact=val('auto-ench-exact','all'),focusUnit=num('auto-focus-unit',0);
 if(!Number.isSafeInteger(budget)||budget<1000||budget>1000000000000||tierMin>tierMax||!cats.length){showToast('Comprueba el presupuesto, tiers y categorías.',true);return;}
 if(!['auto','compare',...CITIES].includes(city)){showToast('Selecciona una ciudad de fabricación válida.',true);return;}
 if(!['1','2','all'].includes(maxCraftCities)){showToast('Selecciona el número máximo de ciudades.',true);return;}
 if(goal==='focus'&&!focus){showToast('Activa Focus para optimizar silver por Focus.',true);return;}
 if(wantsRefining&&focus&&!craftCats.length){showToast('El refinamiento con Focus requiere consumo específico de tu spec. Desactiva Focus para evitar un profit falso; el plan de refinamiento actual usa 0 Focus.',true);return;}
 if(craftCats.length&&branchMode==='selected'&&!branchKeys.length){showToast('Marca al menos una rama en Encontrar oportunidades.',true);return;}
 if(wantsRefining&&!refineFamilies.length){showToast('Elige al menos un recurso para refinar.',true);return;}
 if(wantsRefining&&market==='black'&&!craftCats.length){showToast('El refinamiento se vende en Royal. Cambia el destino a Royal o combinado.',true);return;}
 if(craftCats.length&&itemMode==='selected'&&!itemKeys.length){showToast('Marca al menos un objeto específico para buscar.',true);return;}
 if(!['off','auto','always'].includes(refiningMode)||refiningFee<0){showToast('Configuración de refinamiento inválida.',true);return;}
 const focusProfile=loadFocusProfile();if(craftCats.length&&focus&&!(focusUnit>0)&&!Object.values(focusProfile).some(x=>Number(x.focus)>0)){showToast('Introduce el costo real de Focus por fabricación o configura los costos por objeto en Ajustes.',true);return;}
 const input={...craftPrefs,market,goal,focus,budget,city,buyMode:'instant',tierMin,tierMax,enchant,daily,focusPerUnit:0,
  cities:CITIES,saleCities,saleMode:'listed',materialShipping:Number(craftPrefs.matShipping)||0,materialPurchase:'all',includeInstantRoyal:false,station:Number(craftPrefs.station)||0,transport:Number(craftPrefs.transport)||0,
  bmTax:Number(craftPrefs.bmTax)||2.5,royalTax:Number(craftPrefs.royalTax)||4,listingFee:Number(craftPrefs.listingFee)||2.5,riskBM:Number(craftPrefs.riskBM)||0,riskRoyal:Number(craftPrefs.riskRoyal)||0,priceStress:Number(craftPrefs.priceStress)||8,resourceStress:Number(craftPrefs.resourceStress)||7,refiningMode,refiningFee,refiningDaily:Number(craftPrefs.refiningDaily)||0,refiningFocus:false,refiningFocusUnit:0};
 Object.assign(autoPrefs,{saleCities,budget,city,maxCraftCities,market,goal,focus,focusUnit,deep,daily,tierMin,tierMax,ench:enchant,enchExact,refiningMode,refiningFee,refineFamilies,refineSale,refineDaily,refineStation,refineFreight,refineDelivery,requireBook:checked('auto-require-book'),categories:cats,branchMode,branchKeys,itemMode,itemKeys});
 localStorage.setItem('gildem-v8-autocraft',JSON.stringify(autoPrefs));
 const marketReferencesPromise=checkMarketReferences();
 state.autoRunning=true;state.preflight=null;setBusy('auto-results','Preparando el catálogo de las ramas seleccionadas…');
 const status=text=>setBusy('auto-results',text);
 try{
  if(craftCats.some(x=>['gathering','potions','mounts','foods','kits','siege'].includes(x)))await loadSpecialCatalog(status);
  if(craftCats.length){registerPotionFamilies(recipes,names);registerMountFamilies(recipes,names);}
  const pick=craftCats.length?selectUniversalRecipes(recipes,BRANCHES,{categories:craftCats,tierMin,tierMax,enchant,limit:deep?900:750,categoryForBranch,branchKeys:branchMode==='selected'?branchKeys:null,itemFilter:{mode:itemMode,stems:itemKeys,enchExact},idFilter:id=>qcVariantIncluded('auto',id,branchKeys[0])}):{chosen:[],eligible:0,branches:0,scanned:0,coverage:1,partial:false};
   if(craftCats.length)pick.chosen=pick.chosen.filter(x=>qcVariantIncluded('auto',x.id,branchKeys[0]));
  const scanRefining=wantsRefining&&market!=='black'?refinementScanIds({families:refineFamilies,tierMin,tierMax,enchant,enchExact}).filter(x=>qcVariantIncluded('auto',x.id,(autoPrefs.branchKeys||[])[0])):[];
  if(!pick.chosen.length&&!scanRefining.length)throw Error('No hay recetas ni recursos refinables con esos tiers y filtros.');
  const ids=pick.chosen.map(x=>x.id),materials=[...new Set(ids.flatMap(id=>(recipes[id]?.materials||[]).map(m=>m.id)))];
  const refineIds=craftCats.length&&refiningMode!=='off'?refiningInputsFor(materials):[];
  const standaloneIds=refiningPriceIds(scanRefining);
  status(`Comparando ${ids.length} recetas y ${scanRefining.length} productos refinados en los mercados…`);
  const p=await prices([...new Set([...ids,...materials,...refineIds,...standaloneIds])],prefs.region,force);
  updateStatus(p);
  const priceMap=rowMap(p.rows);
  const result=createUniversalCandidates({selected:pick.chosen,recipes,priceMap,inputs:{...input,focusPerUnit:focusUnit},profile:focusProfile,experience:learnFromSales(loadPortfolios()),nameOf:itemName,maxAge:Math.max(prefs.maxAge,72)});
  const refinery=createRefiningCandidates({selected:scanRefining,priceMap,market,saleCities,mode:refineSale,maxAge:Math.max(prefs.maxAge,72),stationFee:refineStation,dailyBonus:refineDaily,bonusCity:checked('auto-qc-bonus'),
   materialShipping:refineFreight,transport:refineDelivery,royalTax:input.royalTax,listingFee:input.listingFee,
   riskRoyal:input.riskRoyal,priceStress:input.priceStress,resourceStress:input.resourceStress,nameOf:itemName});
  // El mismo motor asigna un único capital a crafting y refinamiento.
  let candidates=filterRoyalSaleRoutes([...result.candidates,...refinery.candidates],saleCities);
  // Primero medir la actividad de todas las rutas con precio/costo real.
  // No descartar un mercado por un ROI teórico alto de otra ciudad.
  candidates=candidates.filter(x=>x.profit>0&&x.capitalPerUnit>0);
  const ids2=marketResearchIds(candidates,{maxItems:deep?320:180});
  // No eliminar rutas por quedar fuera de la muestra de historial: esas rutas
  // se valoran como actividad no verificada y pueden entrar en el plan paciente.
  // Inspect selected items even without any profitable quote. Otherwise a zero-plan
  // screen would offer no clue whether the chosen item sells in other cities.
  const marketHistoryIds=chosenDemandIds([...new Set([...ids,...scanRefining.map(x=>x.id)])],900);
  let warning=p.warning||'';const histLookup=new Map();let historyVerified=false;
  if(marketHistoryIds.length){status('Consultando actividad histórica por ciudad, incluso para objetos sin profit…');try{
   const hist=await history(marketHistoryIds,prefs.region,force);warning=[warning,hist.warning].filter(Boolean).join(' · ');
   historyVerified=!!hist.rows?.length&&!hist.warning;
   for(const [key,series] of demandHistoryIndex(hist.rows))histLookup.set(key,series);
  }catch(e){warning=[warning,'Historial incompleto: '+e.message].filter(Boolean).join(' · ');}}
  const demandImport=demandEvidence(candidates,histLookup,marketHistoryIds,saleCities);
  const marketCoverage=coverageByMarket(ids,priceMap,{cities:saleCities,market:'royal',maxAge:prefs.maxAge,history:histLookup.size?histLookup:null});
  marketCoverage.historySample=marketHistoryIds.length;marketCoverage.historyUniverse=ids.length;
  marketCoverage.historyObserved=new Set([...histLookup].filter(([,data])=>data.length).map(([key])=>key.split('|')[0])).size;
  marketCoverage.historyPairs=[...histLookup].filter(([,data])=>data.length).length;
  marketCoverage.historyPartial=!historyVerified;
  const instant=candidates.filter(x=>x.mode==='instant'),instantIds=[...new Set(instant.map(x=>x.id))];
  if(instantIds.length){status('Comprobando órdenes de compra y límites de absorción…');try{
    const places=[...new Set(instant.map(x=>x.city))],bookResult=await orderbook(instantIds,prefs.region,force,places);
    warning=[warning,bookResult.warning].filter(Boolean).join(' · ');
    const map=normalizeOrderbook(bookResult.rows,instantIds,places,prefs.maxAge);
    candidates=candidates.map(x=>x.mode==='instant'?enrichWithDepth(x,map.get(x.id+'|'+x.city)):x);
  }catch(e){warning=[warning,'Órdenes de compra sin verificar: '+e.message].filter(Boolean).join(' · ');
   candidates=candidates.map(x=>x.mode==='instant'?enrichWithDepth(x,null):x);
  }}
  if(autoPrefs.requireBook)candidates=candidates.filter(x=>x.city!=='Black Market'||x.depthVerified);
  const listed=candidates.filter(x=>x.mode==='listed'&&x.city!=='Black Market');
  if(listed.length){status('Revisando competencia Royal y profundidad de publicación…');try{
   const bid=[...new Set(listed.map(x=>x.id))].slice(0,deep?120:70),cities=[...new Set(listed.map(x=>x.city))];
   const res=await orderbook(bid,prefs.region,force,cities),book=normalizeSellBook(res.rows,bid,cities,prefs.maxAge);
   for(const x of listed)x.competition=listingPressure(book.get(x.id+'|'+x.city),x.sell);
   warning=[warning,res.warning].filter(Boolean).join(' · ');
  }catch(e){warning=[warning,'Competencia Royal no comprobada: '+e.message].filter(Boolean).join(' · ');}}
  attachMarketIntelligence(candidates,priceMap,prefs.maxAge);
  for(const x of candidates){x.confidence=confidenceOf({ageHours:x.ageHours,activity:x.activity,market:x.city==='Black Market'?'Black Market':'Royal',depthVerified:x.depthVerified,listed:x.mode==='listed'});x.dailySales=null;}
  const viable=filterViableCraftRoutes(candidates,{budget,mode:'royal'});
  const selectedSafe=selectCraftSaleRoutes(viable.accepted,market);
  const adaptive=await allocateCraftWithPatientFallback({candidates,viable,market,budget,goal,invest:autoPrefs.invest||'all',
   focusLimit:focus?Number(craftPrefs.focusBudget||10000):null,region:prefs.region,force,maxCraftCities,capFraction:.08,horizonDays:Number(autoPrefs.horizonDays)||14});
  const cityChoice=adaptive.cityChoice,routes=adaptive.routes;
  let plan=adaptive.plan;const purchasing=adaptive.check;
   let supplyNote=purchasing.warning||'';
  if(plan.materials.length){
   const common=plan.materials.slice().sort((a,b)=>b.qtyGross*b.unitPrice-a.qtyGross*a.unitPrice).slice(0,35);
   try{status('Comprobando profundidad de compra para los materiales más costosos…');
    const bookResult=await orderbook([...new Set(common.map(x=>x.id))],prefs.region,force,[...new Set(common.map(x=>x.city))]);
    const sellBook=normalizeSellBook(bookResult.rows,[...new Set(common.map(x=>x.id))],[...new Set(common.map(x=>x.city))],prefs.maxAge);
    const supply=checkMaterialSupply(common,sellBook);
    if(supply.warnings.length)supplyNote=`Profundidad insuficiente para ${supply.insufficient} recursos verificados: ${supply.warnings.slice(0,4).join(' · ')}. Revisa cantidades antes de comprar.`;
    if(supply.missing.length)supplyNote+=' '+supply.missing.length+' materiales principales sin profundidad observable (compra no asegurada).';
   }catch(e){supplyNote='No se pudo verificar la profundidad de compra de materias primas: '+e.message;}
  }
  const stock=procurementPlan(plan.materials,loadInventory(),loadPortfolios());
  state.autoPlan={smartPortfolio:portfolioDiversityStats(plan.rows,{budget, reserve:0,pending:adaptive.pending}),fill:adaptive.fill,bulkEligible:adaptive.bulkEligible,minWeekly:adaptive.minWeekly,exposureFraction:adaptive.exposureFraction,investableBudget:adaptive.investment.spendable,reserveSilver:adaptive.investment.reserve,procurementAudit:purchasing.depthAudit||null,marketReferences:await marketReferencesPromise,plan,planStrategy:adaptive.strategy,supplyPending:!!purchasing.supplyPending,budget,saleCities,branch:craftCats.length?(branchMode==='selected'?branchKeys.length+' ramas elegidas':'Exploración de '+cats.length+' categorías'):'Solo refinamiento Royal',city,daily,focus,refiningMode:craftCats.length?refiningMode:'off',refiningFee,market,invest:autoPrefs.invest||'all',journals:false,cap:.10,unknownCap:2,scanned:pick.scanned,advanced:false,
   warning:[warning,viable.rejected.length?`${viable.rejected.length} rutas descartadas por margen, riesgo, profundidad o liquidez. ${viable.reasons.slice(0,2).map(x=>x.reason).join('; ')}.`:null,supplyNote,cityChoice.removed?`Se omitieron ${cityChoice.removed} rutas para concentrar la fabricación en ${cityChoice.cities.join(', ')}.`:null,wantsRefining&&market==='black'?'Los recursos refinados no se venden en el Mercado Negro: la categoría de refinamiento se omitió por tu filtro de destino.':null,pick.partial?'Exploración por muestra: las recetas fuera del muestreo no fueron analizadas.':null,'Diarios no incluidos en la búsqueda automática hasta que su fama y precios estén verificados. Si el taller o el transporte están en 0, esos gastos no se descontarán.'].filter(Boolean).join(' · '),
   goal,focusBudget:Number(craftPrefs.focusBudget||10000),buyMode:'instant',availableCandidates:routes,bmDepth:instant.some(x=>x.depthVerified),requireBook:autoPrefs.requireBook,qualityMode:'normal',priceStress:input.priceStress,resourceStress:input.resourceStress,matShipping:input.materialShipping,useWallet:false,solverMethod:'optimización diversificada entre ramas (aproximada)',
   marketCoverage,horizonDays:Number(autoPrefs.horizonDays)||14,scanDiagnosis:diagnoseScan({recipes:ids.length,candidates:candidates.length,viable,recommendations:plan.rows.length,missing:result.missing}),
   autoMeta:{...pick,craftCities:cityChoice.cities,craftCitiesRemoved:cityChoice.removed,refiningChecked:scanRefining.length,refiningRoutes:refinery.candidates.length,refiningAllocated:plan.rows.filter(x=>x.recipeKind==='refining').length,candidates:routes.length,stockSaving:stock.cashSaved,branchesSelected:branchMode==='selected'?branchKeys:null,itemsSelected:itemMode==='selected'?itemKeys:null,refiningMode}};
  control('auto-results').innerHTML=autoResults(state.autoPlan);
   if(plan.rows.length){state.resultSource='autocraft';changePage('resultados');}
  showToast(plan.rows.length?`Encontradas ${plan.rows.length} rutas de inversión, incluido refinamiento si tenía margen.`:'Consulta el Plan de investigación y los precios mínimos antes de comprar.',!plan.rows.length);
 }catch(e){control('auto-results').innerHTML=errorText(e);showToast(e.message,true);}finally{state.autoRunning=false;}
}
function currentPlan(){return (state.page==='autocraft'||(state.page==='resultados'&&state.resultSource==='autocraft'))?state.autoPlan:state.plan;}
function currentResultElement(){return control(state.page==='autocraft'?'auto-results':'craft-results');}
function redrawCurrentPlan(){if(state.page==='resultados'){resultsPage();return;}const p=currentPlan(),el=currentResultElement();if(p&&el)el.innerHTML=state.page==='autocraft'?autoResults(p):craftResult(p);}
// Rebalance plans against sampled raw-material turnover BEFORE showing the shopping list.
// AODP history is not live order depth; missing observations get a 1-craft cap.
async function guardMaterialPurchases(plan,region,force,{patient=false}={}){
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
 let supplyPending=patient&&plan.rows.some(r=>r.externalDemand);
 // Un lote de venta lenta puede necesitar comprar durante varios días. No
 // declaramos que exista stock inmediato: lo mostramos como plan CONDICIONAL.
 // A staged PURCHASE is not the same as a one-item CRAFTING plan.
 // In patient mode keep the strategic order quantities, mark the unverified
 // procurement and require a new price/book check before spending silver.
 if(patient&&(screened.changed.length||screened.unverified.length||screened.priceAlerts.length))supplyPending=true;
 const patientRows=patient?plan.rows.map((row,i)=>({...row,
   procurementFirstBatch:Math.max(0,screened.rows[i]?.qty||0),
   patientSupplyPending:screened.rows[i]?.qty<row.qty
 })):screened.rows;
 let constrained=patient?plan:screened.changed.length>0?fitPlan(patientRows,plan.capital,plan.focusLimit):plan;
 let bookScreen=null,bookNote=null,depthAudit=null;
 // Real ask levels cap bulk purchases even if historical turnover looks abundant.
 // If book data is unavailable, stay at one initial craft per affected route.
 if(constrained.rows.length&&constrained.materials.length){
  try{
   const critical=[...constrained.materials].sort((a,b)=>b.qtyGross*b.unitPrice-a.qtyGross*a.unitPrice).slice(0,35);
   const materials=[...new Set(critical.map(x=>x.id))],cities=[...new Set(critical.map(x=>x.city))];
   const response=await orderbook(materials,region,force,cities);
   const books=normalizeSellBook(response.rows,materials,cities,prefs.maxAge);
   // Extra budget is available only inside the actual investment budget.
   const spare=Math.max(0,constrained.capital-constrained.totalCost);
   depthAudit=materialDepthAssessment(constrained.materials,books,{
    reserveAllowance:spare,profitAllowance:Math.max(0,constrained.totalProfit)*.20,useFraction:.60
   });
   const ceilingMap=new Map(depthAudit.rows.map(x=>[x.id+'|'+x.city,x.ceiling]));
   bookScreen=limitRowsByMaterialBook(constrained.rows,books,{
    fraction:.60,unknownCraftCap:0,priceCeilingByMaterial:ceilingMap
   });
   if(bookScreen.rejected.length||bookScreen.missing.length){
    supplyPending=true;
    if(patient){
     // The target remains visible; the first batch is based on the ACTUAL
     // ask levels that fit the price ceiling, not the first cheap offer.
     const stageQty=bookScreen.rows.map(x=>Math.max(0,x.qty));
     constrained={...constrained,rows:constrained.rows.map((x,i)=>({...x,
      procurementFirstBatch:Math.min(x.qty,stageQty[i]??0),
      patientSupplyPending:stageQty[i]<x.qty
     }))};
    }else constrained=fitPlan(bookScreen.rows,plan.capital,plan.focusLimit);
   }else if(patient){
    const stageQty=bookScreen.rows.map(x=>Math.max(0,x.qty));
    constrained={...constrained,rows:constrained.rows.map((x,i)=>({...x,
     procurementFirstBatch:Math.min(x.qty,stageQty[i]??0)
    }))};
   }
   if(response.warning){bookNote='Libro de materiales parcial: '+response.warning;supplyPending=true;}
   if(depthAudit.totalEstimatedExtra>0)bookNote=(bookNote?bookNote+' · ':'')+'Los precios por tramos añaden hasta '+Math.ceil(depthAudit.totalEstimatedExtra)+' silver sobre la primera cotización para el stock observado. Recalcula el margen antes de comprar.';
  }catch(e){
   bookNote='No se verificó la profundidad de materiales: '+e.message;
   supplyPending=true;
   constrained={...constrained,rows:constrained.rows.map(x=>({...x,procurementFirstBatch:0,patientSupplyPending:true}))};
  }
 }
 const details=[];
 if(screened.changed.length)details.push(screened.changed.length+(patient?' rutas necesitarán compras en etapas según el historial de los recursos':' rutas reducidas para no concentrar compras de recursos crudos'));
 if(screened.unverified.length)details.push(screened.unverified.length+(patient?' materiales sin suficiente historial: verificar stock y compras por etapas':' materiales sin suficiente historial: máximo 1 craft inicial por ruta afectada'));
 if(screened.priceAlerts.length)details.push(screened.priceAlerts.length+' materiales al menos 20% por encima de su mediana: no comprar todo el lote sin recalcular');
 if(bookScreen){
  details.push(bookScreen.visible.length+' materiales con profundidad de venta observada al precio presupuestado');
  if(bookScreen.rejected.length)details.push(bookScreen.rejected.length+(patient?' rutas con compra en etapas: solo 60% de las ofertas baratas observadas para la primera compra':' rutas reducidas por falta de órdenes baratas; máximo 60% de la oferta observada'));
  if(bookScreen.missing.length)details.push(bookScreen.missing.length+(patient?' insumos sin libro comprobable: plan condicionado hasta verificar':' insumos sin libro comprobable: máximo 1 craft inicial por ruta'));
 }
 details.push('Topes históricos del 8% y, cuando hay libros verificables, 60% de órdenes baratas observadas. La disponibilidad puede cambiar; verifica antes de comprar');
 if(patient&&supplyPending)details.unshift('PLAN CONDICIONADO: cantidades objetivo para vender a lo largo de varios días. NO se verificó stock para todo el lote al precio actual; compra por etapas y recalcula profit después de cada compra.');
 return {plan:constrained,warning:[warn,bookNote,...details].filter(Boolean).join(' · '),liquidity:screened,book:bookScreen,depthAudit,supplyPending};
}


// Resultado primero: fase estricta. Si esta descarta todo, construir un plan
// PACIENTE con una o pocas fabricaciones que puedan tardar días en venderse.
// No hay inventario ficticio, ni venta asegurada, ni profit sin cotización.
async function allocateCraftWithPatientFallback({candidates,viable,market,budget,goal='balanced',invest='all',focusLimit=null,
 capFraction=.10,region,force,maxCraftCities='all',minConfidence=0,horizonDays=14}={}){
 // No 15% reserve: when "Usar todo" is selected, allocate against the FULL budget.
 // A market cap is NOT a promise to fill 100% of that budget.
 const baseInvestment=investmentBudget(budget,{reservePercent:0});
 const spendable=Math.floor(baseInvestment.spendable*(invest==='all'?1:.90));
 const investment={...baseInvestment,spendable,reserve:baseInvestment.gross-spendable};
 const pending=pendingUnitsByMarket(loadPortfolios());
 // Never count a high-profit but near-dead enchanted item as a bulk candidate.
 // AODP counts are observed listing activity, not certified player purchases.
 const volume=bulkMarketCandidates(candidates,{minWeekly:MIN_WEEKLY_ACTIVITY});
 const viableIds=new Set(volume.accepted.map(x=>x.id+'|'+x.city+'|'+x.craftCity+'|'+x.mode));
 const strictRoutes=selectCraftSaleRoutes(viable.accepted.filter(x=>viableIds.has(x.id+'|'+x.city+'|'+x.craftCity+'|'+x.mode)),market);
 const cityStrict=market==='royal'?chooseCraftingCities(strictRoutes,{maxCities:maxCraftCities,budget}):{routes:strictRoutes,cities:[],removed:0};
 const allocate=(routes,{patient=false}={})=>{
  const itemFraction=bulkItemExposureFraction(routes);
  const allocation=allocatePortfolioV6(routes,investment.spendable,{
   goal,useAll:invest==='all',capFraction,unknownCap:0,horizonDays,intelligent:true,bulkMode:true,
   maxPerItemFraction:itemFraction,maxVariants:65,targetDifferentItems:28,pendingByMarket:pending,
   focusLimit,minimumConfidence:patient?0:minConfidence});
  return {allocation,plan:fitPlan(allocation.rows,investment.spendable,focusLimit),itemFraction};
 };
 const strict=allocate(cityStrict.routes);
 const strictChecked=await guardMaterialPurchases(strict.plan,region,force);
 const safePlan=strictChecked.plan;
 const patient=selectPatientRoutes(volume.accepted,{budget,limit:600,horizonDays,observedShare:capFraction});
 const selected=selectCraftSaleRoutes(patient.accepted,market);
 const cities=market==='royal'?chooseCraftingCities(selected,{maxCities:maxCraftCities,budget}):{routes:selected,cities:[],removed:0};
 let proposed=allocate(cities.routes,{patient:true});
 if(!proposed.plan.rows.length){
  // Journals can have a negative marginal effect when bought as whole books.
  const noJournals=cities.routes.map(r=>({...r,journal:null,journalBonus:0,
   profit:r.profit-(Number(r.journalBonus)||0),stressProfit:r.stressProfit-(Number(r.journalBonus)||0)}))
   .filter(r=>r.profit>0&&r.stressProfit>0);
  if(noJournals.length)proposed=allocate(noJournals,{patient:true});
 }
 const proposedChecked=await guardMaterialPurchases(proposed.plan,region,force,{patient:true});
 const patientPlan=proposedChecked.plan;
 // Spending capacity is an objective ONLY among positive-margin, observed,
 // bounded routes. Never use a nearly empty strict batch to suppress a much
 // larger feasible staged portfolio. Staged plans are explicitly CONDITIONAL.
 const safeFunds=safePlan.totalCost||0,patientFunds=patientPlan.totalCost||0;
 const safeItems=new Set(safePlan.rows.map(r=>r.id)).size,patientItems=new Set(patientPlan.rows.map(r=>r.id)).size;
 const preferPatient=patientPlan.rows.length&&patientPlan.totalProfit>0&&
  (!safePlan.rows.length||
   (patientFunds>safeFunds*1.15&&patientItems>=Math.max(1,safeItems-2))||
   (patientFunds>=safeFunds*.95&&patientItems>safeItems));
 const plan=preferPatient?patientPlan:safePlan;
 const check=preferPatient?proposedChecked:strictChecked;
 const choice=preferPatient?cities:cityStrict;
 const allocation=preferPatient?proposed:strict;
 const summary=portfolioFillSummary(plan,budget,{eligible:new Set(volume.accepted.map(x=>x.id)).size});
 return {plan,check,viable,routes:choice.routes,cityChoice:choice,
  strategy:plan.rows.length?(preferPatient?'patient':'verified'):'empty',
  patient,method:allocation.allocation.method,investment,pending,
  bulkEligible:volume.accepted.length,bulkExcluded:volume.rejected.length,
  minWeekly:MIN_WEEKLY_ACTIVITY,exposureFraction:allocation.itemFraction,fill:summary};
}
// Gildem Craft Pro v8.5.5 · Resultados. Iconos reales: itemimg() del render oficial.
// Verificar disponibilidad NO significa importar precios, ventas ni profundidad de las webs.
// Cada plan renueva este diagnóstico, con la fuente numérica AODP separada.
async function checkMarketReferences(){
 try{const request=new URL('./.netlify/functions/market-references',window.location.href);
  request.searchParams.set('region',REGION);
  const res=await fetch(request,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(7500)});
  if(!res.ok||!(res.headers.get('content-type')||'').includes('json'))return null;
  const data=await res.json();
  return data&&Array.isArray(data.checks)?data:null;
 }catch{return null;}
}
function marketReferencesPanel(data){
 const rows=marketReferenceSnapshot(data);
 const checkedAt=data?.checkedAt&&Number.isFinite(Date.parse(data.checkedAt))?new Date(data.checkedAt).toLocaleString('es-ES'):null;
 const verified=data?.region==='west'&&Array.isArray(data?.checks)&&data.checks.length>0;
 const accessible=rows.filter(r=>r.status==='accessible').length;
 const checked=verified?`Accesibilidad comprobada: ${accessible} de ${rows.length} páginas respondieron · ${h(checkedAt||'fecha desconocida')}.`:'No se pudo comprobar la accesibilidad de las páginas externas en esta consulta.';
 const cards=rows.map(r=>{
  const status=r.status==='accessible'?'Página accesible, servidor de los datos NO verificado':r.status==='unavailable'?'La página no respondió':'Acceso no confirmado';
  const region=r.westSelectable==='yes'?'Permite seleccionar América (West), pero este chequeo no leyó su selección':'Servidor West sin verificación automática';
  return `<a href="${h(r.url)}" target="_blank" rel="noopener noreferrer" class="gcp-reference-card" aria-label="Abrir ${h(r.name)}">
    <strong class="gcp-source-name">${h(r.name)}</strong>
    <span class="gcp-source-server">${h(region)}</span>
    <small class="gcp-source-status">${h(status)} · Sin estadísticas importadas</small>
    <span class="gcp-source-uses">${h(r.description)}</span>
   </a>`;
 }).join('');
 return `<section class="gcp-market-references panel"><details open><summary>Fuentes y evidencia de mercado · América (West)</summary>
 <div class="gcp-reference-primary"><strong>AODP América (West)</strong><span>Única fuente numérica automática: cotizaciones, historial y órdenes observadas. Los datos pueden ser antiguos o incompletos.</span></div>
 <p class="explain">${checked} Estas comprobaciones solo prueban disponibilidad de páginas, NO importan ventas ni verifican automáticamente su servidor. <strong>0 de ${rows.length} referencias externas aportaron estadísticas al cálculo.</strong></p>
 <div class="gcp-reference-grid">${cards}</div>
 <p class="explain">El plan solo utiliza AODP West y tablas externas importadas manualmente con servidor West confirmado. Los anuncios de particulares no prueban ventas ejecutadas. Nunca se mezcla Europa ni Asia con América.</p>
 <div class="gcp-reference-actions"><button type="button" class="btn sm ghost" data-nav="ajustes">Importar estadísticas West</button><button type="button" class="btn sm ghost" data-action="research-west-ai">Copiar consulta para investigación con IA · West</button></div>
 <small class="muted">La investigación con IA genera una consulta para copiar. No es una búsqueda automática, ni una importación de cifras, ni una comprobación de profit.</small></details></section>`;
}
function marketCoverageHtml(p){
 const coverage=p?.marketCoverage,diagnosis=p?.scanDiagnosis;
 if(!coverage&&!diagnosis)return '';
 const cities=coverage?.markets||[];
 const rows=cities.map(x=>`<tr><td><strong>${h(x.city==='Black Market'?'Mercado Negro':x.city)}</strong></td><td>${fmt(x.bidItems)}</td><td>${fmt(x.askItems)}</td><td>${coverage.historyLoaded?fmt(x.activeItems):'No consultado'}</td><td>${coverage.historyLoaded?fmt(x.observedQty14):'No consultado'}</td><td>${x.ageMax===null?'—':x.ageMax.toFixed(1)+' h'}</td></tr>`).join('');
 const mostObserved=cities.filter(x=>x.leaders?.length).map(x=>`<div class="gcp-market-leaders"><strong>${h(x.city==='Black Market'?'Mercado Negro':x.city)}</strong>${x.leaders.map(l=>`<span>${itemCell(l.id)} <b>${fmt(l.daily)}/día observado</b></span>`).join('')}</div>`).join('');
 const top=(diagnosis?.reasons||[]).slice(0,5).map(x=>`<li>${h(x.reason)} · ${fmt(x.count)} rutas</li>`).join('');
 const count=diagnosis?`<div class="gcp-market-stats"><span>${fmt(diagnosis.recipes)} recetas evaluadas</span><span>${fmt(diagnosis.candidates)} rutas con margen inicial</span><span>${fmt(diagnosis.viable)} rutas que superaron seguridad</span><span>${fmt(diagnosis.recommendations)} rutas del plan</span></div>`:'';
 const missing=diagnosis&&diagnosis.missingMaterials+diagnosis.missingSales+diagnosis.missingFocus>0?`<p class="explain">Sin precio completo de materiales: ${fmt(diagnosis.missingMaterials)} · Sin precio de venta reciente: ${fmt(diagnosis.missingSales)} · Sin Focus verificable: ${fmt(diagnosis.missingFocus)}</p>`:'';
 return `<section class="gcp-market-audit panel"><details ${!p.plan?.rows?.length?'open':''}><summary>Mercados examinados · cobertura y motivos de descarte</summary>${count}<div class="table-scroll"><table class="data-table"><thead><tr><th>Mercado</th><th>Objetos con compra (bid)</th><th>Objetos con venta (ask)</th><th>Objetos con historial</th><th>Unidades observadas 14d</th><th>Cotización más antigua</th></tr></thead><tbody>${rows}</tbody></table></div>${mostObserved?`<h4 class="gcp-market-heading">Objetos con más actividad observada por ciudad</h4><div class="gcp-market-leaders-grid">${mostObserved}</div>`:''}${missing}${top?`<strong>Principales motivos por los que algunas rutas no entraron:</strong><ul class="gcp-market-reasons">${top}</ul>`:''}<p class="explain">Datos comunitarios AODP West. Historial solicitado para ${fmt(coverage.historySample||0)} de ${fmt(coverage.items||0)} variantes elegidas; ${fmt(coverage.historyObserved||0)} variantes devolvieron observaciones en ${fmt(coverage.historyPairs||0)} pares objeto/ciudad${coverage.historyPartial?' (consulta parcial o no confirmada)':''}. Las cantidades históricas NO son profundidad de compra ni una promesa de ventas; las cotizaciones cuentan solo cuando están dentro del límite de antigüedad. La cobertura es de la rama y variantes elegidas, no de todo Albion.</p>${!p.plan?.rows?.length?'<div class="notice neutral">No se recomienda gastar silver sin márgenes y liquidez suficientes. Las tablas indican qué falta verificar o qué mercados tienen datos.</div>':''}</details></section>`;
}
function resultCategory(r){
 if(r.recipeKind==='refining')return 'Refinamiento';
 const branch=BRANCHES.find(b=>!isAggregateBranch(b.key)&&b.test(r.id));
 const cat=branch?categoryForBranch(branch.key):'';
 return ({weapons:'Armas',armor:'Armaduras',accessories:'Accesorios',offhands:'Manos secundarias',mounts:'Monturas',potions:'Pociones',foods:'Comidas',gathering:'Recolección',refining:'Refinamiento',kits:'Kits',siege:'Asedio'})[cat]||'Otros';
}
function resultClass(value){return Number(value)>=0?'positive':'negative';}
function resultsPage(){
 document.body.classList.add('gcp-results-active');
 const current=currentPlan();
 if(!current?.plan?.rows?.length){
  main.innerHTML=`<div class="gcp-results gcp-results-empty"><section class="gcp-result-hero"><span class="gcp-hero-overline">GILDEM CRAFT PRO · RESULTADOS</span><h2>Tus planes, en una sola pantalla</h2><p>Genera un plan en Black Craft o Royal Craft y aquí aparecerán las cantidades, compras, capital, profit y comprobaciones.</p></section><div class="gcp-empty-actions"><button class="btn gold" data-nav="crafting">⚒ Crear plan Black Craft</button><button class="btn" data-nav="autocraft">✦ Crear plan Royal Craft</button><button class="btn ghost" data-nav="cartera">Ver inversiones guardadas</button></div></div>`;
  return;
 }
 const b=current.plan,rows=b.rows||[],sum=resultsSummary(current),supply=shoppingWithCeilings(current),audit=preflightOverview(state.preflight,sum);
 const proof=evidenceForPlan(b,{horizonDays:current.horizonDays||14,supplyPending:current.supplyPending});
 const evidenceRows=proof.rows.map(r=>`<tr><td>${itemCell(r.id)}</td><td>${h(r.city)}</td><td>${r.observedDaily===null?'No verificable':fmt(Math.round(r.observedDaily))+' observadas/día'}<small class="gcp-evidence-muted">${h(r.historySource)}</small></td><td>${r.ageHours===null?'Sin fecha':r.ageHours.toFixed(1)+' h'}<small class="gcp-evidence-muted">${h(r.quote)}</small></td><td>${fmt(r.qty)} objetivo<small class="gcp-evidence-muted">${r.firstBatch===null?'Primer lote sin verificar':fmt(r.firstBatch)+' lote inicial estimado, no reservado'}</small></td><td>${h(r.procurement)}${r.alerts.length?`<small class="gcp-evidence-muted">${h(r.alerts.slice(0,2).join(' · '))}</small>`:''}</td></tr>`).join('');
 const availableBlack=!!state.plan?.plan?.rows?.length,availableRoyal=!!state.autoPlan?.plan?.rows?.length;
 const branch=state.resultSource==='autocraft'?'Royal Craft':'Black Craft';
 const confidenceText=sum.confidence===null?'Sin calificación':sum.confidence>=75?'Alta':sum.confidence>=45?'Media':'Baja';
 const activityText=sum.activityDays===null?'Sin historial':sum.activityDays>=10?'Alta':sum.activityDays>=5?'Media':'Baja';
 const destinationLabel=(r)=>r.city==='Black Market'?'Mercado Negro':r.city;
 const ageText=sum.ageHours===null?'Antigüedad no verificable':`Precio más antiguo: ${sum.ageHours.toFixed(1)} h`;
 const profitabilityClass=sum.profit>=0?'positive':'negative';
 const patienceNotice=current.planStrategy==='patient'?`<div class="gcp-patience-banner"><strong>Plan paciente · venta por órdenes.</strong> ${current.supplyPending?'Compra de materiales pendiente de confirmación. No ejecutar antes de revalidar.':'El plazo de venta no está garantizado y puede superar varios días.'} El profit no se ha cobrado.</div>`:'';
 const kpis=[
   ['Capital necesario',short(sum.capital),'Compra bruta + costos incluidos','coins'],
   ['Profit estimado',(sum.profit>=0?'+':'')+short(sum.profit),'Neto estimado, aún no realizado','profit'],
   ['ROI estimado',sum.roi===null?'—':sum.roi.toFixed(1)+'%','Sobre capital bruto del plan','roi'],
   ['Focus usado',fmt(sum.focus),'Costo según perfil configurado','focus']
 ];
 const cards=kpis.map(([name,value,desc,klass])=>`<article class="gcp-kpi gcp-kpi-${klass}"><div class="gcp-kpi-icon" aria-hidden="true">${({coins:'◈',profit:'↗',roi:'◎',focus:'✦'})[klass]}</div><div class="gcp-kpi-content"><span class="gcp-kpi-name">${h(name)}</span><strong class="gcp-kpi-number ${klass==='profit'?profitabilityClass:''}">${h(value)}</strong><small>${h(desc)}</small></div>${klass==='coins'?`<div class="gcp-kpi-meter" style="width:${sum.budgetUsed.toFixed(1)}%"></div>`:''}</article>`).join('');
 const production=groupProduction(rows);
 const items=production.map(g=>{
  const count=g.sourceIndices.length;
  const stages=g.sourceIndices.some(i=>rows[i].patientSupplyPending||rows[i].procurementFirstBatch!=null&&rows[i].procurementFirstBatch<rows[i].qty);
  const craftPlaces=g.craftCities.map(c=>`${h(c.city)}${g.craftCities.length>1?' · '+fmt(c.qty)+' fab.':''}`).join(' · ');
  const weeklyMax=Math.max(0,...g.sourceIndices.map(i=>Number(observedWeeklyActivity(rows[i])?.units)||0));
  const source=g.sourceIndices.map(i=>rows[i].demandSource||'historial')[0];
  return `<article class="gcp-compact-card gcp-production-card">
   <div class="gcp-compact-item">${itemCell(g.id)}<span class="gcp-tier gcp-tier-${itemEnch(g.id)}">T${itemTier(g.id)}.${itemEnch(g.id)}</span></div>
   <div class="gcp-compact-quantity"><label for="gcp-group-${h(g.id).replace(/[^a-zA-Z0-9-]/g,'-')}">Fabricar</label><input id="gcp-group-${h(g.id).replace(/[^a-zA-Z0-9-]/g,'-')}" class="qty-input" data-plan-group="${h(g.key)}" type="number" min="0" step="1" max="${Math.min(999999,Math.max(g.qty,g.capacity))}" value="${g.qty}" aria-label="Fabricaciones totales de ${h(itemName(g.id))}"><small>${fmt(g.units)} unidades</small></div>
   <div class="gcp-compact-meta"><span><b>Fabricar en</b> ${craftPlaces}</span><span><b>Mercados</b> ${count} ${count===1?'ruta':'rutas'}</span>${g.sourceIndices.some(i=>rows[i].salePriceProvisional)?'<span class="gcp-pending-text"><b>Precio BM objetivo:</b> historial; confirmar antes de comprar o fabricar</span>':''}${weeklyMax?`<span><b>Actividad semanal</b> hasta ${fmt(Math.round(weeklyMax))} observaciones/mercado · ${h(source)}</span>`:''}${stages?'<span class="gcp-pending-text">Compras por etapas, no garantizadas</span>':''}</div>
   <div class="gcp-compact-values"><span><small>Capital</small><strong>${moneyCell(g.capital)}</strong></span><span><small>Profit estimado</small><strong class="${resultClass(g.profit)}">${moneyCell(g.profit,resultClass(g.profit))}</strong></span></div>
  </article>`;
 }).join('');
 const logistics=groupLogistics(rows).map(g=>`<article class="gcp-compact-card gcp-logistics-card">
   <div class="gcp-logistics-title">${itemCell(g.id)}<span class="gcp-tier gcp-tier-${itemEnch(g.id)}">T${itemTier(g.id)}.${itemEnch(g.id)}</span></div>
   <div class="gcp-logistics-route"><span><small>Fabricar</small><strong>${h(g.craftCity)}</strong></span><span aria-hidden="true">→</span><span><small>Vender</small><strong>${h(g.city==='Black Market'?'Caerleon · BM':g.city)}</strong></span></div>
   <div class="gcp-logistics-footer"><strong>${fmt(g.qty)} fab. · ${fmt(g.units)} uds.</strong><span class="${resultClass(g.profit)}">${moneyCell(g.profit,resultClass(g.profit))} profit</span></div>
   ${g.staged||g.firstBatch<g.qty?`<small class="gcp-pending-text">Primera compra respaldada: ${fmt(g.firstBatch)} de ${fmt(g.qty)} fab. (estimado)</small>`:''}
  </article>`).join('');
 const shoppingRows=supply.map(m=>`<article class="gcp-compact-card gcp-shopping-card"><div class="gcp-shopping-item">${itemCell(m.id)}<strong>${fmt(m.qtyGross)} uds.</strong></div><div class="gcp-shopping-detail"><span>Comprar en <b>${h(m.city||'Sin ciudad')}</b></span><span>Precio/u ${moneyCell(m.unitPrice)}</span><span>Máximo/u ${moneyCell(Math.floor(m.suggestedCeiling))}</span><strong>${moneyCell(m.grossCost)}</strong></div></article>`).join('');
 const journalRows=(b.journalSummary?.items||[]).map(j=>`<article class="gcp-compact-card gcp-shopping-card"><div class="gcp-shopping-item">${itemCell(j.empty,j.name+' T'+j.tier)}<strong>${fmt(j.qty)} uds.</strong></div><div class="gcp-shopping-detail"><span>Comprar en <b>${h(j.buyCity||'Sin ciudad')}</b></span><span>Diario</span><strong>${moneyCell(j.purchaseCost)}</strong></div></article>`).join('');
 const materialTotal=supply.reduce((s,m)=>s+m.grossCost,0);
 const firstStage=stagedMaterialNeeds(rows),firstStageCost=firstStage.reduce((sum,m)=>sum+m.qty*m.unitPrice,0);
 const firstStageHtml=firstStage.length?`<details class="gcp-first-stage"><summary>Primera compra orientativa · ${short(firstStageCost)} silver</summary><p>Estas cantidades no representan órdenes reservadas. Antes de comprar compara las ofertas actuales con los techos del plan.</p><div class="gcp-compact-grid gcp-first-stage-grid">${firstStage.slice(0,60).map(m=>`<article class="gcp-compact-card gcp-shopping-card"><div class="gcp-shopping-item">${itemCell(m.id)}<strong>${fmt(Math.ceil(m.qty))} uds.</strong></div><div class="gcp-shopping-detail"><span>${h(m.city)}</span><span>${moneyCell(m.qty*m.unitPrice)} estimados</span></div></article>`).join('')}</div></details>`:
  '<p class="gcp-panel-caption">Primera compra no verificada: ninguna cantidad es segura al precio cotizado. Actualiza el libro de órdenes antes de invertir.</p>';
 const cats=budgetGroups(current,resultCategory);
 const bars=cats.map((c,i)=>`<div class="gcp-budget-row"><div class="gcp-budget-label"><span>${h(c.category)}</span><b>${c.percent.toFixed(1)}%</b><strong>${short(c.capital)}</strong></div><div class="gcp-track"><span class="gcp-budget-bar gcp-bar-${i%5}" style="width:${Math.min(100,Math.max(0,c.percent)).toFixed(2)}%"></span></div></div>`).join('');
 const marker=level=>({ok:'✓',danger:'!',warning:'⚠',pending:'·'})[level]||'·';
 const checks=audit.details.map(x=>`<div class="gcp-check gcp-check-${x.level}"><span aria-hidden="true">${marker(x.level)}</span><p>${h(x.text)}</p></div>`).join('');
 const verificationDate=audit.at?` · ${h(new Date(audit.at).toLocaleString('es-ES'))}`:'';
 const sellDepth=sum.blackTotal?`Mercado Negro: órdenes de venta pendientes; puja NPC solo orientativa`:'Royal: órdenes de venta pendientes, sin fecha garantizada';
 main.innerHTML=`<section class="gcp-results">
   <header class="gcp-result-hero"><div><span class="gcp-hero-overline">GILDEM CRAFT PRO · ${h(branch)} · ${h(prefs.region.toUpperCase())}</span><h2>Resultados del Plan</h2><p>${h(current.branch||'Plan de crafting')} · ${sum.routeCount} rutas · ${fmt(sum.units)} unidades · Mercado ${h(current.market==='black'?'Negro':'Royal')}</p></div><span class="gcp-result-crest" aria-hidden="true">✦</span></header>
   ${patienceNotice}
   <div class="gcp-smart-summary"><strong>◈ Crafting de volumen</strong> · ${fmt(current.smartPortfolio?.differentItems||new Set(rows.map(r=>r.id)).size)} objetos · ${current.fill?.percent?.toFixed(1)??(sum.budgetUsed.toFixed(1))}% del presupuesto asignado · ${short(current.fill?.remaining??Math.max(0,current.budget-b.totalCost))} sin invertir · Sin reserva fija · Actividad mayor de ${current.minWeekly??50}/semana · Tope por objeto ${Math.round((current.exposureFraction??.12)*100)}%.<small>${h(current.fill?.explanation||'Los topes protegen contra saturación.')} Actividad observada no significa ventas ejecutadas. ${current.smartPortfolio?.pendingMarkets||0} mercados con inventario pendiente registrado.</small></div>
   <div class="gcp-summaryline"><span class="gcp-tag ${sum.confidence===null?'neutral':sum.confidence>=75?'good':sum.confidence>=45?'caution':'risk'}">Confianza: ${h(confidenceText)}</span><span class="gcp-tag ${sum.activityDays===null?'neutral':sum.activityDays>=10?'good':'caution'}">Actividad observada: ${h(activityText)}</span><span class="gcp-tag ${audit.status==='verified'?'good':audit.status==='partial'?'caution':audit.status==='warning'?'risk':'neutral'}">${h(audit.title)}</span><span class="gcp-age">${h(ageText)}</span></div>
   ${(availableBlack&&availableRoyal)?`<div class="gcp-result-sources"><span>Ver resultados de:</span><button class="btn sm ${state.resultSource==='crafting'?'gold':'ghost'}" data-action="results-source" data-source="crafting">Black Craft</button><button class="btn sm ${state.resultSource==='autocraft'?'gold':'ghost'}" data-action="results-source" data-source="autocraft">Royal Craft</button></div>`:''}
   <div class="gcp-kpi-grid">${cards}</div>
   ${marketCoverageHtml(current)}
   ${marketReferencesPanel(current.marketReferences)}
   <section class="gcp-market-proof"><div class="gcp-proof-head"><div><strong>Calidad de los datos del plan</strong><p>Precio, actividad y abastecimiento se verifican por separado. No son ventas realizadas.</p></div><span class="gcp-tag ${proof.staged?'caution':'neutral'}">${proof.staged} rutas con compras por etapas</span></div>
   <div class="gcp-proof-stats"><span>${proof.quoted}/${proof.total} cotizaciones recientes</span><span>${proof.rows.filter(x=>x.observedDaily!==null).length}/${proof.total} con historial observable</span><span>${proof.ready}/${proof.total} sin compra pendiente señalada</span></div>
   <details><summary>Revisar evidencia de cada objeto antes de comprar</summary><div class="table-scroll"><table class="data-table"><thead><tr><th>Objeto</th><th>Mercado</th><th>Actividad</th><th>Precio observado</th><th>Fabricaciones</th><th>Compras</th></tr></thead><tbody>${evidenceRows}</tbody></table></div><p class="explain">${h(proof.disclaimer)} Un primer lote de 0 o no verificable no significa que el objeto no tenga mercado; significa que el stock de insumos no está respaldado al precio presupuestado. El techo completo es un objetivo condicionado.</p></details></section>
   <div class="gcp-result-grid"><section class="gcp-result-panel gcp-panel-craft"><div class="gcp-panel-title"><h3>⚒ Lista de fabricación</h3><span class="gcp-title-count">${production.length} objetos · ${fmt(sum.units)} unidades · ${fmt(production.reduce((a,g)=>a+g.qty,0))} fabricaciones</span></div><div class="gcp-compact-grid gcp-production-grid">${items}</div><div class="gcp-panel-foot"><span>Un objeto aparece una sola vez. Edita su total; los destinos se recalculan en Logística.</span><span>${h(sellDepth)}</span></div></section>
   <section class="gcp-result-panel gcp-panel-logistics"><div class="gcp-panel-title"><h3>↗ Logística · Fabricar y vender</h3><span class="gcp-title-count">${rows.length} rutas de venta · ${fmt(sum.units)} unidades</span></div><p class="gcp-panel-caption">Cada destino tiene su propia cantidad y profit. Fabricaciones del mismo objeto se suman arriba, sin duplicar la producción.</p><div class="gcp-compact-grid gcp-logistics-grid">${logistics}</div></section>
   <section class="gcp-result-panel gcp-panel-shopping"><div class="gcp-panel-title"><h3>▣ Lista de compras</h3><span class="gcp-title-count">${supply.length} materiales · ${(b.journalSummary?.items||[]).length} diarios</span></div><div class="gcp-compact-grid gcp-shopping-grid">${shoppingRows}${journalRows}</div><div class="gcp-shopping-total"><span>Materiales a comprar (bruto)</span><strong>${short(materialTotal)}</strong></div><p class="gcp-panel-caption">El techo/u es un límite financiero calculado, no una oferta disponible. Los diarios son adicionales si no están incluidos en el capital del plan.</p>${firstStageHtml}${current.procurementAudit?`<details class="gcp-depth-details"><summary>Ver compras por tramos y primer lote</summary><p>Ofertas observadas en AODP West: ${current.procurementAudit.checked}/${current.procurementAudit.rows.length} materiales con libro. ${current.procurementAudit.missing} insumos con cantidad insuficiente al techo previsto. No implica compra ejecutada.</p><div class="gcp-compact-grid gcp-depth-grid">${current.procurementAudit.rows.map(m=>`<article class="gcp-compact-card gcp-shopping-card"><div class="gcp-shopping-item">${itemCell(m.id)}<strong>${fmt(m.filled)} / ${fmt(m.qty)}</strong></div><div class="gcp-shopping-detail"><span>Precio medio ${m.averageUnitPrice===null?'Sin ofertas':moneyCell(m.averageUnitPrice)}</span><span>Techo/u ${moneyCell(m.ceiling)}</span></div></article>`).join('')}</div></details>`:''}</section>
   <section class="gcp-result-panel gcp-panel-preflight"><div class="gcp-panel-title"><h3>☑ Comprobación previa</h3><span class="gcp-state ${audit.status}">${h(audit.title)}${verificationDate}</span></div><div class="gcp-check-grid">${checks}</div>${current.warning?`<details class="gcp-warnings"><summary>Advertencias del plan</summary><p>${h(current.warning)}</p></details>`:''}<p class="gcp-panel-caption">AODP aporta observaciones comunitarias. El resultado no garantiza la ejecución ni la disponibilidad de todas las órdenes.</p></section>
   <section class="gcp-result-panel gcp-panel-budget"><div class="gcp-panel-title"><h3>◉ Distribución del presupuesto</h3><span class="gcp-title-count">${sum.budgetUsed.toFixed(1)}% del capital asignado</span></div>${bars||'<p>No hay categorías con capital asignado.</p>'}<div class="gcp-budget-remaining"><span>Presupuesto restante</span><strong>${short(Math.max(0,sum.budget-sum.capital))}</strong></div><p class="gcp-panel-caption">Distribución proporcional al capital estimado de cada ruta. No son nuevos gastos.</p></section></div>
   <div id="preflight-results" class="gcp-preflight-detail">${state.preflight?preflightResult(state.preflight):''}</div>
   <div class="gcp-result-actions"><button class="btn gcp-verify" data-action="preflight">✓ Verificar antes de comprar</button><button class="btn" data-action="results-copy">▤ Copiar compras</button><button class="btn" data-action="results-copy-first">▤ Copiar primer lote</button><button class="btn" data-action="export-plan">↓ Exportar CSV</button><button class="btn" data-action="save-investment">▣ Guardar plan</button><button class="btn ghost" data-action="results-edit">✎ Editar plan</button></div>
   <p class="gcp-last-note">Datos para planificación, no transacciones ejecutadas. Comprueba precios, volumen, impuestos y riesgo de transporte antes de invertir.</p>
 </section>`;
}
async function resultsCopyShopping(firstOnly=false){const p=currentPlan();if(!p)return showToast('Genera un plan antes de copiar.',true);
 const first=stagedMaterialNeeds(p.plan?.rows||[]);
 const output=firstOnly?(first.length?'PRIMER LOTE · oferta no reservada · revalidar precios antes de comprar\n'+first.map(m=>`${itemName(m.id)} · ${m.city} · ${Math.ceil(m.qty)} unidades · máximo orientativo ${Math.floor(m.unitPrice)} silver/u`).join('\n'):'No hay primer lote respaldado por órdenes de materiales; verifica la compra antes de invertir.'):shoppingListText(p,itemName);
 try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(output);
 else{const el=document.createElement('textarea');el.value=output;el.style.position='fixed';el.style.left='-10000px';document.body.appendChild(el);el.select();if(!document.execCommand('copy'))throw Error('El navegador no permite copiar');el.remove();}
 showToast(firstOnly?'Primer lote copiado. Son cantidades orientativas, no ofertas reservadas.':'Lista de compras copiada. Comprueba precios antes de comprar.');}
 catch(e){showToast('No se pudo copiar: '+e.message,true);}
}

function craftResult(p){const b=p.plan, journalTotals=new Map();
  const patientBadge=p.planStrategy==='patient'?'<div class="notice neutral gcp-patient-notice"><strong>Plan de venta lenta y capital paciente.</strong> Las cantidades son pequeñas y pueden tardar varios días o semanas en venderse. Beneficio calculado con precios observados, no cobrado. '+(p.supplyPending?'Los materiales no están disponibles en cantidad verificable al precio indicado; el plan necesita compras por etapas.':'Comprueba los precios y la competencia antes de ejecutar.')+'</div>':'';
 for(const r of b.rows){if(r.journal?.prices){const key=r.journal.empty;const old=journalTotals.get(key)||{...r.journal,qty:0};old.qty+=r.qty*r.journal.ratio;journalTotals.set(key,old);}}
 const detailedListRows=b.rows.map((r,index)=>`<tr><td>${itemCell(r.id,'',r.recipeKind==='refining'?'Refinamiento':r.personalLearning?.qtySold>=3?`${r.personalLearning.qtySold} vendidas por ti · ${r.personalLearning.averageDays.toFixed(1)} días medios`:r.id)}</td><td><strong>T${itemTier(r.id)}.${itemEnch(r.id)}</strong></td><td class="main-city">${r.recipeKind==='refining'?'<span class="pill green">Refinar</span> ':''}${h(r.craftCity)}</td><td>${r.city==='Black Market'?'<span class="pill amber">Mercado Negro</span>':'<span class="pill green">Royal</span>'}</td><td>${h(r.city==='Black Market'?'Caerleon · Mercado Negro':r.city)}</td><td>${r.mode==='instant'?'Inmediata':'Orden de venta'}</td><td><input class="qty-input" type="number" data-plan-qty="${index}" min="0" max="${Number.isFinite(r.maxCrafts)?r.maxCrafts:999999}" step="1" value="${r.qty}" aria-label="Fabricaciones de ${h(itemName(r.id))}"></td><td><strong>${fmt(r.qty*(r.craftAmount||1))}</strong></td><td>${r.returnRate.toFixed(1)}%</td><td>${moneyCell(r.sell)}</td><td>${moneyCell(r.profit,r.profit>=0?'positive':'negative')}</td><td>${moneyCell(r.totalProfit,'positive')}</td><td>${r.activity?.observations?fmt(r.activity.activeDays)+' / 14 días · '+short(r.activity.observedDaily)+'/día observado':'Sin observaciones'}</td><td>${r.mode==='instant'?(r.depthVerified?`<span class="pill green">${h(r.bookCoverage||'Libro observado')}</span>`:`<span class="pill amber">${r.city==='Black Market'?'1 provisional':'Profundidad no verificada'}</span>`):'<span class="pill amber">Venta no garantizada</span>'}</td><td><span class="pill ${r.confidence?.tone||'red'}" title="${h((r.confidence?.reasons||[]).join(' · '))}">${h(r.confidence?.label||'Baja')} (${r.confidence?.score||0})</span></td><td>${moneyCell(r.stressProfit,r.stressProfit>=0?'positive':'negative')}</td><td>${r.focusPerUnit?fmt(r.focusPerUnit):'—'}</td><td>${moneyCell(breakEvenPrice(r))}</td><td>${r.competition?.known?`${fmt(r.competition.unitsAhead)} unidades delante · ${h(r.competition.risk)}`:'Sin datos de competencia'}</td></tr>`).join('');
 const groupedProduction=p.autoMeta?groupProduction(b.rows):[];
 const autoProductionRows=groupedProduction.map(g=>`<tr>
 <td>${itemCell(g.id,'',g.kind==='refining'?'Refinamiento':'')}</td>
 <td><strong>T${itemTier(g.id)}.${itemEnch(g.id)}</strong></td>
 <td class="main-city">${g.craftCities.map(c=>`${h(c.city)}${g.craftCities.length>1?' · '+fmt(c.qty)+' lotes':''}`).join(' · ')}</td>
 <td><input class="qty-input" type="number" data-plan-group="${h(g.key)}" min="0" max="${Math.min(g.capacity,999999)}" step="1" value="${g.qty}" aria-label="Cantidad total a fabricar de ${h(itemName(g.id))}"></td>
 <td><strong>${fmt(g.units)}</strong></td>
 <td>${Number.isFinite(g.rrrMin)?g.rrrMin.toFixed(1)+(g.rrrMax!==g.rrrMin?'–'+g.rrrMax.toFixed(1):'')+'%':'—'}</td>
 <td>${moneyCell(g.capital)}</td>
 <td>${moneyCell(g.profit,g.profit>=0?'positive':'negative')}</td>
 </tr>`).join('');
 const listRows=p.autoMeta?autoProductionRows:detailedListRows;
 function renderSalesMarket(market){const rows=groupSales(b.rows,market);if(!rows.length)return '';
  const title=market==='royal'?'Distribución de ventas Royal':'Distribución de ventas Mercado Negro';
  const body=rows.map(r=>`<tr><td>${itemCell(r.id)}</td><td><strong>T${itemTier(r.id)}.${itemEnch(r.id)}</strong></td><td>${h(r.city==='Black Market'?'Caerleon · Mercado Negro':r.city)}</td><td><strong>${fmt(r.units)}</strong></td><td>${r.mode==='instant'?'Inmediata':'Orden de venta'}</td><td>${moneyCell(r.pricePerUnit)}</td><td>${moneyCell(r.profit,r.profit>=0?'positive':'negative')}</td></tr>`).join('');
  return `<div class="col-12"><div class="panel"><h3 class="subheading">${title}</h3><div class="table-scroll"><table class="data-table"><thead><tr><th>Objeto</th><th>Tier</th><th>Ciudad de venta</th><th>Unidades a vender</th><th>Modo</th><th>Precio/u estimado</th><th>Profit estimado</th></tr></thead><tbody>${body}</tbody></table></div></div></div>`;
 }
 const automaticSales=p.autoMeta?renderSalesMarket('royal')+renderSalesMarket('black'):'';

 const mats=b.materials.sort((a,b)=>a.city.localeCompare(b.city)||a.id.localeCompare(b.id)).map(m=>`<tr><td>${itemCell(m.id)}</td><td><strong>${fmt(Math.ceil(m.qtyGross))}</strong></td><td>${fmt(Math.ceil(m.qtyNet))}</td><td>${h(m.city||'—')}</td><td>${moneyCell(m.unitPrice)}</td><td>${moneyCell(Math.ceil(m.qtyGross)*m.unitPrice)}</td></tr>`).join('');
 const cities=b.cities.map(c=>`<tr><td>${c.city==='Black Market'?'<span class="pill amber">Mercado Negro</span>':'<span class="pill green">Royal</span>'}</td><td><strong>${h(c.city==='Black Market'?'Caerleon · Mercado Negro':c.city)}</strong></td><td>${fmt(c.qty)}</td><td>${fmt(c.products)}</td><td>${moneyCell(c.capital)}</td><td>${moneyCell(c.profit,'positive')}</td></tr>`).join('');
 const journals=(b.journalSummary?.items||[]).map(j=>`<tr><td>${itemCell(j.empty,j.name+' T'+j.tier)}</td><td><strong>${fmt(j.qty)}</strong></td><td>${fmt(j.full)} completos · ${j.partial} parcial</td><td>${h(j.buyCity)}</td><td>${moneyCell(j.purchaseCost)}</td><td>${j.exact?'<span class="pill green">Datos del juego</span>':'<span class="pill amber">Fama estimada</span>'}</td></tr>`).join('');
 const usedPct=p.budget?Math.min(100,b.totalCost/p.budget*100):0;
 const marketLabel=p.market==='royal'?'Royal':p.market==='mixed'?'Mercado Negro + Royal':'Mercado Negro';
 const totals={black:{qty:0,profit:0},royal:{qty:0,profit:0}};
 for(const r of b.rows){const t=r.city==='Black Market'?'black':'royal';totals[t].qty+=r.qty*(r.craftAmount||1);totals[t].profit+=r.totalProfit;}
 const mixedStats=p.market==='mixed'?`<div class="col-6">${stat('Destino: Mercado Negro',fmt(totals.black.qty)+' unidades','Profit estimado '+short(totals.black.profit),'gold','♜')}</div><div class="col-6">${stat('Destino: Royal',fmt(totals.royal.qty)+' unidades','Profit estimado '+short(totals.royal.profit),'jade','⌂')}</div>`:'';
 const missedSide=p.market==='mixed'&&b.rows.length&&(totals.black.qty===0||totals.royal.qty===0)?`<div class="col-12"><div class="notice neutral">${totals.black.qty===0?'No se asignaron unidades al Mercado Negro':'No se asignaron unidades a Royal'}. No hubo oportunidades rentables, con precios recientes y capacidad de presupuesto suficientes para incluir ambos destinos. No se inventan ventas para completar la distribución.</div></div>`:'';
 const refinements=plannedRefining(b.rows);
 const refinedBox=refinements.length?`<div class="col-12"><div class="panel"><h3 class="subheading">Refinamiento incluido en el plan</h3><p class="explain">Estos materiales se producirán antes de fabricar. La lista de compras ya muestra sus recursos crudos y el refinado del tier anterior; no contabiliza dos veces el refinado final.</p><div class="table-scroll"><table class="data-table"><thead><tr><th>Material a refinar</th><th>Fabricaciones</th><th>Ciudad</th><th>Retorno</th><th>Costo estación</th><th>Traslado</th><th>Focus</th></tr></thead><tbody>${refinements.map(x=>`<tr><td>${itemCell(x.id)}</td><td>${fmt(Math.ceil(x.crafts))}</td><td>${h(x.city)}</td><td>${x.rrr.toFixed(1)}%</td><td>${moneyCell(x.stationFee)}</td><td>${moneyCell(x.transferFee)}</td><td>${fmt(x.focus)}</td></tr>`).join('')}</tbody></table></div></div></div>`:p.refiningMode&&p.refiningMode!=='off'?`<div class="col-12"><div class="notice neutral"><strong>Refinamiento: ${p.refiningMode==='auto'?'comparación activada':'activado'}.</strong> Ningún material del plan necesitó refinado propio rentable o verificable. No se asumieron ahorros sin datos. Las monturas y pociones pueden usar ingredientes que no son recursos refinables tradicionales.</div></div>`:'';
 const marketAuditRows=b.rows.slice(0,25).map(r=>{const s=r.marketSignals||{},activity=r.activity||{};
  const seen=Number.isFinite(r.ageHours)?r.ageHours.toFixed(1)+' h':'Sin fecha';
  const direct=s.bid>0?moneyCell(s.bid):'Sin cotización reciente';
  const listed=s.ask>0?moneyCell(s.ask):'Sin cotización reciente';
  const historical=activity.medianPrice>0?moneyCell(activity.medianPrice):activity.avgPrice>0?moneyCell(activity.avgPrice):'Sin historial suficiente';
  const gap=Number.isFinite(s.spreadPercent)?s.spreadPercent.toFixed(0)+'%':'No comparable';
  const movement=volumeTrend(r.activity,r.activity7);
  const sales14=activity.observations?short(activity.observedDaily):'Sin datos';
  const sales7=r.activity7?.observations?short(r.activity7.observedDaily):'Sin datos';
  const silver14=activity.observations?short(activity.observedSilverDaily):'Sin datos';
  return `<tr><td>${itemCell(r.id)}</td><td>${h(r.city==='Black Market'?'Mercado Negro':r.city)}</td><td>${direct}</td><td>${listed}</td><td>${historical}</td><td>${sales7} / ${sales14}</td><td>${silver14}</td><td>${h(movement)}</td><td>${h(gap)}</td><td>${h(seen)}</td></tr>`;
 }).join('');
 const marketAudit=b.rows.length?`<div class="col-12"><details class="craft-advanced"><summary>Verificar señales del mercado · compras, publicaciones y antigüedad</summary><div class="table-scroll"><table class="data-table"><thead><tr><th>Objeto</th><th>Mercado</th><th>Vender ahora · bid</th><th>Publicar · ask</th><th>Referencia 14 días</th><th>Volumen observado 7d / 14d por día</th><th>Silver histórico diario 14d</th><th>Tendencia</th><th>Spread</th><th>Precio observado hace</th></tr></thead><tbody>${marketAuditRows}</tbody></table></div><p class="explain">La referencia histórica usa la mediana por días cuando existe suficiente cobertura. Un precio publicado no es una venta realizada. Las fechas proceden de las observaciones AODP, no del momento en que abriste la página.</p></details></div>`:'';
 const context=`${h(p.branch)} · ${p.city==='auto'?'Bono de cada ciudad':p.city==='compare'?'Bono vs Caerleon':h(p.city)} · bono diario ${p.daily}% · ${p.focus?'con Focus':'sin Focus'} · ${marketLabel}`;
 return `<div class="page-grid"><div class="col-12"><div class="craft-summary"><div><span class="kicker">${p.autoMeta?'ESCÁNER MULTI-RAMA':'TU PLAN PERSONALIZADO'}</span><h3>${context}</h3><p>Precios observados, retorno esperado y cantidades limitadas por la liquidez disponible. No se garantizan ventas ni márgenes futuros.</p></div><div class="button-row"><button class="btn sm" data-action="export-plan" ${!b.rows.length?'disabled':''}>↓ CSV del plan</button><button class="btn sm ghost" data-action="export-shopping" ${!b.rows.length?'disabled':''}>↓ Compras y diarios</button><button class="btn sm green" data-action="preflight" ${!b.rows.length?'disabled':''}>✓ Verificar antes de comprar</button></div></div></div>
 <div class="col-3">${stat('Capital necesario',short(b.totalCost),'Compra bruta y gastos · límite '+short(p.budget),'gold','◈')}</div><div class="col-3">${stat('Profit estimado',short(b.totalProfit),'Incluye retorno esperado','jade','↗')}</div><div class="col-3">${stat('Unidades a vender',fmt(b.rows.reduce((s,x)=>s+x.qty*(x.craftAmount||1),0)),(p.autoMeta?groupedProduction.length+' objetos únicos':b.rows.length+' rutas de venta'),'blue','⚒')}</div><div class="col-3">${stat('Presupuesto restante',short(b.remaining),p.invest==='all'?'Sin oportunidades verificables adicionales':'Reserva sin asignar','','◎')}</div>
  ${patientBadge}${mixedStats}${missedSide}
  ${b.rows.some(r=>r.salePriceProvisional)?`<div class="col-12"><div class="notice red"><strong>Plan de venta BM condicionado a precio:</strong> ${fmt(b.rows.filter(r=>r.salePriceProvisional).reduce((s,r)=>s+r.qty*(r.craftAmount||1),0))} unidades usan un precio objetivo conservador del historial AODP West, NO un bid del NPC disponible ahora. El profit de esas rutas es hipotético: <strong>no comprar ni fabricar hasta comprobar dentro del juego que el Mercado Negro permite publicar al precio objetivo y que los materiales siguen costando lo presupuestado.</strong></div></div>`:''}
  ${marketAudit}
  ${!b.rows.length?`<section class="panel gcp-no-craft-plan"><h3>Sin crafting rentable con las cotizaciones disponibles</h3><p>Se examinaron ${fmt(p.scanned||0)} variantes, pero ninguna reúne precio de venta utilizable, costes completos, margen después de impuestos y actividad suficiente. No se generarán fabricaciones con pérdidas solo para gastar silver.</p><div class="button-row"><button class="btn gold sm" data-action="expand-craft-search">↗ Ampliar búsqueda · todos los tiers y encantamientos</button><button class="btn sm" data-action="refresh-craft-now">↻ Actualizar precios y recalcular</button></div><p class="explain">Los promedios de ventas que aparecen en rankings externos son útiles para encontrar demanda, pero no garantizan el precio al que comprará el NPC. Si el margen solo existe a un precio histórico, el plan estará señalado como condicionado hasta confirmar ese precio dentro del juego.</p></section>`:''}
 <div class="col-12">${marketCoverageHtml(p)}${marketReferencesPanel(p.marketReferences)}</div>
 ${b.rows.some(x=>x.recipeKind==='refining')?`<div class="col-12"><div class="notice neutral"><strong>Refinamiento para vender:</strong> ${fmt(b.rows.filter(x=>x.recipeKind==='refining').reduce((n,x)=>n+x.qty,0))} unidades refinadas en ${fmt(b.rows.filter(x=>x.recipeKind==='refining').length)} rutas Royal. El costo bruto de recursos, el retorno esperado y la estación están incluidos. Es una actividad distinta del refinamiento de insumos de crafting.</div></div>`:''}
 <div class="col-12" id="preflight-results">${state.preflight?preflightResult(state.preflight):''}</div>
 <div class="col-12"><div class="panel"><div class="toggleline"><h3 class="subheading">${p.autoMeta?'Lista exacta: qué fabricar':'Lista exacta: qué fabricar y dónde vender'}</h3><span class="pill green">${p.autoMeta?groupedProduction.length+' objetos únicos':b.rows.length+' rutas'} · cantidades editables</span></div><div class="table-scroll">${listRows?`<table class="data-table"><thead>${p.autoMeta?'<tr><th>Objeto</th><th>Tier</th><th>Fabricar / refinar en</th><th>Lotes a fabricar</th><th>Unidades totales</th><th>RRR</th><th>Capital</th><th>Profit total</th></tr>':'<tr><th>Objeto</th><th>Tier</th><th>Fabricar / refinar en</th><th>Mercado</th><th>Vender en</th><th>Tipo de venta</th><th>Lotes / refinados</th><th>Unidades para vender</th><th>RRR</th><th>Precio por unidad</th><th>Profit por fabricación</th><th>Profit total</th><th>Actividad 14d (no ventas)</th><th>Libro de órdenes</th><th>Confianza</th><th>Profit estrés/fabricación</th><th>Focus/fabricación</th><th>Precio equilibrio/u</th><th>Competencia Royal</th></tr>'}</thead><tbody>${listRows}</tbody></table>`:empty('Sin candidatos rentables y verificables','Amplía tiers, cambia mercado o revisa si tu ciudad realmente tiene bono para la rama.')}</div></div></div>
 <div class="col-8"><div class="panel"><h3 class="subheading">🧺 Lista de compras para comenzar</h3><div class="table-scroll">${mats?`<table class="data-table"><thead><tr><th>Material</th><th>Comprar (bruto)</th><th>Consumo esperado</th><th>Ciudad de compra</th><th>Precio/u</th><th>Total bruto</th></tr></thead><tbody>${mats}</tbody></table>`:empty('Sin materiales')}</div><p class="explain">Compra las cantidades <strong>brutas</strong>. El retorno de recursos no ocurre antes de fabricar y se estima para varias fabricaciones; las cantidades netas no son una lista de compra inicial. Si usas diarios, presupuestar diarios enteros puede requerir capital adicional.</p></div></div>
 <div class="col-4"><div class="panel"><h3 class="subheading">Uso del presupuesto y riesgo</h3><div class="progress-track"><div class="progress-fill" style="width:${usedPct}%"></div></div><div class="cost-row"><span>Comprometido</span><strong>${short(b.totalCost)} (${usedPct.toFixed(1)}%)</strong></div><div class="cost-row"><span>Restante</span><strong>${short(b.remaining)}</strong></div><div class="cost-row"><span>Costo neto esperado</span><strong>${short(b.totalNetCost)}</strong></div><div class="cost-row"><span>Diarios vacíos a comprar</span><strong>${short(b.journalSummary?.cost||0)}</strong></div><div class="cost-row"><span>Profit bajo estrés</span><strong>${short(b.rows.reduce((s,r)=>s+r.stressProfit*r.qty,0))}</strong></div><div class="cost-row total"><span>ROI sobre capital bruto</span><strong>${b.totalCost?(100*b.totalProfit/b.totalCost).toFixed(1)+'%':'—'}</strong></div><div class="notice neutral" style="margin-top:16px">${p.invest==='all'?'Modo presupuesto completo: intenta asignar el máximo posible con profit y límites de demanda válidos.':'Modo cautela: máximo 30% del capital por objeto.'} <strong>El riesgo incluye precio de venta -${p.priceStress}% y materiales +${p.resourceStress}%. No se fuerzan compras ni se supone que las órdenes observadas se venderán.</strong></div></div></div>
 ${automaticSales}
 <div class="col-12" ${p.autoMeta?'hidden':''}><div class="panel"><h3 class="subheading">Distribución de ventas ${marketLabel}</h3><div class="table-scroll">${cities?`<table class="data-table"><thead><tr><th>Tipo</th><th>Destino</th><th>Unidades para vender</th><th>Rutas</th><th>Capital</th><th>Profit estimado</th></tr></thead><tbody>${cities}</tbody></table>`:empty('Sin destinos')}</div><p class="explain">${p.market==='royal'?'El plan considera precios de las ciudades Royal y hasta 3 mercados por objeto, priorizando precios netos y ventas observadas. Los registros históricos no garantizan que una orden futura se venda.':p.market==='mixed'?'Mercado Negro usa niveles de órdenes de compra observadas cuando los hay; sin niveles verificados, limita a 1 craft provisional por objeto. Las cantidades pueden desaparecer antes de vender. Las rutas Royal usan precios y ventas históricas por ciudad, con hasta tres destinos por objeto. El capital y los recursos solo se cuentan una vez por unidad fabricada.':'Los artículos del Mercado Negro se publican mediante órdenes propias. El precio observado de compra del NPC es una referencia prudente, no una venta garantizada ni una profundidad de demanda para anuncios futuros. Se aplica un tope conservador de unidades.'}</p></div></div>
 ${refinedBox}
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
 <div class="field span4"><label>Servidor del plan (bloqueado)</label><div class="input" aria-label="Servidor fijo">América (West) · AODP West</div></div>
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
 <div class="col-12"><details class="panel" style="padding:20px"><summary><strong>Mis materiales y Focus</strong> · Opcional, sin pestañas adicionales</summary><p class="explain">Los datos existentes se conservan en este navegador. Registra inventario o costos de Focus reales solo si los necesitas.</p>
 <h3 class="subheading">Inventario disponible</h3>
 <form class="form-grid" id="inventory-form">${field('ID del recurso','inventory-id','<input id="inventory-id" class="input" required placeholder="T5_METALBAR">','span4')}${selectField('Ciudad','inventory-city',CITIES,'Caerleon','span4')}${numberField('Cantidad disponible','inventory-qty',0,0,1,'span2')}${numberField('Costo/u registrado','inventory-unitcost',0,0,1,'span2')}<div class="field span12"><button class="btn sm gold" type="submit">Guardar material</button></div></form>
 <div class="table-scroll" style="margin-top:14px"><table class="data-table"><thead><tr><th>Material</th><th>Ciudad</th><th>Total</th><th>Reservado</th><th>Disponible</th></tr></thead><tbody>${availableInventory(loadInventory(),loadPortfolios()).slice(0,60).map(x=>`<tr><td>${itemCell(x.id)}</td><td>${h(x.city)}</td><td>${fmt(x.qty)}</td><td>${fmt(x.reserved)}</td><td>${fmt(x.available)}</td></tr>`).join('')}</tbody></table></div>
 <h3 class="subheading" style="margin-top:24px">Costos reales de Focus</h3>
 <form id="focus-form" class="form-grid">${field('ID exacto del objeto','focus-item','<input id="focus-item" class="input" placeholder="T6_SHOES_PLATE_SET1" required>','span4')}${numberField('Focus por craft','focus-cost',0,1,1,'span4')}${numberField('Spec','focus-spec',0,0,1,'span2')}<div class="field span2"><button class="btn sm gold" type="submit">Guardar Focus</button></div></form>
 <p class="explain">Para registrar ventas de planes guardados anteriormente, existe una vista de historial opcional dentro de Ajustes; no ocupa espacio en el menú principal.</p><div class="button-row"><button class="btn sm ghost" data-nav="cartera">Abrir historial opcional</button><button class="btn sm" data-action="backup-data">↓ Exportar respaldo</button></div>
 </details></div>
 <div class="col-12"><details class="panel gcp-snapshot-input"><summary>Estadísticas de volumen West (opcional)</summary><p class="explain">Solo se aceptan tablas de Albion Online Hub cuando hayas confirmado en la página que el ranking corresponde a <strong>América (West)</strong>. Si la página no identifica su servidor, no la importes. Royal Forge, Albion Free Market, AO MCT y Albion Online Tools se ofrecen como enlaces de contraste con selector West; no se leen sus números automáticamente. Los anuncios entre jugadores no cuentan como ventas. Nunca se importan precios para el cálculo de profit.</p>
 <div class="form-grid"><div class="field span3"><label>Fuente</label><select class="form-select" id="market-volume-source"><option value="hub">Albion Online Hub · Top Selling (West confirmado)</option></select></div>
 <div class="field span3"><label>Mercado</label><select class="form-select" id="market-volume-market">${opts(['Black Market',...CITIES], 'Black Market')}</select></div>
 <div class="field span3"><label>Servidor admitido</label><div class="input">Solo América (West)</div></div>
 <div class="field span3"><label>Fecha real de la tabla</label><input id="market-volume-date" type="date" class="input"></div></div>
 <label class="field" style="display:block;margin-top:12px"><input type="checkbox" id="market-volume-west-proof"> Confirmo que la fuente identifica explícitamente estos datos como América (West), no Europa/Asia.</label>
 <textarea id="market-volume-paste" class="input" rows="6" maxlength="280000" placeholder="Pega la tabla con IDs y Cantidad diaria media…" style="width:100%;margin:12px 0"></textarea>
 <button type="button" class="btn gold" data-action="save-market-volume">Importar estadísticas históricas</button><small class="muted">${importedMarketVolume()?importedMarketVolume().rows.length+' registros importados · '+h(importedMarketVolume().observedAt.slice(0,10)):'Sin estadísticas manuales válidas para el servidor actual'}</small></details></div>
 <div class="col-12"><div class="panel"><h3 class="subheading">Diagnóstico de imágenes de Albion</h3><p class="explain">Las fotos se buscan en el CDN alternativo, el proxy de Netlify y el render oficial; si fallan, se muestra una imagen local de respaldo. No depende de la API de precios.</p><div class="button-row"><button class="btn" data-action="test-icons" type="button">▣ Comprobar servidores de imágenes</button></div><div id="icon-diagnostics" class="muted tiny" aria-live="polite" style="margin-top:12px">Puedes verificar la conexión de los iconos desde este navegador.</div></div></div>
 <div class="col-12"><div class="panel"><h3 class="subheading">Sincronización privada entre dispositivos (opcional)</h3>
 <p class="explain">Tus inversiones, Focus, inventario y alertas siguen siendo locales por defecto. Si habilitas GILDEM_SYNC_ENABLED=1 en Netlify, podrás guardar y recuperar una copia cifrada con AES-GCM. La clave nunca sale de tu navegador; quien la pierda no podrá descifrar el respaldo. No es una cuenta de usuario ni un servicio de copia continua.</p>
 <div class="form-grid">
 ${field('Clave secreta de sincronización (guárdala fuera del navegador)','sync-secret','<input class="input" type="password" autocomplete="off" id="sync-secret" placeholder="Generar o pegar clave privada">','span12')}
 </div><div class="button-row" style="margin-top:12px"><button class="btn sm" type="button" data-action="sync-generate">Generar clave segura</button><button class="btn sm" type="button" data-action="sync-upload">↑ Subir copia cifrada</button><button class="btn sm gold" type="button" data-action="sync-download">↓ Recuperar copia cifrada</button></div>
 <div id="sync-message" class="muted tiny" style="margin-top:12px">Por defecto la sincronización está desactivada en Netlify. Actívala desde Environment variables si deseas usarla.</div>
 </div></div>
 <div class="col-12"><div class="panel"><h3 class="subheading">Fuentes del proyecto</h3><p class="explain">Precios e historial: <a target="_blank" rel="noopener" href="https://west.albion-online-data.com/api-docs">Albion Online Data Project (AODP)</a>. Catálogo de nombres y recetas: <a target="_blank" rel="noopener" href="https://github.com/vkorne-web/albion-market">albion-market</a>, extraído de <a target="_blank" rel="noopener" href="https://github.com/ao-data/ao-bin-dumps">ao-bin-dumps</a>. Referencia de funcionalidades y flujo de trabajo: <a target="_blank" rel="noopener" href="https://albiononlinehub.com/">Albion Online Hub</a> (no se importan sus precios). Esta es una herramienta de fans, no oficial, sin afiliación con Albion Online ni con Albion Online Hub.</p></div></div></div>`;}
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
 return {branch:selectedBranch,city:val('craft-city','auto'),daily:num('craft-daily',0),focus:val('craft-focus','no')==='yes',budget:num('craft-budget',10000000),invest:val('craft-invest','all'),horizonDays:Number(craftPrefs.horizonDays)||14,market:'black',tierMin,tierMax,ench:4,tierExact:'all',enchExact:val('craft-ench-exact','all'),buy:val('craft-buy','all'),buyMode:val('craft-buy-mode','instant'),goal:val('craft-goal','balanced'),minConfidence:num('craft-confidence',0),focusBudget:num('craft-focus-budget',10000),focusPerUnit:num('craft-focus-unit',0),qualityMode:['mounts','potions','foods'].includes(categoryForBranch(selectedBranch))?'normal':val('craft-quality-mode','normal'),qualityWeights:[1,2,3,4,5].map(i=>num('craft-q'+i,i===1?100:0)),priceStress:num('craft-price-stress',8),resourceStress:num('craft-resource-stress',7),riskBM:num('craft-risk-bm',0),riskRoyal:num('craft-risk-royal',0),matShipping:num('craft-mat-shipping',0),bmTax:num('craft-bm-tax',2.5),royalTax:num('craft-royal-tax',4),listingFee:num('craft-listing-fee',2.5),bmMode:'listed',requireBook:checked('craft-require-book'),useWallet:false,saleMode:val('craft-sale-mode','listed'),station:num('craft-station',0),transport:num('craft-transport',0),cap:num('craft-cap',0),unknownCap:num('craft-unknown',2),journals:!['mounts','potions','foods'].includes(categoryForBranch(selectedBranch))&&(control('craft-journals')?checked('craft-journals'):true),refiningMode:'off',refiningFee:0,refiningDaily:0,refiningFocus:false,refiningFocusUnit:0};}
function getMaterialFinder(map,input,craftCity='',maxAgeHours=prefs.maxAge){return id=>{const allowed=materialPurchaseCities(id,input.buy,CITIES);let best=null;
 const side=input.buyMode==='order'?'buy_price_max':'sell_price_min';
 for(const city of allowed){const q=quote(map,id,city,side,maxAgeHours);if(!q)continue;const fee=input.buyMode==='order'?prefs.setup/100:0;const effective=q.price*(1+fee)+(city!==craftCity?input.matShipping:0);if(!best||effective<best.price)best={...q,price:effective,originalPrice:q.price,city,mode:input.buyMode,shippingPerUnit:city!==craftCity?input.matShipping:0};}return best;};}
async function runCraft(force=false){
 state.preflight=null;
 let input;
 try{
  input=calcInputs();
  if(!Number.isSafeInteger(input.budget)||input.budget<1000)throw Error('Introduce un presupuesto válido desde 1.000 silver.');
  if(input.useWallet){const wallet=cashPosition(loadWallet(),loadPortfolios());if(!wallet.configured)throw Error('Configura el silver disponible en Ajustes y datos.');input.budget=Math.min(input.budget,Math.floor(wallet.available));if(input.budget<1000)throw Error('El silver libre de tu negocio es insuficiente para generar otro plan.');}
  if(![0,10,20].includes(input.daily))throw Error('El bono diario debe ser 0%, 10% o 20%.');
  if(!['balanced','daily','profit','roi','focus'].includes(input.goal))throw Error('Prioridad del plan no reconocida');
  if(input.cap<0||input.cap>100||input.unknownCap<0||!Number.isInteger(input.unknownCap))throw Error('Límite de volumen inválido');
  if([input.bmTax,input.royalTax,input.listingFee].some(x=>x<0||x>30))throw Error('Las tarifas de venta deben estar entre 0% y 30%.');
  if(input.matShipping<0||input.station<0||input.transport<0||input.refiningFee<0||input.refiningFocusUnit<0||input.focusBudget<0||input.focusPerUnit<0||input.riskBM<0||input.riskBM>100||input.riskRoyal<0||input.riskRoyal>100)throw Error('Gastos, Focus o riesgo fuera de rango');
  if(input.priceStress<0||input.priceStress>80||input.resourceStress<0||input.resourceStress>100)throw Error('Escenario de riesgo fuera de rango');
  if(input.qualityMode==='mix'&&Math.abs(input.qualityWeights.reduce((a,b)=>a+b,0)-100)>.001)throw Error('Los porcentajes de calidad deben sumar exactamente 100%.');
  if(!['off','auto','always'].includes(input.refiningMode)||![0,10,20].includes(input.refiningDaily))throw Error('Opción de refinado inválida.');
  if(craftItemChoice(input.branch).mode==='selected'&&!craftItemChoice(input.branch).stems.length)throw Error('Selecciona al menos un objeto de esa rama.');
  if(input.refiningFocus&&!(input.refiningFocusUnit>0))throw Error('Introduce el costo real de Focus por unidad refinada; no se puede adivinar solo con tu spec.');
  if(input.goal==='focus'&&!input.focus&&!input.refiningFocus)throw Error('Para maximizar silver/Focus, activa Focus de crafting o de refinado.');
  const profile=loadFocusProfile();
  if(input.focus&&!input.focusPerUnit&&!Object.values(profile).some(x=>Number(x.focus)>0))throw Error('Para evitar una recomendación falsa, introduce el Focus por craft que marca el juego, o guarda los valores por objeto en Focus y specs.');
 }catch(e){return showToast(e.message,true);}
 saveCraftPrefs({...input,budget:num('craft-budget',input.budget),focus:input.focus?'yes':'no',...Object.fromEntries(input.qualityWeights.map((x,i)=>['q'+(i+1),x]))});
 if(!Object.keys(recipes).length)return showToast('Todavía estamos descargando el catálogo de recetas.',true);
 const branch=branchByKey(input.branch);
 if(branchIsRoyalOnly(input.branch)){
  setBusy('craft-results','Cargando recetas reales del juego para '+branch.label+'…');
  try{await loadSpecialCatalog(t=>setBusy('craft-results',t));registerPotionFamilies(recipes,names);}
  catch(e){control('craft-results').innerHTML=errorText(e);return showToast(e.message,true);}
 }
 const choice=craftItemChoice(input.branch);
 let ids=recipesForBranch(recipes,input.branch,input.tierMin,input.tierMax,input.ench,650,'auto',id=>itemMatches(id,{mode:choice.mode,stems:choice.stems,enchExact:input.enchExact})&&qcVariantIncluded('craft',id,input.branch));
 ids=ids.filter(id=>qcVariantIncluded('craft',id,input.branch));
 if(!ids.length){control('craft-results').innerHTML=empty('No hay recetas de esa rama con la ciudad elegida','Intenta la ciudad automática o amplía los tiers.');return;}
 const marketReferencesPromise=checkMarketReferences();
 setBusy('craft-results','Consultando recetas y materiales de '+ids.length+' variantes…');
 try{
  const materialIds=[...new Set(ids.flatMap(id=>recipes[id].materials.map(m=>m.id)))];
  const journalSet=new Set();if(input.journals){for(const id of ids){const j=journalInfo(id,recipes[id],input.branch,journalFor(id));if(j&&j.ratio>0){journalSet.add(j.empty);journalSet.add(j.full);}}}
  const refinementIds=[]; // Insumos de equipo: siempre comprar refinados, nunca refinar antes del crafting.
  const response=await prices([...new Set([...ids,...materialIds,...refinementIds,...journalSet])],prefs.region,force);
  updateStatus(response);
  const map=rowMap(response.rows);
  let qualitiesMap=map;
  if(input.qualityMode==='mix'){
   setBusy('craft-results','Leyendo los cinco niveles de calidad del equipamiento…');
   const qualityData=await pricesQuality(ids,prefs.region,force);
   qualitiesMap=rowMap(qualityData.rows);
  }
  // Consultamos la actividad ANTES de descartar rutas sin bid BM rentable.
  // Así un objeto .0 de alta rotación puede evaluarse para venta POR ORDEN,
  // sin convertir precios históricos en compra inmediata garantizada.
  let warning=response.warning||null;
  let lookup=new Map(),historyVerified=false;
  const marketHistoryIds=chosenDemandIds(ids,900);
  if(marketHistoryIds.length){
   setBusy('craft-results','Consultando precios y actividad de 14 días en América…');
   try{const hist=await history(marketHistoryIds,prefs.region,force);
    if(hist.warning)warning=[warning,hist.warning].filter(Boolean).join(' · ');
    historyVerified=!!hist.rows?.length&&!hist.warning;
    lookup=demandHistoryIndex(hist.rows);
   }catch(e){warning=[warning,'Sin historial West: '+e.message].filter(Boolean).join(' · ');}
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
    const marketFind=getMaterialFinder(map,input,city,Math.max(prefs.maxAge,72));
    const find=id=>marketFind(id); // compra el material refinado en el mercado elegido
    const specialty=rec.specialtyEnabled!==false&&city===rec.city;
    const rate=craftingReturnRate({specialty,dailyBonus:dailyForRecipe,focus:input.focus});
    const without=craftingReturnRate({specialty,dailyBonus:dailyForRecipe,focus:false});
    const costData=craftCost(rec,find,rate.returnRate,input.station);
    if(!costData)continue;
    const refiningFocusCost=costData.materials.reduce((sum,m)=>sum+m.count*(m.refining?.focusPerRefine||0),0);
    const refiningSaving=costData.materials.reduce((sum,m)=>{const f=m.refining;if(!f?.focus)return sum;
      const sourceInput=f.inputs.reduce((x,y)=>x+y.count*y.unitPrice,0);
      const regularRR=100*(18+40+input.refiningDaily)/(100+18+40+input.refiningDaily);
      return sum+m.used*sourceInput*(f.rrr-regularRR)/100;},0);
    const focusGain=(input.focus?costData.materials.reduce((a,m)=>a+(m.ret?m.count*m.unitPrice*(rate.returnRate-without.returnRate)/100:0),0):0)+refiningSaving;
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
    const side=saleCity==='Black Market'?'buy_price_max':(mode==='instant'?'buy_price_max':'sell_price_min');
    let sale=quote(map,id,saleCity,side,Math.max(prefs.maxAge,72));
    let forecast=null;
    // Precio de venta por orden BM, separado del bid instantáneo observado.
    // El historial sólo puede generar un ESCENARIO CONDICIONADO, no una orden garantizada.
    if(saleCity==='Black Market'&&mode==='listed'&&input.qualityMode==='normal'){
     const histPrice=historicalBmListingTarget(lookup.get(id+'|Black Market')||[],sale);
     const routeTransit=(city==='Caerleon'?0:input.transport*outputAmount);
     const quality=chooseBmListingPrice(sale,histPrice,{cost:costData.total+routeTransit,units:outputAmount,
      taxPercent:input.bmTax,setupPercent:input.listingFee,stressSaleDrop:input.priceStress/100,
      stressMaterialRise:input.resourceStress/100,materialsCost:costData.materialCost});
     if(quality.provisional){sale=quality.quote;forecast=histPrice;}
    }
    if(!sale)continue;
    if(input.qualityMode==='mix'){
      const byQuality={};for(let k=1;k<=5;k++)byQuality[k]=quote(qualitiesMap,id,saleCity,side,Math.max(prefs.maxAge,72),k);
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
      rawMaterials:costData.rawMaterials,at:sale.at,ageHours:oldAge,activity:null,confidence:null,personalLearning:salesExperience.get(id+'|'+saleCity)||null,focusPerUnit:focusPerUnit+refiningFocusCost,focusGain,stressProfit:stress.stressed-riskPenalty,
      taxRate:taxPct/100,saleTaxPercent:taxPct,craftAmount:outputAmount,recipeKind:kind||'equipo',setupRate:mode==='listed'?input.listingFee/100:0,referenceSide:forecast?'historical_bm_target':side,
      salePriceProvisional:!!forecast,salePriceSource:forecast?'Objetivo histórico 14d West, no precio garantizado':'AODP West · bid observado',
      observedNpcBid:forecast?.bid||null,listingUnverified:saleCity==='Black Market'&&mode==='listed',transportCost:transit,transportRiskPct:lossPct,expectedRiskCost:riskPenalty,stationCost:input.station,buyMode:input.buyMode,buySetup:prefs.setup/100,qualityMode:input.qualityMode,qualityWeights:input.qualityWeights,journal,journalBonus});
   }
   }
  }
  demandEvidence(candidates,lookup,marketHistoryIds,input.market==='black'?['Black Market']:CITIES);
  const marketCoverage=coverageByMarket(ids,map,{cities:input.market==='black'?['Black Market']:CITIES,market:input.market,maxAge:prefs.maxAge,history:lookup.size?lookup:null});
  marketCoverage.historySample=marketHistoryIds.length;marketCoverage.historyUniverse=ids.length;
  marketCoverage.historyObserved=new Set([...lookup].filter(([,data])=>data.length).map(([key])=>key.split('|')[0])).size;
  marketCoverage.historyPairs=[...lookup].filter(([,data])=>data.length).length;
  marketCoverage.historyPartial=!historyVerified;
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
   x.confidence=confidenceOf({ageHours:x.ageHours,activity:x.activity,market:x.city==='Black Market'?'Black Market':'Royal',depthVerified:x.depthVerified,listed:x.mode==='listed'});
   if(x.salePriceProvisional){
    x.confidence={...x.confidence,score:Math.min(45,x.confidence.score),label:'Condicionado',tone:'amber',
     reasons:[...(x.confidence.reasons||[]),'Precio objetivo de orden BM del historial; confirmar en el juego']};
   }
   x.dailySales=null; // No existe prueba de ventas ejecutadas en este endpoint.
  }
  // Las rutas sin actividad suficiente reciben topes conservadores.
  for(const x of candidates){if(x.competition?.known && x.activity?.observations && x.mode==='listed'){
   x.competitionNote='Órdenes Royal por delante: '+x.competition.unitsAhead+' (no equivalen a ventas).';
  }}
  attachMarketIntelligence(candidates,map,prefs.maxAge);
  const viable=filterViableCraftRoutes(candidates,{budget:input.budget,mode:'black'});
  const shortlisted=selectCraftSaleRoutes(viable.accepted,input.market);
  const capFraction=input.cap>0?input.cap/100:(input.invest==='all'?.1:.07);
  const adaptive=await allocateCraftWithPatientFallback({candidates,viable,market:input.market,budget:input.budget,
   goal:input.goal,invest:input.invest,focusLimit:input.focus||input.refiningFocus?input.focusBudget:null,
   capFraction,region:prefs.region,force,minConfidence:input.minConfidence,horizonDays:input.horizonDays});
  let plan=adaptive.plan;const purchasing=adaptive.check;
   const source=branchIsRoyalOnly(input.branch)?recipeCatalogStatus():null;
  const recipeAge=source?.downloadedAt?Date.now()-Date.parse(source.downloadedAt):Infinity;
  const recipeWarning=source&&(!Number.isFinite(recipeAge)||recipeAge>24*3600000)?'Recetas especiales sin verificación reciente después de un parche. Compruébalas dentro del juego antes de invertir.':null;
  const warnings=[warning,purchasing.warning,viable.rejected.length?`${viable.rejected.length} rutas descartadas: no tienen suficiente margen de seguridad, demanda observable o profundidad BM.`:null,recipeWarning,input.goal==='daily'&&!salesExperience.size?'Sin ventas propias registradas todavía: la prioridad de rotación utiliza señales conservadoras del mercado.':null,branchIsRoyalOnly(input.branch)?(categoryForBranch(input.branch)==='mounts'?'Monturas: solo Royal; se incluye el ensillado, no la crianza ni alimentación.':categoryForBranch(input.branch)==='foods'?'Comidas: solo Royal; el precio incluye todos los ingredientes de la receta. Verifica las tarifas del cocinero y la fecha del catálogo tras cada parche.':'Esta rama solo admite venta en Royal.'):null,noFocusValues?`${noFocusValues} recetas omitidas: falta un costo de Focus verificado.`:null,noQualityQuotes?`${noQualityQuotes} precios por calidad incompletos o antiguos: excluidos.`:null,input.buyMode==='order'?'Materiales presupuestados con órdenes de compra no ejecutadas; pueden no completarse.':null].filter(Boolean);
  state.plan={smartPortfolio:portfolioDiversityStats(plan.rows,{budget:input.budget, reserve:0,pending:adaptive.pending}),fill:adaptive.fill,bulkEligible:adaptive.bulkEligible,minWeekly:adaptive.minWeekly,exposureFraction:adaptive.exposureFraction,investableBudget:adaptive.investment.spendable,reserveSilver:adaptive.investment.reserve,procurementAudit:purchasing.depthAudit||null,marketReferences:await marketReferencesPromise,planStrategy:adaptive.strategy,supplyPending:!!purchasing.supplyPending,marketCoverage,horizonDays:input.horizonDays,scanDiagnosis:diagnoseScan({recipes:ids.length,candidates:candidates.length,viable,recommendations:plan.rows.length}),plan,budget:input.budget,branch:branch.label,city:input.city,daily:input.daily,focus:input.focus,refiningFocus:input.refiningFocus,refiningMode:input.refiningMode,refiningFee:input.refiningFee,refiningDaily:input.refiningDaily,market:input.market,invest:input.invest,journals:input.journals,cap:capFraction,unknownCap:input.unknownCap,scanned:ids.length,advanced:state.fullCatalog,warning:warnings.join(' · '),goal:input.goal,focusBudget:input.focusBudget,buyMode:input.buyMode,availableCandidates:shortlisted,bmDepth:bookVerified,requireBook:input.requireBook,qualityMode:input.qualityMode,priceStress:input.priceStress,resourceStress:input.resourceStress,matShipping:input.matShipping,useWallet:input.useWallet,solverMethod:adaptive.method||'asignación de capital'};
  control('craft-results').innerHTML=craftResult(state.plan);
  if(plan.rows.length){state.resultSource='crafting';changePage('resultados');}
  if(!plan.rows.length)showToast('No hay margen verificable. Amplía la búsqueda a todos los tiers y encantamientos o actualiza AODP West.',true);
  else{showToast('Plan generado: '+plan.rows.reduce((s,r)=>s+r.qty*(r.craftAmount||1),0)+' productos en '+plan.rows.length+' rutas.'+(plan.rows.some(r=>r.salePriceProvisional)?' ATENCIÓN: precios objetivo BM históricos, confirmar antes de invertir.':''));checkAlerts(false).catch(()=>{});}
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
async function runPreflight(){const p=currentPlan();if(!p?.plan?.rows?.length)return showToast('Genera primero un plan.',true);
 const target=control('preflight-results');if(target)setBusy('preflight-results','Reconsultando productos, materiales, diarios y órdenes observadas…');
 try{
  const rows=p.plan.rows;
  const ids=[...new Set(rows.flatMap(r=>[r.id,...r.materials.flatMap(m=>m.refining?[m.id,...m.refining.inputs.map(x=>x.id)]:[m.id]),...(r.journal?.prices?[r.journal.empty,r.journal.full]:[])]))];
  const response=await (p.qualityMode==='mix'?pricesQuality:prices)(ids,prefs.region,true);
  if(response.warning)throw Error('No se pudo confirmar información nueva en AODP: '+response.warning);
  let book=new Map();const instant=rows.filter(r=>r.mode==='instant');
  if(instant.length){const products=[...new Set(instant.map(r=>r.id))],cities=[...new Set(instant.map(r=>r.city))];
   const depth=await orderbook(products,prefs.region,true,cities);
   if(depth.warning)throw Error('Profundidad de órdenes sin confirmar: '+depth.warning);
   book=normalizeOrderbook(depth.rows,products,cities,prefs.maxAge);
  }
  const report=verifyPlannedPrices(rows,response.rows,{budget:p.budget,focusLimit:p.focus||p.refiningFocus?p.focusBudget:null,maxAgeHours:prefs.maxAge,materialShipping:p.matShipping||0,book});
  report.notes=[];
  if(p.qualityMode==='mix')report.notes.push('Las calidades son una mezcla estimada, no resultados asegurados.');
  if(rows.some(r=>r.mode==='listed'))report.notes.push('Órdenes Royal/BM: publicar no garantiza compradores ni plazo de venta. En BM la puja del NPC es la referencia, NO el precio asegurado de tu orden.');
  if(rows.some(r=>r.city==='Black Market'&&r.mode==='listed'))report.notes.push('BM: revisa tu precio objetivo en el juego y la evolución de la puja del NPC antes de publicar; no equivale a vender ahora.');
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
   if(p.planStrategy==='patient')report.notes.push('Plan de venta lenta: la actividad histórica no garantiza que se ejecute una orden en un plazo concreto.');
   if(p.supplyPending)report.blockers.push('Compras de materiales pendientes: el libro no garantiza el lote al precio usado. No ejecutar hasta confirmar el abastecimiento.');
   report.ok=report.ok&&report.blockers.length===0;

  if(report.blockers.length)report.ok=false;
  state.preflight=report;if(state.page==='resultados')resultsPage();else if(control('preflight-results'))control('preflight-results').innerHTML=preflightResult(report);
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
async function syncCatalog(force=false){
 state.loading=true;const info=control('settings-info');if(info)info.textContent='Sincronizando nombres y recetas…';
 try{
  const stats=await loadCatalog(force);registerPotionFamilies(recipes,names);registerMountFamilies(recipes,names);
  state.catalogReady=Object.keys(recipes).length>0;state.loading=false;
  if(state.page==='crafting')void refreshCraftItems();
  if(state.page==='autocraft')void refreshAutoPickers();
  if(state.page==='levelcraft')void refreshLevelFamilies();
  if(info)info.textContent=`Listos: ${fmt(stats.names)} nombres · ${fmt(stats.recipes)} recetas.`;
  else if(state.page==='inicio')render();
  showToast(stats.warning||'Catálogo sincronizado: '+fmt(stats.recipes)+' recetas.',!!stats.warning);
 }catch(e){
  state.catalogReady=Object.keys(recipes).length>0;state.loading=false;
  if(state.page==='crafting')renderItemChoices('craft');
  if(state.page==='autocraft')renderItemChoices('auto');
  if(info)info.textContent='Error de catálogo: '+e.message;
  showToast('No se cargaron las recetas. Usa «Reintentar catálogo». '+e.message,true);
 }
}
async function syncGameRecipes(){
 const status=control('recipe-sync-status')||control('settings-info');
 const report=t=>{if(status)status.textContent=t;};
 report('Buscando las últimas recetas en los datos del juego…');
 try{
  const amount=await loadSpecialCatalog(report,true);registerPotionFamilies(recipes,names);
  const old=loadPortfolios(),updated=flagChangedPortfolios(old,recipes,recipeCatalogStatus().sourceRevision);
  if(updated.some((p,i)=>JSON.stringify(p.patchChanges)!==JSON.stringify(old[i].patchChanges)))writeLocal(K_LEDGER,updated);
  const source=recipeCatalogStatus();
  report('Recetas: '+fmt(amount)+' variantes · revisión '+(source.sourceRevision?.slice(0,10)||'no disponible')+' · consulta '+(source.downloadedAt?new Date(source.downloadedAt).toLocaleString('es-ES'):'sin fecha')+'. Regenera tu plan.');
  const n=updated.reduce((s,p)=>s+(p.patchChanges||[]).length,0);
  showToast(n?`Recetas actualizadas: ${n} cambios en tus planes guardados. Recalcula antes de comprar.`:'Recetas actualizadas y planes guardados comprobados.');
 }catch(e){report('No se pudieron validar recetas nuevas: '+e.message);showToast(e.message,true);}
}
async function syncAdvanced(){const info=control('settings-info')||control('craft-results');if(info)info.textContent='Descargando datos de diarios…';try{const total=await loadAdvanced(text=>{if(info)info.textContent=text;});state.fullCatalog=true;if(state.page==='ajustes')settingsPage();if(state.page==='crafting'){if(state.plan){state.plan.advanced=true;control('craft-results').innerHTML=craftResult(state.plan);}else craftPage();}showToast('Diarios sincronizados: '+fmt(total)+' entradas. Vuelve a generar el plan para incluirlos.');}catch(e){if(info)info.textContent='Error: '+e.message;showToast(e.message,true);}}
function applySettings(){prefs.region=REGION;prefs.premium=val('settings-premium','premium')==='premium';prefs.maxAge=num('settings-age',24);prefs.tax=num('settings-tax',4);prefs.setup=num('settings-setup',2.5);prefs.transport=num('settings-shipping',0);prefs.rrr=num('settings-rrr',24.8);prefs.station=num('settings-station',0);
 if(prefs.maxAge<1||prefs.maxAge>720||prefs.tax<0||prefs.tax>50||prefs.setup<0||prefs.setup>50||prefs.rrr<0||prefs.rrr>=100)return showToast('Uno de los parámetros está fuera de rango.',true);
 save();$('#server-select').value=prefs.region;render();showToast('Ajustes guardados. Próximos cálculos usarán los nuevos valores.');}
function exportPlan(){const active=currentPlan();if(!active?.plan.rows.length)return showToast('Genera primero un plan de crafting',true);
 if(active.autoMeta){
  const cols=[['TIPO','NOMBRE','ID','TIER','FABRICACIONES_O_LOTES','UNIDADES','CIUDAD','CAPITAL_BRUTO','PROFIT_TOTAL_ESTIMADO']];
  for(const g of groupProduction(active.plan.rows))cols.push(['FABRICAR',itemName(g.id),g.id,`${itemTier(g.id)}.${itemEnch(g.id)}`,g.qty,g.units,g.craftCities.map(c=>c.city+': '+c.qty+' lotes').join(' / '),Math.round(g.capital),Math.round(g.profit)]);
  for(const market of ['royal','black'])for(const r of groupSales(active.plan.rows,market))cols.push([market==='royal'?'VENDER_ROYAL':'VENDER_MERCADO_NEGRO',itemName(r.id),r.id,`${itemTier(r.id)}.${itemEnch(r.id)}`,'',r.units,r.city,Math.round(r.capital),Math.round(r.profit)]);
  for(const m of active.plan.materials)cols.push(['COMPRA',itemName(m.id),m.id,itemTier(m.id),Math.ceil(m.qtyGross),'',m.city,Math.round(Math.ceil(m.qtyGross)*m.unitPrice),'']);
  downloadText('\ufeff'+cols.map(row=>row.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(';')).join('\r\n'),'gildem-fabricacion-y-distribucion-royal-bm.csv','text/csv;charset=utf-8;');
  return;
 }
 const fields=[['TIPO','NOMBRE','ID','TIER','FABRICACIONES','UNIDADES_A_VENDER','CIUDAD_FABRICACION','CIUDAD_VENTA_O_COMPRA','RETORNO_PORCENTAJE','COSTO_BRUTO_POR_FABRICACION','COSTO_NETO_POR_FABRICACION','PRECIO_VENTA','PROFIT_POR_FABRICACION','PROFIT_TOTAL','TIPO_MERCADO','MODO_VENTA','CONFIANZA','ESTRES_PROFIT_FABRICACION','FOCUS_POR_FABRICACION','ACTIVIDAD_ORDENES_DIARIAS','PRECIO_VENTA_ORIGEN','VENTA_CONDICIONADA']];
 for(const r of active.plan.rows)fields.push(['CRAFT',itemName(r.id),r.id,`${itemTier(r.id)}.${itemEnch(r.id)}`,r.qty,r.qty*(r.craftAmount||1),r.craftCity,r.city,r.returnRate.toFixed(2),Math.round(r.capitalPerUnit),Math.round(r.cost),r.sell,Math.round(r.profit),Math.round(r.totalProfit),r.city==='Black Market'?'MERCADO NEGRO':'ROYAL',r.mode==='instant'?'INMEDIATA':'ORDEN',r.confidence?.label,Math.round(r.stressProfit),r.focusPerUnit,r.activity?.observedDaily??'',r.salePriceSource||'AODP West',r.salePriceProvisional?'SI; confirmar bid BM':'NO']);
 for(const m of active.plan.materials)fields.push(['COMPRA',itemName(m.id),m.id,itemTier(m.id),Math.ceil(m.qtyGross),'','',m.city,'',Math.round(m.unitPrice),'','','','','','']);
 const csv='\ufeff'+fields.map(row=>row.map(s=>'"'+String(s??'').replaceAll('"','""')+'"').join(';')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='gildem-plan-royal-blackmarket-unificado.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function exportShopping(){
 const p=currentPlan()?.plan;if(!p?.rows.length)return showToast('Genera un plan primero.',true);
 const lines=[['TIPO','NOMBRE','ID','CIUDAD','COMPRAR_CANTIDAD_BRUTA','CONSUMO_ESTIMADO','PRECIO_UNITARIO','COSTO_BRUTO','PRECISION']];
 for(const m of p.materials)lines.push([m.refinedFrom?'RECURSO PARA REFINAR':'MATERIAL',itemName(m.id),m.id,m.city,Math.ceil(m.qtyGross),Math.ceil(m.qtyNet),Math.round(m.unitPrice),Math.round(Math.ceil(m.qtyGross)*m.unitPrice),'Cotización AODP']);
 for(const r of plannedRefining(p.rows))lines.push(['REFINAR EN TALLER',itemName(r.id),r.id,r.city,Math.ceil(r.crafts),'',Math.round(r.stationFee+r.transferFee),Math.round(r.stationFee+r.transferFee),'Costos de estación y traslado configurados']);
 for(const j of p.journalSummary?.items||[])lines.push(['DIARIO VACÍO',j.name+' T'+j.tier,j.empty,j.buyCity,j.qty,'',j.price,Math.round(j.purchaseCost),j.exact?'Dato del juego':'Estimación de fama / precio referencia']);
 const csv='\ufeff'+lines.map(row=>row.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(';')).join('\r\n');
 downloadText(csv,'gildem-compras-y-diarios-royal-bm.csv','text/csv;charset=utf-8;');
}
// Las ediciones manuales nunca pueden exceder el presupuesto ni los topes
// por objeto; la profundidad debe verificarse de nuevo tras editar.
function commitEditedSmartPlan(active,rows,result){
 if(!result.ok)return {ok:false,reason:result.reason};
 const budget=Number(active.investableBudget??active.budget);
 const guard=validateIntelligentEdits(result.rows,budget,{itemFraction:active.exposureFraction||.12,bulkMode:true});
 if(!guard.ok)return guard;
 active.plan={...result,rows:result.rows.map(r=>({...r,procurementFirstBatch:0,patientSupplyPending:true}))};
 active.procurementAudit=null;
 active.supplyPending=true;
 active.fill=portfolioFillSummary(active.plan,active.budget,{eligible:active.bulkEligible||0});
 active.smartPortfolio=portfolioDiversityStats(active.plan.rows,{
  budget:active.budget,reserve:active.reserveSilver||0,pending:pendingUnitsByMarket(loadPortfolios())
 });
 state.preflight=null;
 redrawCurrentPlan();
 return {ok:true};
}
function changePlanGroup(key,qty){
 const active=currentPlan(),current=active?.plan;
 if(!current)return;
 const proposed=distributeProductionQuantity(current.rows,key,qty);
 if(!proposed.ok){showToast(proposed.reason,true);redrawCurrentPlan();return;}
 const result=rebuildPlan(proposed.rows,active.investableBudget??active.budget,active.focus||active.refiningFocus?active.focusBudget:null);
 const saved=commitEditedSmartPlan(active,proposed.rows,result);if(!saved.ok){showToast(saved.reason,true);redrawCurrentPlan();return;}
 showToast('Fabricaciones agrupadas y distribución de ventas actualizadas.');
}
function changePlanQty(index,qty){
 const active=currentPlan(),current=active?.plan;if(!current)return;
 if(!Number.isInteger(qty)||qty<0)return showToast('Introduce una cantidad entera de 0 o más.',true);
 const rows=current.rows.map(x=>({...x}));if(!rows[index])return;
 rows[index].qty=qty;
 const result=rebuildPlan(rows,active.investableBudget??active.budget,active.focus||active.refiningFocus?active.focusBudget:null);
 const saved=commitEditedSmartPlan(active,rows,result);if(!saved.ok){showToast(saved.reason,true);redrawCurrentPlan();return;}
 showToast('Cantidades, diarios y compra actualizados.');
}
function addPlanRoute(key){
 const p=currentPlan();if(!p?.plan)return;
 const x=(p.availableCandidates||[]).find(r=>r.id+'|'+r.city+'|'+r.craftCity===key);
 if(!x)return showToast('Ruta no encontrada',true);
 if(p.plan.rows.some(r=>r.id===x.id&&r.city===x.city&&r.craftCity===x.craftCity))return showToast('Esa ruta ya está en tu plan.',true);
 if(!bulkMarketCandidates([x]).accepted.length)return showToast('Este objeto no supera 50 observaciones semanales con margen conservador positivo.',true);
 if(x.marketCapacity===0)return showToast('El libro no soporta una unidad rentable.',true);
 const outstanding=pendingUnitsByMarket(loadPortfolios()).get(x.id+'|'+x.city)||0;
 const depth=Number.isFinite(x.marketCapacity)?x.marketCapacity:(x.city==='Black Market'&&x.mode==='instant'?1:(x.activity?.observations?Math.max(1,Math.floor(x.activity.observedDaily*p.cap)):p.unknownCap));
 const maxCrafts=Math.max(0,depth-Math.ceil(outstanding/Math.max(1,x.craftAmount||1)));
 if(maxCrafts<1)return showToast('Todavía tienes inventario pendiente de venta o el mercado no admite otra unidad.',true);
 const rows=[...p.plan.rows,{...x,qty:1,maxCrafts,pendingUnits:outstanding}];
 const next=rebuildPlan(rows,p.investableBudget??p.budget,p.focus||p.refiningFocus?p.focusBudget:null);
 const saved=commitEditedSmartPlan(p,rows,next);if(!saved.ok)return showToast(saved.reason,true);
 showToast('Se añadió la ruta. Verifica de nuevo el libro de órdenes antes de comprar.');
}
function suggestItems(text){const wrap=control('search-results');if(!wrap)return;
 const matches=findItems(text,10);if(!text.trim()||!matches.length){wrap.style.display='none';return;}
 wrap.style.display='block';wrap.innerHTML=matches.map(o=>`<button class="search-result" data-select-id="${h(o.id)}" type="button">${itemimg(o.id,42)}<span><strong>${h(o.name)}</strong><small>${h(o.id)}</small></span></button>`).join('');}
function currentAction(force=false){if(state.page==='resultados'){if(!force)return;const source=state.resultSource==='autocraft'?'autocraft':'crafting';changePage(source);return source==='autocraft'?runAutoScan(true):runCraft(true);}if(state.page==='precios'&&state.market)return runLookup(force);if((state.page==='comercio'||state.page==='negro')&&state.trade)return runTrade(force);if(state.page==='crafting'&&state.plan)return runCraft(force);if(state.page==='autocraft'&&state.autoPlan){if(force)return runAutoScan(true);return;}if(state.page==='levelcraft'&&state.levelPlan){if(force)return runLevelCraft(true);return;}if(state.page==='refino'&&state.refine)return runRefine(force);if(state.page==='encantar'&&state.enchant)return runEnchant(force);if(state.page==='transmutar'&&state.transmute)return runTransmute(force);showToast('Selecciona una herramienta y ejecuta tu primera consulta.');}
// ─── Mi negocio, datos de Focus y alertas locales ──────────────────────────
const K_LEDGER='gildem-v4-ledger',K_FOCUS='gildem-v4-focus',K_ALERTS='gildem-v4-alerts',K_WALLET='gildem-v6-wallet',K_INVENTORY='gildem-v8-inventory';
function readLocal(key,defaultValue){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):defaultValue;}catch{return defaultValue;}}
function writeLocal(key,v){try{saveDailyBackup();localStorage.setItem(key,JSON.stringify(v));return true;}catch{showToast('No se pudo guardar. Libera espacio en este navegador.',true);return false;}}
function snapshotPayload(){return {version:8,exported:new Date().toISOString(),portfolios:readLocal(K_LEDGER,[]),alerts:readLocal(K_ALERTS,[]),focus:readLocal(K_FOCUS,{}),wallet:readLocal(K_WALLET,{}),inventory:readLocal(K_INVENTORY,[])};}
function saveDailyBackup(){try{const key='gildem-v8-daily-backups',old=JSON.parse(localStorage.getItem(key)||'[]');if(old.length&&Date.now()-Date.parse(old[old.length-1].at)<24*3600000)return;
 old.push({at:new Date().toISOString(),backup:snapshotPayload()});localStorage.setItem(key,JSON.stringify(old.slice(-3)));}catch{}}
function loadInventory(){const list=readLocal(K_INVENTORY,[]);return Array.isArray(list)?list:[];}
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
  ${p.patchChanges?.length?`<div class="notice red">⚠ Recetas modificadas desde que guardaste este plan: ${p.patchChanges.map(h).join(', ')}. Vuelve a generar el plan antes de fabricar.</div>`:''}
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
 <div class="col-12"><div class="panel"><div class="toggleline"><div><h3 class="subheading">Mi inventario de materiales</h3><p class="tiny muted">Reserva stock entre planes guardados y descuéntalo cuando confirmes la fabricación.</p></div><span class="pill green">${loadInventory().length} tipos registrados</span></div>
 <form class="form-grid" id="inventory-form" style="margin-top:12px">
  ${field('ID de material o recurso','inventory-id','<input class="input" id="inventory-id" placeholder="T5_METALBAR" required>','span4')}
  ${selectField('Ciudad del stock','inventory-city',CITIES,'Caerleon','span4')}
  ${numberField('Cantidad física (reemplaza el saldo)','inventory-qty',0,0,1,'span2')}
  ${numberField('Costo histórico por unidad','inventory-unitcost',0,0,1,'span2')}
  <div class="field span12"><button class="btn sm gold" type="submit">Guardar inventario</button></div>
 </form><div class="table-scroll" style="margin-top:12px"><table class="data-table"><thead><tr><th>Material</th><th>Ciudad</th><th>En inventario</th><th>Reservado</th><th>Disponible</th><th>Valor histórico</th></tr></thead><tbody>${availableInventory(loadInventory(),all).map(x=>`<tr><td>${itemCell(x.id)}</td><td>${h(x.city)}</td><td>${fmt(x.qty)}</td><td>${fmt(x.reserved)}</td><td><strong>${fmt(x.available)}</strong></td><td>${short(x.qty*x.unitCost)}</td></tr>`).join('')}</tbody></table></div><p class="explain">El inventario no se crea a partir de tus precios de AODP. Debes registrar manualmente lo que ya posees; no existe una conexión pública con la mochila del personaje.</p></div></div>
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
function savePlanPortfolio(){const p=currentPlan()?.plan;
 if(!p?.rows.length)return showToast('Necesitas generar un plan primero.',true);
 const name=window.prompt('Nombre para esta inversión','Craft '+new Date().toLocaleDateString('es-ES'));
 if(name===null)return;
 const all=loadPortfolios();
 const deduction=procurementPlan(p.materials,loadInventory(),all);
 all.push({...createPortfolioFromPlan(p,String(name||'Plan de crafting').slice(0,70)),started:false,inventoryAllocations:deduction.allocations,
  inventoryCredit:deduction.cashSaved,recipeSnapshot:recipeSnapshot(p.rows,recipes),recipeRevision:recipeCatalogStatus().sourceRevision||null,patchChanges:[]});
 if(writeLocal(K_LEDGER,all))showToast('Plan guardado en Mi negocio. Registra las ventas al cobrarlas.');
}
function appendPlanAlert(index){const r=currentPlan()?.plan.rows[Number(index)];if(!r)return showToast('No existe esa ruta.',true);
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
async function cloudSync(mode){const msg=control('sync-message'),code=val('sync-secret','').trim();if(!code){showToast('Genera o pega la clave secreta.',true);return;}
 if(msg)msg.textContent='Conectando cifrado…';
 try{const id=await syncId(code);const url='./.netlify/functions/private-sync';let response;
  if(mode==='upload')response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,encrypted:await encryptPayload(snapshotPayload(),code)})});
  else response=await fetch(url+'?id='+id,{cache:'no-store'});
  const data=await response.json();if(!response.ok)throw Error(data.error||'Servidor no disponible');
  if(mode==='download'){
   const payload=await decryptPayload(data.encrypted,code);
   if(![4,6,7,8].includes(payload.version)||!Array.isArray(payload.portfolios)||!Array.isArray(payload.alerts)||!payload.focus||typeof payload.focus!=='object')throw Error('La copia descifrada no es un respaldo válido.');
   if(!confirm('¿Reemplazar tus inversiones, inventario, Focus y alertas de ESTE navegador con la copia cifrada?'))return;
   writeLocal(K_LEDGER,payload.portfolios.slice(0,500));writeLocal(K_ALERTS,payload.alerts.slice(0,500));writeLocal(K_FOCUS,payload.focus);if(payload.wallet)writeLocal(K_WALLET,payload.wallet);
   if(Array.isArray(payload.inventory))writeLocal(K_INVENTORY,payload.inventory.map(validateEntry).slice(0,600));
   showToast('Copia privada recuperada con éxito');settingsPage();
  }else showToast('Copia cifrada guardada. Usa la misma clave en otro dispositivo.');
  if(msg)msg.textContent='Última operación: '+new Date(data.updatedAt||Date.now()).toLocaleString('es-ES')+' · cifrado privado.';
 }catch(e){if(msg)msg.textContent=e.message;showToast(e.message,true);}
}
function saveInventoryInput(){try{const entry=validateEntry({id:val('inventory-id'),city:val('inventory-city'),qty:num('inventory-qty'),unitCost:num('inventory-unitcost')});
 const stock=loadInventory(),existing=stock.findIndex(x=>x.id===entry.id&&x.city===entry.city);
 const reserved=(availableInventory([{...entry,qty:1000000000}],loadPortfolios())[0]?.reserved||0);
 if(entry.qty<reserved)throw Error(`Hay ${reserved} unidades reservadas en planes sin iniciar. No puedes reducir el stock por debajo de esa cantidad.`);
 if(existing>=0)stock[existing]=entry;else stock.push(entry);
 if(writeLocal(K_INVENTORY,stock)){if(state.page==='ajustes')settingsPage();else portfolioPage();showToast('Inventario actualizado.');}
 }catch(e){showToast(e.message,true);}}
function exportBackup(){downloadText(JSON.stringify(snapshotPayload(),null,2),'gildem-craft-respaldo.json','application/json');}
function exportLedger(){const data=[['PLAN','FECHA','ITEM','MERCADO','FABRICADAS','VENDIDAS','COSTO_UNITARIO','PRECIO_VENTA_UNITARIO','TARIFAS','TRANSPORTE','PROFIT_REAL_VENTA']];
 for(const p of loadPortfolios())for(const lot of p.lots)for(const s of lot.sales||[]){const profit=s.qty*(s.price-lot.unitCost)-s.fees-s.transport;data.push([p.title,s.at,lot.id,lot.market,lot.qty,s.qty,lot.unitCost,s.price,s.fees,s.transport,profit]);}
 const csv='\ufeff'+data.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(';')).join('\r\n');downloadText(csv,'gildem-ventas-reales-v6.csv','text/csv;charset=utf-8;');}
async function importBackup(file){if(!file)return;if(file.size>2000000)return showToast('El respaldo supera el tamaño permitido (2 MB).',true);
 try{const payload=JSON.parse(await file.text());if(![4,6,7,8].includes(payload.version)||!Array.isArray(payload.portfolios)||!Array.isArray(payload.alerts)||!payload.focus||typeof payload.focus!=='object')throw Error('Formato de respaldo inválido.');
  if(!confirm('¿Reemplazar tus inversiones, alertas y valores de Focus actuales por este respaldo?'))return;
  writeLocal(K_LEDGER,payload.portfolios.slice(0,500));writeLocal(K_ALERTS,payload.alerts.slice(0,500));writeLocal(K_FOCUS,payload.focus);if(payload.wallet)writeLocal(K_WALLET,payload.wallet);if(Array.isArray(payload.inventory))writeLocal(K_INVENTORY,payload.inventory.map(validateEntry).slice(0,600));render();showToast('Respaldo recuperado en este navegador.');
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
 const labels=['Netlify CDN','Render oficial','CDN alternativo'];
 const results=await Promise.all(sources.map(src=>probeImage(src)));
 const dest=control('icon-diagnostics');if(!dest)return;
 dest.innerHTML=results.map((ok,i)=>`<span class="pill ${ok?'green':'red'}">${h(labels[i]||'Fuente '+(i+1))}: ${ok?'Funciona':'No disponible'}</span>`).join(' ') + '<p class="explain">Si todas fallan, revisa extensiones de bloqueo, tu red o utiliza la versión completa con iconos guardados durante el despliegue.</p>';
}

document.addEventListener('click',e=>{
 const royalGroup=e.target.closest('[data-auto-group]');if(royalGroup){qcChooseAutoGroup(royalGroup.dataset.autoGroup);return;}
 const group=e.target.closest('[data-branch-group]');if(group){changeBranchGroup(group.dataset.branchGroup);return;}
 const family=e.target.closest('[data-level-family]');if(family){levelPrefs.stem=family.dataset.levelFamily;state.levelPlan=null;saveLevel();levelFamilyChoices();const r=control('level-results');if(r)r.innerHTML=empty('Listo para calcular','Seleccionaste '+family.dataset.levelFamily+'. Configura tu spec y presupuesto.');return;}
 const choice=e.target.closest('[data-branch-choice]');if(choice){chooseBranch(choice.dataset.branchChoice);return;}
 const nav=e.target.closest('[data-nav]');if(nav){changePage(nav.dataset.nav);return;}
 const s=e.target.closest('[data-select-id]');if(s){state.id=s.dataset.selectId;state.query=itemName(state.id);const input=control('item-search');if(input)input.value=state.query;const list=control('search-results');if(list)list.style.display='none';runLookup();return;}
 const btn=e.target.closest('[data-action]');if(!btn)return;
 const action=btn.dataset.action;
 if(action==='royal-select-all'){document.querySelectorAll('#auto-form input[data-royal-sale-city]').forEach(x=>x.checked=true);saveRoyalSaleCities();return;}
 if(action==='results-source'){if(['crafting','autocraft'].includes(btn.dataset.source)){state.resultSource=btn.dataset.source;state.preflight=null;resultsPage();}return;}
 if(action==='results-edit'){changePage(state.resultSource==='autocraft'?'autocraft':'crafting');return;}
 if(action==='results-copy'){void resultsCopyShopping();return;}
 if(action==='results-copy-first'){void resultsCopyShopping(true);return;}
 if(action==='research-west-ai'){
  const current=currentPlan();
  const prompt=makeWestResearchBrief({market:current?.market||'black',branch:current?.branch||'',rows:current?.plan?.rows||current?.availableCandidates||[]});
  if(!navigator.clipboard?.writeText){showToast('Tu navegador no admite copiar automáticamente. Abre el plan con un navegador seguro.',true);return;}
  void navigator.clipboard.writeText(prompt).then(()=>showToast('Consulta West copiada. Pégala en una IA con búsqueda web activa: las fuentes externas todavía NO están conectadas automáticamente.')).catch(()=>showToast('No fue posible copiar la consulta.',true));return;
 }
 if(action==='save-investment')savePlanPortfolio();
 if(action==='run-auto')runAutoScan();
 if(action==='watch-route')appendPlanAlert(btn.dataset.index);
 if(action==='backup-data')exportBackup();
 if(action==='sync-generate'){const code=newSyncCode();const el=control('sync-secret');if(el){el.type='text';el.value=code;el.select();}showToast('Clave creada: cópiala y guárdala en un lugar seguro. No puede recuperarse.');}
 if(action==='sync-upload')cloudSync('upload');
 if(action==='sync-download')cloudSync('download');
 if(action==='export-ledger')exportLedger();
 if(action==='check-alerts')checkAlerts(true);
 if(action==='enable-notify'){if(typeof Notification==='undefined')showToast('Este navegador no admite notificaciones.',true);else Notification.requestPermission().then(p=>showToast(p==='granted'?'Notificaciones activadas.':'Permiso no concedido.'));}
 if(action==='start-portfolio'){try{const previous=loadPortfolios(),active=previous.find(x=>x.id===btn.dataset.pid);
 const inventory=consumeAllocations(loadInventory(),active?.inventoryAllocations||[]);
 const all=startPortfolio(previous,btn.dataset.pid,loadWallet());
 if(writeLocal(K_LEDGER,all)&&writeLocal(K_INVENTORY,inventory)){portfolioPage();showToast('Compra registrada, inventario consumido y caja actualizada.');}}catch(e){showToast(e.message,true);}}
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
 if(action==='expand-craft-search'){
  changePage('crafting');
  document.querySelectorAll('[data-qc-multi="craft-tier"], [data-qc-multi="craft-ench"]').forEach(el=>{el.checked=true;});
  const branch=val('craft-branch',craftPrefs.branch);
  craftItemPrefs[branch]={mode:'all',stems:[]};
  saveCraftItemChoice(branch,{mode:'all',stems:[]});
  document.querySelectorAll('#craft-item-options [data-pick-item]').forEach(el=>{el.checked=true;});
  const allToggle=document.querySelector('[data-qc-all="craft"]');if(allToggle)allToggle.checked=true;
  qcSync('craft');
  showToast('Búsqueda ampliada: todos los objetos de la rama, T4–T8 y .0–.4. Sin incluir rutas con pérdidas.');
  void runCraft(true);return;
 }
 if(action==='refresh-craft-now'){const source=state.page==='resultados'?(state.resultSource==='autocraft'?'autocraft':'crafting'):state.page;if(state.page==='resultados')changePage(source);if(source==='autocraft')runAutoScan(true);else runCraft(true);}
 if(action==='add-route')addPlanRoute(btn.dataset.routeKey);
 if(action==='clear-cache'){if(confirm('¿Eliminar los precios almacenados en este dispositivo?')){clearCache();showToast('Caché eliminada');settingsPage();}}
 if(action==='save-market-volume')saveExternalMarketVolume();
 if(action==='test-icons')runIconDiagnostics();
 if(action==='sync-catalog')syncCatalog(true);
 if(action==='refresh-game-recipes')syncGameRecipes();
 if(action==='advanced')syncAdvanced();
 if(action==='retry-catalog')syncCatalog(true);
});
document.addEventListener('input',e=>{
 if(e.target.id==='craft-branch-search'){const el=control('craft-branch-options');if(el)el.innerHTML=branchOptions(e.target.value);return;}
 if(e.target.id==='auto-branch-search'){renderAutoBranches();return;}
 if(e.target.id==='craft-item-search'){renderItemChoices('craft');return;}
 if(e.target.id==='auto-item-search'){renderItemChoices('auto');return;}
 if(e.target.id==='level-item-search'){levelFamilyChoices();return;}
 if(e.target.id==='item-search'){state.query=e.target.value;suggestItems(state.query);}
});
document.addEventListener('change',e=>{
 if(e.target.matches('[data-royal-sale-city]')){
  if(!selectedRoyalSaleCities().length){e.target.checked=true;showToast('Mantén al menos una ciudad de venta Royal seleccionada.',true);}
  saveRoyalSaleCities();return;
 }
 if(qcOnChange(e.target))return;
  if(e.target.matches('[data-qc-all]')){const prefix=e.target.dataset.qcAll;const el=control(prefix+'-item-options');if(el)el.querySelectorAll('input[data-pick-item]').forEach(x=>{x.checked=e.target.checked;});qcSaveObjectChecks(prefix);return;}
  if(e.target.name==='level-category'){levelPrefs.category=e.target.value;levelPrefs.stem='';state.levelPlan=null;saveLevel();void refreshLevelFamilies();return;}
 if(e.target.closest('#level-form')){Object.assign(levelPrefs,{spec:num('level-spec',0),exactRemaining:val('level-fame',''),budget:num('level-budget',20000000),market:val('level-market','mixed'),tierMin:num('level-tiermin',4),tierMax:num('level-tiermax',8),enchExact:val('level-ench','all'),city:val('level-city','auto'),goal:val('level-goal','balanced'),study:val('level-study','no'),studyFee:num('level-study-fee',0),focus:val('level-focus','no'),focusUnit:num('level-focus-unit',0),focusBudget:num('level-focus-budget',10000),capPct:num('level-cap',10),maxStages:num('level-stages',8),manualCraftFame:val('level-craft-fame','')});saveLevel();return;}
 if(e.target.matches('[data-plan-group]')){changePlanGroup(e.target.dataset.planGroup,Number(e.target.value));return;}
 if(e.target.matches('[data-plan-qty]')){changePlanQty(Number(e.target.dataset.planQty),Number(e.target.value));return;}
 if(e.target.id==='restore-data'){importBackup(e.target.files?.[0]);return;}
 if(e.target.name==='craft-scope'){
  const branch=val('craft-branch',craftPrefs.branch),old=craftItemChoice(branch);
  saveCraftItemChoice(branch,{...old,mode:e.target.value});renderItemChoices('craft');return;
 }
 if(e.target.name==='auto-scope'){
  autoPrefs.itemMode=e.target.value;saveAutoSelections();renderItemChoices('auto');return;
 }
 if(e.target.matches('[data-pick-item]')){qcSaveObjectChecks(e.target.dataset.pickItem);return;}
  if(e.target.matches('[data-auto-branch]')){
   if(!e.target.checked){e.target.checked=true;return;}
   qcChooseAutoBranch(e.target.value);return;
  }
 if(e.target.id==='auto-branch-mode'){
  autoPrefs.branchMode=e.target.value;saveAutoSelections();renderAutoBranches();renderItemChoices('auto');return;
 }
 if(e.target.name==='auto-category'){
  autoPrefs.categories=readAutoCategories();saveAutoSelections();void refreshAutoPickers();return;
 }
 if(e.target.name==='auto-refine-family'){
  autoPrefs.refineFamilies=[...document.querySelectorAll('input[name="auto-refine-family"]:checked')].map(x=>x.value);
  saveAutoSelections();return;
 }
 if(e.target.closest('#auto-form')){
  if(e.target.id==='auto-market')refreshAutoCategoryPanels();
  Object.assign(autoPrefs,{city:val('auto-city','auto'),tierMin:num('auto-tiermin',4),tierMax:num('auto-tiermax',8),ench:4,enchExact:val('auto-ench-exact','all'),refiningMode:'off',refiningFee:0,refineSale:val('auto-refine-sale','listed'),refineDaily:num('auto-refine-daily',0),refineStation:num('auto-refine-station',0),refineFreight:num('auto-refine-freight',0),refineDelivery:num('auto-refine-delivery',0)});
  saveAutoSelections();return;
 }
 if(e.target.closest('#craft-form')){
  craftRateHelp();try{saveCraftPrefs({...calcInputs(),focus:val('craft-focus','no'),unknown:num('craft-unknown',2)});}catch{}
  if(['craft-tiermin','craft-tiermax','craft-ench-exact'].includes(e.target.id))renderItemChoices('craft');return;
 }
 if(e.target.id==='settings-premium'){const tax=control('settings-tax');if(tax)tax.value=e.target.value==='premium'?4:8;}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='craft-branch-search'){e.preventDefault();const first=manualBranches(branchCategory,e.target.value)[0];if(first)chooseBranch(first.key);return;}if(e.key==='Enter'&&e.target.id==='item-search'){e.preventDefault();control('search-results').style.display='none';runLookup();}});
document.addEventListener('submit',e=>{e.preventDefault();const id=e.target.id;if(id==='trade-form')runTrade();if(id==='craft-form')runCraft();if(id==='auto-form')runAutoScan();if(id==='level-form')runLevelCraft();if(id==='refine-form')runRefine();if(id==='transmute-form')runTransmute();if(id==='enchant-form')runEnchant();if(id==='settings-form')applySettings();
 if(id==='sale-form')registerRealSale();
  if(id==='inventory-form')saveInventoryInput();
  if(id==='wallet-form'){try{const initial=Number(val('wallet-initial',''));if(!Number.isFinite(initial)||initial<0)throw Error('Capital inicial inválido');let wallet=loadWallet();wallet={...wallet,initial,adjustments:Array.isArray(wallet.adjustments)?wallet.adjustments:[]};const extra=num('wallet-adjust',0);if(extra)wallet=adjustWallet(wallet,extra,val('wallet-note','Ajuste manual'));if(writeLocal(K_WALLET,wallet)){portfolioPage();showToast('Saldo actualizado.');}}catch(err){showToast(err.message,true);}}
 if(id==='alert-form'){const index=num('alert-route',-1),route=currentPlan()?.plan.rows[index];if(!route){showToast('Genera un plan primero.',true);return;}const all=loadAlerts();all.push(addAlertFromRoute(route,{minRoi:num('alert-roi',10),minProfit:num('alert-profit',3000)}));if(writeLocal(K_ALERTS,all)){showToast('Alerta guardada.');alertsPage();}}
 if(id==='focus-form'){const id=val('focus-item').trim().toUpperCase();const focus=num('focus-cost',0),spec=num('focus-spec',0);if(!/^T[2-8]_[A-Z0-9_]+(?:@[1-4])?$/.test(id)||!(focus>0)||spec<0||spec>120){showToast('Introduce un ID válido, un costo positivo y spec de 0 a 120.',true);return;}const p=loadFocusProfile();p[id]={focus,spec};if(writeLocal(K_FOCUS,p)){if(state.page==='ajustes')settingsPage();else focusPage();showToast('Perfil de Focus actualizado.');}}
 });
$('#mobile-menu').addEventListener('click',()=>document.querySelector('.sidebar').classList.toggle('open'));
$('#server-select').value=prefs.region;
$('#server-select').disabled=true;$('#server-select').title='Solo América (West); Europa y Asia bloqueados para todos los planes';
render();syncCatalog();
if('serviceWorker'in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
window.setInterval(()=>{if(document.visibilityState==='visible'){currentAction(false);checkAlerts(false).catch(()=>{});}},HOUR);
window.addEventListener('focus',()=>{if(state.lastFetch&&Date.now()-state.lastFetch>HOUR)currentAction(false);});
