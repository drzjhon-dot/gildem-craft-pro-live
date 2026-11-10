import {CITIES,CATEGORY_META,CATEGORY_GROUPS,itemIcon,tierLabel,enchOf,safe,money,fmt,iso,categoryMeta} from './util.mjs';
import {itemName} from './catalog.mjs';
import {planSummary} from './engine.mjs';
export const tabNames={black:'Black Craft',royal:'Royal Craft',settings:'Datos y ajustes'};
const icon=(id,size=44)=>`<img src="${itemIcon(id,size)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='./assets/crest.svg'">`;
export const itemCell=(id,names={})=>`<div class="item">${icon(id)}<div><b>${safe(itemName(id,names))}</b><small>${safe(id)}</small></div></div>`;
const tier=id=>`<span class="tier e${enchOf(id)}">${tierLabel(id)}</span>`;
export const metric=(label,value,sub='',klass='')=>`<div class="metric ${klass}"><small>${safe(label)}</small><strong>${safe(value)}</strong><span>${safe(sub)}</span></div>`;
export function hero(title,sub,id='T5_2H_BOW',kicker='GILDEM CRAFT PRO · V9.0'){return `<section class="hero"><div><div class="kicker">${safe(kicker)}</div><h1>${safe(title)}</h1><p>${safe(sub)}</p></div><img class="hero-art" src="${itemIcon(id,200)}" alt="Arte de objeto de Albion" onerror="this.onerror=null;this.src='./assets/crest.svg'"/></section>`;}
const input=(label,key,value,type='number',extra='')=>`<div class="field"><label for="${key}">${safe(label)}</label><input type="${type}" id="${key}" name="${key}" value="${safe(value)}" ${extra}></div>`;
const select=(label,key,options,value)=>`<div class="field"><label for="${key}">${safe(label)}</label><select id="${key}" name="${key}">${options.map(([v,n])=>`<option value="${safe(v)}" ${String(v)===String(value)?'selected':''}>${safe(n)}</option>`).join('')}</select></div>`;

function branchPicker(selected='Todas'){
 const groups=CATEGORY_GROUPS.map(group=>{
  const cards=group.keys.map(key=>{
   const meta=categoryMeta(key),active=selected===key;
   return `<button type="button" class="branch-card ${active?'active':''}" data-category-select="${safe(key)}" aria-pressed="${active?'true':'false'}">${icon(meta.icon,52)}<span><b>${safe(meta.label)}</b><small>${safe(meta.note)}</small></span></button>`;
  }).join('');
  return `<div class="branch-group"><div class="branch-title">${safe(group.title)}</div><div class="branch-grid">${cards}</div></div>`;
 }).join('');
 const allMeta=categoryMeta('Todas');
 return `<div class="field full"><label>Rama</label><input type="hidden" id="category" name="category" value="${safe(selected)}"><button type="button" class="branch-card all-branch ${selected==='Todas'?'active':''}" data-category-select="Todas" aria-pressed="${selected==='Todas'?'true':'false'}">${icon(allMeta.icon,52)}<span><b>Todas</b><small>Explorar todas las ramas válidas</small></span></button>${groups}</div>`;
}

function journalTable(plan){
 const rows=(plan.journals||[]).map(j=>`<tr><td><div class="journal-cell"><span class="journal-badge">📘</span><div><b>${safe(j.name)}</b><small>${safe(j.rows)} rutas aportan este diario</small></div></div></td><td>${safe('T'+j.tier)}</td><td class="numeric">${fmt(j.qty)}</td><td>Estimado por lote de fabricación</td></tr>`).join('');
 return `<div class="panel"><div class="pane-head"><h2 class="pane-title">Diarios sugeridos</h2><span class="pill gray">${plan.journals?.length||0} tipos</span></div>${plan.journals?.length?`<div class="table-scroll"><table id="journal-table"><thead><tr><th>Diario</th><th>Tier</th><th>Cantidad</th><th>Nota</th></tr></thead><tbody>${rows}</tbody></table></div><p class="footnote">Estimación conservadora: 1 diario por fabricación. Confirma el diario exacto dentro del juego antes de comprar.</p>`:`<p class="footnote">Sin diarios sugeridos: no hay rutas seleccionadas.</p>`}</div>`;
}

