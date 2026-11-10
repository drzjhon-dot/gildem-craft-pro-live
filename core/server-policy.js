// Gildem Craft Pro: el planificador del usuario solo trabaja en AMERICAS / WEST.
// Ninguna fuente sin identidad regional puede influir en profit o demanda.
export const REGION = 'west';
export const AODP_WEST = 'https://west.albion-online-data.com';
export function requireWest(region='west') {
 if(region !== REGION) throw new Error('Servidor bloqueado: Gildem Craft Pro solo acepta América (West).');
 return REGION;
}
export const WEST_MARKET_SOURCES = Object.freeze([
 {key:'albion-hub',title:'Albion Online Hub · Top Selling',url:'https://albiononlinehub.com/top-selling-items',westSelectable:'unverified',uses:'Historial de rotación solo con servidor West demostrado o confirmado en importación manual',numericApi:false},
 {key:'royal-forge',title:'Royal Forge · Market',url:'https://royalforge.app/market',westSelectable:'yes',uses:'Contraste visual, elegir Americas dentro de la web',numericApi:false},
 {key:'albion-tools',title:'Albion Online Tools · Marketplace',url:'https://albiononlinetools.com/marketplace/',westSelectable:'yes',uses:'Solo anuncios de jugadores marcados West; NO son ventas realizadas',numericApi:false},
 {key:'albion-free-market',title:'Albion Free Market · Top Traded',url:'https://albionfreemarket.com/topitems',westSelectable:'yes',uses:'Ranking histórico; revisar Americas en la interfaz y sus fechas',numericApi:false},
 {key:'ao-mct',title:'AO Market and Crafting Tools',url:'https://aomct.app/',westSelectable:'yes',uses:'Contraste de crafting usando selector Americas',numericApi:false}
]);
export const NUMERIC_SOURCE = Object.freeze({name:'Albion Online Data Project',server:'west',base:AODP_WEST,independentTimestamp:true});
export function sourceLabel(source){
 if(source==='aodp')return 'AODP · América (West)';
 return WEST_MARKET_SOURCES.find(s=>s.key===source)?.title||'Fuente sin servidor confirmado';
}
export function recognizedWestSnapshot(snapshot){
 return !!snapshot&&snapshot.region===REGION&&snapshot.serverProof==='user-confirmed-west'&&
 snapshot.source==='hub'&&snapshot.rows?.every(r=>r.city&&r.id&&Number.isFinite(r.daily)&&r.daily>=0);
}
