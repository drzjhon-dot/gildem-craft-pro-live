import test from 'node:test';
import assert from 'node:assert/strict';
import {extractGearRecipes,overlayGearRecipes} from '../core/ao-gear-recipes.js';
const base={items:{equipmentitem:[{
 '@uniquename':'T5_MAIN_SWORD','@shopsubcategory1':'sword',
 craftingrequirements:{'@amountcrafted':'1',craftresource:[
  {'@uniquename':'T5_METALBAR','@count':'16'},
  {'@uniquename':'T5_ARTEFACT_TOKEN','@count':'1','@maxreturnamount':'0'}]},
 enchantments:{enchantment:{'@enchantmentlevel':'1',craftingrequirements:{craftresource:{'@uniquename':'T5_METALBAR_LEVEL1','@enchantmentlevel':'1','@count':'16'}}}}
 }],weapon:[{'@uniquename':'T6_2H_BOW','@shopsubcategory1':'bow','@showinmarketplace':'false',craftingrequirements:{craftresource:{'@uniquename':'T6_PLANKS','@count':'32'}}}],transformationweapon:[]}};
test('Extrae receta base y encantada desde dump RAW, sin inventar precios',()=>{
 const r=extractGearRecipes(base);
 assert.equal(r.recipes.T5_MAIN_SWORD.city,'Lymhurst');
 assert.equal(r.recipes.T5_MAIN_SWORD.materials[0].count,16);
 assert.equal(r.recipes.T5_MAIN_SWORD.materials[1].ret,false);
 assert.equal(r.recipes['T5_MAIN_SWORD@1'].materials[0].id,'T5_METALBAR_LEVEL1@1');
 assert.equal(r.recipes.T5_MAIN_SWORD.amountCrafted,1);
 assert.equal(r.recipes.T5_MAIN_SWORD.recipeSource,'ao-bin-dumps-gear');
});
test('No vuelve a recomendar artículos retirados del mercado',()=>{
 const r=overlayGearRecipes({'T6_2H_BOW':{materials:[{id:'T6_PLANKS',count:32}],city:'Lymhurst'}},base);
 assert.equal(r.recipes.T6_2H_BOW,undefined);
 assert(r.recipes.T5_MAIN_SWORD);
});
test('Cuando la especialidad de ciudad es desconocida no se inventa un bono',()=>{
 const r=extractGearRecipes({items:{equipmentitem:[{'@uniquename':'T7_MAIN_UNKNOWN','@shopsubcategory1':'not-mapped',craftingrequirements:{craftresource:{'@uniquename':'T7_PLANKS','@count':'32'}}}]}});
 assert.deepEqual(r.recipes,{});
 assert.deepEqual(r.unknownCityIds,['T7_MAIN_UNKNOWN']);
});
test('No interpreta formatted/items.json como el dump RAW de crafting',()=>{
 assert.throws(()=>extractGearRecipes([{UniqueName:'T4_MAIN_SWORD'}]),/RAW/);
});
test('Retiene recetas legadas válidas para items no cubiertos y sobreescribe equipo conocido',()=>{
 const r=overlayGearRecipes({T5_MAIN_SWORD:{city:'Martlock',materials:[]},T5_MEAL_SOME:{city:'Caerleon',materials:[{id:'A',count:1}]}},base);
 assert.equal(r.recipes.T5_MAIN_SWORD.city,'Lymhurst');
 assert.equal(r.recipes.T5_MEAL_SOME.city,'Caerleon');
 assert.equal(r.statistics.direct,2);
});

import {prepareAlwaysPlan} from '../core/always-plan.js';
test('La capacidad de venta se reduce por inventario pendiente propio',()=>{
 const route={id:'T5_A',city:'Black Market',craftCity:'Lymhurst',craftAmount:1,rawMaterials:1000,
  costTotal:800,referencePrice:900,taxRate:0,setupRate:0,weeklyObserved:1000,materials:[]};
 const without=prepareAlwaysPlan([route],{budget:100000,horizonDays:14});
 const withPending=prepareAlwaysPlan([{...route,pendingMarketUnits:100}],{budget:100000,horizonDays:14});
 assert(without.rows.length===1);
 assert(withPending.rows.length===1);
 assert(withPending.rows[0].qty < without.rows[0].qty);
 assert.equal(withPending.rows[0].pendingMarketUnits,100);
 const full=prepareAlwaysPlan([{...route,pendingMarketUnits:1000}],{budget:100000,horizonDays:14});
 assert.equal(full.rows.length,0);
});
