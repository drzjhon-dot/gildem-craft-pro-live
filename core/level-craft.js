// Level Craft: progression and liquidity-aware crafting plan.
// All forecasts are estimates unless the player provides the exact fame still
// needed from the Destiny Board. No AODP order observation is an executed sale.
import {itemStem} from './item-selection.js';
import {routeProfitAtQuantity} from './depth.js';
import {itemTier,itemEnch} from './engine.js';
import {materialPurchaseCities} from './material-cities.js';

const BASE_PROGRESS=[[0,0],[10,14424],[30,169582],[60,750526],[90,2886914],[100,12879472]];
export const FAME_REFERENCE='https://albionfreemarket.com/articles/view/how-much-fame-to-reach-level-100-in-albion-online-the-destiny-board-explained';
export const CRAFT_FAME_BY_MATERIAL_TIER={2:1.5,3:7.5,4:22.5,5:90,6:270,7:645,8:1395};
function clean(id){return String(id||'').split('@')[0];}
export function specFameTotal(id){
 const stem=itemStem(id),raw=clean(id);
 if(/^(MAIN_|2H_)/.test(stem)&&!stem.startsWith('2H_TOOL_'))return 25758944;
 if(/^ARMOR_(PLATE|CLOTH|LEATHER)/.test(stem))return 12879472;
 if(/^(HEAD|SHOES)_(PLATE|CLOTH|LEATHER)/.test(stem))return 6439736;
 if(/^OFF_/.test(stem))return 6439736;
 if(/^BAG|^CAPE/.test(stem))return 19319208;
 if(/^2H_TOOL_TRACKING/.test(stem))return 19319208;
 if(/^SIEGE_BANNER|^2H_TOOL_SIEGEHAMMER/.test(stem))return 38638416;
 if(/^2H_TOOL_/.test(stem))return 19319208;
 // For uncommon families (food, potions, mounts, gathering gear) do not
 // pretend a general crafting-spec total applies to the selected node.
 return null;
}
function interpolatedBase(level){
 const x=Math.max(0,Math.min(100,Number(level)||0));
 for(let i=1;i<BASE_PROGRESS.length;i++){
  const [high,hi]=BASE_PROGRESS[i],[low,lo]=BASE_PROGRESS[i-1];
  if(x<=high){const t=(x-low)/(high-low);
   // Monotonic smooth interpolation in cumulative fame, not exact destiny data.
   return lo+(hi-lo)*t*t*(3-2*t);
  }
 }
 return BASE_PROGRESS.at(-1)[1];
}
export function specFameGoal({itemId,spec=0,exactRemaining=null}={}){
 const level=Number(spec);
 if(!Number.isInteger(level)||level<0||level>100)throw Error('La spec debe estar entre 0 y 100.');
 const known=specFameTotal(itemId);
 if(level===100)return {required:0,total:known,estimate:false,source:'Meta completada',level};
 if(exactRemaining!==null&&exactRemaining!==''&&Number.isFinite(Number(exactRemaining))&&Number(exactRemaining)>0){
  return {required:Math.ceil(Number(exactRemaining)),total:known,estimate:false,source:'Fama restante introducida desde el juego',level};
 }
 if(!known)throw Error('Para esta especialización necesitamos la fama pendiente exacta de tu Destiny Board.');
 const fraction=interpolatedBase(level)/BASE_PROGRESS.at(-1)[1];
 return {required:Math.max(1,Math.ceil(known*(1-fraction))),total:known,estimate:level!==0,source:level===0?'Referencia total de especialización':'Curva de nivel interpolada: aproximación',level};
}
export function craftingFameFromRecipe(itemId,recipe,{premium=true,manualFame=null}={}){
 if(manualFame!==null&&manualFame!==''&&Number(manualFame)>0)return {value:Number(manualFame)*(premium?1.5:1),estimated:false,manual:true};
 if(!recipe?.materials?.length)return null;
 let value=0,nonRefined=[];
 for(const m of recipe.materials){
  const id=String(m.id||'');const tier=itemTier(id),ench=itemEnch(id)||Number(id.match(/_LEVEL([1-4])/)?.[1]||0);
  const refined=/^T[2-8]_(?:METALBAR|PLANKS|CLOTH|LEATHER|STONEBLOCK)(?:_LEVEL[1-4])?(?:@[1-4])?$/.test(id);
  if(!refined){nonRefined.push(id);continue;}
  const f=CRAFT_FAME_BY_MATERIAL_TIER[tier];if(!f)return null;
  value+=f*Math.pow(2,ench)*Number(m.count||0);
 }
 if(value<=0)return null;
 // Artefactos pueden incrementar la fama; sin factor verificado se
 // muestra una estimación base y se permite aportar la cifra real.
 return {value:value*(premium?1.5:1),estimated:nonRefined.length>0,nonRefined,manual:false};
}
export function eligibleToStudy(id,recipe){return !/^(?:T[2-8]_MOUNT_|T[2-8]_(?:METALBAR|CLOTH|PLANKS|LEATHER|STONEBLOCK))/.test(id)&&recipe?.kind!=='mount'&&recipe?.kind!=='refining';}
function conservativeCapacity(route,capFraction=0.10){
 const units=Math.max(1,Number(route.craftAmount)||1);
 if(route.city==='Black Market'){
  if(route.depthVerified&&Number.isFinite(route.marketCapacity))return Math.max(0,Math.floor(route.marketCapacity));
  return 1; // Never infer BM depth from an advertised best bid.
 }
 const activity=route.activity;
 if(activity?.observations>0&&Number.isFinite(activity.observedDaily))return Math.max(1,Math.floor(activity.observedDaily*capFraction/units));
 return 2; // Small provisional exposure, NOT proven demand.
}
const number=x=>Number.isFinite(Number(x))?Number(x):0;
function bestRouteScore(route,fame,goal){
 const net=number(route.profit),gross=number(route.capitalPerUnit);
 const netPerFame=net/fame;
 if(goal==='fast')return Math.log1p(fame)*4+netPerFame*500;
 if(goal==='cheap')return netPerFame*1200+Math.log1p(fame);
 return netPerFame*650+Math.log1p(fame)*2;
}
export function planLevelCraft({routes=[],recipes={},goalFame=0,budget=0,premium=true,study=false,studyFee=0,manualCraftFame=null,goal='balanced',capFraction=.1,maxStages=24,focusBudget=0}={}){
 if(!(goalFame>=0&&Number.isFinite(goalFame))||!(budget>0))throw Error('Fama y presupuesto inválidos.');
 if(study&&(!Number.isFinite(Number(studyFee))||Number(studyFee)<0))throw Error('La tarifa de estudio debe ser válida.');
 const ready=routes.map(route=>{
   const f=craftingFameFromRecipe(route.id,recipes[route.id],{premium,manualFame:manualCraftFame});
   const fame=f?.value||0,craftAmount=Math.max(1,number(route.craftAmount)||1);
   return {...route,famePerCraft:fame,fameEstimated:!!f?.estimated,cap:conservativeCapacity(route,capFraction),craftAmount};
  }).filter(x=>x.famePerCraft>0&&x.capitalPerUnit>0&&Number.isFinite(x.profit)&&(x.sell>0||x.studyOnly));
 const unique=new Map();for(const r of ready){const key=r.id+'|'+r.city;
  const old=unique.get(key);if(!old||bestRouteScore(r,r.famePerCraft,goal)>bestRouteScore(old,old.famePerCraft,goal))unique.set(key,r);
 }
 const ranked=[...unique.values()].filter(x=>!x.studyOnly).sort((a,b)=>bestRouteScore(b,b.famePerCraft,goal)-bestRouteScore(a,a.famePerCraft,goal));
 const studyRoutes=[...unique.values()].filter(x=>eligibleToStudy(x.id,recipes[x.id]));
 let remaining=goalFame,wallet=budget,earned=0,netProfit=0,peakCapital=0,studyCount=0,focusRemaining=Number(focusBudget)||0,focusUsed=0;
 const stages=[],availableBM=new Map(),unknownRoyalUsed=new Set();
 for(const route of ranked.filter(r=>r.city==='Black Market'))availableBM.set(route.id,route.cap);
 for(let step=1;step<=maxStages&&remaining>0.01;step++){
  let cash=wallet,spent=0,net=0,fameEarned=0,stageCount=0;
  const entries=[];
  // Craft for sale is always the first choice, even when Study is allowed.
  for(const route of ranked){
   if(remaining<=0.01)break;
   const baseCap=route.cap;
   let cap=baseCap;
   if(route.city==='Black Market')cap=availableBM.get(route.id)||0;
   if(route.city!=='Black Market'&&!(route.activity?.observations>0)&&unknownRoyalUsed.has(route.id+'|'+route.city))cap=0;
   // 80 units/route/round and 50% budget concentration keep the list sane.
   cap=Math.min(cap,80);
   const byMoney=Math.floor((cash+1e-9)/route.capitalPerUnit);
   const byFocus=route.focusPerUnit>0?Math.floor((focusRemaining+1e-9)/route.focusPerUnit):Infinity;
   const byFame=Math.ceil(remaining/route.famePerCraft);
   const qty=Math.max(0,Math.min(cap,byMoney,byFame,byFocus));
   if(!qty)continue;
   const inv=qty*route.capitalPerUnit,profit=routeProfitAtQuantity(route,qty);
   if(profit===null)continue;
   entries.push({id:route.id,craftCity:route.craftCity,city:route.city,mode:route.mode,kind:'sell',qty,units:qty*route.craftAmount,
    profit,investment:inv,materials:route.materials,returnRate:route.returnRate,famePerCraft:route.famePerCraft,fame:qty*route.famePerCraft,
    ageHours:route.ageHours,depthVerified:!!route.depthVerified,activity:route.activity});
   cash-=inv;spent+=inv;net+=profit;focusUsed+=qty*(route.focusPerUnit||0);focusRemaining-=qty*(route.focusPerUnit||0);fameEarned+=qty*route.famePerCraft;remaining=Math.max(0,remaining-qty*route.famePerCraft);stageCount+=qty;
   if(route.city==='Black Market')availableBM.set(route.id,Math.max(0,(availableBM.get(route.id)||0)-qty));
   if(route.city!=='Black Market'&&!(route.activity?.observations>0))unknownRoyalUsed.add(route.id+'|'+route.city);
  }
  if(study&&remaining>0.01){
   const options=studyRoutes
    .map(r=>{
      const matGross=r.materials.reduce((sum,m)=>sum+m.count*(m.upfrontUnitPrice||m.unitPrice),0);
      const matNet=r.materials.reduce((sum,m)=>sum+m.used*m.unitPrice,0);
      return {...r,additional:r.famePerCraft*2.75,studyInvestment:matGross+(r.stationCost||0)+Number(studyFee)*r.craftAmount,studyNetCost:matNet+(r.stationCost||0)+Number(studyFee)*r.craftAmount};
    })
    .filter(r=>r.studyInvestment>0)
    .sort((a,b)=>(a.studyNetCost/(a.famePerCraft+a.additional))-(b.studyNetCost/(b.famePerCraft+b.additional)));
   for(const route of options){if(remaining<=0.01)break;
    const perFame=route.famePerCraft+route.additional;
    const byFocus=route.focusPerUnit>0?Math.floor((focusRemaining+1e-9)/route.focusPerUnit):Infinity;
    const qty=Math.max(0,Math.min(80,Math.floor((cash+1e-9)/route.studyInvestment),Math.ceil(remaining/perFame),byFocus));
    if(!qty)continue;
    const inv=qty*route.studyInvestment,cost=qty*route.studyNetCost;
    entries.push({id:route.id,craftCity:route.craftCity,city:null,kind:'study',qty,units:qty*route.craftAmount,investment:inv,profit:-cost,famePerCraft:perFame,fame:qty*perFame,
     returnRate:route.returnRate,materials:route.materials,studyFee:Number(studyFee)});
    studyCount+=qty*route.craftAmount;cash-=inv;spent+=inv;net-=cost;focusUsed+=qty*(route.focusPerUnit||0);focusRemaining-=qty*(route.focusPerUnit||0);fameEarned+=qty*perFame;remaining=Math.max(0,remaining-qty*perFame);stageCount+=qty;
   }
  }
  if(stageCount===0)break;
  // Following stages depend on successfully selling earlier goods; not guaranteed.
  wallet+=net;earned+=fameEarned;netProfit+=net;peakCapital=Math.max(peakCapital,spent);
  stages.push({number:step,rows:entries,investment:spent,netProfit:net,fame:fameEarned,cashAfter:wallet});
  if(wallet<=0||(!ranked.some(r=>r.city!=='Black Market')&&!study))break;
 }
 const totals=new Map(),materials=new Map(),sales=new Map();
 for(const stage of stages)for(const r of stage.rows){
  const key=r.id+'|'+r.kind+'|'+r.craftCity;
  const prev=totals.get(key)||{id:r.id,method:r.kind,craftCity:r.craftCity,qty:0,units:0,fame:0,profit:0,investment:0};
  prev.qty+=r.qty;prev.units+=r.units;prev.fame+=r.fame;prev.profit+=r.profit;prev.investment+=r.investment;totals.set(key,prev);
  if(r.kind==='sell'){
   const saleKey=r.id+'|'+r.city,prior=sales.get(saleKey)||{id:r.id,city:r.city,qty:0,units:0,profit:0};
   prior.qty+=r.qty;prior.units+=r.units;prior.profit+=r.profit;sales.set(saleKey,prior);
  }
  for(const m of r.materials||[]){const materialKey=m.id+'|'+m.city,prior=materials.get(materialKey)||{id:m.id,city:m.city,qtyGross:0,qtyNet:0,unitPrice:m.unitPrice};
   prior.qtyGross+=m.count*r.qty;prior.qtyNet+=m.used*r.qty;materials.set(materialKey,prior);
  }
 }
 return {stages,items:[...totals.values()],sales:[...sales.values()],materials:[...materials.values()],remainingFame:Math.ceil(remaining),earnedFame:Math.ceil(earned),
  completed:remaining<=0.01,budget,peakCapital,netProfit,walletAfter:wallet,studyCount,goalFame,hasEstimatedFame:ready.some(r=>r.fameEstimated),
  qualifyingRoutes:ranked.length,focusUsed,warning:'Las cantidades y las rondas son una proyección. AODP observa órdenes, no ventas ejecutadas. Reconsulta precios y demanda antes de cada ronda.'};
}

