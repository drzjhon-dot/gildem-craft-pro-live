// Catalogo de fuentes de referencia. Disponibilidad NO equivale a integracion.
import {WEST_MARKET_SOURCES,NUMERIC_SOURCE} from './server-policy.js';
export const MARKET_REFERENCES=WEST_MARKET_SOURCES;
export function marketReferenceSnapshot(payload){
 const checks=payload?.region==='west'&&Array.isArray(payload.checks)?payload.checks:[];
 const found=new Map(checks.map(x=>[x.key,x]));
 return MARKET_REFERENCES.map(r=>({
  ...r,
  // Las tarjetas utilizan name/description; los datos originales se llaman title/uses.
  name:r.title,description:r.uses,
  server:'west',numericImported:false,
  status:['accessible','unavailable'].includes(found.get(r.key)?.status)?found.get(r.key).status:'unverified',
  serverVerified:false,checkedAt:found.get(r.key)?.checkedAt||null
 }));
}
export {NUMERIC_SOURCE};
