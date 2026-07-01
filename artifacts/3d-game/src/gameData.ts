// ── Character definitions ──────────────────────────────────────────────────
export interface CharacterDef {
  id: number;
  name: string;
  gender: 'boy' | 'girl';
  color: string;
  helmetColor: string;
  bonus: string;
  skillName: string;
  skillDesc: string;
  skillType: 'passive' | 'active';
  speedBonus: number;
  hpBonus: number;
  dmgBonus: number;
  dmgReduce?: number;   // % dmg reduction
  healOnKill?: number;  // HP regen per kill
  doubleJump?: boolean;
  healRegen?: boolean;
}

// ── Weapon definitions ────────────────────────────────────────────────────
export type WeaponCategory = 'assault' | 'sniper' | 'smg' | 'shotgun' | 'pistol';

export interface WeaponDef {
  id: number;
  name: string;
  category: WeaponCategory;
  icon: string;
  cooldown: number;
  price: number;
  spread?: boolean;
  spreadCount?: number;
  oneShot?: boolean;
  description: string;
  bulletColor: string;
  dmgMult?: number;
  rangeMult?: number;
}

// ── Cosmetics ────────────────────────────────────────────────────────────
export type CosmeticCategory = 'top' | 'pants' | 'weapon-skin';

export interface CosmeticItem {
  id: string;
  category: CosmeticCategory;
  name: string;
  colorOverride: string;
  price: number;
}

export interface Outfit {
  topId: string;
  pantsId: string;
  weaponSkinId: string;
}

export const DEFAULT_OUTFIT: Outfit = { topId: 'top-0', pantsId: 'pants-0', weaponSkinId: 'ws-0' };

// ── Game mode ────────────────────────────────────────────────────────────
export type GameMode = 'quick' | 'battle-royale' | 'multiplayer';

// ─────────────────────────────────────────────────────────────────────────
export const CHARACTERS: CharacterDef[] = [
  {
    id: 0, name: 'Alex', gender: 'boy', color: '#2255cc', helmetColor: '#334466',
    bonus: '+10% vitesse', skillName: 'Sprint', skillType: 'passive',
    skillDesc: 'Déplacement 10% plus rapide en permanence.',
    speedBonus: 1.1, hpBonus: 0, dmgBonus: 1,
  },
  {
    id: 1, name: 'Kai', gender: 'boy', color: '#228844', helmetColor: '#1a5533',
    bonus: '+15 HP max', skillName: 'Endurance', skillType: 'passive',
    skillDesc: 'Points de vie maximum augmentés de 15.',
    speedBonus: 1.0, hpBonus: 15, dmgBonus: 1,
  },
  {
    id: 2, name: 'Luna', gender: 'girl', color: '#dd44aa', helmetColor: '#aa2277',
    bonus: '+20% dégâts', skillName: 'Précision', skillType: 'passive',
    skillDesc: 'Chaque balle inflige 20% de dégâts supplémentaires.',
    speedBonus: 1.0, hpBonus: 0, dmgBonus: 1.2,
  },
  {
    id: 3, name: 'Zara', gender: 'girl', color: '#9933cc', helmetColor: '#662299',
    bonus: 'Régén. HP', skillName: 'Récupération', skillType: 'passive',
    skillDesc: 'Régénère 2 HP toutes les 3 secondes.',
    speedBonus: 1.0, hpBonus: 0, dmgBonus: 1, healRegen: true,
  },
  {
    id: 4, name: 'Nova', gender: 'girl', color: '#ddbb00', helmetColor: '#aa8800',
    bonus: 'Double saut', skillName: 'Bond', skillType: 'passive',
    skillDesc: 'Peut effectuer un deuxième saut dans les airs.',
    speedBonus: 1.0, hpBonus: 0, dmgBonus: 1, doubleJump: true,
  },
  {
    id: 5, name: 'Kelly', gender: 'girl', color: '#ff7722', helmetColor: '#cc4400',
    bonus: '+20% vitesse', skillName: 'Agilité', skillType: 'passive',
    skillDesc: 'Vitesse de déplacement augmentée de 20%.',
    speedBonus: 1.2, hpBonus: 0, dmgBonus: 1,
  },
  {
    id: 6, name: 'Alok', gender: 'boy', color: '#00aa99', helmetColor: '#007766',
    bonus: 'Régén zone', skillName: 'Zone de soin', skillType: 'active',
    skillDesc: 'Régénère 5 HP/s en permanence (compétence passive améliorée).',
    speedBonus: 1.0, hpBonus: 0, dmgBonus: 1, healRegen: true,
  },
  {
    id: 7, name: 'Andrew', gender: 'boy', color: '#cc2222', helmetColor: '#881111',
    bonus: '-15% dégâts reçus', skillName: 'Bouclier', skillType: 'passive',
    skillDesc: 'Réduit tous les dégâts reçus de 15%.',
    speedBonus: 1.0, hpBonus: 0, dmgBonus: 1, dmgReduce: 0.15,
  },
  {
    id: 8, name: 'Kapella', gender: 'girl', color: '#44cc88', helmetColor: '#228855',
    bonus: '+25 HP max', skillName: 'Garde', skillType: 'passive',
    skillDesc: 'Points de vie maximum augmentés de 25.',
    speedBonus: 1.0, hpBonus: 25, dmgBonus: 1,
  },
  {
    id: 9, name: 'Moco', gender: 'girl', color: '#00ccff', helmetColor: '#0088bb',
    bonus: 'Tir rapide', skillName: 'Marquage', skillType: 'passive',
    skillDesc: 'Cadence de tir améliorée de 10%.',
    speedBonus: 1.0, hpBonus: 0, dmgBonus: 1,
  },
  {
    id: 10, name: 'Jota', gender: 'boy', color: '#996633', helmetColor: '#664422',
    bonus: 'Soin sur kill', skillName: 'Recyclage', skillType: 'passive',
    skillDesc: 'Récupère 10 HP à chaque ennemi éliminé.',
    speedBonus: 1.0, hpBonus: 0, dmgBonus: 1, healOnKill: 10,
  },
  {
    id: 11, name: 'Wukong', gender: 'boy', color: '#ccaa00', helmetColor: '#886600',
    bonus: '+15% vitesse & HP', skillName: 'Duel', skillType: 'active',
    skillDesc: 'Vitesse augmentée et HP bonus cumulés.',
    speedBonus: 1.15, hpBonus: 10, dmgBonus: 1,
  },
];

