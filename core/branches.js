// More precise crafting lines. All filters use actual item IDs from the public recipe dump.
const gear=(part,kind)=>id=>new RegExp(`^T[4-8]_${part}_${kind}`).test(id);
const byId=regex=>id=>regex.test(id);
// Exact line membership avoids accidentally skipping artifact/crystal weapons.
// These IDs are game item stems; tier and enchantment are handled separately.
const WEAPON_FAMILIES={
 axe:['MAIN_AXE','2H_AXE','2H_HALBERD','2H_HALBERD_MORGANA','2H_SCYTHE_HELL','2H_DUALAXE_KEEPER','2H_AXE_AVALON','2H_SCYTHE_CRYSTAL'],
 sword:['MAIN_SWORD','2H_CLAYMORE','2H_DUALSWORD','MAIN_SCIMITAR_MORGANA','2H_CLEAVER_HELL','2H_DUALSCIMITAR_UNDEAD','2H_CLAYMORE_AVALON','MAIN_SWORD_CRYSTAL'],
 bow:['2H_BOW','2H_WARBOW','2H_LONGBOW','2H_LONGBOW_UNDEAD','2H_BOW_HELL','2H_BOW_KEEPER','2H_BOW_AVALON','2H_BOW_CRYSTAL'],
 crossbow:['2H_CROSSBOW','2H_CROSSBOWLARGE','MAIN_1HCROSSBOW','2H_REPEATINGCROSSBOW_UNDEAD','2H_DUALCROSSBOW_HELL','2H_CROSSBOWLARGE_MORGANA','2H_CROSSBOW_CANNON_AVALON','2H_DUALCROSSBOW_CRYSTAL'],
 dagger:['MAIN_DAGGER','2H_DAGGERPAIR','2H_CLAWPAIR','MAIN_RAPIER_MORGANA','MAIN_DAGGER_HELL','2H_IRONGAUNTLETS_HELL','2H_DUALSICKLE_UNDEAD','2H_DAGGER_KATAR_AVALON','2H_DAGGERPAIR_CRYSTAL'],
 spear:['MAIN_SPEAR','2H_SPEAR','2H_GLAIVE','MAIN_SPEAR_KEEPER','2H_HARPOON_HELL','2H_TRIDENT_UNDEAD','MAIN_SPEAR_LANCE_AVALON','2H_GLAIVE_CRYSTAL'],
 mace:['MAIN_MACE','2H_MACE','2H_FLAIL','MAIN_ROCKMACE_KEEPER','MAIN_MACE_HELL','2H_MACE_MORGANA','2H_DUALMACE_AVALON','MAIN_MACE_CRYSTAL'],
 hammer:['MAIN_HAMMER','2H_POLEHAMMER','2H_HAMMER','2H_HAMMER_UNDEAD','2H_DUALHAMMER_HELL','2H_RAM_KEEPER','2H_HAMMER_AVALON','2H_HAMMER_CRYSTAL'],
 quarterstaff:['2H_QUARTERSTAFF','2H_IRONCLADEDSTAFF','2H_DOUBLEBLADEDSTAFF','2H_COMBATSTAFF_MORGANA','2H_TWINSCYTHE_HELL','2H_ROCKSTAFF_KEEPER','2H_QUARTERSTAFF_AVALON','2H_DOUBLEBLADEDSTAFF_CRYSTAL'],
 fire:['MAIN_FIRESTAFF','2H_FIRESTAFF','2H_INFERNOSTAFF','MAIN_FIRESTAFF_KEEPER','2H_FIRESTAFF_HELL','2H_INFERNOSTAFF_MORGANA','2H_FIRE_RINGPAIR_AVALON','MAIN_FIRESTAFF_CRYSTAL'],
 ice:['MAIN_FROSTSTAFF','2H_FROSTSTAFF','2H_GLACIALSTAFF','MAIN_FROSTSTAFF_KEEPER','2H_ICEGAUNTLETS_HELL','2H_ICECRYSTAL_UNDEAD','MAIN_FROSTSTAFF_AVALON','2H_FROSTSTAFF_CRYSTAL'],
 holy:['MAIN_HOLYSTAFF','2H_HOLYSTAFF','2H_DIVINESTAFF','MAIN_HOLYSTAFF_MORGANA','2H_HOLYSTAFF_HELL','2H_HOLYSTAFF_UNDEAD','MAIN_HOLYSTAFF_AVALON','2H_HOLYSTAFF_CRYSTAL'],
 nature:['MAIN_NATURESTAFF','2H_NATURESTAFF','2H_WILDSTAFF','MAIN_NATURESTAFF_KEEPER','2H_NATURESTAFF_HELL','2H_NATURESTAFF_KEEPER','MAIN_NATURESTAFF_AVALON','MAIN_NATURESTAFF_CRYSTAL'],
 curse:['MAIN_CURSEDSTAFF','2H_CURSEDSTAFF','2H_DEMONICSTAFF','MAIN_CURSEDSTAFF_UNDEAD','2H_SKULLORB_HELL','2H_CURSEDSTAFF_MORGANA','MAIN_CURSEDSTAFF_AVALON','MAIN_CURSEDSTAFF_CRYSTAL'],
 arcane:['MAIN_ARCANESTAFF','2H_ARCANESTAFF','2H_ENIGMATICSTAFF','MAIN_ARCANESTAFF_UNDEAD','2H_ARCANESTAFF_HELL','2H_ENIGMATICORB_MORGANA','2H_ARCANE_RINGPAIR_AVALON','2H_ARCANESTAFF_CRYSTAL'],
 shapeshifter:['2H_SHAPESHIFTER_SET1','2H_SHAPESHIFTER_SET2','2H_SHAPESHIFTER_SET3','2H_SHAPESHIFTER_MORGANA','2H_SHAPESHIFTER_HELL','2H_SHAPESHIFTER_KEEPER','2H_SHAPESHIFTER_AVALON','2H_SHAPESHIFTER_CRYSTAL'],
 gloves:['2H_KNUCKLES_SET1','2H_KNUCKLES_SET2','2H_KNUCKLES_SET3','2H_KNUCKLES_KEEPER','2H_KNUCKLES_HELL','2H_KNUCKLES_MORGANA','2H_KNUCKLES_AVALON','2H_KNUCKLES_CRYSTAL']
};
const weapon=key=>id=>/^T[4-8]_/.test(id)&&WEAPON_FAMILIES[key]?.includes(id.replace(/^T[4-8]_/, '').split('@')[0]);
export const BRANCHES=[
 {key:'boots_plate',label:'Botas de placas',city:'Martlock',test:gear('SHOES','PLATE')},
 {key:'boots_cloth',label:'Zapatos de tela',city:'Bridgewatch',test:gear('SHOES','CLOTH')},
 {key:'boots_leather',label:'Zapatos de cuero',city:'Lymhurst',test:gear('SHOES','LEATHER')},
 {key:'boots_all',label:'Todas las botas y zapatos',city:null,test:id=>/^T[4-8]_SHOES_/.test(id)&&!id.includes('_GATHERER_')},
 {key:'heads_plate',label:'Cascos de placas',city:'Fort Sterling',test:gear('HEAD','PLATE')},
 {key:'heads_cloth',label:'Capuchas de tela',city:'Thetford',test:gear('HEAD','CLOTH')},
 {key:'heads_leather',label:'Capuchas de cuero',city:'Lymhurst',test:gear('HEAD','LEATHER')},
 {key:'heads_all',label:'Todos los cascos y capuchas',city:null,test:id=>/^T[4-8]_HEAD_/.test(id)&&!id.includes('_GATHERER_')},
 {key:'chests_plate',label:'Armaduras de placas',city:'Bridgewatch',test:gear('ARMOR','PLATE')},
 {key:'chests_cloth',label:'Túnicas de tela',city:'Fort Sterling',test:gear('ARMOR','CLOTH')},
 {key:'chests_leather',label:'Chaquetas de cuero',city:'Thetford',test:gear('ARMOR','LEATHER')},
 {key:'chests_all',label:'Todas las pecheras',city:null,test:id=>/^T[4-8]_ARMOR_/.test(id)&&!id.includes('_GATHERER_')},
 {key:'axe',label:'Hachas',city:'Martlock',test:weapon('axe')},
 {key:'sword',label:'Espadas',city:'Lymhurst',test:weapon('sword')},
 {key:'bow',label:'Arcos',city:'Lymhurst',test:weapon('bow')},
 {key:'crossbow',label:'Ballestas',city:'Bridgewatch',test:weapon('crossbow')},
 {key:'dagger',label:'Dagas',city:'Bridgewatch',test:weapon('dagger')},
 {key:'spear',label:'Lanzas',city:'Fort Sterling',test:weapon('spear')},
 {key:'mace',label:'Mazas',city:'Thetford',test:weapon('mace')},
 {key:'hammer',label:'Martillos',city:'Fort Sterling',test:weapon('hammer')},
 {key:'quarterstaff',label:'Bastones de combate',city:'Martlock',test:weapon('quarterstaff')},
 {key:'fire',label:'Bastones de fuego',city:'Thetford',test:weapon('fire')},
 {key:'ice',label:'Bastones de hielo',city:'Martlock',test:weapon('ice')},
 {key:'holy',label:'Bastones sagrados',city:'Fort Sterling',test:weapon('holy')},
 {key:'nature',label:'Bastones de naturaleza',city:'Thetford',test:weapon('nature')},
 {key:'curse',label:'Bastones malditos',city:'Bridgewatch',test:weapon('curse')},
 {key:'arcane',label:'Bastones arcanos',city:'Lymhurst',test:weapon('arcane')},
 {key:'shapeshifter',label:'Bastones metamorfos',city:'Caerleon',test:weapon('shapeshifter')},
 {key:'gloves',label:'Guantes de guerra',city:'Caerleon',test:weapon('gloves')},
 {key:'offhand',label:'Manos secundarias',city:'Martlock',test:byId(/^T[4-8]_OFF_/)},
 {key:'bags',label:'Bolsas',city:'Brecilien',test:byId(/^T[4-8]_BAG/)},
 {key:'capes',label:'Capas',city:'Brecilien',test:byId(/^T[4-8]_CAPE/)},
 {key:'weapons_all',label:'Todas las armas',city:null,test:byId(/^T[4-8]_(MAIN_|2H_)/)},
];

