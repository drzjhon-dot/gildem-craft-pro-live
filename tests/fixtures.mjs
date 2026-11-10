// Solo datos sintéticos de prueba; no se muestran como mercado real al usuario.
export const itemSpecs=[
 ['T4_MAIN_SWORD','sword','Lymhurst'],['T5_MAIN_SWORD','sword','Lymhurst'],['T6_MAIN_SWORD','sword','Lymhurst'],['T7_MAIN_SWORD','sword','Lymhurst'],
 ['T4_2H_BOW','bow','Lymhurst'],['T5_2H_BOW','bow','Lymhurst'],['T6_2H_BOW','bow','Lymhurst'],['T7_2H_BOW','bow','Lymhurst'],
 ['T4_MAIN_AXE','axe','Martlock'],['T5_MAIN_AXE','axe','Martlock'],['T6_MAIN_AXE','axe','Martlock'],['T7_MAIN_AXE','axe','Martlock'],
 ['T4_2H_HOLYSTAFF','holystaff','Fort Sterling'],['T5_2H_HOLYSTAFF','holystaff','Fort Sterling'],['T6_2H_HOLYSTAFF','holystaff','Fort Sterling'],['T7_2H_HOLYSTAFF','holystaff','Fort Sterling'],
 ['T4_SHOES_PLATE_SET1','plate_shoes','Martlock'],['T5_SHOES_PLATE_SET1','plate_shoes','Martlock'],['T6_SHOES_PLATE_SET1','plate_shoes','Martlock'],['T7_SHOES_PLATE_SET1','plate_shoes','Martlock'],
 ['T4_ARMOR_CLOTH_SET1','cloth_armor','Fort Sterling'],['T5_ARMOR_CLOTH_SET1','cloth_armor','Fort Sterling'],['T6_ARMOR_CLOTH_SET1','cloth_armor','Fort Sterling'],['T7_ARMOR_CLOTH_SET1','cloth_armor','Fort Sterling'],
 ['T4_HEAD_LEATHER_SET1','leather_helmet','Lymhurst'],['T5_HEAD_LEATHER_SET1','leather_helmet','Lymhurst'],['T6_HEAD_LEATHER_SET1','leather_helmet','Lymhurst'],['T7_HEAD_LEATHER_SET1','leather_helmet','Lymhurst']
];
export function rawFixture(){return {items:{weapon:itemSpecs.filter(x=>/MAIN_|2H_/.test(x[0])).map(specItem),equipmentitem:itemSpecs.filter(x=>!(/MAIN_|2H_/.test(x[0]))).map(specItem),transformationweapon:[]}};}
function specItem([id,sub]){const tier=id.match(/T(\d)_/)[1];return {'@uniquename':id,'@shopsubcategory1':sub,craftingrequirements:{craftresource:[{'@uniquename':`T${tier}_METALBAR`,'@count':'16','@maxreturnamount':'16'},{'@uniquename':`T${tier}_PLANKS`,'@count':'8','@maxreturnamount':'8'}]},enchantments:{enchantment:[1,2].map(x=>({'@enchantmentlevel':String(x),craftingrequirements:{craftresource:[{'@uniquename':`T${tier}_METALBAR_LEVEL${x}`,'@enchantmentlevel':String(x),'@count':'16'},{'@uniquename':`T${tier}_PLANKS_LEVEL${x}`,'@enchantmentlevel':String(x),'@count':'8'}]}}))}};}
export function allFixtureRecipes(){const raw=rawFixture();const rec=[];for(const k of ['weapon','equipmentitem'])for(const x of raw.items[k]){rec.push(x['@uniquename']);for(const e of [1,2])rec.push(x['@uniquename']+'@'+e)}return rec;}
const ROYALS=['Bridgewatch','Fort Sterling','Lymhurst','Martlock','Thetford','Caerleon','Brecilien'];
export const MARKET_CITIES=[...ROYALS,'Black Market'];
export function fakePriceRows(ids,now=Date.now()){const at=new Date(now-2*3600_000).toISOString();return ids.flatMap(id=>MARKET_CITIES.map((city,i)=>({item_id:id,city,quality:1,sell_price_min:/(METALBAR|PLANKS)/.test(id)?120+i*3:14000+i*30,sell_price_min_date:at,buy_price_max:/(METALBAR|PLANKS)/.test(id)?110+i*3:11000+i*30,buy_price_max_date:at})));}
export function fakeHistoryRows(ids,now=Date.now(),qty=120){return ids.flatMap(id=>MARKET_CITIES.map(city=>({item_id:id,location:city,quality:1,data:Array.from({length:14},(_,i)=>({timestamp:new Date(now-(i+1)*86400000+1_000).toISOString(),item_count:qty,avg_price:13000}))})));}
export function fixtureFetch({now=Date.now(),invalid=false}={}){const recipes=allFixtureRecipes();return async url=>{
 const u=new URL(url,'http://localhost'),raw=u.pathname.includes('catalog');if(raw){const type=u.searchParams.get('type');return {ok:true,status:200,json:async()=>type==='recipes'?{...await (await import('../src/catalog.mjs')).extractCatalog(rawFixture())}:{names:{T4_2H_BOW:'Arco del adepto',T5_2H_BOW:'Arco del experto'}}};}
 const ids=(u.searchParams.get('items')||u.pathname.match(/\/([T\d_@,]+)\.json/)?.[1]||'').split(',').map(decodeURIComponent).filter(Boolean);
 const type=u.searchParams.get('kind')||(u.pathname.includes('/history/')?'history':'prices');
 const rows=type==='history'?fakeHistoryRows(ids,now):fakePriceRows(ids,now);
 return {ok:!invalid,status:invalid?503:200,json:async()=>rows,headers:{get:()=>null}};
};}
