// GILDEM CRAFT PRO v9.0 · Interfaz de tablas sin cambiar el motor de crafting.
// La fuente sigue siendo app.js; estos cambios son solo presentación.
// Mueve controles existentes (no los clona), para que sus eventos conserven
// el ID de ruta y los inputs sigan editando el objeto correcto.
import {compareTier,tierLabel,tierFrom,orderedByTier} from './tier-sort.js';

const d=globalThis.document;
const main=d?.getElementById('main-content');
const element=(tag,css='',text)=>{const el=d.createElement(tag);if(css)el.className=css;if(text!==undefined)el.textContent=String(text);return el;};
function tierOf(node){
 if(!node)return 'T99.99';
 const badge=node.querySelector('.gcp-tier');
 if(badge&&tierFrom(badge.textContent).tier<99)return badge.textContent;
 // Los íconos del render oficial incluyen el ID real, incluso si el nombre
 // visible está traducido. El tier de la materia prima no se adivina.
 const src=node.querySelector('.item-cell img')?.getAttribute('src')||'';
 const id=(decodeURIComponent(src).match(/T[1-8]_[A-Z0-9_]+(?:@[0-4])?/i)||[])[0]||'';
 if(tierFrom(id).tier<99)return id;
 const text=node.querySelector('td:nth-child(2)')?.textContent||node.textContent;
 return tierFrom(text).tier<99?text:'T99.99';
}
function sortNodes(nodes){return orderedByTier(nodes,tierOf);}
function cell(row,content,css=''){
 const td=element('td',css);
 if(content?.nodeType)td.appendChild(content);
 else if(content!==null&&content!==undefined)td.textContent=String(content);
 row.appendChild(td);
 return td;
}
function compactBadge(node){
 const badge=node?.querySelector('.gcp-tier');
 const text=badge?.textContent?.trim()||tierLabel(tierOf(node));
 if(badge)badge.remove();
 return element('span','gcp-v9-tier',text);
}
function details(text){
 if(!text)return element('span','gcp-v9-muted','Sin observaciones adicionales');
 const box=element('details','gcp-v9-details');
 box.appendChild(element('summary','','Ver detalles'));
 box.appendChild(element('p','',text));
 return box;
}
function tableFromCards(grid,selector,headers,rowBuilder,tableType){
 if(!grid||grid.classList.contains('gcp-v9-host'))return false;
 const nodes=[...grid.children].filter(n=>n.matches?.(selector));
 if(!nodes.length)return false;
 const scroll=element('div','gcp-v9-scroll');
 const table=element('table',`gcp-v9-table gcp-v9-${tableType}`);
 table.setAttribute('aria-label',tableType==='craft'?'Lista de fabricación ordenada por tier':tableType==='buy'?'Lista de compras ordenada por tier':'Rutas del plan ordenadas por tier');
 const thead=element('thead'),head=element('tr');
 for(const h of headers)head.appendChild(element('th','',h));
 thead.appendChild(head);
 const tbody=element('tbody');
 for(const node of sortNodes(nodes)){
  const tr=element('tr');
  rowBuilder(tr,node);
  tbody.appendChild(tr);
 }
 table.append(thead,tbody);scroll.appendChild(table);
 grid.replaceChildren(scroll);
 grid.classList.add('gcp-v9-host');
 return true;
}
function conditionalCraft(tr,card){
 const product=card.querySelector('.gcp-conditional-product');
 const tier=compactBadge(product||card);
 const fields=[...card.querySelectorAll('.gcp-conditional-data > span')];
 const text=i=>fields[i]?.textContent?.trim()||'Sin dato';
 const first=cell(tr,product,'gcp-v9-item');
 if(!product)first.textContent='Objeto sin identificar';
 cell(tr,tier);
 cell(tr,text(0),'gcp-v9-amount');
 cell(tr,text(1));
 cell(tr,text(2),'gcp-v9-number');
 cell(tr,text(3),'gcp-v9-number');
 const route=card.querySelector('.gcp-conditional-route')?.textContent?.trim()||'';
 const warnings=card.querySelector('.gcp-conditional-blocker')?.textContent?.trim()||'';
 const note=details([route,`Precio observado: ${text(4)}`,`Equilibrio: ${text(5)}`,warnings].filter(Boolean).join(' · '));
 cell(tr,note);
}
function conditionalBuy(tr,card){
 const name=card.querySelector('.item-cell');
 cell(tr,name,'gcp-v9-item');
 cell(tr,element('span','gcp-v9-tier',tierLabel(tierOf(card))));
 const total=[...card.children].find(x=>x.tagName==='SPAN'&&!x.classList.contains('item-cell'));
 cell(tr,total||'—','gcp-v9-number');
 cell(tr,card.querySelector('small')||'Sin referencia');
}
function resultCraft(tr,card){
 const item=card.querySelector('.gcp-compact-item');
 const tier=compactBadge(item||card);
 const qty=card.querySelector('.gcp-compact-quantity');
 const meta=card.querySelector('.gcp-compact-meta');
 const values=card.querySelector('.gcp-compact-values');
 cell(tr,item,'gcp-v9-item');
 cell(tr,tier);
 cell(tr,qty,'gcp-v9-input');
 cell(tr,meta,'gcp-v9-meta');
 cell(tr,values,'gcp-v9-values');
}
function resultBuy(tr,card){
 const item=card.querySelector('.gcp-shopping-item');
 const badge=element('span','gcp-v9-tier',tierLabel(tierOf(card)));
 const detail=card.querySelector('.gcp-shopping-detail');
 cell(tr,item,'gcp-v9-item');
 cell(tr,badge);
 cell(tr,detail,'gcp-v9-values');
}
function logistics(tr,card){
 const item=card.querySelector('.gcp-logistics-title');
 const tier=compactBadge(item||card);
 cell(tr,item,'gcp-v9-item');
 cell(tr,tier);
 cell(tr,card.querySelector('.gcp-logistics-route'));
 cell(tr,card.querySelector('.gcp-logistics-footer'),'gcp-v9-values');
}
function renderDemand(){
 const wrap=main.querySelector('.gcp-conditional-wrap');
 if(!wrap)return;
 const craft=wrap.querySelector('.gcp-conditional-grid:not(.gcp-v9-host)');
 const buy=wrap.querySelector('.gcp-conditional-materials:not(.gcp-v9-host)');
 if(craft)tableFromCards(craft,'.gcp-conditional-card',
  ['Objeto','Tier','Fabricar','Actividad semanal','Capital','Resultado neto','Precio, ruta y avisos'],conditionalCraft,'craft');
 if(buy)tableFromCards(buy,'.gcp-conditional-material',
  ['Material','Tier','Comprar (bruto)','Ciudad y referencia'],conditionalBuy,'buy');
 const craftTable=wrap.querySelector('.gcp-conditional-grid.gcp-v9-host');
 const buyTable=wrap.querySelector('.gcp-conditional-materials.gcp-v9-host');
 if(craftTable&&buyTable&&!wrap.querySelector('.gcp-v9-demand-pair')){
  const pair=element('div','gcp-v9-demand-pair');
  const left=element('section','gcp-v9-demand-panel');
  const right=element('section','gcp-v9-demand-panel');
  const craftTitle=craftTable.previousElementSibling;
  const buyTitle=buyTable.previousElementSibling;
  const buyingCaption=buyTitle?.previousElementSibling;
  if(craftTitle?.tagName==='H3')left.appendChild(craftTitle);
  else left.appendChild(element('h3','','Lista de fabricación'));
  if(buyTitle?.tagName==='P'&&buyingCaption?.tagName==='H3'){
   right.appendChild(buyingCaption);right.appendChild(buyTitle);
  }else if(buyTitle?.tagName==='H3')right.appendChild(buyTitle);
  else right.appendChild(element('h3','','Lista de compras'));
  craftTable.before(pair);
  left.appendChild(craftTable);right.appendChild(buyTable);
  pair.append(left,right);
 }
}
function renderClassic(){
 const root=main.querySelector('.gcp-results');
 if(!root)return;
 for(const selector of ['.gcp-production-grid','.gcp-shopping-grid','.gcp-logistics-grid','.gcp-first-stage-grid','.gcp-depth-grid']){
  const grid=root.querySelector(selector+':not(.gcp-v9-host)');
  if(!grid)continue;
  if(selector.includes('production'))tableFromCards(grid,'.gcp-production-card',
   ['Objeto','Tier','Fabricar','Fabricación y rotación','Capital / Profit'],resultCraft,'craft');
  else if(selector.includes('logistics'))tableFromCards(grid,'.gcp-logistics-card',
   ['Objeto','Tier','Fabricar y vender','Cantidad y profit'],logistics,'logistics');
  else tableFromCards(grid,'.gcp-shopping-card',
   ['Material / Diario','Tier','Cantidad, ciudad y precio'],resultBuy,'buy');
 }
}
function sortOtherTierTables(){
 // Las tablas clásicas (craftResult) ya tienen columna Tier. Nunca tocar
 // tablas de mercados, gastos o histórico que no representan objetos por tier.
 for(const table of main.querySelectorAll('table:not(.gcp-v9-table)')){
  const heads=[...table.querySelectorAll('thead th')].map(x=>x.textContent.trim().toLowerCase());
  const ix=heads.findIndex(x=>x==='tier' || x==='nivel');
  if(ix<0)continue;
  const tbody=table.tBodies?.[0];if(!tbody||tbody.rows.length<2)continue;
  const original=[...tbody.rows];
  const sorted=orderedByTier(original,row=>row.cells[ix]?.textContent||tierOf(row));
  if(sorted.every((row,i)=>row===original[i]))continue;
  for(const tr of sorted)tbody.appendChild(tr);
 }
}
function run(){
 if(!main)return;
 renderDemand();renderClassic();sortOtherTierTables();
}
if(main){
 let scheduled=false;
 const schedule=()=>{
  if(scheduled)return;
  scheduled=true;
  queueMicrotask(()=>{scheduled=false;try{run();}catch(error){console.warn('[Gildem v9] No se pudo reorganizar una tabla:',error);}});
 };
 new MutationObserver(schedule).observe(main,{childList:true,subtree:true});
 schedule();
}