// Craft-for-study needs material quotes, but never requires a fabricated sale
// quote. These candidates cannot enter the sale portion of the allocator.
export function createStudyOnlyCandidates({ids=[],recipes={},priceMap,inputs,maxAge=24}={}){
 const result=[],cities=inputs.cities||[];
 for(const id of ids){const recipe=recipes[id];if(!eligibleToStudy(id,recipe)||!recipe?.materials?.length)continue;
  const places=inputs.city==='compare'?[...new Set([recipe.city,'Caerleon'])]:inputs.city&&inputs.city!=='auto'?[inputs.city]:[recipe.city];
  for(const craftCity of places){
   const materials=[];let raw=0,net=0;
   const bonus=recipe.specialtyEnabled===false?0:(recipe.city===craftCity?15:0);
   const production=18+bonus+(recipe.dailyEnabled===false?0:Number(inputs.daily)||0)+(inputs.focus?59:0);
   const rrr=100*production/(100+production);
   for(const m of recipe.materials){
    let best=null;
    for(const city of materialPurchaseCities(m.id,inputs.materialPurchase||'bonus',cities)){const r=priceMap?.get(m.id+'|'+city+'|1');
     if(!r||!(Number(r.sell_price_min)>0))continue;
     const time=Date.parse(r.sell_price_min_date||'');if(!Number.isFinite(time)||Date.now()-time>maxAge*3600000||time>Date.now()+60000)continue;
     const px=Number(r.sell_price_min)+(city===craftCity?0:Number(inputs.materialShipping)||0);
     if(!best||px<best.unitPrice)best={city,unitPrice:px,at:time};
    }
    if(!best)break;
    const count=Number(m.count),used=m.ret===false?count:count*(1-rrr/100);
    materials.push({...m,city:best.city,unitPrice:best.unitPrice,upfrontUnitPrice:best.unitPrice,count,used,returned:count-used});
    raw+=count*best.unitPrice;net+=used*best.unitPrice;
   }
   if(materials.length!==recipe.materials.length)continue;
   const station=Number(inputs.station)||0;
   result.push({id,city:null,studyOnly:true,craftCity,materials,stationCost:station,returnRate:rrr,
    capitalPerUnit:raw+station,cost:net+station,profit:-(net+station),sell:0,craftAmount:Math.max(1,Number(recipe.amountCrafted)||1),
    focusPerUnit:inputs.focus?(Number(inputs.focusPerUnit)||0):0});
  }
 }
 return result;
}
