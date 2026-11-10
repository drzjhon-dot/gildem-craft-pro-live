// Game-file crafting recipes from ao-data/ao-bin-dumps/items.json.
// Static metadata ONLY; never contains orders, transactions, prices or demand.
// Restrict to ordinary gear. Special items remain in core/special-recipes.js.
const asArray=value=>Array.isArray(value)?value:value?[value]:[];
const GEAR=/^T[1-8]_(?:HEAD_|ARMOR_|SHOES_|MAIN_|2H_|OFF_|BAG(?:_|$)|CAPE(?:_|$))/;
const EXCLUDE=/(?:_TOOL_|_SEED|_FARM|_JOURNAL|_SKIN|UNTRADEABLE)/;
const SUBCAT_TO_CITY=Object.freeze({
 sword:'Lymhurst',bow:'Lymhurst',arcanestaff:'Lymhurst',
 axe:'Martlock',quarterstaff:'Martlock',froststaff:'Martlock',
 mace:'Thetford',firestaff:'Thetford',naturestaff:'Thetford',
 hammer:'Fort Sterling',spear:'Fort Sterling',holystaff:'Fort Sterling',
 crossbow:'Bridgewatch',dagger:'Bridgewatch',cursestaff:'Bridgewatch',
 knuckles:'Caerleon',shapeshifterstaff:'Caerleon',
 cloth_armor:'Fort Sterling',plate_helmet:'Fort Sterling',
 leather_helmet:'Lymhurst',leather_shoes:'Lymhurst',
 plate_armor:'Bridgewatch',cloth_shoes:'Bridgewatch',
 leather_armor:'Thetford',cloth_helmet:'Thetford',
 plate_shoes:'Martlock'
});
const CATEGORY_TO_CITY=Object.freeze({offhands:'Martlock',bags:'Brecilien',capes:'Brecilien',gathering:'Caerleon'});
const idForResource=res=>{
 const id=res?.['@uniquename'],lvl=Number(res?.['@enchantmentlevel']||0);
 if(typeof id!=='string'||!/^[A-Z0-9_@-]{3,110}$/.test(id))return null;
 return lvl>0&&Number.isInteger(lvl)&&lvl<=4&&!id.includes('@')?`${id}@${lvl}`:id;
};
const materialsFrom=req=>{
 const materials=[];
 for(const res of asArray(req?.craftresource)){
  const id=idForResource(res),count=Number(res?.['@count']);
  if(!id||!Number.isFinite(count)||count<=0||!Number.isInteger(count)||count>100000)continue;
  const cap=res['@maxreturnamount']===undefined?null:Number(res['@maxreturnamount']);
  const m={id,count,ret:!(cap===0)};
  if(cap!==null&&Number.isFinite(cap)&&cap>=0)m.maxReturn=cap;
  materials.push(m);
 }
 return materials;
};
const cityFor=item=>CATEGORY_TO_CITY[item?.['@shopcategory']]||SUBCAT_TO_CITY[item?.['@shopsubcategory1']]||null;
const reqFor=(id,city,request)=>{
 const req=asArray(request).find(x=>materialsFrom(x).length>0);
 if(!req)return null;
 const materials=materialsFrom(req);
 const output=Number(req['@amountcrafted']||1);
 // Output batch size is present in game data for potion-type objects. Keep
 // gear defaults at one only when the dump does not declare a batch size.
 if(!Number.isInteger(output)||output<1||output>10000)return null;
 return {id,materials,city,amountCrafted:output,recipeSource:'ao-bin-dumps-gear',recipeKind:'gear'};
};
export function extractGearRecipes(dump){
 if(!dump?.items||typeof dump.items!=='object')throw Error('Dump RAW inválido: se esperaba la propiedad items');
 const recipes={},retiredIds=new Set(),unknownCityIds=new Set();let recognized=0;
 for(const category of ['equipmentitem','weapon','transformationweapon'])for(const item of asArray(dump.items[category])){
  const id=item?.['@uniquename'];
  if(typeof id!=='string'||!GEAR.test(id)||EXCLUDE.test(id))continue;
  recognized++;
  if(item['@showinmarketplace']==='false'){
   retiredIds.add(id);
   for(const lvl of asArray(item?.enchantments?.enchantment))if(Number(lvl?.['@enchantmentlevel'])>0)retiredIds.add(`${id}@${lvl['@enchantmentlevel']}`);
   continue;
  }
  const city=cityFor(item);
  if(!city){unknownCityIds.add(id);continue;} // Do not invent a specialty city.
  const base=reqFor(id,city,item.craftingrequirements);
  if(base)recipes[id]=base;
  for(const e of asArray(item.enchantments?.enchantment)){
   const lvl=Number(e?.['@enchantmentlevel']);
   if(!Number.isInteger(lvl)||lvl<1||lvl>4)continue;
   const crafted=reqFor(`${id}@${lvl}`,city,e.craftingrequirements);
   if(crafted)recipes[crafted.id]=crafted;
  }
 }
 return {recipes,retiredIds:[...retiredIds],unknownCityIds:[...unknownCityIds],recognized};
}
export function overlayGearRecipes(legacy,dump){
 const extracted=extractGearRecipes(dump);
 const result={...(legacy||{})};
 for(const id of extracted.retiredIds)delete result[id];
 for(const [id,record] of Object.entries(extracted.recipes)){
  // Keep the catalog shape used by the existing planner; provenance is
  // explicit to allow comparing source versions after a patch.
  result[id]={...record,materials:record.materials.map(m=>({...m}))};
 }
 return {recipes:result,statistics:{direct:Object.keys(extracted.recipes).length,retired:extracted.retiredIds.length,
  legacyFallback:Object.keys(result).length-Object.keys(extracted.recipes).length,
  unknownCity:extracted.unknownCityIds.length,recognized:extracted.recognized}};
}
