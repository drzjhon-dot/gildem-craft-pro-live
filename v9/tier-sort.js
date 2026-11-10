// GILDEM CRAFT PRO v9.0: comparador unificado de tier y encantamiento.
// Valores visuales: T4.0, T4.1, ... T5.0. IDs: T4_ITEM, T4_ITEM@1.
export function tierFrom(value) {
 const text=String(value??'').trim();
 const pretty=/(?:^|[^A-Z0-9])T([1-8])[.\s]([0-4])(?:\b|$)/i.exec(text);
 if(pretty)return {tier:Number(pretty[1]),enchant:Number(pretty[2])};
 const id=/(?:^|\b)T([1-8])_[A-Z0-9_]+(?:@([0-4]))?/i.exec(text);
 if(id)return {tier:Number(id[1]),enchant:Number(id[2]??0)};
 const generic=/(?:^|\b)T([1-8])\b/i.exec(text);
 return generic?{tier:Number(generic[1]),enchant:0}:{tier:99,enchant:99};
}
export function compareTier(a,b){
 const left=tierFrom(a),right=tierFrom(b);
 return left.tier-right.tier||left.enchant-right.enchant;
}
export function tierLabel(value){
 const {tier,enchant}=tierFrom(value);
 return tier===99?'—':`T${tier}.${enchant}`;
}
export function orderedByTier(items,key=x=>x){
 return [...items].map((item,index)=>({item,index})).sort((a,b)=>compareTier(key(a.item),key(b.item))||a.index-b.index).map(x=>x.item);
}