// ─────────────────────────────────────────────────────────────────────────
export const WEAPONS: WeaponDef[] = [
  // ── Pistols (starter) ──────────────────────────
  { id:  0, category:'pistol',  name:'Pistolet',        icon:'🔫', cooldown:220, price:  0, bulletColor:'#ffee44', description:'Arme de départ équilibrée', dmgMult:1.0, rangeMult:1.0 },
  { id:  1, category:'pistol',  name:'Desert Eagle',    icon:'🔫', cooldown:360, price: 80, bulletColor:'#ffcc00', description:'Puissant, tir lent', dmgMult:1.5, rangeMult:1.2, oneShot:true },
  { id:  2, category:'pistol',  name:'Glock 18',        icon:'🔫', cooldown:130, price: 90, bulletColor:'#eeee00', description:'Semi-auto rapide', dmgMult:0.8, rangeMult:0.9 },
  // ── SMGs ──────────────────────────────────────
  { id:  3, category:'smg',     name:'UMP45',           icon:'⚡', cooldown: 95, price:120, bulletColor:'#ff9900', description:'SMG polyvalent', dmgMult:0.9, rangeMult:0.85 },
  { id:  4, category:'smg',     name:'MP5',             icon:'⚡', cooldown: 72, price:130, bulletColor:'#ffaa00', description:'Cadence très élevée', dmgMult:0.8, rangeMult:0.8 },
  { id:  5, category:'smg',     name:'P90',             icon:'⚡', cooldown: 60, price:160, bulletColor:'#ffbb00', description:'Tir le plus rapide', dmgMult:0.75, rangeMult:0.75 },
  // ── Assault Rifles ────────────────────────────
  { id:  6, category:'assault', name:'M4A1',            icon:'🎯', cooldown: 95, price:150, bulletColor:'#ff8800', description:'AR équilibré', dmgMult:1.0, rangeMult:1.2 },
  { id:  7, category:'assault', name:'AK-47',           icon:'🎯', cooldown:110, price:180, bulletColor:'#ff6600', description:'Puissant, recul fort', dmgMult:1.3, rangeMult:1.1 },
  { id:  8, category:'assault', name:'SCAR-L',          icon:'🎯', cooldown: 88, price:200, bulletColor:'#ff9922', description:'Précis à distance', dmgMult:1.1, rangeMult:1.4 },
  { id:  9, category:'assault', name:'M416',            icon:'🎯', cooldown: 92, price:160, bulletColor:'#ffaa22', description:'Meilleure stabilité', dmgMult:1.0, rangeMult:1.3 },
  { id: 10, category:'assault', name:'Groza',           icon:'🎯', cooldown: 80, price:280, bulletColor:'#ff4400', description:'AR de pointe', dmgMult:1.2, rangeMult:1.15 },
  { id: 11, category:'assault', name:'AN94',            icon:'🎯', cooldown: 85, price:220, bulletColor:'#ff8844', description:'Rafale précise', dmgMult:1.15, rangeMult:1.25 },
  // ── Shotguns ──────────────────────────────────
  { id: 12, category:'shotgun', name:'M1887',           icon:'💥', cooldown:480, price:200, bulletColor:'#ff3300', description:'3 balles — effet zone', spread:true, spreadCount:3, dmgMult:1.0, rangeMult:0.6 },
  { id: 13, category:'shotgun', name:'S1897',           icon:'💥', cooldown:550, price:160, bulletColor:'#ff4422', description:'Pompe classique', spread:true, spreadCount:3, dmgMult:0.9, rangeMult:0.55 },
  { id: 14, category:'shotgun', name:'SPAS-12',         icon:'💥', cooldown:420, price:260, bulletColor:'#ff2200', description:'5 balles en éventail', spread:true, spreadCount:5, dmgMult:0.8, rangeMult:0.5 },
  // ── Snipers ───────────────────────────────────
  { id: 15, category:'sniper',  name:'AWM',             icon:'🔭', cooldown:2200,price:400, bulletColor:'#00eeff', description:'1 tir = 1 kill', oneShot:true, dmgMult:5.0, rangeMult:3.0 },
  { id: 16, category:'sniper',  name:'Kar98k',          icon:'🔭', cooldown:1600,price:300, bulletColor:'#22ddff', description:'Sniper classique', oneShot:true, dmgMult:4.0, rangeMult:2.5 },
  { id: 17, category:'sniper',  name:'SKS',             icon:'🔭', cooldown: 900,price:240, bulletColor:'#44ccff', description:'Semi-auto longue portée', dmgMult:2.0, rangeMult:2.0 },
];

