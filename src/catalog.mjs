// Recetas oficiales desde ao-data/ao-bin-dumps: items.json RAW.
// No contiene precios ni ventas. Sin receta verificable, no se fabrica.
import {familyOf,tierOf,enchOf,cmpTier} from './util.mjs';
const arr=x=>Array.isArray(x)?x:x?[x]:[];
const EQUIPMENT=/^T[1-8]_(?:HEAD_|ARMOR_|SHOES_|MAIN_|2H_|OFF_|BAG(?:_|$)|CAPE(?:_|$))/;
const EXCLUDE=/(?:_TOOL_|_SEED|_FARM|_JOURNAL|_SKIN|UNTRADEABLE)/;
const isSpecial=id=>/^T[1-8]_(?:POTION_|MEAL_|MOUNT_|BACKPACK_GATHERER_|2H_TOOL_(?:AXE|PICK|SICKLE|KNIFE|HAMMER|FISHINGROD))/.test(id)||/^T[1-8]_(?:HEAD|ARMOR|SHOES)_GATHERER_/.test(id);
function specialCategory(id){if(/_POTION_/.test(id))return 'Pociones';if(/_MEAL_/.test(id))return 'Comidas';if(/_MOUNT_/.test(id))return 'Monturas';return 'Recolección';}
function specialCity(category){return category==='Pociones'?'Brecilien':category==='Comidas'?'Caerleon':'Caerleon';}
const SUBCAT={sword:'Lymhurst',bow:'Lymhurst',arcanestaff:'Lymhurst',axe:'Martlock',quarterstaff:'Martlock',froststaff:'Martlock',mace:'Thetford',firestaff:'Thetford',naturestaff:'Thetford',hammer:'Fort Sterling',spear:'Fort Sterling',holystaff:'Fort Sterling',crossbow:'Bridgewatch',dagger:'Bridgewatch',cursestaff:'Bridgewatch',knuckles:'Caerleon',shapeshifterstaff:'Caerleon',cloth_armor:'Fort Sterling',plate_helmet:'Fort Sterling',leather_helmet:'Lymhurst',leather_shoes:'Lymhurst',plate_armor:'Bridgewatch',cloth_shoes:'Bridgewatch',leather_armor:'Thetford',cloth_helmet:'Thetford',plate_shoes:'Martlock'};
const SHOPCITY={offhands:'Martlock',bags:'Brecilien',capes:'Brecilien',gathering:'Caerleon'};
export function materialId(m){const id=m?.['@uniquename'],e=Number(m?.['@enchantmentlevel']||0);if(typeof id!=='string'||!/^T[1-8]_[A-Z0-9_@-]+$/.test(id))return null;return Number.isInteger(e)&&e>=1&&e<=4&&!id.includes('@')?`${id}@${e}`:id;}
export function extractMaterials(req){return arr(req?.craftresource).flatMap(m=>{const id=materialId(m),count=Number(m?.['@count']);if(!id||!Number.isSafeInteger(count)||count<=0||count>100000)return [];const max=m?.['@maxreturnamount']===undefined?null:Number(m['@maxreturnamount']);return [{id,count,returned:max!==0}];});}
function recipeFrom(id,item,req,special=false){const material=extractMaterials(req),count=Number(req?.['@amountcrafted']||1);if(!material.length||!Number.isSafeInteger(count)||count<1||count>1000)return null;const category=special?specialCategory(id):familyOf(id,{sub:item?.['@shopsubcategory1']});
 const city=special?specialCity(category):SHOPCITY[item['@shopcategory']]||SUBCAT[item['@shopsubcategory1']]||null;return {id,materials:material,output:count,city,category,source:'ao-bin-dumps',market:special?'royal':'both',specialtyEnabled:category!=='Monturas'};}
