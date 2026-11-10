// Optional statistics manually copied from third-party market rankings.
// Not a live API connection. Never use a copied reference price for profit.
export const MARKET_SNAPSHOT_KEY='gildem-market-volume-snapshot-v1';
const CITIES=['Black Market','Bridgewatch','Fort Sterling','Lymhurst','Martlock','Thetford','Caerleon','Brecilien'];
const ITEM=/T[4-8]_[A-Z0-9_]+(?:@\d)?/g;
const normalizeCity=s=>CITIES.find(c=>c.toLowerCase()===String(s||'').toLowerCase())||null;
const cleanNum=s=>Number(String(s||'').trim().replace(/[\s,]/g,''));
export function parseMarketRanking(text,{source='hub',market='Black Market',maxRows=2000}={}){
 const input=String(text||'').slice(0,280000),rows=new Map();
 const sourceMode=['hub','journal'].includes(source)?source:'hub';
 if(sourceMode==='journal'){
  for(const line of input.split(/\r?\n/)){
   if(!line.includes('ico/T')||!line.includes('.webp'))continue;
   const cells=line.split('|').map(x=>x.trim());
   // Markdown table columns: icon, item, city, cost, sale, mode, profit, ROI,
   // observed daily units, silver turnover, etc. The image URL has the real ID.
   const id=(cells.find(x=>x.includes('ico/T'))||'').match(/ico\/(T[4-8]_[A-Z0-9_]+(?:@\d)?)\.webp/i)?.[1];
   const daily=cleanNum(cells[9]); // leading Markdown pipe yields cells[0]==''
   if(id&&Number.isFinite(daily)&&daily>=0&&daily<1e8){
    const city=normalizeCity(market);if(city)rows.set(id+'|'+city,{id,city,daily,source:'Albion Journal · tabla pegada'});
   }
  }
 }else{
  // Albion Hub copy can include either TSV rows or item/category/quantity on
  // separate lines. Anchor each block on the item ID, not on enchantment text.
  const matches=[...input.matchAll(ITEM)].filter(m=>!m[0].includes('LEVEL'));
  for(let i=0;i<matches.length;i++){
   const id=matches[i][0],slice=input.slice(matches[i].index+id.length,matches[i+1]?.index??input.length).slice(0,900);
   const city=CITIES.find(c=>new RegExp('\\b'+c.replace(/ /g,'\\s+')+'\\b','i').test(slice))||normalizeCity(market);
   if(!city)continue;
   const afterCity=slice.slice(Math.max(0,slice.toLowerCase().indexOf(city.toLowerCase())+city.length));
   // In the Hub ranking, the first quantified field after the category text
   // is DAILY AVG AMOUNT. Ignore the tier in the ID and the later price.
   const candidates=afterCity.match(/(?:^|[\t\n\r ]+)(\d{1,3}(?:,\d{3})+|\d{1,8})(?=\s|$)/g)||[];
   let daily=null;
   for(const candidate of candidates){const num=cleanNum(candidate);if(Number.isFinite(num)&&num>=0&&num<=1e7){daily=num;break;}}
   if(daily!==null)rows.set(id+'|'+city,{id,city,daily,source:'Albion Online Hub · tabla pegada'});
  }
 }
 return [...rows.values()].slice(0,Math.max(0,maxRows));
}
export function validMarketSnapshot(snapshot,{region='west',now=Date.now(),maxAgeDays=14}={}){
 if(!snapshot||snapshot.region!==region||!['hub','journal'].includes(snapshot.source))return false;
 const date=Date.parse(snapshot.observedAt||'');
 return Number.isFinite(date)&&date<=now+3600000&&now-date<=maxAgeDays*86400000&&Array.isArray(snapshot.rows);
}
export function externalDaily(index,id,city,{region='west',now=Date.now()}={}){
 if(!validMarketSnapshot(index,{region,now}))return null;
 const r=index.rows.find(x=>x.id===id&&x.city===city);
 return r&&Number.isFinite(r.daily)&&r.daily>=0?{daily:r.daily,source:r.source||'Importación manual',observedAt:index.observedAt}:null;
}
