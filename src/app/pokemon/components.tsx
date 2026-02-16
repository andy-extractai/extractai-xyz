'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createPokemon, GameState, GAME_MAP, getTypeMultiplier, PokemonInstance,
  POKEDEX, recalcStats, rollEncounter, STARTER_POS, TILE,
  TILE_COLORS, WALKABLE, xpForLevel,
} from './data';
import { drawPlayerSprite, drawPokemonSprite, getTypeColor } from './sprites';

const TILE_SIZE = 32;
const MAP_W = 30;
const MAP_H = 20;

function loadGame(): GameState | null {
  if (typeof window === 'undefined') return null;
  const s = localStorage.getItem('pokemon_save');
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function saveGame(state: GameState) {
  localStorage.setItem('pokemon_save', JSON.stringify(state));
}

// ─── STARTER SELECTION ───
function StarterSelect({ onSelect }: { onSelect: (id: number) => void }) {
  const starters = [1, 2, 3];
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    starters.forEach((id, i) => {
      const c = canvasRefs.current[i];
      if (!c) return;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, 96, 96);
      drawPokemonSprite(ctx, id, 16, 8, 64);
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-2">Choose Your Partner!</h1>
      <p className="text-zinc-400 mb-8">Professor Oak needs your help. Pick a Pokémon to start your journey.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {starters.map((id, i) => {
          const sp = POKEDEX[id];
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="border border-zinc-700 rounded-xl p-6 hover:border-emerald-400 transition-all flex flex-col items-center gap-2 bg-zinc-900/50"
            >
              <canvas
                ref={el => { canvasRefs.current[i] = el; }}
                width={96} height={96}
                className="pixelated"
              />
              <span className="text-lg font-bold">{sp.name}</span>
              <span className="text-sm px-2 py-0.5 rounded" style={{ background: getTypeColor(sp.type), color: '#fff' }}>
                {sp.type.toUpperCase()}
              </span>
              <span className="text-xs text-zinc-400">
                HP:{sp.baseHP} ATK:{sp.baseATK} DEF:{sp.baseDEF} SPD:{sp.baseSPD}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── HP / XP BARS ───
function HPBar({ current, max, label }: { current: number; max: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? '#22c55e' : pct > 20 ? '#eab308' : '#ef4444';
  return (
    <div className="w-full">
      {label && <div className="text-xs text-zinc-400 mb-0.5">{label}</div>}
      <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-xs text-zinc-400 mt-0.5">{current}/{max}</div>
    </div>
  );
}

function XPBar({ xp, level }: { xp: number; level: number }) {
  const needed = xpForLevel(level + 1);
  const pct = Math.min(100, (xp / needed) * 100);
  return (
    <div className="w-full">
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-zinc-500">XP: {xp}/{needed}</div>
    </div>
  );
}

// ─── BATTLE SCREEN ───
function BattleScreen({
  team, wild, bag, onEnd,
}: {
  team: PokemonInstance[];
  wild: PokemonInstance;
  bag: { potions: number; pokeballs: number };
  onEnd: (result: { team: PokemonInstance[]; bag: { potions: number; pokeballs: number }; caught: boolean; defeated: boolean }) => void;
}) {
  const [playerIdx, setPlayerIdx] = useState(0);
  const [playerTeam, setPlayerTeam] = useState<PokemonInstance[]>(() => team.map(p => ({ ...p })));
  const [enemy, setEnemy] = useState<PokemonInstance>({ ...wild });
  const [playerBag, setPlayerBag] = useState({ ...bag });
  const [log, setLog] = useState<string[]>([`A wild ${POKEDEX[wild.speciesId].name} appeared!`]);
  const [menu, setMenu] = useState<'main' | 'fight' | 'bag' | 'switch'>('main');
  const [busy, setBusy] = useState(false);
  const playerCanvasRef = useRef<HTMLCanvasElement>(null);
  const enemyCanvasRef = useRef<HTMLCanvasElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const player = playerTeam[playerIdx];
  const playerSpecies = POKEDEX[player.speciesId];
  const enemySpecies = POKEDEX[enemy.speciesId];

  // Draw sprites
  useEffect(() => {
    const pc = playerCanvasRef.current?.getContext('2d');
    if (pc) {
      pc.clearRect(0, 0, 96, 96);
      drawPokemonSprite(pc, player.speciesId, 8, 8, 80, true);
    }
    const ec = enemyCanvasRef.current?.getContext('2d');
    if (ec) {
      ec.clearRect(0, 0, 96, 96);
      drawPokemonSprite(ec, enemy.speciesId, 8, 8, 80);
    }
  }, [player.speciesId, enemy.speciesId]);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [log]);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const calcDamage = (attacker: PokemonInstance, defender: PokemonInstance, move: { type: string; power: number }) => {
    const atkStat = attacker.atk;
    const defStat = defender.def;
    const mult = getTypeMultiplier(move.type as any, POKEDEX[defender.speciesId].type);
    const base = ((2 * attacker.level / 5 + 2) * move.power * atkStat / defStat / 50 + 2);
    const rand = 0.85 + Math.random() * 0.15;
    return Math.max(1, Math.floor(base * mult * rand));
  };

  const enemyTurn = (currentEnemy: PokemonInstance, currentTeam: PokemonInstance[], idx: number) => {
    const move = currentEnemy.moves[Math.floor(Math.random() * currentEnemy.moves.length)];
    const hit = Math.random() * 100 < move.accuracy;
    if (!hit) {
      addLog(`${enemySpecies.name} used ${move.name}... but missed!`);
      return;
    }
    const dmg = calcDamage(currentEnemy, currentTeam[idx], move);
    const mult = getTypeMultiplier(move.type as any, POKEDEX[currentTeam[idx].speciesId].type);
    const newHP = Math.max(0, currentTeam[idx].currentHP - dmg);
    const updated = [...currentTeam];
    updated[idx] = { ...updated[idx], currentHP: newHP };
    setPlayerTeam(updated);

    let msg = `${enemySpecies.name} used ${move.name}! (-${dmg} HP)`;
    if (mult > 1) msg += " It's super effective!";
    if (mult < 1) msg += " It's not very effective...";
    addLog(msg);

    if (newHP <= 0) {
      addLog(`${POKEDEX[updated[idx].speciesId].name} fainted!`);
      const alive = updated.findIndex(p => p.currentHP > 0);
      if (alive === -1) {
        setTimeout(() => {
          addLog('All your Pokémon fainted! You blacked out...');
          setTimeout(() => {
            const healed = updated.map(p => ({ ...p, currentHP: Math.max(1, Math.floor(p.maxHP * 0.5)) }));
            onEnd({ team: healed, bag: playerBag, caught: false, defeated: false });
          }, 1500);
        }, 500);
      } else {
        setPlayerIdx(alive);
      }
    }
  };

  const doPlayerMove = (moveIdx: number) => {
    if (busy) return;
    setBusy(true);
    setMenu('main');
    const move = player.moves[moveIdx];
    const hit = Math.random() * 100 < move.accuracy;
    if (!hit) {
      addLog(`${playerSpecies.name} used ${move.name}... but missed!`);
      setTimeout(() => { enemyTurn(enemy, playerTeam, playerIdx); setBusy(false); }, 800);
      return;
    }
    const dmg = calcDamage(player, enemy, move);
    const mult = getTypeMultiplier(move.type as any, enemySpecies.type);
    const newHP = Math.max(0, enemy.currentHP - dmg);
    const newEnemy = { ...enemy, currentHP: newHP };
    setEnemy(newEnemy);

    let msg = `${playerSpecies.name} used ${move.name}! (-${dmg} HP)`;
    if (mult > 1) msg += " It's super effective!";
    if (mult < 1) msg += " It's not very effective...";
    addLog(msg);

    if (newHP <= 0) {
      addLog(`${enemySpecies.name} fainted!`);
      // XP gain
      const xpGain = Math.floor(enemySpecies.baseHP * enemy.level / 3);
      const updated = [...playerTeam];
      updated[playerIdx] = { ...updated[playerIdx], xp: updated[playerIdx].xp + xpGain };
      addLog(`${playerSpecies.name} gained ${xpGain} XP!`);

      // Level up check
      while (updated[playerIdx].xp >= xpForLevel(updated[playerIdx].level + 1)) {
        updated[playerIdx].xp -= xpForLevel(updated[playerIdx].level + 1);
        updated[playerIdx].level += 1;
        updated[playerIdx] = recalcStats(updated[playerIdx]);
        addLog(`${playerSpecies.name} grew to level ${updated[playerIdx].level}!`);
      }

      setPlayerTeam(updated);
      setTimeout(() => onEnd({ team: updated, bag: playerBag, caught: false, defeated: true }), 1500);
    } else {
      setTimeout(() => { enemyTurn(newEnemy, playerTeam, playerIdx); setBusy(false); }, 800);
    }
  };

  const doRun = () => {
    if (busy) return;
    const chance = (player.spd / enemy.spd) * 0.7;
    if (Math.random() < chance) {
      addLog('Got away safely!');
      setTimeout(() => onEnd({ team: playerTeam, bag: playerBag, caught: false, defeated: false }), 800);
    } else {
      setBusy(true);
      addLog("Couldn't escape!");
      setTimeout(() => { enemyTurn(enemy, playerTeam, playerIdx); setBusy(false); }, 800);
    }
  };

  const usePotion = () => {
    if (busy || playerBag.potions <= 0) return;
    setBusy(true);
    setMenu('main');
    const heal = 20;
    const updated = [...playerTeam];
    updated[playerIdx] = { ...updated[playerIdx], currentHP: Math.min(updated[playerIdx].maxHP, updated[playerIdx].currentHP + heal) };
    setPlayerTeam(updated);
    setPlayerBag(b => ({ ...b, potions: b.potions - 1 }));
    addLog(`Used a Potion! ${playerSpecies.name} healed ${heal} HP.`);
    setTimeout(() => { enemyTurn(enemy, updated, playerIdx); setBusy(false); }, 800);
  };

  const usePokeball = () => {
    if (busy || playerBag.pokeballs <= 0 || playerTeam.length >= 6) return;
    setBusy(true);
    setMenu('main');
    setPlayerBag(b => ({ ...b, pokeballs: b.pokeballs - 1 }));
    const catchRate = Math.max(0.1, (1 - enemy.currentHP / enemy.maxHP) * 0.8 + 0.1);
    addLog('You threw a Pokéball!');
    if (Math.random() < catchRate) {
      addLog(`Gotcha! ${enemySpecies.name} was caught!`);
      const caught = { ...enemy };
      const updated = [...playerTeam, caught];
      setPlayerTeam(updated);
      setTimeout(() => onEnd({ team: updated, bag: { ...playerBag, pokeballs: playerBag.pokeballs - 1 }, caught: true, defeated: false }), 1500);
    } else {
      addLog('Oh no! It broke free!');
      setTimeout(() => { enemyTurn(enemy, playerTeam, playerIdx); setBusy(false); }, 800);
    }
  };

  const switchPokemon = (idx: number) => {
    if (busy || idx === playerIdx || playerTeam[idx].currentHP <= 0) return;
    setBusy(true);
    setMenu('main');
    addLog(`Come back, ${POKEDEX[playerTeam[playerIdx].speciesId].name}! Go, ${POKEDEX[playerTeam[idx].speciesId].name}!`);
    setPlayerIdx(idx);
    setTimeout(() => { enemyTurn(enemy, playerTeam, idx); setBusy(false); }, 800);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-2 sm:p-4">
      <div className="w-full max-w-lg">
        {/* Enemy info */}
        <div className="flex items-center gap-3 mb-2 p-2 bg-zinc-900 rounded-lg">
          <canvas ref={enemyCanvasRef} width={96} height={96} className="pixelated w-16 h-16 sm:w-20 sm:h-20" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">{enemySpecies.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: getTypeColor(enemySpecies.type) }}>
                {enemySpecies.type.toUpperCase()}
              </span>
              <span className="text-xs text-zinc-400">Lv.{enemy.level}</span>
            </div>
            <HPBar current={enemy.currentHP} max={enemy.maxHP} />
          </div>
        </div>

        {/* Player info */}
        <div className="flex items-center gap-3 mb-2 p-2 bg-zinc-900 rounded-lg">
          <canvas ref={playerCanvasRef} width={96} height={96} className="pixelated w-16 h-16 sm:w-20 sm:h-20" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">{playerSpecies.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: getTypeColor(playerSpecies.type) }}>
                {playerSpecies.type.toUpperCase()}
              </span>
              <span className="text-xs text-zinc-400">Lv.{player.level}</span>
            </div>
            <HPBar current={player.currentHP} max={player.maxHP} />
            <XPBar xp={player.xp} level={player.level} />
          </div>
        </div>

        {/* Battle log */}
        <div ref={logRef} className="h-20 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-lg p-2 mb-3 text-xs text-zinc-300 space-y-0.5">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>

        {/* Menus */}
        {menu === 'main' && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMenu('fight')} disabled={busy} className="btn-battle bg-red-900 hover:bg-red-800">⚔️ Fight</button>
            <button onClick={() => setMenu('bag')} disabled={busy} className="btn-battle bg-yellow-900 hover:bg-yellow-800">🎒 Bag</button>
            <button onClick={() => setMenu('switch')} disabled={busy} className="btn-battle bg-blue-900 hover:bg-blue-800">🔄 Switch</button>
            <button onClick={doRun} disabled={busy} className="btn-battle bg-zinc-800 hover:bg-zinc-700">🏃 Run</button>
          </div>
        )}

        {menu === 'fight' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {player.moves.map((m, i) => (
                <button key={i} onClick={() => doPlayerMove(i)} disabled={busy}
                  className="btn-battle text-left" style={{ background: getTypeColor(m.type as any) + '33', borderColor: getTypeColor(m.type as any) }}>
                  <div className="font-bold text-xs">{m.name}</div>
                  <div className="text-[10px] text-zinc-400">{m.type.toUpperCase()} PWR:{m.power}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setMenu('main')} className="text-xs text-zinc-500 hover:text-white">← Back</button>
          </div>
        )}

        {menu === 'bag' && (
          <div className="space-y-2">
            <button onClick={usePotion} disabled={busy || playerBag.potions <= 0}
              className="btn-battle bg-green-900 hover:bg-green-800 w-full">
              🧪 Potion (x{playerBag.potions}) - Heal 20 HP
            </button>
            <button onClick={usePokeball} disabled={busy || playerBag.pokeballs <= 0 || playerTeam.length >= 6}
              className="btn-battle bg-red-900 hover:bg-red-800 w-full">
              🔴 Pokéball (x{playerBag.pokeballs}) {playerTeam.length >= 6 ? '- Team full!' : ''}
            </button>
            <button onClick={() => setMenu('main')} className="text-xs text-zinc-500 hover:text-white">← Back</button>
          </div>
        )}

        {menu === 'switch' && (
          <div className="space-y-2">
            {playerTeam.map((p, i) => (
              <button key={i} onClick={() => switchPokemon(i)}
                disabled={busy || i === playerIdx || p.currentHP <= 0}
                className={`btn-battle w-full flex justify-between ${i === playerIdx ? 'ring-1 ring-emerald-400' : ''} ${p.currentHP <= 0 ? 'opacity-40' : ''}`}>
                <span className="text-xs font-bold">{POKEDEX[p.speciesId].name} Lv.{p.level}</span>
                <span className="text-xs">{p.currentHP}/{p.maxHP} HP</span>
              </button>
            ))}
            <button onClick={() => setMenu('main')} className="text-xs text-zinc-500 hover:text-white">← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── OVERWORLD ───
function Overworld({
  gameState,
  onBattle,
  onSave,
}: {
  gameState: GameState;
  onBattle: (wild: PokemonInstance) => void;
  onSave: (gs: GameState) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [px, setPx] = useState(gameState.playerX);
  const [py, setPy] = useState(gameState.playerY);
  const [frame, setFrame] = useState(0);
  const stepsRef = useRef(0);
  const movingRef = useRef(false);

  const VIEWPORT_W = typeof window !== 'undefined' ? Math.min(MAP_W, Math.floor(window.innerWidth / TILE_SIZE)) : 15;
  const VIEWPORT_H = typeof window !== 'undefined' ? Math.min(MAP_H, Math.floor((window.innerHeight - 80) / TILE_SIZE)) : 12;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const camX = Math.max(0, Math.min(MAP_W - VIEWPORT_W, px - Math.floor(VIEWPORT_W / 2)));
    const camY = Math.max(0, Math.min(MAP_H - VIEWPORT_H, py - Math.floor(VIEWPORT_H / 2)));

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = camY; y < camY + VIEWPORT_H && y < MAP_H; y++) {
      for (let x = camX; x < camX + VIEWPORT_W && x < MAP_W; x++) {
        const tile = GAME_MAP[y]?.[x] ?? 3;
        const sx = (x - camX) * TILE_SIZE;
        const sy = (y - camY) * TILE_SIZE;
        ctx.fillStyle = TILE_COLORS[tile] || '#000';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

        // Tile details
        if (tile === TILE.TALL_GRASS) {
          ctx.fillStyle = '#16a34a';
          for (let g = 0; g < 3; g++) {
            const gx = sx + 4 + g * 10;
            const gy = sy + 8;
            ctx.fillRect(gx, gy, 2, 12);
            ctx.fillRect(gx - 2, gy + 2, 2, 6);
            ctx.fillRect(gx + 2, gy + 2, 2, 6);
          }
        } else if (tile === TILE.WATER) {
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(sx + 4, sy + 12, 24, 2);
          ctx.fillRect(sx + 8, sy + 20, 20, 2);
        } else if (tile === TILE.TREE) {
          ctx.fillStyle = '#854d0e';
          ctx.fillRect(sx + 12, sy + 18, 8, 14);
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.arc(sx + 16, sy + 14, 12, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === TILE.BUILDING) {
          ctx.fillStyle = '#57534e';
          ctx.fillRect(sx + 2, sy + 2, 28, 28);
          ctx.fillStyle = '#78716c';
          ctx.fillRect(sx, sy, 32, 4);
        } else if (tile === TILE.DOOR) {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(sx + 8, sy + 4, 16, 28);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(sx + 20, sy + 16, 3, 3);
        } else if (tile === TILE.FLOWER) {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(sx + 6, sy + 10, 4, 4);
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(sx + 20, sy + 20, 4, 4);
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(sx + 14, sy + 6, 4, 4);
        } else if (tile === TILE.FENCE) {
          ctx.fillStyle = '#92400e';
          ctx.fillRect(sx, sy + 12, 32, 4);
          ctx.fillRect(sx + 4, sy + 4, 4, 24);
          ctx.fillRect(sx + 24, sy + 4, 4, 24);
        } else if (tile === TILE.SIGN) {
          ctx.fillStyle = '#a8a29e';
          ctx.fillRect(sx + 10, sy + 8, 12, 10);
          ctx.fillStyle = '#78716c';
          ctx.fillRect(sx + 14, sy + 18, 4, 10);
        }
      }
    }

    // Player
    const playerSX = (px - camX) * TILE_SIZE;
    const playerSY = (py - camY) * TILE_SIZE;
    drawPlayerSprite(ctx, playerSX, playerSY, TILE_SIZE, frame);
  }, [px, py, frame, VIEWPORT_W, VIEWPORT_H]);

  useEffect(() => { draw(); }, [draw]);

  const tryMove = useCallback((dx: number, dy: number) => {
    if (movingRef.current) return;
    const nx = px + dx;
    const ny = py + dy;
    if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) return;
    const tile = GAME_MAP[ny]?.[nx];
    if (tile === undefined || !WALKABLE.has(tile)) return;
    movingRef.current = true;
    setPx(nx);
    setPy(ny);
    setFrame(f => f + 1);
    stepsRef.current++;

    // Save periodically
    if (stepsRef.current % 10 === 0) {
      onSave({ ...gameState, playerX: nx, playerY: ny });
    }

    // Wild encounter in tall grass
    if (tile === TILE.TALL_GRASS && Math.random() < 0.15) {
      const wild = rollEncounter();
      if (wild) {
        setTimeout(() => {
          onSave({ ...gameState, playerX: nx, playerY: ny });
          onBattle(wild);
        }, 200);
      }
    }

    setTimeout(() => { movingRef.current = false; }, 120);
  }, [px, py, gameState, onBattle, onSave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': tryMove(0, -1); break;
        case 'ArrowDown': case 's': tryMove(0, 1); break;
        case 'ArrowLeft': case 'a': tryMove(-1, 0); break;
        case 'ArrowRight': case 'd': tryMove(1, 0); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryMove]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="flex items-center gap-4 p-2 text-xs text-zinc-400">
        <span>🎮 Arrow keys / WASD to move</span>
        <span>|</span>
        <span>Team: {gameState.team.length}/6</span>
        <span>🧪{gameState.bag.potions}</span>
        <span>🔴{gameState.bag.pokeballs}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={VIEWPORT_W * TILE_SIZE}
        height={VIEWPORT_H * TILE_SIZE}
        className="pixelated border border-zinc-800 rounded"
      />
      {/* Mobile D-pad */}
      <div className="sm:hidden grid grid-cols-3 gap-1 mt-3 w-36">
        <div />
        <button onClick={() => tryMove(0, -1)} className="btn-dpad">▲</button>
        <div />
        <button onClick={() => tryMove(-1, 0)} className="btn-dpad">◀</button>
        <div className="w-10 h-10" />
        <button onClick={() => tryMove(1, 0)} className="btn-dpad">▶</button>
        <div />
        <button onClick={() => tryMove(0, 1)} className="btn-dpad">▼</button>
        <div />
      </div>
    </div>
  );
}

// ─── MAIN GAME ───
export default function PokemonGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [wildPokemon, setWildPokemon] = useState<PokemonInstance | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = loadGame();
    if (saved) setGameState(saved);
    setLoaded(true);
  }, []);

  const handleStarter = (id: number) => {
    const starter = createPokemon(id, 5);
    const gs: GameState = {
      phase: 'overworld',
      team: [starter],
      bag: { potions: 5, pokeballs: 10 },
      playerX: STARTER_POS.x,
      playerY: STARTER_POS.y,
      defeatedCount: 0,
      caughtCount: 0,
    };
    setGameState(gs);
    saveGame(gs);
  };

  const handleBattle = (wild: PokemonInstance) => {
    setWildPokemon(wild);
  };

  const handleBattleEnd = (result: { team: PokemonInstance[]; bag: { potions: number; pokeballs: number }; caught: boolean; defeated: boolean }) => {
    if (!gameState) return;
    // Reward: gain items after defeating pokemon
    const newBag = { ...result.bag };
    if (result.defeated) {
      newBag.pokeballs += 1; // bonus pokeball
      if (Math.random() < 0.3) newBag.potions += 1; // chance for potion
    }
    const gs: GameState = {
      ...gameState,
      team: result.team,
      bag: newBag,
      phase: 'overworld',
      defeatedCount: gameState.defeatedCount + (result.defeated ? 1 : 0),
      caughtCount: gameState.caughtCount + (result.caught ? 1 : 0),
    };
    setGameState(gs);
    saveGame(gs);
    setWildPokemon(null);
  };

  const handleSave = (gs: GameState) => {
    setGameState(gs);
    saveGame(gs);
  };

  const handleNewGame = () => {
    localStorage.removeItem('pokemon_save');
    setGameState(null);
    setWildPokemon(null);
  };

  if (!loaded) return <div className="min-h-screen bg-black" />;

  // Starter selection
  if (!gameState) {
    return <StarterSelect onSelect={handleStarter} />;
  }

  // Battle
  if (wildPokemon) {
    return (
      <BattleScreen
        team={gameState.team}
        wild={wildPokemon}
        bag={gameState.bag}
        onEnd={handleBattleEnd}
      />
    );
  }

  // Overworld
  return (
    <div className="relative">
      <Overworld gameState={gameState} onBattle={handleBattle} onSave={handleSave} />
      <button
        onClick={handleNewGame}
        className="absolute top-2 right-2 text-[10px] text-zinc-600 hover:text-zinc-400 transition"
      >
        New Game
      </button>
    </div>
  );
}
