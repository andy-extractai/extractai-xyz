import { PokemonInstance, StatusEffect } from '../data/types';
import { SPECIES, expToNextLevel, expForLevel } from '../data/pokemon';
import { MOVES } from '../data/moves';
import { getEffectiveness } from '../data/types';
import { BattleState, TurnResult, calcStats, createPokemon } from './state';

// ===== DAMAGE CALCULATION =====
export function calculateDamage(
  attacker: PokemonInstance, defender: PokemonInstance, moveId: string
): { damage: number; crit: boolean; effectiveness: number } {
  const move = MOVES[moveId];
  if (!move || move.power === 0) return { damage: 0, crit: false, effectiveness: 1 };

  const atkSpecies = SPECIES[attacker.speciesId];
  const defSpecies = SPECIES[defender.speciesId];

  // Physical vs special
  const atk = move.category === 'physical' ? attacker.stats.attack : attacker.stats.spAtk;
  const def = move.category === 'physical' ? defender.stats.defense : defender.stats.spDef;

  // Critical hit
  const critChance = move.name === 'Slash' ? 0.25 : 0.0625;
  const crit = Math.random() < critChance;
  const critMult = crit ? 1.5 : 1;

  // STAB
  const stab = atkSpecies.types.includes(move.type) ? 1.5 : 1;

  // Type effectiveness
  const effectiveness = getEffectiveness(move.type, defSpecies.types);

  // Random factor
  const rand = 0.85 + Math.random() * 0.15;

  // Burn reduces physical damage
  const burnMod = (attacker.status === 'burn' && move.category === 'physical') ? 0.5 : 1;

  const damage = Math.max(1, Math.floor(
    ((2 * attacker.level / 5 + 2) * move.power * atk / def / 50 + 2)
    * critMult * stab * effectiveness * rand * burnMod
  ));

  return { damage, crit, effectiveness };
}

// ===== ACCURACY CHECK =====
export function doesMoveHit(move: string, attacker: PokemonInstance, defender: PokemonInstance): boolean {
  const moveData = MOVES[move];
  if (!moveData) return false;
  if (moveData.accuracy === 0) return true; // always hits
  
  // Paralysis: 25% chance to not move
  if (attacker.status === 'paralyze' && Math.random() < 0.25) return false;
  
  return Math.random() * 100 < moveData.accuracy;
}

// ===== STATUS EFFECTS =====
export function applyStatusDamage(pokemon: PokemonInstance): { damage: number; message: string } | null {
  if (pokemon.status === 'poison') {
    const dmg = Math.max(1, Math.floor(pokemon.stats.hp / 8));
    pokemon.currentHp = Math.max(0, pokemon.currentHp - dmg);
    return { damage: dmg, message: `${SPECIES[pokemon.speciesId].name} is hurt by poison!` };
  }
  if (pokemon.status === 'burn') {
    const dmg = Math.max(1, Math.floor(pokemon.stats.hp / 16));
    pokemon.currentHp = Math.max(0, pokemon.currentHp - dmg);
    return { damage: dmg, message: `${SPECIES[pokemon.speciesId].name} is hurt by its burn!` };
  }
  return null;
}

export function canAct(pokemon: PokemonInstance): { canAct: boolean; message?: string } {
  if (pokemon.status === 'sleep') {
    if (Math.random() < 0.33) {
      pokemon.status = null;
      return { canAct: true, message: `${SPECIES[pokemon.speciesId].name} woke up!` };
    }
    return { canAct: false, message: `${SPECIES[pokemon.speciesId].name} is fast asleep!` };
  }
  if (pokemon.status === 'freeze') {
    if (Math.random() < 0.2) {
      pokemon.status = null;
      return { canAct: true, message: `${SPECIES[pokemon.speciesId].name} thawed out!` };
    }
    return { canAct: false, message: `${SPECIES[pokemon.speciesId].name} is frozen solid!` };
  }
  if (pokemon.status === 'paralyze') {
    if (Math.random() < 0.25) {
      return { canAct: false, message: `${SPECIES[pokemon.speciesId].name} is paralyzed! It can't move!` };
    }
  }
  return { canAct: true };
}

