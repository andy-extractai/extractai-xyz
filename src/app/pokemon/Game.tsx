'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, createInitialState, createPokemon, saveGame, loadGame, calcStats, PCUIState } from './engine/state';
import { rollWildEncounter, evolvePokemon } from './engine/battle';
import { renderMap } from './engine/renderer';
import { executeBattleAction, handlePostMessage, handleBattleVictory, handlePostExp, handleLearnMove, useBattleItem, handleCatchResult } from './engine/battleLogic';
import { getAllMaps, DOOR_CONNECTIONS, MAP_CONNECTIONS, TILE_DEFS } from './data/maps';
import { SPECIES } from './data/pokemon';
import { MOVES } from './data/moves';
import { ITEMS, MART_INVENTORY } from './data/items';
import { TRAINERS, GYM_ORDER, ELITE4_ORDER } from './data/trainers';
import { StatusEffect } from './data/types';
import { findFirstAlive, roundRectPath } from './components/utils';
import { renderBattleScreen } from './components/BattleScreen';
import { renderMenu } from './components/MenuScreen';
import { renderShop } from './components/ShopScreen';
import { renderIntroScreen, renderNamingScreen, renderStarterSelect } from './components/IntroScreens';
import { renderEvolution } from './components/EvolutionScreen';
import { renderPCScreen, depositPokemon, withdrawPokemon } from './components/PCScreen';
import { getHmAction, cutTreeFlag, isTreeCut, shouldExitSurf, teamKnowsMove } from './engine/hm';

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

      if (s.dialog && (e.key === 'z' || e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        advanceDialog();
        return;
      }

      if (e.key === 'Escape' && s.phase === 'overworld' && !s.dialog) {
        e.preventDefault();
        setState(prev => ({
          ...prev,
          phase: prev.menu ? 'overworld' : 'menu',
          menu: prev.menu ? null : { screen: 'main', selectedIndex: 0, subIndex: 0 },
        }));
        return;
      }

      if (s.phase === 'menu' && s.menu) { handleMenuInput(e.key.toLowerCase()); return; }
      if (s.phase === 'battle' && s.battle) { handleBattleInput(e.key.toLowerCase()); return; }
      if (s.phase === 'shop' && s.shop) { handleShopInput(e.key.toLowerCase()); return; }
      if (s.phase === 'pc' && s.pcUI) { handlePCInput(e.key.toLowerCase()); return; }
      if (s.phase === 'evolution') {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'z') completeEvolution();
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
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
      if (d.charIndex < d.lines[d.currentLine].length) {
        return { ...prev, dialog: { ...d, charIndex: d.lines[d.currentLine].length } };
      }
      if (d.currentLine < d.lines.length - 1) {
        return { ...prev, dialog: { ...d, currentLine: d.currentLine + 1, charIndex: 0 } };
      }
      const callback = d.onComplete;
      const newState = { ...prev, dialog: null };
      if (callback) setTimeout(callback, 50);
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
          if (dx !== 0 || dy !== 0) { lastMoveRef.current = now; movePlayer(dx, dy, dir); }
        }
        if (keysRef.current.has('z') || keysRef.current.has(' ')) {
          keysRef.current.delete('z');
          keysRef.current.delete(' ');
          interact();
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) renderGame(ctx, s, frameRef.current);
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

      if (newX < 0 || newY < 0 || newX >= map.width || newY >= map.height) {
        let edge: 'north' | 'south' | 'east' | 'west' = 'north';
        if (dy < 0) edge = 'north';
        else if (dy > 0) edge = 'south';
        else if (dx < 0) edge = 'west';
        else if (dx > 0) edge = 'east';
        const conn = MAP_CONNECTIONS.find(c => c.from === prev.player.mapId && c.fromEdge === edge);
        if (conn && MAPS[conn.to]) {
          return { ...prev, player: { ...prev.player, x: conn.toX, y: conn.toY, mapId: conn.to, direction: dir, steps: prev.player.steps + 1 } };
        }
        return { ...prev, player: { ...prev.player, direction: dir } };
      }

      let tileType = map.tiles[newY]?.[newX];
      // Treat cut trees as walkable grass
      if (tileType === 16 && prev.player.storyFlags.has(cutTreeFlag(prev.player.mapId, newX, newY))) {
        tileType = 0;
      }
      const tileDef = TILE_DEFS[tileType];
      // Allow walking on water when surfing
      const isWater = tileType === 3;
      const canWalk = tileDef?.walkable || (isWater && prev.player.isSurfing);
      if (!canWalk) return { ...prev, player: { ...prev.player, direction: dir } };

      const npcBlocking = map.npcs.find(n => n.x === newX && n.y === newY);
      if (npcBlocking && npcBlocking.spriteType !== 'sign') return { ...prev, player: { ...prev.player, direction: dir } };

      const doorConn = DOOR_CONNECTIONS.find(d => d.fromMap === prev.player.mapId && d.fromX === newX && d.fromY === newY);
      if (doorConn && MAPS[doorConn.toMap]) {
        return { ...prev, player: { ...prev.player, x: doorConn.toX, y: doorConn.toY, mapId: doorConn.toMap, direction: dir, steps: prev.player.steps + 1 } };
      }

      // Exit surf when stepping onto land
      const exitSurf = shouldExitSurf(tileType, prev.player.isSurfing);
      const newState = { ...prev, player: { ...prev.player, x: newX, y: newY, direction: dir, steps: prev.player.steps + 1, isSurfing: exitSurf ? false : prev.player.isSurfing } };

      if (tileDef.encounter && prev.player.team.length > 0 && prev.player.repelSteps <= 0) {
        const encounter = rollWildEncounter(map.encounters, map.encounterRate);
        if (encounter) {
          const wildPoke = createPokemon(encounter.speciesId, encounter.level);
          newState.player.pokedex.seen.add(encounter.speciesId);
          return {
            ...newState, phase: 'battle',
            battle: {
              type: 'wild', playerTeam: [...prev.player.team], enemyTeam: [wildPoke],
              activePlayerIdx: findFirstAlive(prev.player.team), activeEnemyIdx: 0,
              phase: 'intro', messages: [`A wild ${SPECIES[encounter.speciesId].name} appeared!`],
              messageIdx: 0, animations: [], canRun: true, battleReward: 0,
            },
          };
        }
      }
      if (newState.player.repelSteps > 0) newState.player.repelSteps--;
      return newState;
    });
  }, []);

  // ===== INTERACTION =====
  const interact = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'overworld' || s.dialog) return;
    const map = MAPS[s.player.mapId];
    if (!map) return;

    const dx = s.player.direction === 'right' ? 1 : s.player.direction === 'left' ? -1 : 0;
    const dy = s.player.direction === 'down' ? 1 : s.player.direction === 'up' ? -1 : 0;
    const targetX = s.player.x + dx;
    const targetY = s.player.y + dy;

    const npc = map.npcs.find(n => n.x === targetX && n.y === targetY);
    if (npc) {
      if (npc.id === 'nurse') {
        showDialog(npc.dialog, () => {
          setState(prev => {
            const healed = prev.player.team.map(p => ({
              ...p, currentHp: calcStats(p.speciesId, p.level, p.iv).hp, status: null as StatusEffect,
              moves: p.moves.map(m => ({ ...m, currentPp: MOVES[m.moveId]?.pp || m.currentPp })),
            }));
            return { ...prev, player: { ...prev.player, team: healed, lastPokecenterMap: prev.player.mapId, lastPokecenterX: prev.player.x, lastPokecenterY: prev.player.y } };
          });
        }, npc.name);
        return;
      }
      if (npc.id === 'clerk') {
        const cityMap = Object.keys(MART_INVENTORY).find(k => s.player.mapId.includes(k)) || 'viridian';
        const inventory = MART_INVENTORY[cityMap] || MART_INVENTORY.viridian;
        setState(prev => ({ ...prev, phase: 'shop', shop: { items: inventory.items, selectedIndex: 0, mode: 'select', quantity: 1, mapId: cityMap } }));
        return;
      }
      if (npc.id === 'oak' && s.player.mapId === 'oak_lab') {
        if (!s.player.storyFlags.has('got_starter')) {
          showDialog(['Ah, there you are!', 'Welcome to the world of Pokémon!', 'Please choose your first partner!'], () => {
            setState(prev => ({ ...prev, phase: 'starter_select' }));
          }, 'Prof. Oak');
          return;
        }
      }
      // HM NPCs - teach Cut or Surf to first eligible Pokémon
      if (npc.id === 'hm_cut_npc' && !s.player.storyFlags.has('got_hm_cut')) {
        showDialog(npc.dialog, () => {
          setState(prev => {
            const newFlags = new Set(prev.player.storyFlags);
            newFlags.add('got_hm_cut');
            // Teach Cut to first team Pokémon that doesn't already know it
            const team = [...prev.player.team];
            const target = team.find(p => p.currentHp > 0 && p.moves.length < 4 && !p.moves.some(m => m.moveId === 'cut'));
            if (target) {
              target.moves = [...target.moves, { moveId: 'cut', currentPp: 30 }];
            } else if (team.length > 0) {
              // Replace last move of first Pokémon
              const p = team[0];
              if (!p.moves.some(m => m.moveId === 'cut')) {
                p.moves = [...p.moves.slice(0, 3), { moveId: 'cut', currentPp: 30 }];
              }
            }
            return { ...prev, player: { ...prev.player, team, storyFlags: newFlags } };
          });
        }, npc.name);
        return;
      }
      if (npc.id === 'hm_surf_npc' && !s.player.storyFlags.has('got_hm_surf')) {
        showDialog(npc.dialog, () => {
          setState(prev => {
            const newFlags = new Set(prev.player.storyFlags);
            newFlags.add('got_hm_surf');
            const team = [...prev.player.team];
            const target = team.find(p => p.currentHp > 0 && p.moves.length < 4 && !p.moves.some(m => m.moveId === 'surf'));
            if (target) {
              target.moves = [...target.moves, { moveId: 'surf', currentPp: 15 }];
            } else if (team.length > 0) {
              const p = team[0];
              if (!p.moves.some(m => m.moveId === 'surf')) {
                p.moves = [...p.moves.slice(0, 3), { moveId: 'surf', currentPp: 15 }];
              }
            }
            return { ...prev, player: { ...prev.player, team, storyFlags: newFlags } };
          });
        }, npc.name);
        return;
      }
      // Already got HM - show different dialog
      if (npc.id === 'hm_cut_npc' && s.player.storyFlags.has('got_hm_cut')) {
        showDialog(['You already have Cut! Use it on small trees!'], undefined, npc.name);
        return;
      }
      if (npc.id === 'hm_surf_npc' && s.player.storyFlags.has('got_hm_surf')) {
        showDialog(['You already have Surf! Use it near water!'], undefined, npc.name);
        return;
      }

      showDialog(npc.dialog, undefined, npc.name);
      return;
    }

    let tileType = map.tiles[targetY]?.[targetX];
    // If this cuttree was already cut, treat as grass
    if (tileType === 16 && s.player.storyFlags.has(cutTreeFlag(s.player.mapId, targetX, targetY))) {
      tileType = 0;
    }

    const hmAction = tileType !== undefined ? getHmAction(tileType, s.player.team, s.player.isSurfing) : null;
    if (hmAction === 'cut') {
      const flag = cutTreeFlag(s.player.mapId, targetX, targetY);
      showDialog(['Used Cut!', 'The tree was cut down!'], () => {
        setState(prev => {
          const newFlags = new Set(prev.player.storyFlags);
          newFlags.add(flag);
          return { ...prev, player: { ...prev.player, storyFlags: newFlags } };
        });
      });
      return;
    }
    if (hmAction === 'surf') {
      showDialog(['Used Surf!'], () => {
        setState(prev => ({
          ...prev,
          player: {
            ...prev.player,
            isSurfing: true,
            x: targetX,
            y: targetY,
          },
        }));
      });
      return;
    }

    if (tileType === 9) {
      const sign = map.npcs.find(n => n.x === targetX && n.y === targetY && n.spriteType === 'sign');
      if (sign) showDialog(sign.dialog);
      return;
    }
    if (tileType === 14) {
      setState(prev => ({ ...prev, phase: 'pc', pcUI: { mode: 'main', selectedIndex: 0 } }));
      return;
    }
    if (tileType === 15) {
      showDialog(['Your Pokémon have been healed!'], () => {
        setState(prev => {
          const healed = prev.player.team.map(p => ({
            ...p, currentHp: calcStats(p.speciesId, p.level, p.iv).hp, status: null as StatusEffect,
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
          if (b.messageIdx < b.messages.length - 1) return { ...prev, battle: { ...b, messageIdx: b.messageIdx + 1 } };
          if (b.phase === 'intro') return { ...prev, battle: { ...b, phase: 'action_select', messages: [], messageIdx: 0 } };
          return handlePostMessage(prev);
        }
        return prev;
      }

      if (b.phase === 'action_select') {
        if (key === 'arrowup' || key === 'w') return { ...prev, battle: { ...b, messages: [], messageIdx: Math.max(0, b.messageIdx - 2) } };
        if (key === 'arrowdown' || key === 's') return { ...prev, battle: { ...b, messages: [], messageIdx: Math.min(3, b.messageIdx + 2) } };
        if (key === 'arrowleft' || key === 'a') return { ...prev, battle: { ...b, messages: [], messageIdx: Math.max(0, b.messageIdx - 1) } };
        if (key === 'arrowright' || key === 'd') return { ...prev, battle: { ...b, messages: [], messageIdx: Math.min(3, b.messageIdx + 1) } };
        if (key === 'z' || key === ' ' || key === 'enter') {
          const selected = b.messageIdx;
          if (selected === 0) return { ...prev, battle: { ...b, phase: 'move_select', messageIdx: 0 } };
          if (selected === 1) return { ...prev, battle: { ...b, phase: 'item_select', messageIdx: 0 } };
          if (selected === 2) return { ...prev, battle: { ...b, phase: 'switch_select', messageIdx: 0 } };
          if (selected === 3) return executeBattleAction(prev, { type: 'run' });
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
        if (key === 'x' || key === 'backspace' || key === 'escape') return { ...prev, battle: { ...b, phase: 'action_select', messageIdx: 0 } };
      }

      if (b.phase === 'switch_select') {
        const teamSize = b.playerTeam.length;
        if (key === 'arrowup' || key === 'w') return { ...prev, battle: { ...b, messageIdx: Math.max(0, b.messageIdx - 1) } };
        if (key === 'arrowdown' || key === 's') return { ...prev, battle: { ...b, messageIdx: Math.min(teamSize - 1, b.messageIdx + 1) } };
        if (key === 'z' || key === ' ' || key === 'enter') {
          const idx = b.messageIdx;
          if (idx === b.activePlayerIdx || b.playerTeam[idx].currentHp <= 0) return prev;
          return executeBattleAction(prev, { type: 'switch', switchIdx: idx });
        }
        if (key === 'x' || key === 'backspace' || key === 'escape') return { ...prev, battle: { ...b, phase: 'action_select', messageIdx: 0 } };
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
        if (key === 'x' || key === 'backspace' || key === 'escape') return { ...prev, battle: { ...b, phase: 'action_select', messageIdx: 0 } };
      }

      if (b.phase === 'fainted') {
        if (key === 'z' || key === ' ' || key === 'enter') {
          const aliveIdx = b.playerTeam.findIndex((p, i) => i !== b.activePlayerIdx && p.currentHp > 0);
          if (aliveIdx >= 0) return { ...prev, battle: { ...b, phase: 'switch_select', messageIdx: 0 } };
          return {
            ...prev, phase: 'overworld', battle: null,
            player: {
              ...prev.player,
              team: prev.player.team.map(p => ({ ...p, currentHp: Math.max(1, Math.floor(calcStats(p.speciesId, p.level, p.iv).hp / 2)) })),
              money: Math.floor(prev.player.money / 2),
              x: prev.lastPokecenterX, y: prev.lastPokecenterY, mapId: prev.lastPokecenterMap,
            },
          };
        }
      }

      if (b.phase === 'victory') { if (key === 'z' || key === ' ' || key === 'enter') return handleBattleVictory(prev); }
      if (b.phase === 'catch') { if (key === 'z' || key === ' ' || key === 'enter') return handleCatchResult(prev); }
      if (b.phase === 'exp_gain' || b.phase === 'level_up') { if (key === 'z' || key === ' ' || key === 'enter') return handlePostExp(prev); }

      if (b.phase === 'learn_move') {
        if (key >= '1' && key <= '4') return handleLearnMove(prev, parseInt(key) - 1);
        if (key === '5' || key === 'x' || key === 'backspace') return handlePostExp(prev);
      }

      return prev;
    });
  }, []);

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
        if (key === 'x' || key === 'backspace' || key === 'escape') return { ...prev, menu: null, phase: 'overworld' };
      } else if (m.screen === 'pokemon') {
        const teamSize = prev.player.team.length;
        if (key === 'arrowup' || key === 'w') m.selectedIndex = Math.max(0, m.selectedIndex - 1);
        if (key === 'arrowdown' || key === 's') m.selectedIndex = Math.min(teamSize - 1, m.selectedIndex + 1);
        if (key === 'z' || key === ' ' || key === 'enter') { m.screen = 'pokemon_detail'; m.selectedPokemon = m.selectedIndex; }
        if (key === 'x' || key === 'backspace' || key === 'escape') { m.screen = 'main'; m.selectedIndex = 0; }
      } else if (m.screen === 'pokemon_detail') {
        if (key === 'x' || key === 'backspace' || key === 'escape' || key === 'z' || key === ' ' || key === 'enter') m.screen = 'pokemon';
      } else if (m.screen === 'bag') {
        const items = Object.entries(prev.player.bag).filter(([, qty]) => qty > 0);
        if (key === 'arrowup' || key === 'w') m.selectedIndex = Math.max(0, m.selectedIndex - 1);
        if (key === 'arrowdown' || key === 's') m.selectedIndex = Math.min(items.length - 1, m.selectedIndex + 1);
        if (key === 'z' || key === ' ' || key === 'enter') {
          if (items.length > 0) {
            const [itemId] = items[m.selectedIndex];
            const item = ITEMS[itemId];
            if (item?.category === 'medicine') {
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
        if (key === 'x' || key === 'backspace' || key === 'escape') { m.screen = 'main'; m.selectedIndex = 1; }
      } else if (m.screen === 'pokedex' || m.screen === 'map') {
        if (key === 'x' || key === 'backspace' || key === 'escape' || key === 'z' || key === ' ' || key === 'enter') { m.screen = 'main'; m.selectedIndex = 2; }
      } else if (m.screen === 'save' || m.screen === 'options') {
        if (key === 'x' || key === 'backspace' || key === 'escape') m.screen = 'main';
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
        if (key === 'x' || key === 'backspace' || key === 'escape') return { ...prev, phase: 'overworld', shop: null };
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
          return { ...prev, player: { ...prev.player, bag: newBag, money: prev.player.money - item.price }, shop: s };
        }
      }
      if (key === 'x' || key === 'backspace' || key === 'escape') return { ...prev, phase: 'overworld', shop: null };
      return { ...prev, shop: s };
    });
  }, []);

  // ===== PC INPUT =====
  const handlePCInput = useCallback((key: string) => {
    setState(prev => {
      if (!prev.pcUI) return prev;
      const pc = { ...prev.pcUI };

      if (pc.mode === 'main') {
        const options = 3; // deposit, withdraw, close
        if (key === 'arrowup' || key === 'w') pc.selectedIndex = Math.max(0, pc.selectedIndex - 1);
        if (key === 'arrowdown' || key === 's') pc.selectedIndex = Math.min(options - 1, pc.selectedIndex + 1);
        if (key === 'z' || key === ' ' || key === 'enter') {
          if (pc.selectedIndex === 0) { pc.mode = 'deposit'; pc.selectedIndex = 0; }
          else if (pc.selectedIndex === 1) { pc.mode = 'withdraw'; pc.selectedIndex = 0; }
          else return { ...prev, phase: 'overworld', pcUI: null };
        }
        if (key === 'x' || key === 'backspace' || key === 'escape') return { ...prev, phase: 'overworld', pcUI: null };
        return { ...prev, pcUI: pc };
      }

      if (pc.mode === 'deposit') {
        const team = prev.player.team;
        if (key === 'arrowup' || key === 'w') pc.selectedIndex = Math.max(0, pc.selectedIndex - 1);
        if (key === 'arrowdown' || key === 's') pc.selectedIndex = Math.min(team.length - 1, pc.selectedIndex + 1);
        if (key === 'z' || key === ' ' || key === 'enter') {
          const result = depositPokemon(team, prev.player.pc, pc.selectedIndex);
          if (result) {
            const newPc = { ...pc, selectedIndex: Math.min(pc.selectedIndex, result.team.length - 1) };
            return { ...prev, player: { ...prev.player, team: result.team, pc: result.pc }, pcUI: newPc };
          }
        }
        if (key === 'x' || key === 'backspace' || key === 'escape') { pc.mode = 'main'; pc.selectedIndex = 0; }
        return { ...prev, pcUI: pc };
      }

      if (pc.mode === 'withdraw') {
        const storage = prev.player.pc;
        if (key === 'arrowup' || key === 'w') pc.selectedIndex = Math.max(0, pc.selectedIndex - 1);
        if (key === 'arrowdown' || key === 's') pc.selectedIndex = Math.min(storage.length - 1, pc.selectedIndex + 1);
        if (key === 'z' || key === ' ' || key === 'enter') {
          const result = withdrawPokemon(prev.player.team, storage, pc.selectedIndex);
          if (result) {
            const newPc = { ...pc, selectedIndex: Math.min(pc.selectedIndex, result.pc.length - 1) };
            return { ...prev, player: { ...prev.player, team: result.team, pc: result.pc }, pcUI: newPc };
          }
        }
        if (key === 'x' || key === 'backspace' || key === 'escape') { pc.mode = 'main'; pc.selectedIndex = 1; }
        return { ...prev, pcUI: pc };
      }

      return prev;
    });
  }, []);

  // ===== STARTER SELECTION =====
  const selectStarter = useCallback((speciesId: string) => {
    const rivalStarters: Record<string, string> = { emberon: 'aqualing', aqualing: 'sproutley', sproutley: 'emberon' };
    const starter = createPokemon(speciesId, 5);
    const rivalSpecies = rivalStarters[speciesId];
    setState(prev => ({
      ...prev, phase: 'overworld',
      player: {
        ...prev.player, team: [starter],
        storyFlags: new Set([...prev.player.storyFlags, 'got_starter']),
        pokedex: { seen: new Set([...prev.player.pokedex.seen, speciesId]), caught: new Set([...prev.player.pokedex.caught, speciesId]) },
      },
      rival: { starterSpecies: rivalSpecies },
    }));
    setTimeout(() => {
      setState(prev => {
        const rivalPoke = createPokemon(rivalSpecies, 5);
        return {
          ...prev, phase: 'battle',
          battle: {
            type: 'trainer', trainerId: 'rival_oak_lab', trainerName: 'Gary',
            playerTeam: [...prev.player.team], enemyTeam: [rivalPoke],
            activePlayerIdx: 0, activeEnemyIdx: 0, phase: 'intro',
            messages: ['Gary: Heh, let me show you how it\'s done!', `Gary sent out ${SPECIES[rivalSpecies].name}!`],
            messageIdx: 0, animations: [], canRun: false, battleReward: 500,
          },
        };
      });
    }, 500);
  }, []);

  // ===== GYM/TRAINER TRIGGERS =====
  useEffect(() => {
    const s = state;
    if (s.phase !== 'overworld') return;

    const gymInfo = GYM_ORDER.find(g => g.gymId === s.player.mapId);
    if (gymInfo && !s.player.badges.includes(gymInfo.badge) && !s.player.defeatedTrainers.has(gymInfo.leaderId)) {
      if (s.player.y <= 4) {
        const trainer = TRAINERS[gymInfo.leaderId];
        if (trainer) {
          const enemyTeam = trainer.team.map(t => createPokemon(t.speciesId, t.level));
          showDialog(trainer.preDialog || [], () => {
            setState(prev => ({
              ...prev, phase: 'battle',
              battle: {
                type: 'trainer', trainerId: gymInfo.leaderId, trainerName: trainer.name, isGymLeader: true,
                playerTeam: [...prev.player.team], enemyTeam,
                activePlayerIdx: findFirstAlive(prev.player.team), activeEnemyIdx: 0,
                phase: 'intro', messages: [`${trainer.name} wants to battle!`],
                messageIdx: 0, animations: [], canRun: false, battleReward: trainer.reward,
              },
            }));
          });
        }
      }
    }

    if (s.player.mapId === 'elite4' && s.player.y <= 4) {
      const nextE4 = ELITE4_ORDER.find(id => !s.player.defeatedTrainers.has(id));
      if (nextE4) {
        const trainer = TRAINERS[nextE4];
        if (trainer) {
          const enemyTeam = trainer.team.map(t => createPokemon(t.speciesId, t.level));
          showDialog(trainer.preDialog || [], () => {
            setState(prev => ({
              ...prev, phase: 'battle',
              battle: {
                type: 'trainer', trainerId: nextE4, trainerName: trainer.name, isElite4: true,
                playerTeam: [...prev.player.team], enemyTeam,
                activePlayerIdx: findFirstAlive(prev.player.team), activeEnemyIdx: 0,
                phase: 'intro', messages: [`${trainer.name} wants to battle!`],
                messageIdx: 0, animations: [], canRun: false, battleReward: trainer.reward,
              },
            }));
          });
        }
      }
    }

    const map = MAPS[s.player.mapId];
    if (map) {
      for (const trainerId of map.trainers) {
        if (s.player.defeatedTrainers.has(trainerId)) continue;
        const trainer = TRAINERS[trainerId];
        if (!trainer) continue;
        const trainerNpc = map.npcs.find(n => n.id === trainerId);
        if (!trainerNpc) {
          const hash = trainerId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          const tx = 8 + (hash % 5);
          const ty = 8 + (hash % 7);
          const dist = Math.abs(s.player.x - tx) + Math.abs(s.player.y - ty);
          if (dist <= 3) {
            const enemyTeam = trainer.team.map(t => createPokemon(t.speciesId, t.level));
            showDialog(trainer.preDialog || [`${trainer.name} wants to battle!`], () => {
              setState(prev => ({
                ...prev, phase: 'battle',
                battle: {
                  type: 'trainer', trainerId, trainerName: trainer.name,
                  playerTeam: [...prev.player.team], enemyTeam,
                  activePlayerIdx: findFirstAlive(prev.player.team), activeEnemyIdx: 0,
                  phase: 'intro', messages: [`${trainer.name} wants to battle!`],
                  messageIdx: 0, animations: [], canRun: false, battleReward: trainer.reward,
                },
              }));
            });
            break;
          }
        }
      }
    }
  }, [state.player.x, state.player.y, state.player.mapId, state.phase]);

  // ===== RENDERING (delegates to extracted components) =====
  const renderGame = useCallback((ctx: CanvasRenderingContext2D, s: GameState, frame: number) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (s.phase === 'intro') { renderIntroScreen(ctx, w, h, frame); return; }
    if (s.phase === 'naming') { renderNamingScreen(ctx, w, h, inputName); return; }
    if (s.phase === 'starter_select') { renderStarterSelect(ctx, w, h, frame, selectedStarter); return; }

    if (s.phase === 'overworld' || s.phase === 'menu' || s.phase === 'shop' || s.phase === 'pc') {
      const map = MAPS[s.player.mapId];
      if (map) {
        renderMap(ctx, map, s.player.x, s.player.y, s.player.direction, w, h, frame, map.npcs, { isSurfing: s.player.isSurfing, cutTrees: s.player.storyFlags });
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, w, 28);
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(map.name, 10, 19);
        ctx.fillStyle = '#888';
        ctx.font = '11px monospace';
        ctx.fillText(`🏅${s.player.badges.length} 💰${s.player.money}`, w - 130, 19);
      }
    }

    if (s.phase === 'battle' && s.battle) renderBattleScreen(ctx, s, w, h, frame);
    if (s.phase === 'evolution' && s.evolution) renderEvolution(ctx, s.evolution, w, h, frame);
    if (s.dialog) renderDialog(ctx, s.dialog, w, h);
    if (s.phase === 'menu' && s.menu) renderMenu(ctx, s, w, h);
    if (s.phase === 'shop' && s.shop) renderShop(ctx, s, w, h);
    if (s.phase === 'pc' && s.pcUI) renderPCScreen(ctx, s, w, h);
    renderMobileControls(ctx, w, h);
  }, [inputName, selectedStarter]);

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
    if (dialog.speaker) { ctx.fillStyle = '#4ade80'; ctx.font = 'bold 12px monospace'; ctx.fillText(dialog.speaker, 25, boxY + 18); }
    const text = dialog.lines[dialog.currentLine].substring(0, dialog.charIndex);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    const maxWidth = w - 50;
    const words = text.split(' ');
    let line = '';
    let lineY = boxY + (dialog.speaker ? 36 : 25);
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxWidth) { ctx.fillText(line, 25, lineY); line = word + ' '; lineY += 18; } else { line = test; }
    }
    ctx.fillText(line, 25, lineY);
    if (dialog.charIndex >= dialog.lines[dialog.currentLine].length) {
      if (Math.floor(Date.now() / 400) % 2 === 0) { ctx.fillStyle = '#4ade80'; ctx.fillText('▼', w - 40, boxY + boxH - 12); }
    }
  }

  function renderMobileControls(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (typeof window === 'undefined' || !('ontouchstart' in window)) return;
    const btnSize = 40, padX = 60, padY = h - 140;
    ctx.globalAlpha = 0.4;
    [{ label: '▲', x: padX, y: padY - btnSize }, { label: '▼', x: padX, y: padY + btnSize },
     { label: '◀', x: padX - btnSize, y: padY }, { label: '▶', x: padX + btnSize, y: padY }].forEach(d => {
      ctx.fillStyle = '#333'; roundRectPath(ctx, d.x - btnSize / 2, d.y - btnSize / 2, btnSize, btnSize, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(d.label, d.x, d.y + 6);
    });
    const abX = w - 80;
    ctx.fillStyle = '#2ecc71'; ctx.beginPath(); ctx.arc(abX, padY, btnSize / 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('A', abX, padY + 6);
    ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(abX - 50, padY + 20, btnSize / 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText('B', abX - 50, padY + 26);
    ctx.textAlign = 'left'; ctx.globalAlpha = 1;
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
      if (s.phase === 'intro') { setState(prev => ({ ...prev, phase: 'naming' })); return; }
      if (s.dialog) { advanceDialog(); return; }
      const padX = 60;
      const padY = h - 140;
      const dist = Math.sqrt((x - padX) ** 2 + (y - padY) ** 2);
      if (dist < 80) {
        const angle = Math.atan2(y - padY, x - padX);
        if (angle > -Math.PI / 4 && angle < Math.PI / 4) { keysRef.current.add('arrowright'); setTimeout(() => keysRef.current.delete('arrowright'), 200); }
        else if (angle > Math.PI / 4 && angle < 3 * Math.PI / 4) { keysRef.current.add('arrowdown'); setTimeout(() => keysRef.current.delete('arrowdown'), 200); }
        else if (angle < -Math.PI / 4 && angle > -3 * Math.PI / 4) { keysRef.current.add('arrowup'); setTimeout(() => keysRef.current.delete('arrowup'), 200); }
        else { keysRef.current.add('arrowleft'); setTimeout(() => keysRef.current.delete('arrowleft'), 200); }
        return;
      }
      if (x > w - 120 && y > h - 180) {
        if (s.phase === 'battle') handleBattleInput('z');
        else { keysRef.current.add('z'); setTimeout(() => keysRef.current.delete('z'), 100); }
        return;
      }
      if (x > w - 170 && x < w - 120 && y > h - 160) {
        if (s.phase === 'battle') handleBattleInput('x');
        else { keysRef.current.add('escape'); setTimeout(() => keysRef.current.delete('escape'), 100); }
        return;
      }
      if (y < 40 && s.phase === 'overworld') {
        setState(prev => ({ ...prev, phase: 'menu', menu: { screen: 'main', selectedIndex: 0, subIndex: 0 } }));
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
        if (e.key === 'Enter' || e.key === ' ') setState(prev => ({ ...prev, phase: 'naming' }));
        if (e.key.toLowerCase() === 'l') { const saved = loadGame(); if (saved) setState(saved); }
        return;
      }
      if (state.phase === 'naming') {
        if (e.key === 'Enter' && inputName.trim().length > 0) {
          setState(prev => ({ ...prev, phase: 'overworld', player: { ...prev.player, name: inputName.trim() } }));
          setTimeout(() => {
            showDialog([
              `Welcome, ${inputName.trim()}!`, 'I am Professor Oak.',
              'The world is full of creatures called Pokémon!',
              'Some people keep them as pets, while others battle with them.',
              'I study Pokémon as a profession.',
              'Your very own Pokémon adventure is about to begin!',
              'Head to my lab in Pallet Town to get your first Pokémon!',
            ], undefined, 'Prof. Oak');
          }, 300);
          return;
        }
        if (e.key === 'Backspace') { setInputName(prev => prev.slice(0, -1)); return; }
        if (e.key.length === 1 && inputName.length < 10) setInputName(prev => prev + e.key);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.phase, inputName, showDialog]);

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

  useEffect(() => {
    if (state.phase === 'overworld' && state.player.team.length > 0) {
      const timer = setTimeout(() => saveGame(state), 30000);
      return () => clearTimeout(timer);
    }
  }, [state.player.steps]);

  const [canvasSize, setCanvasSize] = useState({ w: 480, h: 360 });
  useEffect(() => {
    const resize = () => {
      const maxW = Math.min(window.innerWidth - 20, 800);
      const maxH = Math.min(window.innerHeight - 100, 600);
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
