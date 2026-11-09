// Fuentes ordenadas para los iconos originales de Albion Online.
// La API de precios AODP NO proporciona imagenes.
import {LOCALLY_CACHED_ICONS} from './icon-manifest.js';
export const FALLBACK_ICON='./icons/item-fallback.svg';
export const imageProviders=['Albion Free Market CDN','Proxy Netlify','Albion Render oficial'];
export function validIconId(id){return /^T[1-9]_[A-Z0-9_]+(?:@[1-4])?$/.test(String(id||''));}
export function iconSources(id,size=84,{localIcons=LOCALLY_CACHED_ICONS}={}){
 if(!validIconId(id))return [FALLBACK_ICON];
 const px=Math.min(217,Math.max(32,Math.round(Number(size)||84)));
 const safeId=encodeURIComponent(id);
 const sources=[];
 if(localIcons.has(id))sources.push('./item-icons/'+safeId+'.png');
 // El CDN alternativo puede funcionar cuando el render oficial este caido o bloqueado.
 sources.push('https://cdn.albionfreemarket.com/item/'+safeId+'.png?size='+px);
 sources.push('./.netlify/functions/item-image?id='+safeId+'&size='+px);
 sources.push('https://render.albiononline.com/v1/item/'+safeId+'.png?size='+px+'&quality=1');
 sources.push(FALLBACK_ICON);
 return sources;
}
export function nextIconSource(id,size,step,options={}){
 const sources=iconSources(id,size,options);
 const next=Math.max(0,Math.floor(Number(step)||0)+1);
 return {src:sources[Math.min(next,sources.length-1)],step:next,final:next>=sources.length-1};
}