// ===== EXECUTE TURN =====
export interface BattleAction {
  type: 'move' | 'item' | 'switch' | 'run';
  moveIdx?: number;
  itemId?: string;
  switchIdx?: number;
}

export function executeTurn(
  battle: BattleState,
  playerAction: BattleAction,
): TurnResult {
  const player = battle.playerTeam[battle.activePlayerIdx];
  const enemy = battle.enemyTeam[battle.activeEnemyIdx];
  const messages: string[] = [];
  let playerDamage = 0, enemyDamage = 0;
  let playerFainted = false, enemyFainted = false;

  if (playerAction.type === 'run') {
    if (!battle.canRun) {
      messages.push("Can't escape from a trainer battle!");
    } else {
      const escapeChance = (player.stats.speed * 128 / Math.max(1, enemy.stats.speed) + 30) / 256;
      if (Math.random() < Math.min(0.95, escapeChance)) {
        messages.push('Got away safely!');
        return { messages, playerDamage: 0, enemyDamage: 0, playerFainted: false, enemyFainted: false };
      } else {
        messages.push("Couldn't escape!");
      }
    }
  }

  if (playerAction.type === 'switch' && playerAction.switchIdx !== undefined) {
    battle.activePlayerIdx = playerAction.switchIdx;
    const newPoke = battle.playerTeam[battle.activePlayerIdx];
    messages.push(`Go! ${SPECIES[newPoke.speciesId].name}!`);
    
    // Enemy still attacks
    const enemyResult = executeMove(enemy, newPoke, selectEnemyMove(enemy), messages);
    if (enemyResult) { playerDamage = enemyResult.damage; }
    if (newPoke.currentHp <= 0) playerFainted = true;
    
    return { messages, playerDamage, enemyDamage, playerFainted, enemyFainted };
  }

  if (playerAction.type === 'item') {
    messages.push(`Used ${playerAction.itemId}!`);
    // Enemy attacks
    const enemyResult = executeMove(enemy, player, selectEnemyMove(enemy), messages);
    if (enemyResult) { playerDamage = enemyResult.damage; }
    if (player.currentHp <= 0) playerFainted = true;
    return { messages, playerDamage, enemyDamage, playerFainted, enemyFainted };
  }

  // Move execution - speed determines order
  if (playerAction.type === 'move' && playerAction.moveIdx !== undefined) {
    const playerMove = player.moves[playerAction.moveIdx]?.moveId;
    const enemyMove = selectEnemyMove(enemy);

    const playerFirst = player.stats.speed >= enemy.stats.speed;
    
    const first = playerFirst ? player : enemy;
    const second = playerFirst ? enemy : player;
    const firstMove = playerFirst ? playerMove : enemyMove;
    const secondMove = playerFirst ? enemyMove : playerMove;
    const firstTarget = playerFirst ? enemy : player;
    const secondTarget = playerFirst ? player : enemy;

    // First attacker
    const res1 = executeMove(first, firstTarget, firstMove, messages);
    if (res1) {
      if (playerFirst) { enemyDamage = res1.damage; }
      else { playerDamage = res1.damage; }
    }

    // Check if target fainted
    if (firstTarget.currentHp <= 0) {
      if (playerFirst) {
        enemyFainted = true;
        messages.push(`${SPECIES[enemy.speciesId].name} fainted!`);
      } else {
        playerFainted = true;
        messages.push(`${SPECIES[player.speciesId].name} fainted!`);
      }
    } else {
      // Second attacker
      const res2 = executeMove(second, secondTarget, secondMove, messages);
      if (res2) {
        if (playerFirst) { playerDamage = res2.damage; }
        else { enemyDamage = res2.damage; }
      }

      if (secondTarget.currentHp <= 0) {
        if (playerFirst) {
          playerFainted = true;
          messages.push(`${SPECIES[player.speciesId].name} fainted!`);
        } else {
          enemyFainted = true;
          messages.push(`${SPECIES[enemy.speciesId].name} fainted!`);
        }
      }
    }

    // End-of-turn status
    if (!playerFainted) {
      const statusResult = applyStatusDamage(player);
      if (statusResult) {
        messages.push(statusResult.message);
        if (player.currentHp <= 0) {
          playerFainted = true;
          messages.push(`${SPECIES[player.speciesId].name} fainted!`);
        }
      }
    }
    if (!enemyFainted) {
      const statusResult = applyStatusDamage(enemy);
      if (statusResult) {
        messages.push(statusResult.message);
        if (enemy.currentHp <= 0) {
          enemyFainted = true;
          messages.push(`${SPECIES[enemy.speciesId].name} fainted!`);
        }
      }
    }
  }

  return { messages, playerDamage, enemyDamage, playerFainted, enemyFainted };
}