export function extractCatalog(raw,{minTier=4,maxTier=8}={}){
 if(!raw?.items||typeof raw.items!=='object')throw Error('Archivo ao-bin-dumps incompatible: falta items');
 const recipes=[],seen=new Set();let retired=0,unknownCity=0;
 for(const bucket of ['equipmentitem','weapon','transformationweapon','consumableitem','mount'])for(const item of arr(raw.items[bucket])){
  const uid=item?.['@uniquename'];if(typeof uid!=='string'||tierOf(uid)<minTier||tierOf(uid)>maxTier)continue;
  const special=isSpecial(uid),gear=EQUIPMENT.test(uid)&&!EXCLUDE.test(uid);
  if(!gear&&!special)continue;
  if(/_MOUNT_/.test(uid)&&/_SKIN|_UNIQUE/.test(uid))continue;
  if(item['@showinmarketplace']==='false'){retired++;continue;}
  const base=arr(item.craftingrequirements).map(req=>recipeFrom(uid,item,req,special)).find(Boolean);
  if(base){if(!base.city)unknownCity++;if(!seen.has(uid)){recipes.push(base);seen.add(uid);}}
  for(const variant of arr(item?.enchantments?.enchantment)){
   const e=Number(variant?.['@enchantmentlevel']);if(!Number.isInteger(e)||e<1||e>4)continue;
   const id=`${uid}@${e}`,rec=arr(variant.craftingrequirements).map(req=>recipeFrom(id,item,req,special)).find(Boolean);
   if(rec&&!seen.has(id)){recipes.push(rec);seen.add(id);}
  }
 }
 recipes.sort((a,b)=>cmpTier(a.id,b.id));
 return {recipes,meta:{source:'ao-data/ao-bin-dumps/items.json',fetchedAt:new Date().toISOString(),count:recipes.length,retired,unknownCity}};
}
// Fuente compacta derivada: se usa solo si falla el RAW, siempre con procedencia visible.
export function normalizeLegacyRecipes(raw,names={}){
 if(!raw||Array.isArray(raw)||typeof raw!=='object')throw Error('Catálogo alternativo inválido');
 const recipes=[];for(const [id,rec] of Object.entries(raw)){
  if(!EQUIPMENT.test(id)||EXCLUDE.test(id)||tierOf(id)<4||tierOf(id)>8||!Array.isArray(rec?.materials)||!rec.materials.length)continue;
  const materials=rec.materials.map(m=>({id:m.id,count:Number(m.count),returned:m.ret!==false}));
  if(materials.some(m=>!m.id||!(m.count>0)))continue;
  recipes.push({id,materials,output:Math.max(1,Number(rec.amountCrafted)||1),city:rec.city||null,category:familyOf(id),source:'catálogo-derivado'});
 }
 recipes.sort((a,b)=>cmpTier(a.id,b.id));return {recipes,meta:{source:'Catálogo derivado (respaldo)',fetchedAt:new Date().toISOString(),count:recipes.length}};
}
export function normalizeNames(raw){if(!raw||typeof raw!=='object')return {};return Object.fromEntries(Object.entries(raw).filter(([id,name])=>/^T[1-8]_/.test(id)&&typeof name==='string'&&name.length<150));}
export function itemName(id,names={}){const base=String(id).split('@')[0],en=enchOf(id);return (names[id]||names[base]||base.replaceAll('_',' '))+(en?' · '+`T${tierOf(id)}.${en}`:'');}
export function selectRecipes(recipes,{category='Todas',minTier=4,maxTier=8,maxEnchant=2,search='',limit=4000}={},names={}){
 const q=search.toLocaleLowerCase('es').trim();
 return recipes.filter(r=>(category==='Todas'||r.category===category)&&tierOf(r.id)>=minTier&&tierOf(r.id)<=maxTier&&enchOf(r.id)<=maxEnchant&&(!q||r.id.toLowerCase().includes(q)||itemName(r.id,names).toLocaleLowerCase('es').includes(q))).slice(0,limit);
}
