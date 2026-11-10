export const CITIES=['Bridgewatch','Fort Sterling','Lymhurst','Martlock','Thetford','Caerleon','Brecilien'];
export const MARKETS=[...CITIES,'Black Market'];
export function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
export const money=v=>Number.isFinite(Number(v))?Math.round(Number(v)).toLocaleString('es-ES'):'—';
export const fmt=v=>Number.isFinite(Number(v))?Number(v).toLocaleString('es-ES'):'—';
export function tierOf(id){const m=/^T(\d+)_/.exec(String(id||''));return m?+m[1]:0;}
export function enchOf(id){const m=/@([1-4])(?:$|\W)/.exec(String(id||''));return m?+m[1]:0;}
export const tierLabel=id=>`T${tierOf(id)}.${enchOf(id)}`;
export const cmpTier=(a,b)=>tierOf(a)-tierOf(b)||enchOf(a)-enchOf(b)||String(a).localeCompare(String(b),'es');
export function itemIcon(id,size=58){const uid=encodeURIComponent(String(id||''));return `https://render.albiononline.com/v1/item/${uid}.png?quality=1&size=${Math.min(217,Math.max(32,size))}`;}
export function positive(v){return Number.isFinite(Number(v))&&Number(v)>0?Number(v):null;}
export function parseUTC(value){if(!value)return NaN;const s=String(value).trim();return Date.parse(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(s)?s+'Z':s);}
export function dateAgeHours(value,now=Date.now()){const t=parseUTC(value);return Number.isFinite(t)?(now-t)/3600000:null;}
export function iso(value){const d=parseUTC(value);return Number.isFinite(d)?new Date(d).toLocaleString('es-ES'):'sin fecha';}
export function chunk(items,size=40){const out=[];for(let i=0;i<items.length;i+=size)out.push(items.slice(i,i+size));return out;}

export const CATEGORY_META=Object.freeze([
 {key:'Todas',label:'Todas',note:'Todas las ramas',icon:'T5_BAG'},
 {key:'Espadas',label:'Espadas',note:'Espadas y claymores',icon:'T5_MAIN_SWORD'},
 {key:'Arcos',label:'Arcos',note:'Arcos y warbows',icon:'T5_2H_BOW'},
 {key:'Hachas',label:'Hachas',note:'Hachas y alabardas',icon:'T5_MAIN_AXE'},
 {key:'Bastones',label:'Bastones',note:'Mágicos y de apoyo',icon:'T5_2H_FIRESTAFF'},
 {key:'Mazas',label:'Mazas',note:'Mazas y flails',icon:'T5_MAIN_MACE'},
 {key:'Martillos',label:'Martillos',note:'Martillos y polehammers',icon:'T5_MAIN_HAMMER'},
 {key:'Dagas',label:'Dagas',note:'Dagas y bloodletters',icon:'T5_MAIN_DAGGER'},
 {key:'Lanzas',label:'Lanzas',note:'Lanzas y tridents',icon:'T5_MAIN_SPEAR'},
 {key:'Ballestas',label:'Ballestas',note:'Ballestas y one-shot',icon:'T5_2H_CROSSBOW'},
 {key:'Armaduras',label:'Armaduras',note:'Chest pieces',icon:'T5_ARMOR_CLOTH_SET1'},
 {key:'Cascos',label:'Cascos',note:'Head pieces',icon:'T5_HEAD_LEATHER_SET1'},
 {key:'Botas',label:'Botas',note:'Shoes y sandals',icon:'T5_SHOES_PLATE_SET1'},
 {key:'Capas y bolsas',label:'Capas y bolsas',note:'Capes y bags',icon:'T5_CAPE'},
 {key:'Pociones',label:'Pociones',note:'Alquimia',icon:'T5_POTION_HEAL'},
 {key:'Comidas',label:'Comidas',note:'Cocina',icon:'T5_MEAL_SOUP'},
 {key:'Monturas',label:'Monturas',note:'Saddles y mounts',icon:'T5_MOUNT_HORSE'},
 {key:'Recolección',label:'Recolección',note:'Gear y tools',icon:'T5_HEAD_GATHERER_FIBER'},
 {key:'Otros',label:'Otros',note:'Offhands y varios',icon:'T5_OFF_BOOK'}
]);
export const CATEGORY_KEYS=CATEGORY_META.map(x=>x.key);
export const CATEGORY_GROUPS=Object.freeze([
 {title:'Armas',keys:['Espadas','Arcos','Hachas','Bastones','Mazas','Martillos','Dagas','Lanzas','Ballestas']},
 {title:'Equipo',keys:['Armaduras','Cascos','Botas','Capas y bolsas']},
 {title:'Especiales',keys:['Pociones','Comidas','Monturas','Recolección','Otros']}
]);
export const categoryMeta=key=>CATEGORY_META.find(x=>x.key===key)||CATEGORY_META[0];

export function familyOf(id,meta={}){
 const sub=String(meta?.sub||'').toLowerCase(),uid=String(id).toUpperCase();
 if(/BOW/.test(uid)||sub.includes('bow'))return 'Arcos';
 if(/SWORD|CLAYMORE|DUALSWORD|KINGMAKER|CLEAVER/.test(uid)||sub.includes('sword'))return 'Espadas';
 if(/AXE|HALBERD|SCYTHE|BEARPAWS/.test(uid)||sub.includes('axe'))return 'Hachas';
 if(/MACE|FLAIL/.test(uid)||sub.includes('mace'))return 'Mazas';
 if(/HAMMER/.test(uid)||sub.includes('hammer'))return 'Martillos';
 if(/DAGGER|BLOODLETTER|DEATHGIVERS/.test(uid)||sub.includes('dagger'))return 'Dagas';
 if(/SPEAR|TRIDENT/.test(uid)||sub.includes('spear'))return 'Lanzas';
 if(/CROSSBOW|BOLTCASTERS/.test(uid)||sub.includes('crossbow'))return 'Ballestas';
 if(/STAFF|ARCANE|FIRE|FROST|HOLY|NATURE|CURSE|QUARTERSTAFF/.test(uid)||sub.includes('staff'))return 'Bastones';
 if(/SHOES_/.test(uid))return 'Botas';
 if(/HEAD_/.test(uid))return 'Cascos';
 if(/ARMOR_/.test(uid))return 'Armaduras';
 if(/BAG|CAPE/.test(uid))return 'Capas y bolsas';
 if(/_POTION_/.test(uid))return 'Pociones';
 if(/_MEAL_/.test(uid))return 'Comidas';
 if(/_MOUNT_/.test(uid))return 'Monturas';
 if(/_GATHERER_|_TOOL_/.test(uid))return 'Recolección';
 return 'Otros';
}

export function journalDisciplineForMaterial(id=''){
 const uid=String(id).toUpperCase();
 if(/CLOTH/.test(uid))return 'Imbuidor';
 if(/LEATHER|HIDE/.test(uid))return 'Peletero';
 if(/METALBAR|ORE/.test(uid))return 'Herrero';
 if(/PLANKS|WOOD/.test(uid))return 'Carpintero';
 if(/STONEBLOCK|ROCK/.test(uid))return 'Cantero';
 if(/POTION|HERB/.test(uid))return 'Alquimista';
 if(/MEAL|FISH|MEAT|CROP/.test(uid))return 'Cocinero';
 return 'Artesano';
}
