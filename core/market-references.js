// Referencias de investigación para el servidor América (West).
// Estas páginas NO son fuentes numéricas integradas. Solo AODP West puede
// aportar precios actuales, libros e historial al motor automático.
import {WEST_MARKET_SOURCES,NUMERIC_SOURCE} from './server-policy.js';
export const MARKET_REFERENCES=WEST_MARKET_SOURCES;
export function marketReferenceSnapshot(payload){
 const found=new Map((payload?.region==='west'?payload.checks:[]||[]).map(x=>[x.key,x]));
 return MARKET_REFERENCES.map(r=>({
  ...r,server:'west',numericImported:false,
  status:['accessible','unavailable'].includes(found.get(r.key)?.status)?found.get(r.key).status:'unverified',
  serverVerified:false,checkedAt:found.get(r.key)?.checkedAt||null
 }));
}
export {NUMERIC_SOURCE};