function executeMove(
  attacker: PokemonInstance, defender: PokemonInstance, moveId: string, messages: string[]
): { damage: number } | null {
  const move = MOVES[moveId];
  if (!move) return null;
  
  const atkName = SPECIES[attacker.speciesId].name;
  
  // Check if can act
  const actCheck = canAct(attacker);
  if (actCheck.message) messages.push(actCheck.message);
  if (!actCheck.canAct) return null;

  messages.push(`${atkName} used ${move.name}!`);
  
  // Deduct PP
  const moveSlot = attacker.moves.find(m => m.moveId === moveId);
  if (moveSlot && moveSlot.currentPp > 0) moveSlot.currentPp--;

  // Check accuracy
  if (!doesMoveHit(moveId, attacker, defender)) {
    messages.push("It missed!");
    return null;
  }

  // Status moves
  if (move.category === 'status') {
    if (move.effect === 'heal') {
      const healAmount = Math.floor(attacker.stats.hp / 2);
      attacker.currentHp = Math.min(attacker.stats.hp, attacker.currentHp + healAmount);
      messages.push(`${atkName} restored health!`);
      return null;
    }
    if (move.effect && ['poison', 'burn', 'paralyze', 'sleep', 'freeze'].includes(move.effect)) {
      if (defender.status === null) {
        defender.status = move.effect as StatusEffect;
        const statusNames: Record<string, string> = {
          poison: 'poisoned', burn: 'burned', paralyze: 'paralyzed',
          sleep: 'fell asleep', freeze: 'was frozen',
        };
        messages.push(`${SPECIES[defender.speciesId].name} ${statusNames[move.effect]}!`);
      } else {
        messages.push("But it failed!");
      }
      return null;
    }
    if (move.effect === 'stat-down') {
      messages.push(`${SPECIES[defender.speciesId].name}'s stats fell!`);
      // Simple implementation: reduce attack by 10%
      defender.stats.attack = Math.max(1, Math.floor(defender.stats.attack * 0.9));
      return null;
    }
    return null;
  }

  // Damage moves
  const { damage, crit, effectiveness } = calculateDamage(attacker, defender, moveId);
  defender.currentHp = Math.max(0, defender.currentHp - damage);
  
  if (crit) messages.push("A critical hit!");
  if (effectiveness > 1) messages.push("It's super effective!");
  else if (effectiveness > 0 && effectiveness < 1) messages.push("It's not very effective...");
  else if (effectiveness === 0) messages.push("It doesn't affect the target...");

  // Status effect from damaging move
  if (move.effect && move.effectChance && defender.status === null) {
    if (['poison', 'burn', 'paralyze', 'sleep', 'freeze'].includes(move.effect)) {
      if (Math.random() * 100 < move.effectChance) {
        defender.status = move.effect as StatusEffect;
        const statusNames: Record<string, string> = {
          poison: 'poisoned', burn: 'burned', paralyze: 'paralyzed',
          sleep: 'fell asleep', freeze: 'was frozen',
        };
        messages.push(`${SPECIES[defender.speciesId].name} was ${statusNames[move.effect]}!`);
      }
    }
  }

  // Drain moves
  if (move.effect === 'heal' && damage > 0) {
    const healAmt = Math.max(1, Math.floor(damage / 2));
    attacker.currentHp = Math.min(attacker.stats.hp, attacker.currentHp + healAmt);
    messages.push(`${atkName} drained energy!`);
  }

  return { damage };
}

function selectEnemyMove(pokemon: PokemonInstance): string {
  const usableMoves = pokemon.moves.filter(m => m.currentPp > 0 && MOVES[m.moveId]);
  if (usableMoves.length === 0) return 'tackle'; // struggle equivalent
  return usableMoves[Math.floor(Math.random() * usableMoves.length)].moveId;
}