// Nuevas profesiones y familias, con restricción de venta Royal cuando aplica.
const gatheringFamily=resource=>id=>new RegExp('^T[4-8]_(?:HEAD|SHOES|ARMOR|BACKPACK)_GATHERER_'+resource+'(?:@\\d+)?$').test(id);
BRANCHES.push(
 {key:'gather_wood',label:'Leñador · equipo y mochila',city:'Caerleon',test:gatheringFamily('WOOD'),market:'royal'},
 {key:'gather_hide',label:'Desollador · equipo y mochila',city:'Caerleon',test:gatheringFamily('HIDE'),market:'royal'},
 {key:'gather_ore',label:'Minero · equipo y mochila',city:'Caerleon',test:gatheringFamily('ORE'),market:'royal'},
 {key:'gather_fiber',label:'Cosechador · equipo y mochila',city:'Caerleon',test:gatheringFamily('FIBER'),market:'royal'},
 {key:'gather_rock',label:'Cantero · equipo y mochila',city:'Caerleon',test:gatheringFamily('ROCK'),market:'royal'},
 {key:'gather_all',label:'Todo el equipo de recolección',city:'Caerleon',test:byId(/^T[4-8]_(HEAD|SHOES|ARMOR|BACKPACK)_GATHERER_/),market:'royal'},
 {key:'potion_all',label:'Todas las pociones',city:'Brecilien',test:byId(/^T[2-8]_POTION_/),market:'royal'},
 {key:'potion_heal',label:'Pociones de curación',city:'Brecilien',test:byId(/^T[2-8]_POTION_HEAL(?:@|$)/),market:'royal'},
 {key:'potion_energy',label:'Pociones de energía',city:'Brecilien',test:byId(/^T[2-8]_POTION_ENERGY(?:@|$)/),market:'royal'},
 {key:'potion_poison',label:'Pociones de veneno',city:'Brecilien',test:byId(/^T[2-8]_POTION_COOLDOWN(?:@|$)/),market:'royal'},
 {key:'mount_all',label:'Todas las monturas ensillables',city:null,test:byId(/^T[3-8]_MOUNT_(?!.*_SKIN)/),market:'royal'},
 {key:'mount_horse',label:'Caballos y caballos blindados',city:null,test:byId(/^T[3-8]_MOUNT_(?:HORSE|ARMORED_HORSE)(?:@|$)/),market:'royal'},
 {key:'mount_ox',label:'Bueyes de transporte',city:null,test:byId(/^T[3-8]_MOUNT_OX(?:@|$)/),market:'royal'},
 {key:'food_all',label:'Todas las comidas',city:'Caerleon',test:byId(/^T[1-8]_MEAL_/),market:'royal'},
 {key:'food_soup',label:'Sopas',city:'Caerleon',test:byId(/^T[1-8]_MEAL_SOUP(?:_|@|$)/),market:'royal'},
 {key:'food_salad',label:'Ensaladas',city:'Caerleon',test:byId(/^T[1-8]_MEAL_(?:SALAD|SEAWEEDSALAD)(?:_|@|$)/),market:'royal'},
 {key:'food_pie',label:'Pasteles',city:'Caerleon',test:byId(/^T[1-8]_MEAL_PIE(?:_|@|$)/),market:'royal'},
 {key:'food_omelette',label:'Tortillas',city:'Caerleon',test:byId(/^T[1-8]_MEAL_OMELETTE(?:_|@|$)/),market:'royal'},
 {key:'food_stew',label:'Guisos',city:'Caerleon',test:byId(/^T[1-8]_MEAL_STEW(?:_|@|$)/),market:'royal'},
 {key:'food_sandwich',label:'Bocadillos',city:'Caerleon',test:byId(/^T[1-8]_MEAL_SANDWICH(?:_|@|$)/),market:'royal'},
 {key:'food_roast',label:'Asados',city:'Caerleon',test:byId(/^T[1-8]_MEAL_ROAST(?:_|@|$)/),market:'royal'},
 {key:'food_fish',label:'Platos de pescado',city:'Caerleon',test:byId(/^T[1-8]_MEAL_(?:.*_FISH(?:@|$)|GRILLEDFISH(?:@|$))/),market:'royal'},
 {key:'food_avalon',label:'Comidas avalonianas',city:'Caerleon',test:byId(/^T[1-8]_MEAL_.*_AVALON(?:@|$)/),market:'royal'}
);
export function branchByKey(key){return BRANCHES.find(b=>b.key===key)||BRANCHES[0];}
export function recipesForBranch(recipes,key,minTier=4,maxTier=7,maxEnchant=1,limit=110,city='auto'){
  const b=branchByKey(key);
  const ids=Object.keys(recipes).filter(id=>{
    const m=id.match(/^T([1-8])_/);if(!m||!b.test(id))return false;
    const tier=Number(m[1]),ench=Number(id.split('@')[1]||0);
    return tier>=minTier&&tier<=maxTier&&ench<=maxEnchant&&recipes[id]?.materials?.length&&!!recipes[id]?.city&&(city==='auto'||recipes[id].city===city);
  });
  // Balance tiers so T4 variants cannot hide all T6/T7 recipes under an API size limit.
  const lanes=new Map();for(const id of ids){const t=Number(id.match(/^T(\d)/)[1]);const a=lanes.get(t)||[];a.push(id);lanes.set(t,a);}
  const result=[],active=[...lanes.keys()].sort();let index=0;
  while(result.length<limit&&active.length){for(let i=active.length-1;i>=0;i--){const arr=lanes.get(active[i]);if(index<arr.length)result.push(arr[index]);else active.splice(i,1);if(result.length>=limit)break;}index++;}
  return result;
}