export function plannerPage(market,state){
 const isBlack=market==='black',v=state.filters[market],g=state.settings,r=state.lastPlans[market],count=state.catalog?.recipes.length||0;
 return `${hero(isBlack?'Black Craft':'Royal Craft',isBlack?'Fabricación para Caerleon. Priorizamos rotación observada, mínimo dos fabricaciones por artículo y exposición prudente para no saturar el Mercado Negro.':'Compara las ciudades Royal y distribuye la producción sin sobrecargar un mercado. Se prioriza movimiento real y diversificación.',isBlack?'T6_2H_BOW':'T6_ARMOR_CLOTH_SET1',isBlack?'MERCADO NEGRO · AMÉRICA WEST':'ROYAL · AMÉRICA WEST')}
<div class="stats">${metric('Recetas verificadas',fmt(count),'ao-bin-dumps','accent')}${metric('Servidor','AMÉRICA','AODP West')}${metric('Fabricación mínima',`${g.minimumCrafts} lotes`,'Por producto')}${metric('Movimiento mínimo',fmt(g.minimumWeekly)+'/sem','Observado en AODP')}</div>
<div class="board"><section class="panel"><h2>Configurar el taller</h2><p class="hint">Elige la rama visualmente. El motor descarta artículos de 1 sola fabricación y no fuerza a gastar todo el presupuesto si el mercado no lo justifica.</p><form id="plan-form" data-market="${market}" class="form-grid">
${branchPicker(v.category)}
${input('Presupuesto (silver)','budget',v.budget)}
${select('Tier mínimo','minTier',[4,5,6,7,8].map(x=>[x,'T'+x]),v.minTier)}
${select('Tier máximo','maxTier',[4,5,6,7,8].map(x=>[x,'T'+x]),v.maxTier)}
${select('Encantamiento máximo','maxEnchant',[0,1,2,3,4].map(x=>[x,'.'+x]),v.maxEnchant)}
${input('Buscar objeto (opcional)','search',v.search,'text','placeholder="Arco, espada, T5_…"')}
<div class="field full"><label><input type="checkbox" name="focus" id="focus" ${v.focus?'checked':''}> Simular con Focus (${(g.rrrFocus*100).toFixed(2)}% RRR)</label><small class="subtle">Solo retorno de materiales. Consumo de puntos Focus sin verificar.</small></div>
<div class="field full"><label>Ciudad de fabricación</label><div class="source-box">La ciudad sugerida sale de la familia de fabricación según el catálogo oficial. Confirma los bonos reales dentro del juego antes de ejecutar el plan.</div></div>
${!isBlack?`<div class="field full"><label>Ciudades de venta</label><div class="chipset">${CITIES.map(city=>`<label><input type="checkbox" data-royal-city="${safe(city)}" ${v.saleCities.includes(city)?'checked':''}>${safe(city)}</label>`).join('')}</div></div>`:''}
<div class="field full"><div class="buttons"><button class="btn gold block" type="submit" id="scan-button">⚒ Generar plan por movimiento</button></div></div></form><p class="footnote">La actividad histórica se refiere a órdenes observadas, no a ventas garantizadas. Si faltan precios o materiales, no se inventan costos ni unidades.</p></section>
<section class="report" id="plan-outlet">${r?planPage(r,state.catalog?.names||{},state):emptyPlan()}</section></div>`;
}

export function emptyPlan(message='El plan aparecerá aquí',sub='Elige una rama, presupuesto y tiers para analizar el mercado West.'){return `<section class="empty">${icon('T5_METALBAR',96)}<h2 class="empty-title">${safe(message)}</h2><p>${safe(sub)}</p></section>`;}

