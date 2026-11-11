import {getStore} from '@netlify/blobs';
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'public, max-age=30'}});
export default async function(request){
 if(request.method!=='GET')return reply({error:'Método no permitido'},405);
 try{
  const data=await getStore({name:'gildem-aodp-west-feed'}).get('latest',{type:'json'});
  if(!data)return reply({connected:false,source:'AODP-NATS',message:'Feed NATS opcional no configurado; REST continúa activo.'});
  const age=Math.max(0,(Date.now()-Date.parse(data.generatedAt))/1000);
  return reply({...data,connected:data.connected===true&&age<=180,ageSeconds:Math.round(age),stale:age>180});
 }catch{return reply({connected:false,source:'AODP-NATS',message:'Feed no disponible; REST continúa activo.'});}
}
export const config={path:'/.netlify/functions/aodp-feed'};
