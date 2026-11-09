// Controles de selección reutilizables por ambos planificadores.
// Una familia de objeto agrupa sus variantes por tier y encantamiento.
export const itemStem=id=>String(id||'').replace(/^T[1-8]_/, '').split('@')[0];
export const itemMatches=(id,{mode='all',stems=[],tierExact='all',enchExact='all'}={})=>{
 if(mode==='selected'&&!stems.includes(itemStem(id)))return false;
 const tier=Number(String(id).match(/^T([1-8])_/)?.[1]);
 const ench=Number(String(id).split('@')[1]||0);
 if(tierExact!=='all'&&tier!==Number(tierExact))return false;
 if(enchExact!=='all'&&ench!==Number(enchExact))return false;
 return true;
};
export function familyChoices(ids,nameOf=id=>id){
 const groups=new Map();
 for(const id of ids||[]){const stem=itemStem(id);if(!stem)continue;
  const tier=Number(String(id).match(/^T([1-8])_/)?.[1]);
  if(!Number.isInteger(tier))continue;
  const current=groups.get(stem)||{stem,label:'',iconId:id.split('@')[0],tiers:new Set(),count:0};
  current.tiers.add(tier);current.count++;
  if(!current.label||tier===4||tier===3&&current.tiers.size===1){current.label=String(nameOf(id)||stem).replace(/\s*·\s*T\d+\.\d+$/,'');current.iconId=id.split('@')[0];}
  groups.set(stem,current);
 }
 return [...groups.values()].map(x=>({...x,tiers:[...x.tiers].sort((a,b)=>a-b)})).sort((a,b)=>a.label.localeCompare(b.label,'es'));
}
export function filterIds(ids,filters){return (ids||[]).filter(id=>itemMatches(id,filters));}