// Categorías visuales: orden lógico y búsqueda sin alterar los IDs de las ramas.
export const BRANCH_CATEGORIES=[
 {key:'armor',label:'Armaduras',icon:'♜',description:'Botas, cascos y pecheras'},
 {key:'weapons',label:'Armas',icon:'⚔',description:'Todas las líneas de armas'},
 {key:'accessories',label:'Accesorios',icon:'◇',description:'Bolsas, capas y manos secundarias'},
 {key:'gathering',label:'Recolección',icon:'♧',description:'Equipos y mochilas Royal'},
 {key:'potions',label:'Pociones',icon:'⚗',description:'Alquimia · Royal'},
 {key:'mounts',label:'Monturas',icon:'♞',description:'Ensillado · Royal'},
 {key:'foods',label:'Comidas',icon:'♨',description:'Cocina · Royal'}
];
export function categoryForBranch(b){const k=typeof b==='string'?b:b?.key||'';
 if(k.startsWith('food_'))return 'foods';if(k.startsWith('gather_'))return 'gathering';if(k.startsWith('potion'))return 'potions';if(k.startsWith('mount'))return 'mounts';
 if(k==='bags'||k==='capes'||k==='offhand')return 'accessories';
 if(/^(boots|heads|chests)/.test(k))return 'armor';return 'weapons';}
