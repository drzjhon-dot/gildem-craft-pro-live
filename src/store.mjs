const KEY='gildem-nova-v9-plans';
const memory=new Map();
const fallback={getItem:key=>memory.get(key)||null,setItem:(key,val)=>memory.set(key,String(val)),removeItem:key=>memory.delete(key)};
export function safeStorage(){try{const s=globalThis.localStorage;const key='__gildem-storage-check';s.setItem(key,'1');s.removeItem(key);return s;}catch{return fallback;}}
const defaultStorage=safeStorage();
export function readPlans(storage=defaultStorage){try{const value=JSON.parse(storage.getItem(KEY)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
export function savePlan(plan,{storage=defaultStorage,now=new Date().toISOString()}={}){
 if(!plan?.rows?.length)throw Error('No hay artículos para guardar');
 const record={id:'p'+now.replace(/\D/g,'')+Math.random().toString(36).slice(2,6),at:now,market:plan.market,budget:plan.budget,totalCapital:plan.totalCapital,profit:plan.totalProfit,
 rows:plan.rows.map(r=>({id:r.id,city:r.city,craftCity:r.craftCity,qty:r.qty,units:r.units,capital:r.capital,profit:r.profit,weekly:r.weekly,saleKind:r.saleKind})),
 shopping:plan.shopping.map(m=>({id:m.id,qty:m.qty,city:m.city,price:m.price})),started:false};
 const saved=readPlans(storage);saved.unshift(record);storage.setItem(KEY,JSON.stringify(saved.slice(0,60)));return record;
}
export function removePlan(id,storage=defaultStorage){const list=readPlans(storage).filter(x=>x.id!==id);storage.setItem(KEY,JSON.stringify(list));return list;}
export function markStarted(id,storage=defaultStorage){const list=readPlans(storage);const r=list.find(x=>x.id===id);if(!r)throw Error('Plan no encontrado');r.started=true;storage.setItem(KEY,JSON.stringify(list));return r;}
export function pendingUnits(plans){const m=new Map();for(const p of plans)if(p.started)for(const r of p.rows||[]){const k=r.id+'|'+r.city;m.set(k,(m.get(k)||0)+Math.max(0,Number(r.units)||0));}return m;}
export function downloadCSV(rows){const esc=x=>'"'+String(x??'').replaceAll('"','""')+'"';return rows.map(r=>r.map(esc).join(',')).join('\r\n');}