// ===== EXP & LEVELING =====
export function calculateExpGain(defeated: PokemonInstance, isTrainer: boolean): number {
  const species = SPECIES[defeated.speciesId];
  const a = isTrainer ? 1.5 : 1;
  return Math.floor((species.expYield * defeated.level * a) / 7);
}

export function gainExp(pokemon: PokemonInstance, amount: number): { leveledUp: boolean; newLevel: number; newMoves: string[] } {
  pokemon.exp += amount;
  let leveledUp = false;
  const newMoves: string[] = [];
  
  while (pokemon.level < 100 && pokemon.exp >= expForLevel(pokemon.level + 1)) {
    pokemon.level++;
    leveledUp = true;
    
    // Recalc stats
    const oldMaxHp = pokemon.stats.hp;
    pokemon.stats = calcStats(pokemon.speciesId, pokemon.level, pokemon.iv);
    // Heal the HP difference
    pokemon.currentHp += pokemon.stats.hp - oldMaxHp;
    
    // Check for new moves
    const species = SPECIES[pokemon.speciesId];
    const learned = species.learnset.filter(m => m.level === pokemon.level);
    for (const m of learned) {
      if (!pokemon.moves.find(pm => pm.moveId === m.moveId)) {
        newMoves.push(m.moveId);
      }
    }
  }
  
  return { leveledUp, newLevel: pokemon.level, newMoves };
}

// ===== CATCH CALCULATION =====
export function attemptCatch(pokemon: PokemonInstance, ballType: string): { success: boolean; shakes: number } {
  const species = SPECIES[pokemon.speciesId];
  const ballBonus = ballType === 'ultraball' ? 2 : ballType === 'greatball' ? 1.5 : 1;
  const statusBonus = pokemon.status === 'sleep' || pokemon.status === 'freeze' ? 2 : 
                       pokemon.status ? 1.5 : 1;
  
  const catchRate = species.catchRate;
  const hpFactor = (3 * pokemon.stats.hp - 2 * pokemon.currentHp) / (3 * pokemon.stats.hp);
  
  const modifiedRate = Math.min(255, Math.floor(catchRate * hpFactor * ballBonus * statusBonus));
  
  if (modifiedRate >= 255) return { success: true, shakes: 3 };
  
  const shakeProbability = Math.floor(65536 / Math.pow(255 / modifiedRate, 0.1875));
  let shakes = 0;
  for (let i = 0; i < 4; i++) {
    if (Math.random() * 65536 < shakeProbability) shakes++;
    else break;
  }
  
  return { success: shakes >= 4, shakes: Math.min(shakes, 3) };
}

// ===== EVOLUTION CHECK =====
export function checkEvolution(pokemon: PokemonInstance): string | null {
  const species = SPECIES[pokemon.speciesId];
  if (species.evolutionLevel && species.evolvesTo && pokemon.level >= species.evolutionLevel) {
    return species.evolvesTo;
  }
  return null;
}

export function evolvePokemon(pokemon: PokemonInstance, newSpeciesId: string): void {
  pokemon.speciesId = newSpeciesId;
  pokemon.stats = calcStats(newSpeciesId, pokemon.level, pokemon.iv);
  // Keep HP ratio
  const ratio = pokemon.currentHp / pokemon.stats.hp;
  pokemon.stats = calcStats(newSpeciesId, pokemon.level, pokemon.iv);
  pokemon.currentHp = Math.max(1, Math.floor(pokemon.stats.hp * ratio));
}

// ===== WILD ENCOUNTER =====
export function rollWildEncounter(encounters: { speciesId: string; minLevel: number; maxLevel: number; weight: number }[], rate: number): { speciesId: string; level: number } | null {
  if (Math.random() * 100 >= rate) return null;
  if (encounters.length === 0) return null;
  
  const totalWeight = encounters.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  
  for (const enc of encounters) {
    roll -= enc.weight;
    if (roll <= 0) {
      const level = enc.minLevel + Math.floor(Math.random() * (enc.maxLevel - enc.minLevel + 1));
      return { speciesId: enc.speciesId, level };
    }
  }
  
  const last = encounters[encounters.length - 1];
  return { speciesId: last.speciesId, level: last.minLevel };
}
