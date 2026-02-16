'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, createInitialState, createPokemon, saveGame, loadGame, calcStats } from './engine/state';
import { executeTurn, calculateExpGain, gainExp, attemptCatch, checkEvolution, evolvePokemon, rollWildEncounter, BattleAction } from './engine/battle';
import { renderMap, renderBattle, drawPokemonSprite } from './engine/renderer';
import { getAllMaps, DOOR_CONNECTIONS, MAP_CONNECTIONS, TILE_DEFS } from './data/maps';
import { SPECIES, expForLevel, expToNextLevel } from './data/pokemon';
import { MOVES } from './data/moves';
import { ITEMS, MART_INVENTORY } from './data/items';
import { TRAINERS, GYM_ORDER, ELITE4_ORDER } from './data/trainers';
import { PokemonInstance, StatusEffect } from './data/types';

const MAPS = getAllMaps();

export default function PokemonGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<GameState>(createInitialState);
  const [inputName, setInputName] = useState('');
  const [selectedStarter, setSelectedStarter] = useState(0);
  const frameRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const lastMoveRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ===== INPUT HANDLING =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      
      const s = stateRef.current;
      
      // Dialog advancement
      if (s.dialog && (e.key === 'z' || e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        advanceDialog();
        return;
      }
      
      // Menu toggle
      if (e.key === 'Escape' && s.phase === 'overworld' && !s.dialog) {
        e.preventDefault();
        setState(prev => ({
          ...prev,
          phase: prev.menu ? 'overworld' : 'menu',
          menu: prev.menu ? null : { screen: 'main', selectedIndex: 0, subIndex: 0 },
        }));
        return;
      }
      
      // Menu/Battle navigation
      if (s.phase === 'menu' && s.menu) {
        handleMenuInput(e.key.toLowerCase());
        return;
      }
      
      if (s.phase === 'battle' && s.battle) {
        handleBattleInput(e.key.toLowerCase());
        return;
      }

      if (s.phase === 'shop' && s.shop) {
        handleShopInput(e.key.toLowerCase());
        return;
      }

      if (s.phase === 'evolution') {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'z') {
          completeEvolution();
        }
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ===== DIALOG =====
  const showDialog = useCallback((lines: string[], onComplete?: () => void, speaker?: string) => {
    setState(prev => ({
      ...prev,
      dialog: { lines, currentLine: 0, charIndex: 0, done: false, onComplete, speaker },
    }));
  }, []);

  const advanceDialog = useCallback(() => {
    setState(prev => {
      if (!prev.dialog) return prev;
      const d = prev.dialog;
      
      // If text still typing, show all
      if (d.charIndex < d.lines[d.currentLine].length) {
        return { ...prev, dialog: { ...d, charIndex: d.lines[d.currentLine].length } };
      }
      
      // Next line
      if (d.currentLine < d.lines.length - 1) {
        return { ...prev, dialog: { ...d, currentLine: d.currentLine + 1, charIndex: 0 } };
      }
      
      // Done
      const callback = d.onComplete;
      const newState = { ...prev, dialog: null };
      if (callback) {
        setTimeout(callback, 50);
      }
      return newState;
    });
  }, []);

  // ===== TYPEWRITER EFFECT =====
  useEffect(() => {
    if (!state.dialog || state.dialog.charIndex >= state.dialog.lines[state.dialog.currentLine].length) return;
    const timer = setTimeout(() => {
      setState(prev => {
        if (!prev.dialog) return prev;
        return { ...prev, dialog: { ...prev.dialog!, charIndex: prev.dialog!.charIndex + 1 } };
      });
    }, 30);
    return () => clearTimeout(timer);
  }, [state.dialog?.charIndex, state.dialog?.currentLine]);

  // ===== MOVEMENT & GAME LOOP =====
  useEffect(() => {
    const gameLoop = () => {
      frameRef.current++;
      const s = stateRef.current;
      
      if (s.phase === 'overworld' && !s.dialog && !s.transition) {
        const now = Date.now();
        if (now - lastMoveRef.current > (s.player.onBicycle ? 80 : 160)) {
          let dx = 0, dy = 0;
          let dir = s.player.direction;
          
          if (keysRef.current.has('arrowup') || keysRef.current.has('w')) { dy = -1; dir = 'up'; }
          else if (keysRef.current.has('arrowdown') || keysRef.current.has('s')) { dy = 1; dir = 'down'; }
          else if (keysRef.current.has('arrowleft') || keysRef.current.has('a')) { dx = -1; dir = 'left'; }
          else if (keysRef.current.has('arrowright') || keysRef.current.has('d')) { dx = 1; dir = 'right'; }
          
          if (dx !== 0 || dy !== 0) {
            lastMoveRef.current = now;
            movePlayer(dx, dy, dir);
          }
        }
        
        // Z/Space/Enter for interaction
        if (keysRef.current.has('z') || keysRef.current.has(' ')) {
          keysRef.current.delete('z');
          keysRef.current.delete(' ');
          interact();
        }
      }
      
      // Render
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) render(ctx, s, frameRef.current);
      }
      
      requestAnimationFrame(gameLoop);
    };
    
    const animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // ===== PLAYER MOVEMENT =====
  const movePlayer = useCallback((dx: number, dy: number, dir: 'up' | 'down' | 'left' | 'right') => {
    setState(prev => {
      if (prev.phase !== 'overworld' || prev.dialog || prev.transition) return prev;
      
      const newX = prev.player.x + dx;
      const newY = prev.player.y + dy;
      const map = MAPS[prev.player.mapId];
      if (!map) return { ...prev, player: { ...prev.player, direction: dir } };
      
      // Check map bounds and edge transitions
      if (newX < 0 || newY < 0 || newX >= map.width || newY >= map.height) {
        // Check map connections
        let edge: 'north' | 'south' | 'east' | 'west' = 'north';
        if (dy < 0) edge = 'north';
        else if (dy > 0) edge = 'south';
        else if (dx < 0) edge = 'west';
        else if (dx > 0) edge = 'east';
        
        const conn = MAP_CONNECTIONS.find(c => c.from === prev.player.mapId && c.fromEdge === edge);
        if (conn && MAPS[conn.to]) {
          return {
            ...prev,
            player: { ...prev.player, x: conn.toX, y: conn.toY, mapId: conn.to, direction: dir, steps: prev.player.steps + 1 },
          };
        }
        return { ...prev, player: { ...prev.player, direction: dir } };
      }
      
      // Check tile walkability
      const tileType = map.tiles[newY]?.[newX];
      const tileDef = TILE_DEFS[tileType];
      if (!tileDef?.walkable) {
        return { ...prev, player: { ...prev.player, direction: dir } };
      }
      
      // Check NPC collision
      const npcBlocking = map.npcs.find(n => n.x === newX && n.y === newY);
      if (npcBlocking && npcBlocking.spriteType !== 'sign') {
        return { ...prev, player: { ...prev.player, direction: dir } };
      }
      
      // Check door
      const doorConn = DOOR_CONNECTIONS.find(
        d => d.fromMap === prev.player.mapId && d.fromX === newX && d.fromY === newY
      );
      if (doorConn && MAPS[doorConn.toMap]) {
        return {
          ...prev,
          player: { ...prev.player, x: doorConn.toX, y: doorConn.toY, mapId: doorConn.toMap, direction: dir, steps: prev.player.steps + 1 },
        };
      }
      
      const newState = {
        ...prev,
        player: { ...prev.player, x: newX, y: newY, direction: dir, steps: prev.player.steps + 1 },
      };
      
      // Check wild encounter
      if (tileDef.encounter && prev.player.team.length > 0 && prev.player.repelSteps <= 0) {
        const encounter = rollWildEncounter(map.encounters, map.encounterRate);
        if (encounter) {
          const wildPoke = createPokemon(encounter.speciesId, encounter.level);
          newState.player.pokedex.seen.add(encounter.speciesId);
          return {
            ...newState,
            phase: 'battle',
            battle: {
              type: 'wild',
              playerTeam: [...prev.player.team],
              enemyTeam: [wildPoke],
              activePlayerIdx: findFirstAlive(prev.player.team),
              activeEnemyIdx: 0,
              phase: 'intro',
              messages: [`A wild ${SPECIES[encounter.speciesId].name} appeared!`],
              messageIdx: 0,
              animations: [],
              canRun: true,
              battleReward: 0,
            },
          };
        }
      }

      // Repel countdown
      if (newState.player.repelSteps > 0) {
        newState.player.repelSteps--;
      }
      
      return newState;
    });
  }, []);

  // ===== INTERACTION =====
  const interact = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'overworld' || s.dialog) return;
    
    const map = MAPS[s.player.mapId];
    if (!map) return;
    
    // Find what's in front of the player
    const dx = s.player.direction === 'right' ? 1 : s.player.direction === 'left' ? -1 : 0;
    const dy = s.player.direction === 'down' ? 1 : s.player.direction === 'up' ? -1 : 0;
    const targetX = s.player.x + dx;
    const targetY = s.player.y + dy;
    
    // Check NPCs
    const npc = map.npcs.find(n => n.x === targetX && n.y === targetY);
    if (npc) {
      // Special NPCs
      if (npc.id === 'nurse') {
        showDialog(npc.dialog, () => {
          setState(prev => {
            const healed = prev.player.team.map(p => ({
              ...p,
              currentHp: calcStats(p.speciesId, p.level, p.iv).hp,
              status: null as StatusEffect,
              moves: p.moves.map(m => ({ ...m, currentPp: MOVES[m.moveId]?.pp || m.currentPp })),
            }));
            return {
              ...prev,
              player: { ...prev.player, team: healed },
              lastPokecenterMap: prev.player.mapId,
              lastPokecenterX: prev.player.x,
              lastPokecenterY: prev.player.y,
            };
          });
        }, npc.name);
        return;
      }
      
      if (npc.id === 'clerk') {
        // Open shop
        const cityMap = Object.keys(MART_INVENTORY).find(k => s.player.mapId.includes(k)) || 'viridian';
        const inventory = MART_INVENTORY[cityMap] || MART_INVENTORY.viridian;
        setState(prev => ({
          ...prev,
          phase: 'shop',
          shop: { items: inventory.items, selectedIndex: 0, mode: 'select', quantity: 1, mapId: cityMap },
        }));
        return;
      }
      
      if (npc.id === 'oak' && s.player.mapId === 'oak_lab') {
        if (!s.player.storyFlags.has('got_starter')) {
          showDialog([
            'Ah, there you are!',
            'Welcome to the world of Pokémon!',
            'Please choose your first partner!',
          ], () => {
            setState(prev => ({ ...prev, phase: 'starter_select' }));
          }, 'Prof. Oak');
          return;
        }
      }
      
      showDialog(npc.dialog, undefined, npc.name);
      return;
    }
    
    // Check tile interactions
    const tileType = map.tiles[targetY]?.[targetX];
    if (tileType === 9) {
      // Sign
      const sign = map.npcs.find(n => n.x === targetX && n.y === targetY && n.spriteType === 'sign');
      if (sign) showDialog(sign.dialog);
      return;
    }
    
    if (tileType === 14) {
      // PC
      setState(prev => ({
        ...prev,
        phase: 'menu',
        menu: { screen: 'pokemon', selectedIndex: 0, subIndex: 0 },
      }));
      return;
    }

    if (tileType === 15) {
      // Heal pad
      showDialog(['Your Pokémon have been healed!'], () => {
        setState(prev => {
          const healed = prev.player.team.map(p => ({
            ...p,
            currentHp: calcStats(p.speciesId, p.level, p.iv).hp,
            status: null as StatusEffect,
            moves: p.moves.map(m => ({ ...m, currentPp: MOVES[m.moveId]?.pp || m.currentPp })),
          }));
          return { ...prev, player: { ...prev.player, team: healed } };
        });
      });
      return;
    }
  }, [showDialog]);

  // ===== BATTLE INPUT =====
  const handleBattleInput = useCallback((key: string) => {
    setState(prev => {
      if (!prev.battle) return prev;
      const b = prev.battle;
      
      if (b.phase === 'intro' || b.phase === 'message') {
        if (key === 'z' || key === ' ' || key === 'enter') {
          if (b.messageIdx < b.messages.length - 1) {
            return { ...prev, battle: { ...b, messageIdx: b.messageIdx + 1 } };
          }
          // Advance to next phase
          if (b.phase === 'intro') {
            return { ...prev, battle: { ...b, phase: 'action_select', messages: [], messageIdx: 0 } };
          }
          // After message, check what happens next
          return handlePostMessage(prev);
        }
        return prev;
      }
      
      if (b.phase === 'action_select') {
        const options = ['FIGHT', 'BAG', 'POKÉMON', 'RUN'];
        if (key === 'arrowup' || key === 'w') {
          return { ...prev, battle: { ...b, messages: [], messageIdx: Math.max(0, b.messageIdx - 2) } };
        }
        if (key === 'arrowdown' || key === 's') {
          return { ...prev, battle: { ...b, messages: [], messageIdx: Math.min(3, b.messageIdx + 2) } };
        }
        if (key === 'arrowleft' || key === 'a') {
          return { ...prev, battle: { ...b, messages: [], messageIdx: Math.max(0, b.messageIdx - 1) } };
        }
        if (key === 'arrowright' || key === 'd') {
          return { ...prev, battle: { ...b, messages: [], messageIdx: Math.min(3, b.messageIdx + 1) } };
        }
        if (key === 'z' || key === ' ' || key === 'enter') {
          const selected = b.messageIdx;
          if (selected === 0) {
            return { ...prev, battle: { ...b, phase: 'move_select', messageIdx: 0 } };
          }
          if (selected === 1) {
            return { ...prev, battle: { ...b, phase: 'item_select', messageIdx: 0 } };
          }
          if (selected === 2) {
            return { ...prev, battle: { ...b, phase: 'switch_select', messageIdx: 0 } };
          }
          if (selected === 3) {
            // Run
            return executeBattleAction(prev, { type: 'run' });
          }
        }
        if (key === 'x' || key === 'backspace') {
          return prev;
        }
      }
      
      if (b.phase === 'move_select') {
        const playerPoke = b.playerTeam[b.activePlayerIdx];
        const moveCount = playerPoke.moves.length;
        
        if (key === 'arrowup' || key === 'w') return { ...prev, battle: { ...b, messageIdx: Math.max(0, b.messageIdx - 2) } };
        if (key === 'arrowdown' || key === 's') return { ...prev, battle: { ...b, messageIdx: Math.min(moveCount - 1, b.messageIdx + 2) } };
        if (key === 'arrowleft' || key === 'a') return { ...prev, battle: { ...b, messageIdx: Math.max(0, b.messageIdx - 1) } };
        if (key === 'arrowright' || key === 'd') return { ...prev, battle: { ...b, messageIdx: Math.min(moveCount - 1, b.messageIdx + 1) } };
        
        if (key === 'z' || key === ' ' || key === 'enter') {
          if (playerPoke.moves[b.messageIdx]?.currentPp <= 0) return prev;
          return executeBattleAction(prev, { type: 'move', moveIdx: b.messageIdx });
        }
        if (key === 'x' || key === 'backspace' || key === 'escape') {
          return { ...prev, battle: { ...b, phase: 'action_select', messageIdx: 0 } };
        }
      }
      
      if (b.phase === 'switch_select') {
        const teamSize = b.playerTeam.length;
        if (key === 'arrowup' || key === 'w') return { ...prev, battle: { ...b, messageIdx: Math.max(0, b.messageIdx - 1) } };
        if (key === 'arrowdown' || key === 's') return { ...prev, battle: { ...b, messageIdx: Math.min(teamSize - 1, b.messageIdx + 1) } };
        
        if (key === 'z' || key === ' ' || key === 'enter') {
          const idx = b.messageIdx;
          if (idx === b.activePlayerIdx) return prev;
          if (b.playerTeam[idx].currentHp <= 0) return prev;
          return executeBattleAction(prev, { type: 'switch', switchIdx: idx });
        }
        if (key === 'x' || key === 'backspace' || key === 'escape') {
          return { ...prev, battle: { ...b, phase: 'action_select', messageIdx: 0 } };
        }
      }
      
      if (b.phase === 'item_select') {
        const ballItems = Object.entries(prev.player.bag).filter(([id, qty]) => qty > 0 && ITEMS[id]);
        if (key === 'arrowup' || key === 'w') return { ...prev, battle: { ...b, messageIdx: Math.max(0, b.messageIdx - 1) } };
        if (key === 'arrowdown' || key === 's') return { ...prev, battle: { ...b, messageIdx: Math.min(ballItems.length - 1, b.messageIdx + 1) } };
        
        if (key === 'z' || key === ' ' || key === 'enter') {
          if (ballItems.length === 0) return prev;
          const [itemId] = ballItems[b.messageIdx];
          return useBattleItem(prev, itemId);
        }
        if (key === 'x' || key === 'backspace' || key === 'escape') {
          return { ...prev, battle: { ...b, phase: 'action_select', messageIdx: 0 } };
        }
      }
      
      if (b.phase === 'fainted') {
        if (key === 'z' || key === ' ' || key === 'enter') {
          // Must switch to alive Pokémon
          const aliveIdx = b.playerTeam.findIndex((p, i) => i !== b.activePlayerIdx && p.currentHp > 0);
          if (aliveIdx >= 0) {
            return { ...prev, battle: { ...b, phase: 'switch_select', messageIdx: 0 } };
          }
          // All fainted - defeat
          return {
            ...prev,
            phase: 'overworld',
            battle: null,
            player: {
              ...prev.player,
              team: prev.player.team.map(p => ({ ...p, currentHp: Math.max(1, Math.floor(calcStats(p.speciesId, p.level, p.iv).hp / 2)) })),
              money: Math.floor(prev.player.money / 2),
              x: prev.lastPokecenterX,
              y: prev.lastPokecenterY,
              mapId: prev.lastPokecenterMap,
            },
          };
        }
      }
      
      if (b.phase === 'victory') {
        if (key === 'z' || key === ' ' || key === 'enter') {
          return handleBattleVictory(prev);
        }
      }
      
      if (b.phase === 'catch') {
        if (key === 'z' || key === ' ' || key === 'enter') {
          return handleCatchResult(prev);
        }
      }
      
      if (b.phase === 'exp_gain' || b.phase === 'level_up') {
        if (key === 'z' || key === ' ' || key === 'enter') {
          return handlePostExp(prev);
        }
      }
      
      if (b.phase === 'learn_move') {
        if (key >= '1' && key <= '4') {
          const slot = parseInt(key) - 1;
          return handleLearnMove(prev, slot);
        }
        if (key === '5' || key === 'x' || key === 'backspace') {
          // Don't learn the move
          return handlePostExp(prev);
        }
      }
      
      return prev;
    });
  }, []);

  // ===== BATTLE EXECUTION =====
  function executeBattleAction(prev: GameState, action: BattleAction): GameState {
    if (!prev.battle) return prev;
    const b = { ...prev.battle };
    
    const result = executeTurn(b, action);
    
    // Escape
    if (action.type === 'run' && result.messages.includes('Got away safely!')) {
      return {
        ...prev,
        phase: 'overworld',
        battle: null,
        player: { ...prev.player, team: [...b.playerTeam] },
      };
    }
    
    b.messages = result.messages;
    b.messageIdx = 0;
    b.phase = 'message';
    b.turnResult = result;
    
    return { ...prev, battle: b };
  }

  function handlePostMessage(prev: GameState): GameState {
    if (!prev.battle) return prev;
    const b = { ...prev.battle };
    const result = b.turnResult;
    
    if (!result) {
      b.phase = 'action_select';
      b.messageIdx = 0;
      return { ...prev, battle: b };
    }
    
    if (result.enemyFainted) {
      // Calculate exp
      const enemy = b.enemyTeam[b.activeEnemyIdx];
      const isTrainer = b.type === 'trainer';
      const expAmount = calculateExpGain(enemy, isTrainer);
      
      b.phase = 'exp_gain';
      b.expGain = { pokemonUid: b.playerTeam[b.activePlayerIdx].uid, amount: expAmount };
      b.messages = [`Gained ${expAmount} EXP!`];
      b.messageIdx = 0;
      b.turnResult = undefined;
      
      return { ...prev, battle: b };
    }
    
    if (result.playerFainted) {
      const aliveCount = b.playerTeam.filter(p => p.currentHp > 0).length;
      if (aliveCount === 0) {
        b.phase = 'fainted';
        b.messages = ['All your Pokémon fainted!', 'You blacked out!'];
        b.messageIdx = 0;
      } else {
        b.phase = 'fainted';
        b.messages = ['Choose a Pokémon to send out!'];
        b.messageIdx = 0;
      }
      b.turnResult = undefined;
      return { ...prev, battle: b };
    }
    
    b.phase = 'action_select';
    b.messageIdx = 0;
    b.turnResult = undefined;
    return { ...prev, battle: b };
  }

  function handleBattleVictory(prev: GameState): GameState {
    if (!prev.battle) return prev;
    const b = prev.battle;
    
    // Update player team
    const newPlayer = { ...prev.player, team: [...b.playerTeam] };
    
    // Trainer reward
    if (b.type === 'trainer' && b.trainerId) {
      newPlayer.money += b.battleReward;
      newPlayer.defeatedTrainers.add(b.trainerId);
      
      // Check gym leader
      if (b.isGymLeader) {
        const gymInfo = GYM_ORDER.find(g => g.leaderId === b.trainerId);
        if (gymInfo && !newPlayer.badges.includes(gymInfo.badge)) {
          newPlayer.badges.push(gymInfo.badge);
        }
      }
    }
    
    // Check evolution
    for (const poke of newPlayer.team) {
      const evoTarget = checkEvolution(poke);
      if (evoTarget) {
        return {
          ...prev,
          phase: 'evolution',
          battle: null,
          player: newPlayer,
          evolution: { pokemon: poke, fromSpecies: poke.speciesId, toSpecies: evoTarget, progress: 0, done: false },
        };
      }
    }
    
    return { ...prev, phase: 'overworld', battle: null, player: newPlayer };
  }

  function handlePostExp(prev: GameState): GameState {
    if (!prev.battle) return prev;
    const b = { ...prev.battle };
    
    // Apply exp
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
    
    // Check for more enemies
    const nextEnemyIdx = b.enemyTeam.findIndex((p, i) => i > b.activeEnemyIdx && p.currentHp > 0);
    if (nextEnemyIdx >= 0) {
      b.activeEnemyIdx = nextEnemyIdx;
      b.phase = 'intro';
      b.messages = [`Opponent sent out ${SPECIES[b.enemyTeam[nextEnemyIdx].speciesId].name}!`];
      b.messageIdx = 0;
      return { ...prev, battle: b };
    }
    
    // Victory
    b.phase = 'victory';
    b.messages = [b.type === 'trainer' ? `You defeated ${b.trainerName}!` : 'You won!'];
    if (b.battleReward > 0) b.messages.push(`Got $${b.battleReward}!`);
    b.messageIdx = 0;
    return { ...prev, battle: b };
  }

  function handleLearnMove(prev: GameState, slot: number): GameState {
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

  function useBattleItem(prev: GameState, itemId: string): GameState {
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
      b.messages = catchResult.success 
        ? [`Gotcha! ${SPECIES[enemy.speciesId].name} was caught!`]
        : [`The Pokémon broke free!`];
      b.messageIdx = 0;
      
      return { ...prev, battle: b, player: { ...prev.player, bag: newBag } };
    }
    
    if (item.category === 'medicine') {
      const playerPoke = b.playerTeam[b.activePlayerIdx];
      
      if (item.effect === 'heal20') playerPoke.currentHp = Math.min(playerPoke.stats.hp, playerPoke.currentHp + 20);
      else if (item.effect === 'heal50') playerPoke.currentHp = Math.min(playerPoke.stats.hp, playerPoke.currentHp + 50);
      else if (item.effect === 'heal200') playerPoke.currentHp = Math.min(playerPoke.stats.hp, playerPoke.currentHp + 200);
      else if (item.effect === 'fullRestore') { playerPoke.currentHp = playerPoke.stats.hp; playerPoke.status = null; }
      else if (item.effect === 'curePoison' && playerPoke.status === 'poison') playerPoke.status = null;
      else if (item.effect === 'cureParalyze' && playerPoke.status === 'paralyze') playerPoke.status = null;
      else if (item.effect === 'cureSleep' && playerPoke.status === 'sleep') playerPoke.status = null;
      
      return executeBattleAction(
        { ...prev, player: { ...prev.player, bag: newBag }, battle: b },
        { type: 'item', itemId }
      );
    }
    
    return prev;
  }

  function handleCatchResult(prev: GameState): GameState {
    if (!prev.battle?.catchAttempt) return prev;
    const b = prev.battle;
    
    if (b.catchAttempt?.success) {
      const caught = b.enemyTeam[b.activeEnemyIdx];
      const newPlayer = { ...prev.player };
      newPlayer.pokedex.caught.add(caught.speciesId);
      
      if (newPlayer.team.length < 6) {
        newPlayer.team = [...newPlayer.team, caught];
      } else {
        newPlayer.pc = [...newPlayer.pc, caught];
      }
      
      return { ...prev, phase: 'overworld', battle: null, player: newPlayer };
    }
    
    // Failed catch - enemy attacks
    return executeBattleAction(prev, { type: 'item', itemId: 'pokeball' });
  }

  // ===== EVOLUTION =====
  const completeEvolution = useCallback(() => {
    setState(prev => {
      if (!prev.evolution) return prev;
      const poke = prev.player.team.find(p => p.uid === prev.evolution!.pokemon.uid);
      if (poke) {
        evolvePokemon(poke, prev.evolution.toSpecies);
        prev.player.pokedex.seen.add(prev.evolution.toSpecies);
        prev.player.pokedex.caught.add(prev.evolution.toSpecies);
      }
      return { ...prev, phase: 'overworld', evolution: null };
    });
  }, []);

  // ===== MENU INPUT =====
  const handleMenuInput = useCallback((key: string) => {
    setState(prev => {
      if (!prev.menu) return prev;
      const m = { ...prev.menu };
      
      if (m.screen === 'main') {
        const options = ['POKÉMON', 'BAG', 'POKÉDEX', 'SAVE', 'MAP', 'CLOSE'];
        if (key === 'arrowup' || key === 'w') m.selectedIndex = Math.max(0, m.selectedIndex - 1);
        if (key === 'arrowdown' || key === 's') m.selectedIndex = Math.min(options.length - 1, m.selectedIndex + 1);
        if (key === 'z' || key === ' ' || key === 'enter') {
          if (m.selectedIndex === 0) m.screen = 'pokemon';
          else if (m.selectedIndex === 1) m.screen = 'bag';
          else if (m.selectedIndex === 2) m.screen = 'pokedex';
          else if (m.selectedIndex === 3) {
            saveGame(prev);
            return { ...prev, menu: null, phase: 'overworld', dialog: { lines: ['Game saved!'], currentLine: 0, charIndex: 0, done: false } };
          }
          else if (m.selectedIndex === 4) m.screen = 'map';
          else if (m.selectedIndex === 5) return { ...prev, menu: null, phase: 'overworld' };
          m.subIndex = 0;
        }
        if (key === 'x' || key === 'backspace' || key === 'escape') {
          return { ...prev, menu: null, phase: 'overworld' };
        }
      } else if (m.screen === 'pokemon') {
        const teamSize = prev.player.team.length;
        if (key === 'arrowup' || key === 'w') m.selectedIndex = Math.max(0, m.selectedIndex - 1);
        if (key === 'arrowdown' || key === 's') m.selectedIndex = Math.min(teamSize - 1, m.selectedIndex + 1);
        if (key === 'z' || key === ' ' || key === 'enter') {
          m.screen = 'pokemon_detail';
          m.selectedPokemon = m.selectedIndex;
        }
        if (key === 'x' || key === 'backspace' || key === 'escape') {
          m.screen = 'main';
          m.selectedIndex = 0;
        }
      } else if (m.screen === 'pokemon_detail') {
        if (key === 'x' || key === 'backspace' || key === 'escape' || key === 'z' || key === ' ' || key === 'enter') {
          m.screen = 'pokemon';
        }
      } else if (m.screen === 'bag') {
        const items = Object.entries(prev.player.bag).filter(([, qty]) => qty > 0);
        if (key === 'arrowup' || key === 'w') m.selectedIndex = Math.max(0, m.selectedIndex - 1);
        if (key === 'arrowdown' || key === 's') m.selectedIndex = Math.min(items.length - 1, m.selectedIndex + 1);
        if (key === 'z' || key === ' ' || key === 'enter') {
          if (items.length > 0) {
            const [itemId] = items[m.selectedIndex];
            const item = ITEMS[itemId];
            if (item?.category === 'medicine') {
              // Use item on first Pokémon that needs it
              const poke = prev.player.team.find(p => p.currentHp < p.stats.hp && p.currentHp > 0);
              if (poke && item.effect) {
                if (item.effect === 'heal20') poke.currentHp = Math.min(poke.stats.hp, poke.currentHp + 20);
                else if (item.effect === 'heal50') poke.currentHp = Math.min(poke.stats.hp, poke.currentHp + 50);
                else if (item.effect === 'heal200') poke.currentHp = Math.min(poke.stats.hp, poke.currentHp + 200);
                else if (item.effect === 'fullRestore') { poke.currentHp = poke.stats.hp; poke.status = null; }
                const newBag = { ...prev.player.bag };
                newBag[itemId]--;
                if (newBag[itemId] <= 0) delete newBag[itemId];
                return { ...prev, player: { ...prev.player, bag: newBag }, menu: m };
              }
            }
          }
        }
        if (key === 'x' || key === 'backspace' || key === 'escape') {
          m.screen = 'main';
          m.selectedIndex = 1;
        }
      } else if (m.screen === 'pokedex' || m.screen === 'map') {
        if (key === 'x' || key === 'backspace' || key === 'escape' || key === 'z' || key === ' ' || key === 'enter') {
          m.screen = 'main';
          m.selectedIndex = 2;
        }
      } else if (m.screen === 'save' || m.screen === 'options') {
        if (key === 'x' || key === 'backspace' || key === 'escape') {
          m.screen = 'main';
        }
      }
      
      return { ...prev, menu: m };
    });
  }, []);

  // ===== SHOP INPUT =====
  const handleShopInput = useCallback((key: string) => {
    setState(prev => {
      if (!prev.shop) return prev;
      const s = { ...prev.shop };
      
      if (s.mode === 'select') {
        if (key === 'z' || key === ' ' || key === 'enter') s.mode = 'buy';
        if (key === 'x' || key === 'backspace' || key === 'escape') {
          return { ...prev, phase: 'overworld', shop: null };
        }
        return { ...prev, shop: s };
      }
      
      if (key === 'arrowup' || key === 'w') s.selectedIndex = Math.max(0, s.selectedIndex - 1);
      if (key === 'arrowdown' || key === 's') s.selectedIndex = Math.min(s.items.length - 1, s.selectedIndex + 1);
      
      if (key === 'z' || key === ' ' || key === 'enter') {
        const itemId = s.items[s.selectedIndex].itemId;
        const item = ITEMS[itemId];
        if (item && prev.player.money >= item.price) {
          const newBag = { ...prev.player.bag };
          newBag[itemId] = (newBag[itemId] || 0) + 1;
          return {
            ...prev,
            player: { ...prev.player, bag: newBag, money: prev.player.money - item.price },
            shop: s,
          };
        }
      }
      if (key === 'x' || key === 'backspace' || key === 'escape') {
        return { ...prev, phase: 'overworld', shop: null };
      }
      
      return { ...prev, shop: s };
    });
  }, []);

  // ===== STARTER SELECTION =====
  const selectStarter = useCallback((speciesId: string) => {
    const rivalStarters: Record<string, string> = {
      emberon: 'aqualing',
      aqualing: 'sproutley',
      sproutley: 'emberon',
    };
    
    const starter = createPokemon(speciesId, 5);
    const rivalSpecies = rivalStarters[speciesId];
    
    setState(prev => ({
      ...prev,
      phase: 'overworld',
      player: {
        ...prev.player,
        team: [starter],
        storyFlags: new Set([...prev.player.storyFlags, 'got_starter']),
        pokedex: {
          seen: new Set([...prev.player.pokedex.seen, speciesId]),
          caught: new Set([...prev.player.pokedex.caught, speciesId]),
        },
      },
      rival: { starterSpecies: rivalSpecies },
    }));
    
    // Trigger rival battle after a delay
    setTimeout(() => {
      setState(prev => {
        const rivalPoke = createPokemon(rivalSpecies, 5);
        return {
          ...prev,
          phase: 'battle',
          battle: {
            type: 'trainer',
            trainerId: 'rival_oak_lab',
            trainerName: 'Gary',
            playerTeam: [...prev.player.team],
            enemyTeam: [rivalPoke],
            activePlayerIdx: 0,
            activeEnemyIdx: 0,
            phase: 'intro',
            messages: ['Gary: Heh, let me show you how it\'s done!', `Gary sent out ${SPECIES[rivalSpecies].name}!`],
            messageIdx: 0,
            animations: [],
            canRun: false,
            battleReward: 500,
          },
        };
      });
    }, 500);
  }, []);

  // ===== GYM BATTLE TRIGGER =====
  useEffect(() => {
    const s = state;
    if (s.phase !== 'overworld') return;
    
    // Check if player is in a gym and should trigger leader
    const gymInfo = GYM_ORDER.find(g => g.gymId === s.player.mapId);
    if (gymInfo && !s.player.badges.includes(gymInfo.badge) && !s.player.defeatedTrainers.has(gymInfo.leaderId)) {
      // Player is at the leader position (roughly y=2)
      if (s.player.y <= 4) {
        const trainer = TRAINERS[gymInfo.leaderId];
        if (trainer) {
          const enemyTeam = trainer.team.map(t => createPokemon(t.speciesId, t.level));
          
          showDialog(trainer.preDialog || [], () => {
            setState(prev => ({
              ...prev,
              phase: 'battle',
              battle: {
                type: 'trainer',
                trainerId: gymInfo.leaderId,
                trainerName: trainer.name,
                isGymLeader: true,
                playerTeam: [...prev.player.team],
                enemyTeam,
                activePlayerIdx: findFirstAlive(prev.player.team),
                activeEnemyIdx: 0,
                phase: 'intro',
                messages: [`${trainer.name} wants to battle!`],
                messageIdx: 0,
                animations: [],
                canRun: false,
                battleReward: trainer.reward,
              },
            }));
          });
        }
      }
    }

    // Check Elite 4
    if (s.player.mapId === 'elite4' && s.player.y <= 4) {
      const nextE4 = ELITE4_ORDER.find(id => !s.player.defeatedTrainers.has(id));
      if (nextE4) {
        const trainer = TRAINERS[nextE4];
        if (trainer) {
          const enemyTeam = trainer.team.map(t => createPokemon(t.speciesId, t.level));
          showDialog(trainer.preDialog || [], () => {
            setState(prev => ({
              ...prev,
              phase: 'battle',
              battle: {
                type: 'trainer',
                trainerId: nextE4,
                trainerName: trainer.name,
                isElite4: true,
                playerTeam: [...prev.player.team],
                enemyTeam,
                activePlayerIdx: findFirstAlive(prev.player.team),
                activeEnemyIdx: 0,
                phase: 'intro',
                messages: [`${trainer.name} wants to battle!`],
                messageIdx: 0,
                animations: [],
                canRun: false,
                battleReward: trainer.reward,
              },
            }));
          });
        }
      }
    }

    // Route trainers
    const map = MAPS[s.player.mapId];
    if (map) {
      for (const trainerId of map.trainers) {
        if (s.player.defeatedTrainers.has(trainerId)) continue;
        const trainer = TRAINERS[trainerId];
        if (!trainer) continue;
        
        // Simple proximity check
        // Trainers "see" you within 4 tiles
        // (In a full game, you'd check line of sight)
        const trainerNpc = map.npcs.find(n => n.id === trainerId);
        if (!trainerNpc) {
          // Create a simple position based on trainer id hash
          const hash = trainerId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          const tx = 8 + (hash % 5);
          const ty = 8 + (hash % 7);
          const dist = Math.abs(s.player.x - tx) + Math.abs(s.player.y - ty);
          if (dist <= 3) {
            const enemyTeam = trainer.team.map(t => createPokemon(t.speciesId, t.level));
            showDialog(trainer.preDialog || [`${trainer.name} wants to battle!`], () => {
              setState(prev => ({
                ...prev,
                phase: 'battle',
                battle: {
                  type: 'trainer',
                  trainerId,
                  trainerName: trainer.name,
                  playerTeam: [...prev.player.team],
                  enemyTeam,
                  activePlayerIdx: findFirstAlive(prev.player.team),
                  activeEnemyIdx: 0,
                  phase: 'intro',
                  messages: [`${trainer.name} wants to battle!`],
                  messageIdx: 0,
                  animations: [],
                  canRun: false,
                  battleReward: trainer.reward,
                },
              }));
            });
            break;
          }
        }
      }
    }
  }, [state.player.x, state.player.y, state.player.mapId, state.phase]);

  // ===== RENDERING =====
  const render = useCallback((ctx: CanvasRenderingContext2D, s: GameState, frame: number) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    if (s.phase === 'intro') {
      renderIntroScreen(ctx, w, h, frame);
      return;
    }
    
    if (s.phase === 'naming') {
      renderNamingScreen(ctx, w, h);
      return;
    }
    
    if (s.phase === 'starter_select') {
      renderStarterSelect(ctx, w, h, frame);
      return;
    }
    
    if (s.phase === 'overworld' || s.phase === 'menu' || s.phase === 'shop') {
      const map = MAPS[s.player.mapId];
      if (map) {
        renderMap(ctx, map, s.player.x, s.player.y, s.player.direction, w, h, frame, map.npcs);
      }
      
      // Location name
      if (map) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, w, 28);
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(map.name, 10, 19);
        
        // Badges
        ctx.fillStyle = '#888';
        ctx.font = '11px monospace';
        ctx.fillText(`🏅${s.player.badges.length} 💰${s.player.money}`, w - 130, 19);
      }
    }
    
    if (s.phase === 'battle' && s.battle) {
      renderBattleScreen(ctx, s, w, h, frame);
    }
    
    if (s.phase === 'evolution' && s.evolution) {
      renderEvolution(ctx, s.evolution, w, h, frame);
    }
    
    // Dialog overlay
    if (s.dialog) {
      renderDialog(ctx, s.dialog, w, h);
    }
    
    // Menu overlay
    if (s.phase === 'menu' && s.menu) {
      renderMenu(ctx, s, w, h);
    }
    
    // Shop overlay
    if (s.phase === 'shop' && s.shop) {
      renderShop(ctx, s, w, h);
    }
    
    // Mobile controls
    renderMobileControls(ctx, w, h);
  }, []);

  function renderIntroScreen(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.5, '#1a1a3e');
    gradient.addColorStop(1, '#0a2a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    // Title
    ctx.fillStyle = '#4ade80';
    ctx.font = `bold ${Math.min(w * 0.08, 48)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('POKÉMON', w / 2, h * 0.25);
    ctx.fillStyle = '#22c55e';
    ctx.font = `bold ${Math.min(w * 0.05, 28)}px monospace`;
    ctx.fillText('EMERALD QUEST', w / 2, h * 0.33);
    
    // Animated pokeball
    const bobY = Math.sin(frame * 0.05) * 10;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.5 + bobY, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.5 + bobY, 30, 0, Math.PI);
    ctx.fillStyle = '#ecf0f1';
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillRect(w / 2 - 30, h * 0.5 + bobY - 2, 60, 4);
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.5 + bobY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Blink text
    if (Math.floor(frame / 30) % 2 === 0) {
      ctx.fillStyle = '#aaa';
      ctx.font = '16px monospace';
      ctx.fillText('Press ENTER or tap to start', w / 2, h * 0.75);
    }
    
    // Load game option
    const hasSave = typeof window !== 'undefined' && localStorage.getItem('pokemon_save');
    if (hasSave) {
      ctx.fillStyle = '#4ade80';
      ctx.font = '14px monospace';
      ctx.fillText('Press L to load save', w / 2, h * 0.82);
    }
    
    ctx.textAlign = 'left';
  }

  function renderNamingScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("What's your name?", w / 2, h * 0.3);
    
    // Name input box
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.strokeRect(w / 2 - 100, h * 0.4, 200, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText(inputName + (Math.floor(Date.now() / 500) % 2 === 0 ? '▊' : ''), w / 2, h * 0.4 + 27);
    
    ctx.fillStyle = '#888';
    ctx.font = '13px monospace';
    ctx.fillText('Type your name and press Enter', w / 2, h * 0.6);
    ctx.textAlign = 'left';
  }

  function renderStarterSelect(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Choose your starter Pokémon!', w / 2, 40);
    
    const starters = ['emberon', 'aqualing', 'sproutley'];
    const names = ['Emberon', 'Aqualing', 'Sproutley'];
    const types = ['🔥 Fire', '💧 Water', '🌿 Grass'];
    const cardW = Math.min(w / 4, 140);
    const spacing = (w - cardW * 3) / 4;
    
    starters.forEach((id, i) => {
      const x = spacing + i * (cardW + spacing);
      const y = h * 0.2;
      const isSelected = selectedStarter === i;
      
      ctx.strokeStyle = isSelected ? '#4ade80' : '#444';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.fillStyle = isSelected ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.05)';
      roundRectPath(ctx, x, y, cardW, h * 0.55, 10);
      ctx.fill();
      ctx.stroke();
      
      drawPokemonSprite(ctx, id, x + cardW * 0.15, y + 20, cardW * 0.7);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(names[i], x + cardW / 2, y + h * 0.4);
      
      ctx.fillStyle = '#aaa';
      ctx.font = '12px monospace';
      ctx.fillText(types[i], x + cardW / 2, y + h * 0.46);
    });
    
    ctx.fillStyle = '#888';
    ctx.font = '13px monospace';
    ctx.fillText('← → to browse, Enter to select', w / 2, h * 0.88);
    ctx.textAlign = 'left';
  }

  function renderBattleScreen(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, frame: number) {
    const b = s.battle!;
    const playerPoke = b.playerTeam[b.activePlayerIdx];
    const enemyPoke = b.enemyTeam[b.activeEnemyIdx];
    
    const shakeOffset = { x: 0, y: 0 };
    // Screen shake animation
    if (b.animations.length > 0) {
      shakeOffset.x = (Math.random() - 0.5) * 6;
      shakeOffset.y = (Math.random() - 0.5) * 6;
    }
    
    renderBattle(ctx, playerPoke, enemyPoke, w, h, frame, shakeOffset);
    
    // Enemy info box (top-right area)
    const enemySpecies = SPECIES[enemyPoke.speciesId];
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    roundRectPath(ctx, 10, 10, w * 0.45, 60, 8);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${enemySpecies.name}  Lv${enemyPoke.level}`, 20, 30);
    
    // HP bar
    drawHPBar(ctx, 20, 38, w * 0.4, 12, enemyPoke.currentHp, enemyPoke.stats.hp);
    
    if (enemyPoke.status) {
      ctx.fillStyle = getStatusColor(enemyPoke.status);
      ctx.font = '10px monospace';
      ctx.fillText(enemyPoke.status.toUpperCase(), 20, 62);
    }
    
    // Player info box (bottom-left area)
    const playerSpecies = SPECIES[playerPoke.speciesId];
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    roundRectPath(ctx, w * 0.5, h * 0.52, w * 0.47, 70, 8);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${playerSpecies.name}  Lv${playerPoke.level}`, w * 0.53, h * 0.52 + 22);
    
    drawHPBar(ctx, w * 0.53, h * 0.52 + 30, w * 0.4, 12, playerPoke.currentHp, playerPoke.stats.hp);
    
    // EXP bar
    const expNeeded = expToNextLevel(playerPoke.level);
    const expProgress = (playerPoke.exp - expForLevel(playerPoke.level)) / Math.max(1, expNeeded);
    ctx.fillStyle = '#333';
    ctx.fillRect(w * 0.53, h * 0.52 + 48, w * 0.4, 6);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(w * 0.53, h * 0.52 + 48, w * 0.4 * Math.min(1, expProgress), 6);
    
    ctx.fillStyle = '#aaa';
    ctx.font = '10px monospace';
    ctx.fillText(`HP: ${playerPoke.currentHp}/${playerPoke.stats.hp}`, w * 0.53, h * 0.52 + 68);
    
    if (playerPoke.status) {
      ctx.fillStyle = getStatusColor(playerPoke.status);
      ctx.fillText(playerPoke.status.toUpperCase(), w * 0.78, h * 0.52 + 68);
    }
    
    // Battle UI (bottom section)
    const uiY = h * 0.78;
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, uiY, w, h - uiY);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, uiY, w, h - uiY);
    
    if (b.phase === 'action_select') {
      const actions = ['FIGHT', 'BAG', 'POKÉMON', 'RUN'];
      const cols = 2;
      actions.forEach((action, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const ax = 20 + col * (w / 2 - 20);
        const ay = uiY + 15 + row * 28;
        ctx.fillStyle = i === b.messageIdx ? '#4ade80' : '#fff';
        ctx.font = `${i === b.messageIdx ? 'bold ' : ''}15px monospace`;
        ctx.fillText(`${i === b.messageIdx ? '▸ ' : '  '}${action}`, ax, ay);
      });
    } else if (b.phase === 'move_select') {
      playerPoke.moves.forEach((move, i) => {
        const moveData = MOVES[move.moveId];
        if (!moveData) return;
        const col = i % 2;
        const row = Math.floor(i / 2);
        const mx = 20 + col * (w / 2 - 20);
        const my = uiY + 15 + row * 28;
        const isSelected = i === b.messageIdx;
        ctx.fillStyle = move.currentPp <= 0 ? '#666' : isSelected ? '#4ade80' : '#fff';
        ctx.font = `${isSelected ? 'bold ' : ''}13px monospace`;
        ctx.fillText(`${isSelected ? '▸ ' : '  '}${moveData.name}`, mx, my);
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.fillText(`${move.currentPp}/${moveData.pp}`, mx + w * 0.22, my);
      });
    } else if (b.phase === 'switch_select' || b.phase === 'fainted') {
      b.playerTeam.forEach((poke, i) => {
        const species = SPECIES[poke.speciesId];
        const my = uiY + 12 + i * 22;
        const isActive = i === b.activePlayerIdx;
        const isFainted = poke.currentHp <= 0;
        ctx.fillStyle = i === b.messageIdx ? '#4ade80' : isFainted ? '#666' : '#fff';
        ctx.font = '12px monospace';
        ctx.fillText(`${i === b.messageIdx ? '▸' : ' '} ${species.name} Lv${poke.level} ${poke.currentHp}/${poke.stats.hp}${isActive ? ' (active)' : ''}`, 20, my);
      });
    } else if (b.phase === 'item_select') {
      const items = Object.entries(s.player.bag).filter(([, qty]) => qty > 0);
      items.forEach(([itemId, qty], i) => {
        const item = ITEMS[itemId];
        if (!item) return;
        const my = uiY + 14 + i * 20;
        ctx.fillStyle = i === b.messageIdx ? '#4ade80' : '#fff';
        ctx.font = '12px monospace';
        ctx.fillText(`${i === b.messageIdx ? '▸' : ' '} ${item.name} x${qty}`, 20, my);
      });
      if (items.length === 0) {
        ctx.fillStyle = '#888';
        ctx.font = '13px monospace';
        ctx.fillText('No items!', 20, uiY + 20);
      }
    } else {
      // Display messages
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      const msg = b.messages[b.messageIdx] || '';
      ctx.fillText(msg, 20, uiY + 25);
      
      if (b.messages.length > 1) {
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText(`${b.messageIdx + 1}/${b.messages.length}  [Z/Enter]`, w - 150, h - 8);
      }
    }
  }

  function renderEvolution(ctx: CanvasRenderingContext2D, evo: { fromSpecies: string; toSpecies: string; progress: number }, w: number, h: number, frame: number) {
    ctx.fillStyle = '#0a0a2a';
    ctx.fillRect(0, 0, w, h);
    
    const glow = Math.sin(frame * 0.1) * 0.3 + 0.5;
    ctx.fillStyle = `rgba(74, 222, 128, ${glow})`;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.4, 80 + glow * 30, 0, Math.PI * 2);
    ctx.fill();
    
    const species = Math.floor(frame / 15) % 2 === 0 ? evo.fromSpecies : evo.toSpecies;
    drawPokemonSprite(ctx, species, w / 2 - 50, h * 0.25, 100);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${SPECIES[evo.fromSpecies].name} is evolving!`, w / 2, h * 0.7);
    
    ctx.fillStyle = '#4ade80';
    ctx.font = '14px monospace';
    ctx.fillText(`→ ${SPECIES[evo.toSpecies].name}!`, w / 2, h * 0.77);
    
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText('[Press Enter]', w / 2, h * 0.85);
    ctx.textAlign = 'left';
  }

  function renderDialog(ctx: CanvasRenderingContext2D, dialog: NonNullable<GameState['dialog']>, w: number, h: number) {
    const boxH = 70;
    const boxY = h - boxH - 10;
    
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    roundRectPath(ctx, 10, boxY, w - 20, boxH, 10);
    ctx.fill();
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    roundRectPath(ctx, 10, boxY, w - 20, boxH, 10);
    ctx.stroke();
    
    if (dialog.speaker) {
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(dialog.speaker, 25, boxY + 18);
    }
    
    const text = dialog.lines[dialog.currentLine].substring(0, dialog.charIndex);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    
    // Word wrap
    const maxWidth = w - 50;
    const words = text.split(' ');
    let line = '';
    let lineY = boxY + (dialog.speaker ? 36 : 25);
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxWidth) {
        ctx.fillText(line, 25, lineY);
        line = word + ' ';
        lineY += 18;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, 25, lineY);
    
    // Blinking advance indicator
    if (dialog.charIndex >= dialog.lines[dialog.currentLine].length) {
      if (Math.floor(Date.now() / 400) % 2 === 0) {
        ctx.fillStyle = '#4ade80';
        ctx.fillText('▼', w - 40, boxY + boxH - 12);
      }
    }
  }

  function renderMenu(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number) {
    const m = s.menu!;
    
    if (m.screen === 'main') {
      const menuW = 180;
      const menuX = w - menuW - 10;
      const options = ['POKÉMON', 'BAG', 'POKÉDEX', 'SAVE', 'MAP', 'CLOSE'];
      const menuH = options.length * 30 + 20;
      
      ctx.fillStyle = 'rgba(0,0,0,0.95)';
      roundRectPath(ctx, menuX, 10, menuW, menuH, 10);
      ctx.fill();
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      roundRectPath(ctx, menuX, 10, menuW, menuH, 10);
      ctx.stroke();
      
      options.forEach((opt, i) => {
        ctx.fillStyle = i === m.selectedIndex ? '#4ade80' : '#fff';
        ctx.font = `${i === m.selectedIndex ? 'bold ' : ''}14px monospace`;
        ctx.fillText(`${i === m.selectedIndex ? '▸ ' : '  '}${opt}`, menuX + 15, 35 + i * 30);
      });
    } else if (m.screen === 'pokemon') {
      ctx.fillStyle = 'rgba(0,0,0,0.95)';
      ctx.fillRect(0, 0, w, h);
      
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('POKÉMON', 20, 30);
      
      s.player.team.forEach((poke, i) => {
        const species = SPECIES[poke.speciesId];
        const y = 50 + i * 55;
        
        ctx.fillStyle = i === m.selectedIndex ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)';
        roundRectPath(ctx, 15, y, w - 30, 48, 6);
        ctx.fill();
        
        if (i === m.selectedIndex) {
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 1;
          roundRectPath(ctx, 15, y, w - 30, 48, 6);
          ctx.stroke();
        }
        
        // Mini sprite
        drawPokemonSprite(ctx, poke.speciesId, 20, y + 2, 44);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`${poke.nickname || species.name}`, 70, y + 20);
        
        ctx.fillStyle = '#aaa';
        ctx.font = '11px monospace';
        ctx.fillText(`Lv${poke.level}`, 70, y + 36);
        
        // HP bar
        drawHPBar(ctx, w * 0.45, y + 14, w * 0.35, 10, poke.currentHp, poke.stats.hp);
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.fillText(`${poke.currentHp}/${poke.stats.hp}`, w * 0.45, y + 40);
        
        if (poke.status) {
          ctx.fillStyle = getStatusColor(poke.status);
          ctx.fillText(poke.status.toUpperCase(), w * 0.7, y + 40);
        }
      });
      
      ctx.fillStyle = '#666';
      ctx.font = '11px monospace';
      ctx.fillText('[ESC] Back  [Enter] Details', 20, h - 15);
    } else if (m.screen === 'pokemon_detail') {
      ctx.fillStyle = 'rgba(0,0,0,0.95)';
      ctx.fillRect(0, 0, w, h);
      
      const poke = s.player.team[m.selectedPokemon || 0];
      if (!poke) return;
      const species = SPECIES[poke.speciesId];
      
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(poke.nickname || species.name, 20, 30);
      
      drawPokemonSprite(ctx, poke.speciesId, w * 0.6, 20, Math.min(w * 0.35, 150));
      
      ctx.fillStyle = '#fff';
      ctx.font = '13px monospace';
      let ly = 55;
      ctx.fillText(`Level: ${poke.level}`, 20, ly); ly += 22;
      ctx.fillText(`Type: ${species.types.join('/')}`, 20, ly); ly += 22;
      ctx.fillText(`HP: ${poke.currentHp}/${poke.stats.hp}`, 20, ly); ly += 22;
      ctx.fillText(`ATK: ${poke.stats.attack}  DEF: ${poke.stats.defense}`, 20, ly); ly += 22;
      ctx.fillText(`SP.A: ${poke.stats.spAtk}  SP.D: ${poke.stats.spDef}`, 20, ly); ly += 22;
      ctx.fillText(`SPD: ${poke.stats.speed}`, 20, ly); ly += 30;
      
      ctx.fillStyle = '#4ade80';
      ctx.fillText('Moves:', 20, ly); ly += 20;
      ctx.fillStyle = '#fff';
      poke.moves.forEach(m => {
        const move = MOVES[m.moveId];
        if (move) {
          ctx.fillText(`  ${move.name} (${move.type}) ${m.currentPp}/${move.pp}`, 20, ly);
          ly += 20;
        }
      });
      
      ctx.fillStyle = '#666';
      ctx.font = '11px monospace';
      ctx.fillText('[ESC/Enter] Back', 20, h - 15);
    } else if (m.screen === 'bag') {
      ctx.fillStyle = 'rgba(0,0,0,0.95)';
      ctx.fillRect(0, 0, w, h);
      
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('BAG', 20, 30);
      
      const items = Object.entries(s.player.bag).filter(([, qty]) => qty > 0);
      items.forEach(([itemId, qty], i) => {
        const item = ITEMS[itemId];
        if (!item) return;
        const y = 55 + i * 28;
        ctx.fillStyle = i === m.selectedIndex ? '#4ade80' : '#fff';
        ctx.font = '13px monospace';
        ctx.fillText(`${i === m.selectedIndex ? '▸ ' : '  '}${item.name} x${qty}`, 20, y);
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.fillText(item.description, 200, y);
      });
      
      if (items.length === 0) {
        ctx.fillStyle = '#888';
        ctx.font = '14px monospace';
        ctx.fillText('Bag is empty!', 20, 60);
      }
      
      ctx.fillStyle = '#aaa';
      ctx.font = '12px monospace';
      ctx.fillText(`Money: $${s.player.money}`, 20, h - 35);
      ctx.fillStyle = '#666';
      ctx.font = '11px monospace';
      ctx.fillText('[ESC] Back  [Enter] Use', 20, h - 15);
    } else if (m.screen === 'pokedex') {
      ctx.fillStyle = 'rgba(0,0,0,0.95)';
      ctx.fillRect(0, 0, w, h);
      
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('POKÉDEX', 20, 30);
      
      ctx.fillStyle = '#aaa';
      ctx.font = '12px monospace';
      ctx.fillText(`Seen: ${s.player.pokedex.seen.size}  Caught: ${s.player.pokedex.caught.size}`, 20, 55);
      
      let row = 0;
      const allSpecies = Object.entries(SPECIES).sort((a, b) => a[1].id - b[1].id);
      const startIdx = 0;
      const maxShow = Math.min(allSpecies.length, 20);
      
      for (let i = startIdx; i < startIdx + maxShow; i++) {
        const [id, sp] = allSpecies[i] || [];
        if (!id) continue;
        const y = 75 + row * 22;
        const seen = s.player.pokedex.seen.has(id);
        const caught = s.player.pokedex.caught.has(id);
        
        ctx.fillStyle = caught ? '#4ade80' : seen ? '#aaa' : '#444';
        ctx.font = '11px monospace';
        ctx.fillText(
          `${String(sp.id).padStart(3, '0')} ${caught ? '●' : seen ? '○' : '?'} ${seen ? sp.name : '???'}`,
          20, y
        );
        row++;
      }
      
      ctx.fillStyle = '#666';
      ctx.font = '11px monospace';
      ctx.fillText('[ESC] Back', 20, h - 15);
    } else if (m.screen === 'map') {
      ctx.fillStyle = 'rgba(0,0,0,0.95)';
      ctx.fillRect(0, 0, w, h);
      
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('MAP', 20, 30);
      
      // Simple map view
      const locations = [
        { name: 'Pallet Town', x: 0.3, y: 0.85 },
        { name: 'Viridian City', x: 0.3, y: 0.65 },
        { name: 'Pewter City', x: 0.3, y: 0.45 },
        { name: 'Cerulean City', x: 0.55, y: 0.35 },
        { name: 'Vermilion City', x: 0.75, y: 0.45 },
        { name: 'Celadon City', x: 0.5, y: 0.55 },
        { name: 'Fuchsia City', x: 0.7, y: 0.65 },
        { name: 'Saffron City', x: 0.5, y: 0.75 },
        { name: 'Cinnabar Island', x: 0.7, y: 0.85 },
        { name: 'Pokémon League', x: 0.3, y: 0.25 },
      ];
      
      const mapArea = { x: 30, y: 50, w: w - 60, h: h - 100 };
      
      // Draw connections
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i < locations.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(mapArea.x + locations[i].x * mapArea.w, mapArea.y + locations[i].y * mapArea.h);
        ctx.lineTo(mapArea.x + locations[i + 1].x * mapArea.w, mapArea.y + locations[i + 1].y * mapArea.h);
        ctx.stroke();
      }
      
      // Draw locations
      locations.forEach(loc => {
        const lx = mapArea.x + loc.x * mapArea.w;
        const ly = mapArea.y + loc.y * mapArea.h;
        const isCurrent = s.player.mapId.includes(loc.name.toLowerCase().replace(/ /g, '_').replace('é', 'e'));
        
        ctx.fillStyle = isCurrent ? '#4ade80' : '#555';
        ctx.beginPath();
        ctx.arc(lx, ly, isCurrent ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = isCurrent ? '#4ade80' : '#888';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(loc.name, lx, ly + 16);
        ctx.textAlign = 'left';
      });
      
      ctx.fillStyle = '#666';
      ctx.font = '11px monospace';
      ctx.fillText('[ESC] Back', 20, h - 15);
    }
  }

  function renderShop(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number) {
    const shop = s.shop!;
    
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('POKÉ MART', 20, 30);
    
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`Money: $${s.player.money}`, 20, 55);
    
    if (shop.mode === 'select') {
      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.fillText('▸ BUY', w / 2 - 30, h / 2);
      ctx.fillStyle = '#666';
      ctx.font = '12px monospace';
      ctx.fillText('[Enter] to shop, [ESC] to leave', 20, h - 15);
    } else {
      shop.items.forEach((item, i) => {
        const itemData = ITEMS[item.itemId];
        if (!itemData) return;
        const y = 80 + i * 28;
        ctx.fillStyle = i === shop.selectedIndex ? '#4ade80' : '#fff';
        ctx.font = '13px monospace';
        ctx.fillText(`${i === shop.selectedIndex ? '▸ ' : '  '}${itemData.name}`, 20, y);
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`$${itemData.price}`, w * 0.55, y);
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.fillText(`Own: ${s.player.bag[item.itemId] || 0}`, w * 0.75, y);
      });
      
      ctx.fillStyle = '#666';
      ctx.font = '11px monospace';
      ctx.fillText('[Enter] Buy  [ESC] Leave', 20, h - 15);
    }
  }

  function renderMobileControls(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Only show if touch device
    if (typeof window === 'undefined' || !('ontouchstart' in window)) return;
    
    const btnSize = 40;
    const padX = 60;
    const padY = h - 140;
    
    ctx.globalAlpha = 0.4;
    
    // D-pad
    const dirs = [
      { label: '▲', x: padX, y: padY - btnSize, key: 'up' },
      { label: '▼', x: padX, y: padY + btnSize, key: 'down' },
      { label: '◀', x: padX - btnSize, y: padY, key: 'left' },
      { label: '▶', x: padX + btnSize, y: padY, key: 'right' },
    ];
    
    dirs.forEach(d => {
      ctx.fillStyle = '#333';
      roundRectPath(ctx, d.x - btnSize / 2, d.y - btnSize / 2, btnSize, btnSize, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, d.x, d.y + 6);
    });
    
    // A/B buttons
    const abX = w - 80;
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(abX, padY, btnSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('A', abX, padY + 6);
    
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(abX - 50, padY + 20, btnSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('B', abX - 50, padY + 26);
    
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  // ===== TOUCH HANDLING =====
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      if (!touch) return;
      
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      
      const s = stateRef.current;
      
      if (s.phase === 'intro') {
        setState(prev => ({ ...prev, phase: 'naming' }));
        return;
      }
      
      if (s.dialog) {
        advanceDialog();
        return;
      }
      
      // D-pad area (bottom-left)
      const padX = 60;
      const padY = h - 140;
      const dist = Math.sqrt((x - padX) ** 2 + (y - padY) ** 2);
      
      if (dist < 80) {
        const angle = Math.atan2(y - padY, x - padX);
        if (angle > -Math.PI / 4 && angle < Math.PI / 4) {
          keysRef.current.add('arrowright');
          setTimeout(() => keysRef.current.delete('arrowright'), 200);
        } else if (angle > Math.PI / 4 && angle < 3 * Math.PI / 4) {
          keysRef.current.add('arrowdown');
          setTimeout(() => keysRef.current.delete('arrowdown'), 200);
        } else if (angle < -Math.PI / 4 && angle > -3 * Math.PI / 4) {
          keysRef.current.add('arrowup');
          setTimeout(() => keysRef.current.delete('arrowup'), 200);
        } else {
          keysRef.current.add('arrowleft');
          setTimeout(() => keysRef.current.delete('arrowleft'), 200);
        }
        return;
      }
      
      // A button (bottom-right)
      if (x > w - 120 && y > h - 180) {
        if (s.phase === 'battle') {
          handleBattleInput('z');
        } else {
          keysRef.current.add('z');
          setTimeout(() => keysRef.current.delete('z'), 100);
        }
        return;
      }
      
      // B button
      if (x > w - 170 && x < w - 120 && y > h - 160) {
        if (s.phase === 'battle') {
          handleBattleInput('x');
        } else {
          keysRef.current.add('escape');
          setTimeout(() => keysRef.current.delete('escape'), 100);
        }
        return;
      }
      
      // Top area - menu
      if (y < 40 && s.phase === 'overworld') {
        setState(prev => ({
          ...prev,
          phase: 'menu',
          menu: { screen: 'main', selectedIndex: 0, subIndex: 0 },
        }));
      }
    };
    
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    return () => canvas.removeEventListener('touchstart', handleTouch);
  }, []);

  // ===== INTRO/NAMING HANDLERS =====
  useEffect(() => {
    if (state.phase !== 'intro' && state.phase !== 'naming') return;
    
    const handleKey = (e: KeyboardEvent) => {
      if (state.phase === 'intro') {
        if (e.key === 'Enter' || e.key === ' ') {
          setState(prev => ({ ...prev, phase: 'naming' }));
        }
        if (e.key.toLowerCase() === 'l') {
          const saved = loadGame();
          if (saved) setState(saved);
        }
        return;
      }
      
      if (state.phase === 'naming') {
        if (e.key === 'Enter' && inputName.trim().length > 0) {
          setState(prev => ({
            ...prev,
            phase: 'overworld',
            player: { ...prev.player, name: inputName.trim() },
          }));
          // Show Oak dialog
          setTimeout(() => {
            showDialog([
              `Welcome, ${inputName.trim()}!`,
              'I am Professor Oak.',
              'The world is full of creatures called Pokémon!',
              'Some people keep them as pets, while others battle with them.',
              'I study Pokémon as a profession.',
              'Your very own Pokémon adventure is about to begin!',
              'Head to my lab in Pallet Town to get your first Pokémon!',
            ], undefined, 'Prof. Oak');
          }, 300);
          return;
        }
        if (e.key === 'Backspace') {
          setInputName(prev => prev.slice(0, -1));
          return;
        }
        if (e.key.length === 1 && inputName.length < 10) {
          setInputName(prev => prev + e.key);
        }
      }
    };
    
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.phase, inputName, showDialog]);

  // Starter selection keyboard
  useEffect(() => {
    if (state.phase !== 'starter_select') return;
    
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setSelectedStarter(prev => Math.max(0, prev - 1));
      if (e.key === 'ArrowRight') setSelectedStarter(prev => Math.min(2, prev + 1));
      if (e.key === 'Enter' || e.key === ' ') {
        const starters = ['emberon', 'aqualing', 'sproutley'];
        selectStarter(starters[selectedStarter]);
      }
    };
    
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.phase, selectedStarter, selectStarter]);

  // Auto-save
  useEffect(() => {
    if (state.phase === 'overworld' && state.player.team.length > 0) {
      const timer = setTimeout(() => saveGame(state), 30000);
      return () => clearTimeout(timer);
    }
  }, [state.player.steps]);

  // Canvas resize
  const [canvasSize, setCanvasSize] = useState({ w: 480, h: 360 });
  useEffect(() => {
    const resize = () => {
      const maxW = Math.min(window.innerWidth - 20, 800);
      const maxH = Math.min(window.innerHeight - 100, 600);
      // Maintain 4:3 ratio
      const ratio = 4 / 3;
      let w = maxW;
      let h = w / ratio;
      if (h > maxH) { h = maxH; w = h * ratio; }
      setCanvasSize({ w: Math.floor(w), h: Math.floor(h) });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className="rounded-lg border-2 border-emerald-900 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <div className="mt-3 text-emerald-700 text-xs font-mono text-center max-w-md">
        <p>Arrow keys/WASD to move • Z/Space/Enter to interact • ESC for menu</p>
        <p className="mt-1">Mobile: Use on-screen controls</p>
      </div>
    </div>
  );
}

// ===== UTILITY =====
function findFirstAlive(team: PokemonInstance[]): number {
  return Math.max(0, team.findIndex(p => p.currentHp > 0));
}

function drawHPBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, current: number, max: number) {
  const ratio = Math.max(0, current / max);
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = ratio > 0.5 ? '#4ade80' : ratio > 0.2 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(x, y, w * ratio, h);
  ctx.strokeStyle = '#555';
  ctx.strokeRect(x, y, w, h);
}

function getStatusColor(status: StatusEffect): string {
  switch (status) {
    case 'poison': return '#a855f7';
    case 'burn': return '#ef4444';
    case 'paralyze': return '#f59e0b';
    case 'sleep': return '#6b7280';
    case 'freeze': return '#3b82f6';
    default: return '#fff';
  }
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