export function branchIsRoyalOnly(key){return ['gathering','potions','mounts','foods'].includes(categoryForBranch(key));}
export function sortedBranches(category,query=''){
 const normalized=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const term=normalized(query).trim();return BRANCHES.filter(b=>categoryForBranch(b)===category&&(!term||normalized(b.label).includes(term)));
}


const CATEGORY_ICON_MAP={
 armor:'T4_ARMOR_PLATE_SET1',
 weapons:'T4_MAIN_AXE',
 accessories:'T4_BAG',
 gathering:'T4_ARMOR_GATHERER_WOOD',
 potions:'T4_POTION_HEAL',
 mounts:'T4_MOUNT_HORSE',
 foods:'T4_MEAL_SALAD'
};
const BRANCH_ICON_MAP={
 boots_plate:'T4_SHOES_PLATE_SET1',boots_cloth:'T4_SHOES_CLOTH_SET1',boots_leather:'T4_SHOES_LEATHER_SET1',boots_all:'T4_SHOES_PLATE_SET1',
 heads_plate:'T4_HEAD_PLATE_SET1',heads_cloth:'T4_HEAD_CLOTH_SET1',heads_leather:'T4_HEAD_LEATHER_SET1',heads_all:'T4_HEAD_PLATE_SET1',
 chests_plate:'T4_ARMOR_PLATE_SET1',chests_cloth:'T4_ARMOR_CLOTH_SET1',chests_leather:'T4_ARMOR_LEATHER_SET1',chests_all:'T4_ARMOR_PLATE_SET1',
 axe:'T4_MAIN_AXE',sword:'T4_MAIN_SWORD',bow:'T4_2H_BOW',crossbow:'T4_2H_CROSSBOW',dagger:'T4_MAIN_DAGGER',spear:'T4_MAIN_SPEAR',mace:'T4_MAIN_MACE',hammer:'T4_MAIN_HAMMER',quarterstaff:'T4_2H_QUARTERSTAFF',
 fire:'T4_MAIN_FIRESTAFF',ice:'T4_MAIN_FROSTSTAFF',holy:'T4_MAIN_HOLYSTAFF',nature:'T4_MAIN_NATURESTAFF',curse:'T4_MAIN_CURSEDSTAFF',arcane:'T4_MAIN_ARCANESTAFF',shapeshifter:'T4_2H_SHAPESHIFTER_SET1',gloves:'T4_2H_KNUCKLES_SET1',
 offhand:'T4_OFF_TORCH',bags:'T4_BAG',capes:'T4_CAPE',weapons_all:'T4_MAIN_AXE',
 gather_wood:'T4_ARMOR_GATHERER_WOOD',gather_hide:'T4_ARMOR_GATHERER_HIDE',gather_ore:'T4_ARMOR_GATHERER_ORE',gather_fiber:'T4_ARMOR_GATHERER_FIBER',gather_rock:'T4_ARMOR_GATHERER_ROCK',gather_all:'T4_ARMOR_GATHERER_WOOD',
 potion_all:'T4_POTION_HEAL',potion_heal:'T4_POTION_HEAL',potion_energy:'T4_POTION_ENERGY',potion_poison:'T4_POTION_COOLDOWN',
 mount_all:'T4_MOUNT_HORSE',mount_horse:'T4_MOUNT_HORSE',mount_ox:'T4_MOUNT_OX',
 food_all:'T4_MEAL_SALAD',food_soup:'T5_MEAL_SOUP',food_salad:'T4_MEAL_SALAD',food_pie:'T5_MEAL_PIE',food_omelette:'T5_MEAL_OMELETTE',food_stew:'T6_MEAL_STEW',food_sandwich:'T6_MEAL_SANDWICH',food_roast:'T5_MEAL_ROAST',food_fish:'T4_MEAL_SALAD_FISH',food_avalon:'T6_MEAL_STEW_AVALON'
};
export function categoryIconId(key){return CATEGORY_ICON_MAP[key]||'T4_BAG';}
export function branchIconId(key){const b=branchByKey(key);return BRANCH_ICON_MAP[b.key]||CATEGORY_ICON_MAP[categoryForBranch(b.key)]||'T4_BAG';}
for(const c of BRANCH_CATEGORIES){if(!c.iconId)c.iconId=categoryIconId(c.key);}
for(const b of BRANCHES){if(!b.iconId)b.iconId=branchIconId(b.key);}
