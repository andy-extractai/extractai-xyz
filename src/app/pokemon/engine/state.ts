import { PokemonInstance, Stats, StatusEffect } from '../data/types';
import { SPECIES, expForLevel } from '../data/pokemon';
import { MOVES } from '../data/moves';

// ===== GAME STATE =====
export interface GameState {
  phase: 'intro' | 'naming' | 'oak_speech' | 'starter_select' | 'overworld' | 'battle' | 'dialog' | 'menu' | 'shop' | 'pc' | 'evolution' | 'credits';
  player: {
    name: string;
    x: number;
    y: number;
    direction: 'up' | 'down' | 'left' | 'right';
    mapId: string;
    team: PokemonInstance[];
    pc: PokemonInstance[];
    bag: Record<string, number>;
    money: number;
    badges: string[];
    pokedex: { seen: Set<string>; caught: Set<string> };
    steps: number;
    repelSteps: number;
    hasBicycle: boolean;
    onBicycle: boolean;
    isSurfing: boolean;
    defeatedTrainers: Set<string>;
    storyFlags: Set<string>;
  };
  rival: {
    starterSpecies: string;
  };
  battle: BattleState | null;
  dialog: DialogState | null;
  menu: MenuState | null;
  shop: ShopState | null;
  pcUI: PCUIState | null;
  evolution: EvolutionState | null;
  credits: { scrollY: number; done: boolean } | null;
  transition: { type: 'fade' | 'battle'; progress: number; callback?: () => void } | null;
  battleTransition: BattleTransitionState | null;
  lastPokecenterMap: string;
  lastPokecenterX: number;
  lastPokecenterY: number;
}

export interface BattleState {
  type: 'wild' | 'trainer';
  trainerId?: string;
  trainerName?: string;
  isGymLeader?: boolean;
  isElite4?: boolean;
  playerTeam: PokemonInstance[];
  enemyTeam: PokemonInstance[];
  activePlayerIdx: number;
  activeEnemyIdx: number;
  phase: 'intro' | 'action_select' | 'move_select' | 'item_select' | 'switch_select' | 'executing' | 'message' | 'fainted' | 'victory' | 'defeat' | 'catch' | 'exp_gain' | 'level_up' | 'learn_move';
  messages: string[];
  messageIdx: number;
  turnResult?: TurnResult;
  catchAttempt?: { success: boolean; shakes: number };
  expGain?: { pokemonUid: string; amount: number; newLevel?: number };
  learnMove?: { pokemonUid: string; moveId: string; slotToReplace?: number };
  animations: BattleAnimation[];
  canRun: boolean;
  battleReward: number;
}

export interface BattleAnimation {
  type: 'shake' | 'flash' | 'hp_drain' | 'faint' | 'ball_throw' | 'exp_fill';
  target: 'player' | 'enemy';
  progress: number;
  duration: number;
  color?: string; // for type-colored flash
}

export interface BattleTransitionState {
  type: 'flash_wipe';
  progress: number;
  duration: number;
}

export interface TurnResult {
  messages: string[];
  playerDamage: number;
  enemyDamage: number;
  playerFainted: boolean;
  enemyFainted: boolean;
  playerStatus?: StatusEffect;
  enemyStatus?: StatusEffect;
  crit?: boolean;
  effectiveness?: number;
}

export interface DialogState {
  lines: string[];
  currentLine: number;
  charIndex: number;
  done: boolean;
  onComplete?: () => void;
  speaker?: string;
}

export interface MenuState {
  screen: 'main' | 'pokemon' | 'bag' | 'pokedex' | 'save' | 'options' | 'pokemon_detail' | 'map';
  selectedIndex: number;
  subIndex: number;
  selectedPokemon?: number;
}

export interface ShopState {
  items: { itemId: string }[];
  selectedIndex: number;
  mode: 'buy' | 'sell' | 'select';
  quantity: number;
  mapId: string;
}

export interface PCUIState {
  mode: 'main' | 'deposit' | 'withdraw';
  selectedIndex: number;
}

export interface EvolutionState {
  pokemon: PokemonInstance;
  fromSpecies: string;
  toSpecies: string;
  progress: number;
  done: boolean;
}

