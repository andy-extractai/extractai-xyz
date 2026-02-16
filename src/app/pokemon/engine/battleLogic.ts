import { GameState, createPokemon, calcStats } from './state';
import { executeTurn, calculateExpGain, gainExp, attemptCatch, checkEvolution, evolvePokemon, BattleAction } from './battle';
import { SPECIES } from '../data/pokemon';
import { MOVES } from '../data/moves';
import { ITEMS } from '../data/items';
import { GYM_ORDER } from '../data/trainers';
import { buildTurnAnimations, createExpFillAnimation, getTypeFlashColor } from './animations';

export function executeBattleAction(prev: GameState, action: BattleAction): GameState {
  if (!prev.battle) return prev;
  const b = { ...prev.battle };
  const result = executeTurn(b, action);
  if (action.type === 'run' && result.messages.includes('Got away safely!')) {
    return { ...prev, phase: 'overworld', battle: null, player: { ...prev.player, team: [...b.playerTeam] } };
  }
  b.messages = result.messages;
  b.messageIdx = 0;
  b.phase = 'message';
  b.turnResult = result;

  // Build animations for this turn
  const anims = buildTurnAnimations(
    result.effectiveness,
    result.playerFainted,
    result.enemyFainted,
    result.playerDamage,
    result.enemyDamage,
  );

  // Add type-colored flash if a move was used
  if (action.type === 'move' && action.moveIdx !== undefined) {
    const playerPoke = b.playerTeam[b.activePlayerIdx];
    const moveId = playerPoke.moves[action.moveIdx]?.moveId;
    const moveData = moveId ? MOVES[moveId] : null;
    if (moveData && result.enemyDamage > 0) {
      const flashColor = getTypeFlashColor(moveData.type);
      const flash = anims.find(a => a.type === 'flash' && a.target === 'enemy');
      if (flash) flash.color = flashColor;
    }
  }

  b.animations = anims;
  return { ...prev, battle: b };
}

export function handlePostMessage(prev: GameState): GameState {
  if (!prev.battle) return prev;
  const b = { ...prev.battle };
  const result = b.turnResult;
  if (!result) { b.phase = 'action_select'; b.messageIdx = 0; return { ...prev, battle: b }; }

  if (result.enemyFainted) {
    const enemy = b.enemyTeam[b.activeEnemyIdx];
    const expAmount = calculateExpGain(enemy, b.type === 'trainer');
    b.phase = 'exp_gain';
    b.expGain = { pokemonUid: b.playerTeam[b.activePlayerIdx].uid, amount: expAmount };
    b.messages = [`Gained ${expAmount} EXP!`];
    b.messageIdx = 0;
    b.turnResult = undefined;
    b.animations = [createExpFillAnimation(500)];
    return { ...prev, battle: b };
  }

  if (result.playerFainted) {
    const aliveCount = b.playerTeam.filter(p => p.currentHp > 0).length;
    b.phase = 'fainted';
    b.messages = aliveCount === 0 ? ['All your Pokémon fainted!', 'You blacked out!'] : ['Choose a Pokémon to send out!'];
    b.messageIdx = 0;
    b.turnResult = undefined;
    return { ...prev, battle: b };
  }

  b.phase = 'action_select';
  b.messageIdx = 0;
  b.turnResult = undefined;
  return { ...prev, battle: b };
}

export function handleBattleVictory(prev: GameState): GameState {
  if (!prev.battle) return prev;
  const b = prev.battle;
  const newPlayer = { ...prev.player, team: [...b.playerTeam] };

  if (b.type === 'trainer' && b.trainerId) {
    newPlayer.money += b.battleReward;
    newPlayer.defeatedTrainers.add(b.trainerId);
    if (b.isGymLeader) {
      const gymInfo = GYM_ORDER.find(g => g.leaderId === b.trainerId);
      if (gymInfo && !newPlayer.badges.includes(gymInfo.badge)) newPlayer.badges.push(gymInfo.badge);
    }
  }

  // Champion Gary defeat → credits
  if (b.trainerId === 'champion_gary') {
    newPlayer.storyFlags = new Set(newPlayer.storyFlags);
    newPlayer.storyFlags.add('champion');
    return {
      ...prev, phase: 'credits', battle: null, player: newPlayer,
      credits: { scrollY: 0, done: false },
    };
  }

  for (const poke of newPlayer.team) {
    const evoTarget = checkEvolution(poke);
    if (evoTarget) {
      return {
        ...prev, phase: 'evolution', battle: null, player: newPlayer,
        evolution: { pokemon: poke, fromSpecies: poke.speciesId, toSpecies: evoTarget, progress: 0, done: false },
      };
    }
  }
  return { ...prev, phase: 'overworld', battle: null, player: newPlayer };
}