export function planPage(p,names={},state={}){const s=planSummary(p),conf=p.rows.filter(r=>r.saleKind!=='histórico'&&r.saleKind!=='sin-cotización').length;
 const cards=`<div class="stats summary-wrap">${metric('Capital objetivo',money(s.capital),'Costos brutos de compra','accent')}${metric('Unidades a vender',fmt(s.units),'Sin rutas de 1 fabricación')}${metric('Movimiento semanal',fmt(Math.round(s.weekly)),'Actividad observada')}${metric('Resultado estimado',s.profit===null?'No verificable':(s.profit>=0?'+':'')+money(s.profit),conf+'/'+p.rows.length+' con precio reciente',s.profit!==null&&s.profit>=0?'green':'red')}</div>`;
 if(!p.rows.length)return `${cards}${emptyPlan('Sin lotes verificables de 2 o más','No hay combinaciones con suficiente actividad, capital y precios de materiales para los filtros. Amplía tiers, cambia rama o actualiza los datos. No se inventan ventas ni costos.')}`;
 const craft=p.rows.map(r=>`<tr><td>${itemCell(r.id,names)}</td><td>${tier(r.id)}</td><td class="numeric">${fmt(r.qty)}</td><td>${fmt(r.units)}</td><td>${safe(r.craftCity)}</td><td>${safe(r.city==='Black Market'?'Caerleon · BM':r.city)}</td><td class="numeric">${fmt(Math.round(r.weekly))}</td><td>${r.salePrice===null?'Sin precio':money(r.salePrice)}</td><td class="${r.profit===null?'':r.profit>=0?'good':'bad'} numeric">${r.profit===null?'No verificable':money(r.profit)}</td></tr>`).join('');
 const buys=p.shopping.map(m=>`<tr><td>${itemCell(m.id,names)}</td><td>${tier(m.id)}</td><td class="numeric">${fmt(m.qty)}</td><td>${safe(m.city)}</td><td class="numeric">${money(m.price)}</td><td class="numeric">${money(m.price*m.qty)}</td></tr>`).join('');
 return `${cards}<div class="panel"><div class="pane-head"><h2 class="pane-title">Lista de fabricación</h2><span class="pill">${p.rows.length} objetos · Tier ascendente</span></div><div class="table-scroll"><table id="craft-table"><thead><tr><th>Objeto</th><th>Tier</th><th>Fabricar</th><th>Unidades</th><th>Ciudad craft</th><th>Vender en</th><th>Actividad semanal</th><th>Precio/u</th><th>Resultado</th></tr></thead><tbody>${craft}</tbody></table></div><p class="footnote">El presupuesto sobrante se deja libre si no hay suficientes rutas prudentes. La herramienta no añade objetos solo para agotar la inversión.</p></div>
 <div class="panel"><div class="pane-head"><h2 class="pane-title">Lista de compras</h2><span class="pill gray">${p.shopping.length} insumos · Sin unidades descartadas</span></div><div class="table-scroll"><table id="buy-table"><thead><tr><th>Material</th><th>Tier</th><th>Comprar bruto</th><th>Ciudad</th><th>Precio/u</th><th>Total</th></tr></thead><tbody>${buys}</tbody></table></div><p class="footnote">Las compras son BRUTAS; el retorno de recursos llega después de fabricar. No se garantiza profundidad del libro de órdenes ni esos precios para lotes grandes. Compra por tramos.</p></div>
 ${journalTable(p)}
 <div class="panel"><div class="pane-head"><h2 class="pane-title">Logística y seguridad</h2><span class="pill gray">${conf}/${p.rows.length} precios cotizados</span></div><div class="source-box">${p.rows.slice(0,5).map(r=>`<div>${tier(r.id)} ${safe(r.id)} · ${safe(r.craftCity)} → ${safe(r.city)} · ${safe(r.saleKind)}${r.saleDate?' · '+safe(iso(r.saleDate)):' · fecha no confirmada'}${r.profit!==null&&r.profit<0?' · PÉRDIDA PREVISTA':''}</div>`).join('')}${p.rows.length>5?`<small>+ ${p.rows.length-5} rutas adicionales en la lista de fabricación</small>`:''}</div><p class="footnote">AODP registra actividad de órdenes, no transacciones garantizadas. La liquidez de compra puede agotarse; revisa órdenes por niveles y comisiones antes de invertir. Los diarios mostrados son sugeridos y deben confirmarse en el juego.</p><div class="buttons"><button class="btn gold" id="export-plan" type="button">Exportar plan CSV</button><button class="btn" id="export-buys" type="button">Lista de compras CSV</button><button class="btn minor" id="copy-buys" type="button">Copiar materiales</button></div></div>`;}