// ===== POKEMON CREATION =====
let uidCounter = 0;
export function generateUid(): string {
  return `pkmn_${Date.now()}_${uidCounter++}`;
}

function randomIv(): number {
  return Math.floor(Math.random() * 16);
}

function generateIvs(): Stats {
  return { hp: randomIv(), attack: randomIv(), defense: randomIv(), spAtk: randomIv(), spDef: randomIv(), speed: randomIv() };
}

export function calcStats(species: string, level: number, iv: Stats): Stats {
  const base = SPECIES[species].baseStats;
  const hp = Math.floor(((base.hp + iv.hp) * 2 * level) / 100) + level + 10;
  const calc = (b: number, i: number) => Math.floor(((b + i) * 2 * level) / 100) + 5;
  return {
    hp,
    attack: calc(base.attack, iv.attack),
    defense: calc(base.defense, iv.defense),
    spAtk: calc(base.spAtk, iv.spAtk),
    spDef: calc(base.spDef, iv.spDef),
    speed: calc(base.speed, iv.speed),
  };
}

export function createPokemon(speciesId: string, level: number, ivOverride?: Stats): PokemonInstance {
  const species = SPECIES[speciesId];
  if (!species) throw new Error(`Unknown species: ${speciesId}`);
  
  const iv = ivOverride || generateIvs();
  const stats = calcStats(speciesId, level, iv);
  
  // Get moves for this level
  const learnedMoves = species.learnset
    .filter(m => m.level <= level)
    .slice(-4); // last 4 moves learned
  
  const moves = learnedMoves.map(m => ({
    moveId: m.moveId,
    currentPp: MOVES[m.moveId]?.pp || 10,
  }));

  return {
    uid: generateUid(),
    speciesId,
    level,
    exp: expForLevel(level),
    currentHp: stats.hp,
    stats,
    moves,
    status: null,
    iv,
  };
}

// ===== INITIAL STATE =====
export function createInitialState(): GameState {
  return {
    phase: 'intro',
    player: {
      name: '',
      x: 5,
      y: 6,
      direction: 'down',
      mapId: 'player_house',
      team: [],
      pc: [],
      bag: { pokeball: 5, potion: 3 },
      money: 3000,
      badges: [],
      pokedex: { seen: new Set(), caught: new Set() },
      steps: 0,
      repelSteps: 0,
      hasBicycle: false,
      onBicycle: false,
      isSurfing: false,
      defeatedTrainers: new Set(),
      storyFlags: new Set(),
    },
    rival: { starterSpecies: 'aqualing' },
    battle: null,
    dialog: null,
    menu: null,
    shop: null,
    pcUI: null,
    evolution: null,
    credits: null,
    transition: null,
    battleTransition: null,
    lastPokecenterMap: 'player_house',
    lastPokecenterX: 3,
    lastPokecenterY: 5,
  };
}

// ===== SAVE/LOAD =====
export function saveGame(state: GameState): void {
  const serializable = {
    ...state,
    player: {
      ...state.player,
      pokedex: {
        seen: Array.from(state.player.pokedex.seen),
        caught: Array.from(state.player.pokedex.caught),
      },
      defeatedTrainers: Array.from(state.player.defeatedTrainers),
      storyFlags: Array.from(state.player.storyFlags),
    },
    battle: null,
    dialog: null,
    menu: null,
    shop: null,
    pcUI: null,
    evolution: null,
    credits: null,
    transition: null,
  };
  try {
    localStorage.setItem('pokemon_save', JSON.stringify(serializable));
  } catch { /* ignore */ }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem('pokemon_save');
    if (!raw) return null;
    const data = JSON.parse(raw);
    data.player.pokedex = {
      seen: new Set(data.player.pokedex.seen),
      caught: new Set(data.player.pokedex.caught),
    };
    data.player.defeatedTrainers = new Set(data.player.defeatedTrainers);
    data.player.storyFlags = new Set(data.player.storyFlags);
    if (!data.player.pc) data.player.pc = [];
    if (data.player.isSurfing === undefined) data.player.isSurfing = false;
    data.pcUI = null;
    data.battleTransition = null;
    return data as GameState;
  } catch {
    return null;
  }
}