export const WEAPON_CATEGORIES: { id: WeaponCategory; label: string; icon: string }[] = [
  { id: 'pistol',  label: 'Pistolets',      icon: '🔫' },
  { id: 'smg',     label: 'Mitraill.',      icon: '⚡' },
  { id: 'assault', label: 'Fusils AR',      icon: '🎯' },
  { id: 'shotgun', label: 'Pompes',         icon: '💥' },
  { id: 'sniper',  label: 'Snipers',        icon: '🔭' },
];

// ─────────────────────────────────────────────────────────────────────────
export const COSMETICS: CosmeticItem[] = [
  // Tops
  { id:'top-0', category:'top',         name:'Tenue de base',       colorOverride:'', price:0 },
  { id:'top-1', category:'top',         name:'Treillis militaire',  colorOverride:'#445533', price:50 },
  { id:'top-2', category:'top',         name:'Veste rouge',         colorOverride:'#cc2222', price:80 },
  { id:'top-3', category:'top',         name:'Hoodie noir',         colorOverride:'#222222', price:100 },
  { id:'top-4', category:'top',         name:'Tenue dorée',         colorOverride:'#aa8800', price:200 },
  { id:'top-5', category:'top',         name:'Armure de combat',    colorOverride:'#445566', price:150 },
  // Pants
  { id:'pants-0', category:'pants',     name:'Pantalon cargo',      colorOverride:'', price:0 },
  { id:'pants-1', category:'pants',     name:'Jean bleu',           colorOverride:'#224488', price:60 },
  { id:'pants-2', category:'pants',     name:'Camo vert',           colorOverride:'#335533', price:70 },
  { id:'pants-3', category:'pants',     name:'Short noir',          colorOverride:'#333333', price:80 },
  { id:'pants-4', category:'pants',     name:'Pantalon rouge',      colorOverride:'#882222', price:90 },
  // Weapon skins (affect bullet color)
  { id:'ws-0', category:'weapon-skin',  name:'Défaut',              colorOverride:'', price:0 },
  { id:'ws-1', category:'weapon-skin',  name:'Or brillant',         colorOverride:'#ffd700', price:100 },
  { id:'ws-2', category:'weapon-skin',  name:'Bleu électrique',     colorOverride:'#0088ff', price:120 },
  { id:'ws-3', category:'weapon-skin',  name:'Dragon rouge',        colorOverride:'#ff2200', price:150 },
  { id:'ws-4', category:'weapon-skin',  name:'Camoflage digital',   colorOverride:'#556644', price:180 },
];

export const MODES = [
  { id:'quick'        as GameMode, name:'Partie Rapide',  icon:'⚡', description:'Élimine 5 ennemis. Simple et rapide.', enemyCount:5,  color:'#2255cc' },
  { id:'battle-royale'as GameMode, name:'Battle Royale',  icon:'🏆', description:'20 bots, zone qui rétrécit. Dernier survivant.', enemyCount:20, color:'#ff6600' },
  { id:'multiplayer'  as GameMode, name:'Multijoueur',    icon:'👥', description:'8 ennemis + un allié IA à tes côtés.', enemyCount:8,  color:'#00aa88' },
];

export const GOLD_PER_KILL = 20;
export const GOLD_WIN_BONUS = 50;
export const GOLD_BR_WIN = 200;