export function settingsPage(state){const g=state.settings;return `${hero('Datos y ajustes','Configura límites conservadores. No utilizamos cotizaciones ausentes como precios actuales.','T6_PLANKS','CONTROL DE DATOS · AMÉRICA WEST')}
 <div class="two-col" style="margin-top:17px"><section class="panel"><h2>Configuración del motor</h2><p class="hint">Estos parámetros se aplican a Black Craft y Royal Craft.</p><form id="settings-form" class="form-grid">
${input('Mínimo movimiento semanal','minimumWeekly',g.minimumWeekly)}
${input('Mínimo fabricaciones','minimumCrafts',g.minimumCrafts,'number','min="2"')}
${input('Participación prudente (%)','share',Math.round(g.share*100),'number','min="1" max="50"')}
${input('Exposición máxima por objeto (%)','perItemBudget',Math.round(g.perItemBudget*100),'number','min="2" max="50"')}
${input('Retorno sin Focus (%)','rrr',(g.rrr*100).toFixed(2),'number','step="0.01" min="0" max="65"')}
${input('Retorno con Focus (%)','rrrFocus',(g.rrrFocus*100).toFixed(2),'number','step="0.01" min="0" max="65"')}
${input('Antigüedad máxima precios (horas)','maxAge',g.maxAge)}
${input('Taller por fabricación (silver)','station',g.station)}
${input('Transporte por fabricación (silver)','transport',g.transport)}
${input('Impuesto BM (%)','bmTax',(g.bmTax*100).toFixed(2),'number','step="0.01"')}
${input('Impuesto Royal (%)','royalTax',(g.royalTax*100).toFixed(2),'number','step="0.01"')}
${input('Tarifa publicación (%)','listingFee',(g.listingFee*100).toFixed(2),'number','step="0.01"')}
${input('Máximo objetos por plan','maxItems',g.maxItems)}
<div class="field full"><button class="btn gold block" type="submit">Guardar ajustes</button></div></form></section>
<section class="panel"><h2>Fuentes y calidad</h2><div class="source-box"><strong>Servidor: América (West)</strong><div>Recetas: ${safe(state.catalog?.meta?.source||'Aún no cargadas')}</div><div>Recetas: ${fmt(state.catalog?.recipes?.length||0)}</div><div>Nombres ES: ${fmt(Object.keys(state.catalog?.names||{}).length)}</div><div>Revisión: ${safe(iso(state.catalog?.meta?.fetchedAt))}</div></div><p class="hint">Para obtener recetas usamos <a href="https://github.com/ao-data/ao-bin-dumps" target="_blank" rel="noopener">ao-bin-dumps</a>. Las cotizaciones e historial proceden de <a href="https://west.albion-online-data.com/api-docs" target="_blank" rel="noopener">AODP West</a>.</p><div class="alert">La actividad histórica no garantiza compradores, las ofertas pueden ser antiguas y los precios pueden cambiar durante grandes compras. El dato faltante nunca se interpreta como cero.</div><div class="buttons"><button class="btn minor" id="reload-catalog">↻ Reintentar catálogo</button></div><h2 style="margin-top:23px">Limitaciones explícitas</h2><p class="hint">La herramienta no puede verificar automáticamente tu Focus, especialización, tasas de talleres ni profundidad completa de ofertas. Introduce retornos y tarifas reales. Los diarios se muestran como sugerencia por lote y disciplina dominante de materiales; confírmalos dentro del juego antes de comprarlos.</p></section></div>`;}
export function errorBox(message){return `<div class="alert error">${safe(message)}</div>`;}
export function analyzerPage(){return ''}
export function savedPage(){return ''}
