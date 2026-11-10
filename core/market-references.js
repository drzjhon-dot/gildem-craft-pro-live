// Referencias externas consultadas antes de cada planificación, sin atribuirles
// volúmenes ni precios que no hayan sido obtenidos de forma verificable.
export const MARKET_REFERENCES=Object.freeze([
 {key:'albion-journal',name:'Albion Journal · Craft Profit',url:'https://vanatoliyv.github.io/albion-craft-profit/#craft',description:'Calculadora de crafting y rentabilidad; fuente de contraste, no feed integrado'},
 {key:'albion-hub',name:'Albion Online Hub · Top Selling',url:'https://albiononlinehub.com/top-selling-items',description:'Ranking público de actividad; no existe una API abierta confirmada'},
 {key:'royal-forge',name:'Royal Forge · Market',url:'https://royalforge.app/market',description:'Consulta de mercados y tendencias; no se importa su base de datos'},
 {key:'albion-tools',name:'Albion Online Tools · Marketplace',url:'https://albiononlinetools.com/marketplace/',description:'Anuncios de jugadores; una publicación no equivale a una venta'}
]);
export function marketReferenceSnapshot(payload){
 const found=new Map((payload?.checks||[]).map(x=>[x.key,x]));
 return MARKET_REFERENCES.map(r=>({...r,status:['accessible','unavailable'].includes(found.get(r.key)?.status)?found.get(r.key).status:'unverified',checkedAt:found.get(r.key)?.checkedAt||null}));
}
