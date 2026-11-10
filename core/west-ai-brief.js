// Preparar consulta verificable para un asistente de IA, sin guardar llaves ni
// fingir investigación web automática cuando no existe un servicio contratado.
import {WEST_MARKET_SOURCES} from './server-policy.js';
const safeText=x=>String(x??'').replace(/[\r\n\t<>]/g,' ').slice(0,100);
export function makeWestResearchBrief({market='black',branch='',rows=[],observedAt=null}={}){
 const destination=market==='royal'?'Royal (ciudades individuales)':'Mercado Negro (Caerleon)';
 const ids=[...new Set((rows||[]).map(r=>safeText(r?.id)).filter(x=>/^T[1-8]_[A-Z0-9_@-]+$/.test(x)))].slice(0,18);
 const sources=WEST_MARKET_SOURCES.map(x=>`- ${x.title}: ${x.url} (verificar selección Americas/West)`).join('\n');
 return [
  'INVESTIGACIÓN DE MERCADOS PARA GILDEM CRAFT PRO',
  'Servidor obligatorio: AMÉRICA (WEST). NO usar precios, volumen, ventas ni órdenes de EUROPA o ASIA.',
  'Mercado objetivo: '+destination, 'Rama: '+safeText(branch||'Sin especificar'),
  'IDs a investigar: '+(ids.length?ids.join(', '):'Toda la rama seleccionada'),
  'Fecha de referencia del plan: '+(observedAt&&Number.isFinite(Date.parse(observedAt))?observedAt:'sin fecha de investigación'),
  'Fuentes externas de apoyo (no son automáticamente APIs accesibles):',sources,
  'Busca otras fuentes públicas con selector explícito Americas West. Cita la URL, la fecha y la evidencia del servidor de cada observación.',
  'Separa actividad histórica, anuncios de jugadores, precios de órdenes vigentes y profundidad del libro. Si no puedes demostrar West, DESCARTA ese dato.',
  'NO inventes datos ni prometas ventas. Calcula profit solamente si se aportan precio vigente AODP West, receta, costes, impuestos y ciudad.',
  'Propón límites de compra de materiales, cantidades por horizonte de 7/14/30 días y advertencias de antigüedad.'
 ].join('\n');
}
