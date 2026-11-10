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
export const CATEGORY_KEYS=['Todas','Espadas','Arcos','Hachas','Bastones','Mazas','Martillos','Dagas','Lanzas','Ballestas','Armaduras','Cascos','Botas','Capas y bolsas','Pociones','Comidas','Monturas','Recolección','Otros'];
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
 return 'Otros';
}