export function handlePostExp(prev: GameState): GameState {
  if (!prev.battle) return prev;
  const b = { ...prev.battle };

  if (b.expGain) {
    const poke = b.playerTeam.find(p => p.uid === b.expGain!.pokemonUid);
    if (poke) {
      const result = gainExp(poke, b.expGain.amount);
      if (result.leveledUp) {
        b.messages = [`${SPECIES[poke.speciesId].name} grew to level ${result.newLevel}!`];
        b.messageIdx = 0;
        b.phase = 'level_up';
        if (result.newMoves.length > 0) {
          b.learnMove = { pokemonUid: poke.uid, moveId: result.newMoves[0] };
          b.phase = 'learn_move';
          b.messages = [
            `${SPECIES[poke.speciesId].name} wants to learn ${MOVES[result.newMoves[0]].name}!`,
            poke.moves.length >= 4 ? 'Choose a move to replace (1-4) or press 5 to skip.' : 'Learning new move!',
          ];
          b.messageIdx = 0;
          if (poke.moves.length < 4) {
            poke.moves.push({ moveId: result.newMoves[0], currentPp: MOVES[result.newMoves[0]].pp });
            b.learnMove = undefined;
            b.phase = 'level_up';
            b.messages = [`${SPECIES[poke.speciesId].name} learned ${MOVES[result.newMoves[0]].name}!`];
          }
        }
        b.expGain = undefined;
        return { ...prev, battle: b };
      }
    }
    b.expGain = undefined;
  }

  const nextEnemyIdx = b.enemyTeam.findIndex((p, i) => i > b.activeEnemyIdx && p.currentHp > 0);
  if (nextEnemyIdx >= 0) {
    b.activeEnemyIdx = nextEnemyIdx;
    b.phase = 'intro';
    b.messages = [`Opponent sent out ${SPECIES[b.enemyTeam[nextEnemyIdx].speciesId].name}!`];
    b.messageIdx = 0;
    return { ...prev, battle: b };
  }

  b.phase = 'victory';
  b.messages = [b.type === 'trainer' ? `You defeated ${b.trainerName}!` : 'You won!'];
  if (b.battleReward > 0) b.messages.push(`Got $${b.battleReward}!`);
  b.messageIdx = 0;
  return { ...prev, battle: b };
}

export function handleLearnMove(prev: GameState, slot: number): GameState {
  if (!prev.battle?.learnMove) return prev;
  const b = { ...prev.battle };
  const poke = b.playerTeam.find(p => p.uid === b.learnMove!.pokemonUid);
  if (!poke || slot >= poke.moves.length) return prev;
  const oldMove = MOVES[poke.moves[slot].moveId];
  poke.moves[slot] = { moveId: b.learnMove!.moveId, currentPp: MOVES[b.learnMove!.moveId].pp };
  b.learnMove = undefined;
  b.messages = [`Forgot ${oldMove?.name} and learned ${MOVES[poke.moves[slot].moveId].name}!`];
  b.messageIdx = 0;
  b.phase = 'level_up';
  return { ...prev, battle: b };
}

export function useBattleItem(prev: GameState, itemId: string, targetIdx?: number): GameState {
  if (!prev.battle) return prev;
  const b = { ...prev.battle };
  const item = ITEMS[itemId];
  if (!item) return prev;
  const newBag = { ...prev.player.bag };
  newBag[itemId] = (newBag[itemId] || 0) - 1;
  if (newBag[itemId] <= 0) delete newBag[itemId];

  if (item.category === 'pokeball' && b.type === 'wild') {
    const enemy = b.enemyTeam[b.activeEnemyIdx];
    const catchResult = attemptCatch(enemy, itemId);
    b.catchAttempt = catchResult;
    b.phase = 'catch';
    b.messages = catchResult.success ? [`Gotcha! ${SPECIES[enemy.speciesId].name} was caught!`] : [`The Pokémon broke free!`];
    b.messageIdx = 0;
    return { ...prev, battle: b, player: { ...prev.player, bag: newBag } };
  }

  if (item.category === 'medicine') {
    if (item.effect === 'revive') {
      // Revive targets a fainted party member
      const idx = targetIdx ?? b.playerTeam.findIndex(p => p.currentHp === 0);
      if (idx < 0 || idx >= b.playerTeam.length || b.playerTeam[idx].currentHp > 0) return prev; // no valid target, don't consume
      b.playerTeam[idx].currentHp = Math.floor(b.playerTeam[idx].stats.hp / 2);
      b.messages = [`${SPECIES[b.playerTeam[idx].speciesId].name} was revived!`];
      b.messageIdx = 0;
      return executeBattleAction({ ...prev, player: { ...prev.player, bag: newBag }, battle: b }, { type: 'item', itemId });
    }

    const playerPoke = b.playerTeam[b.activePlayerIdx];
    if (item.effect === 'heal20') playerPoke.currentHp = Math.min(playerPoke.stats.hp, playerPoke.currentHp + 20);
    else if (item.effect === 'heal50') playerPoke.currentHp = Math.min(playerPoke.stats.hp, playerPoke.currentHp + 50);
    else if (item.effect === 'heal200') playerPoke.currentHp = Math.min(playerPoke.stats.hp, playerPoke.currentHp + 200);
    else if (item.effect === 'fullRestore') { playerPoke.currentHp = playerPoke.stats.hp; playerPoke.status = null; }
    else if (item.effect === 'curePoison') { if (playerPoke.status === 'poison') playerPoke.status = null; }
    else if (item.effect === 'cureParalyze') { if (playerPoke.status === 'paralyze') playerPoke.status = null; }
    else if (item.effect === 'cureSleep') { if (playerPoke.status === 'sleep') playerPoke.status = null; }
    return executeBattleAction({ ...prev, player: { ...prev.player, bag: newBag }, battle: b }, { type: 'item', itemId });
  }
  return prev;
}

export function handleCatchResult(prev: GameState): GameState {
  if (!prev.battle?.catchAttempt) return prev;
  const b = prev.battle;
  if (b.catchAttempt?.success) {
    const caught = b.enemyTeam[b.activeEnemyIdx];
    const newPlayer = { ...prev.player };
    newPlayer.pokedex.caught.add(caught.speciesId);
    if (newPlayer.team.length < 6) newPlayer.team = [...newPlayer.team, caught];
    else newPlayer.pc = [...newPlayer.pc, caught];
    return { ...prev, phase: 'overworld', battle: null, player: newPlayer };
  }
  return executeBattleAction(prev, { type: 'item', itemId: 'pokeball' });
}
