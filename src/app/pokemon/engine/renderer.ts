import { TILE_DEFS, GameMap, NPCData } from '../data/maps';
import { SPECIES } from '../data/pokemon';
import { PokemonInstance } from '../data/types';

const TILE_SIZE = 32;
const VIEWPORT_TILES_X = 15;
const VIEWPORT_TILES_Y = 11;

// ===== SPRITE DRAWING =====
// All sprites are drawn programmatically - no external assets

// Player sprite patterns (8x8 pixel art scaled to tile size)
const PLAYER_SPRITES: Record<string, number[][]> = {
  down: [
    [0,0,1,1,1,1,0,0],
    [0,1,2,2,2,2,1,0],
    [0,1,2,3,3,2,1,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,4,4,1,1,0],
    [0,1,4,4,4,4,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,1,0,0,1,0,0],
  ],
  up: [
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,4,4,1,1,0],
    [0,1,4,4,4,4,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,1,0,0,1,0,0],
  ],
  left: [
    [0,0,1,1,1,0,0,0],
    [0,1,2,2,1,1,0,0],
    [0,1,3,2,2,1,0,0],
    [0,0,1,1,1,0,0,0],
    [0,1,4,4,1,1,0,0],
    [0,4,4,4,4,1,0,0],
    [0,0,1,1,0,0,0,0],
    [0,1,0,0,1,0,0,0],
  ],
  right: [
    [0,0,0,1,1,1,0,0],
    [0,0,1,2,2,1,1,0],
    [0,0,1,2,2,3,1,0],
    [0,0,0,1,1,1,0,0],
    [0,0,1,4,4,1,1,0],
    [0,0,1,4,4,4,4,0],
    [0,0,0,0,1,1,0,0],
    [0,0,0,1,0,0,1,0],
  ],
};
// 0=transparent, 1=outline(#222), 2=skin(#fdbcb4), 3=eye(#333), 4=shirt(#3498db)
const PLAYER_COLORS = ['transparent', '#222', '#fdbcb4', '#333', '#3498db'];

export function drawSprite(
  ctx: CanvasRenderingContext2D, 
  pattern: number[][], 
  colors: string[], 
  x: number, y: number, 
  size: number
) {
  const pixelSize = size / pattern.length;
  for (let row = 0; row < pattern.length; row++) {
    for (let col = 0; col < pattern[row].length; col++) {
      const colorIdx = pattern[row][col];
      if (colors[colorIdx] === 'transparent') continue;
      ctx.fillStyle = colors[colorIdx];
      ctx.fillRect(
        x + col * pixelSize,
        y + row * pixelSize,
        pixelSize + 0.5,
        pixelSize + 0.5
      );
    }
  }
}

// NPC sprite patterns
function getNpcColors(type: string): string[] {
  const base: Record<string, string[]> = {
    man:      ['transparent', '#222', '#fdbcb4', '#333', '#555'],
    woman:    ['transparent', '#222', '#fdbcb4', '#333', '#e74c3c'],
    youngster:['transparent', '#222', '#fdbcb4', '#333', '#f39c12'],
    lass:     ['transparent', '#222', '#fdbcb4', '#333', '#e91e63'],
    hiker:    ['transparent', '#222', '#d4a06a', '#333', '#795548'],
    oak:      ['transparent', '#222', '#fdbcb4', '#333', '#f5f5dc'],
    nurse:    ['transparent', '#222', '#fdbcb4', '#333', '#ff69b4'],
    clerk:    ['transparent', '#222', '#fdbcb4', '#333', '#2ecc71'],
    oldman:   ['transparent', '#222', '#e0c8a8', '#555', '#8b7355'],
    sign:     ['transparent', '#555', '#bbb', '#444', '#888'],
  };
  return base[type] || base.man;
}

// Pokémon sprite (battle view) - generates from species colors
export function drawPokemonSprite(
  ctx: CanvasRenderingContext2D,
  speciesId: string,
  x: number, y: number,
  size: number,
  flip?: boolean
) {
  const species = SPECIES[speciesId];
  if (!species) return;
  
  const colors = species.spriteColors;
  const s = size;
  
  ctx.save();
  if (flip) {
    ctx.translate(x + size, y);
    ctx.scale(-1, 1);
    x = 0; y = 0;
  }
  
  // Generate a deterministic "sprite" from species id hash
  const hash = speciesId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  
  // Body
  ctx.fillStyle = colors[0];
  const bodyW = s * 0.6;
  const bodyH = s * 0.5;
  const bodyX = x + (s - bodyW) / 2;
  const bodyY = y + s * 0.3;
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 8);
  
  // Head
  ctx.fillStyle = colors[0];
  const headSize = s * 0.4;
  const headX = x + (s - headSize) / 2;
  const headY = y + s * 0.1;
  roundRect(ctx, headX, headY, headSize, headSize, headSize / 2);
  
  // Eyes
  ctx.fillStyle = '#fff';
  const eyeSize = s * 0.08;
  ctx.beginPath();
  ctx.arc(headX + headSize * 0.3, headY + headSize * 0.4, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headX + headSize * 0.7, headY + headSize * 0.4, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Pupils
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(headX + headSize * 0.35, headY + headSize * 0.42, eyeSize * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headX + headSize * 0.75, headY + headSize * 0.42, eyeSize * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Accent details based on type
  ctx.fillStyle = colors[1] || colors[0];
  
  // Ears/horns/wings based on hash
  if (hash % 3 === 0) {
    // Ears
    ctx.beginPath();
    ctx.moveTo(headX, headY);
    ctx.lineTo(headX - s * 0.05, headY - s * 0.15);
    ctx.lineTo(headX + s * 0.1, headY);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(headX + headSize, headY);
    ctx.lineTo(headX + headSize + s * 0.05, headY - s * 0.15);
    ctx.lineTo(headX + headSize - s * 0.1, headY);
    ctx.fill();
  } else if (hash % 3 === 1) {
    // Wings
    ctx.fillStyle = colors[2] || colors[1];
    ctx.beginPath();
    ctx.ellipse(bodyX - s * 0.1, bodyY + bodyH * 0.3, s * 0.15, s * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bodyX + bodyW + s * 0.1, bodyY + bodyH * 0.3, s * 0.15, s * 0.25, 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Tail
    ctx.fillStyle = colors[2] || colors[0];
    ctx.beginPath();
    ctx.moveTo(bodyX + bodyW, bodyY + bodyH * 0.7);
    ctx.quadraticCurveTo(bodyX + bodyW + s * 0.2, bodyY + bodyH * 0.3, bodyX + bodyW + s * 0.15, bodyY + bodyH);
    ctx.lineTo(bodyX + bodyW, bodyY + bodyH * 0.9);
    ctx.fill();
  }
  
  // Legs
  ctx.fillStyle = colors[0];
  const legW = s * 0.12;
  const legH = s * 0.15;
  roundRect(ctx, bodyX + bodyW * 0.2, bodyY + bodyH - 2, legW, legH, 3);
  roundRect(ctx, bodyX + bodyW * 0.65, bodyY + bodyH - 2, legW, legH, 3);
  
  // Type indicator glow
  ctx.fillStyle = colors[1] || colors[0];
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(x + s / 2, y + s * 0.55, s * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
  ctx.fill();
}

// ===== MAP RENDERING =====
export function renderMap(
  ctx: CanvasRenderingContext2D,
  map: GameMap,
  playerX: number, playerY: number,
  playerDir: string,
  canvasWidth: number, canvasHeight: number,
  frameCount: number,
  npcs: NPCData[],
) {
  const camX = playerX - Math.floor(VIEWPORT_TILES_X / 2);
  const camY = playerY - Math.floor(VIEWPORT_TILES_Y / 2);
  
  // Scale to fit canvas
  const scaleX = canvasWidth / (VIEWPORT_TILES_X * TILE_SIZE);
  const scaleY = canvasHeight / (VIEWPORT_TILES_Y * TILE_SIZE);
  const scale = Math.min(scaleX, scaleY);
  
  ctx.save();
  ctx.translate(
    (canvasWidth - VIEWPORT_TILES_X * TILE_SIZE * scale) / 2,
    (canvasHeight - VIEWPORT_TILES_Y * TILE_SIZE * scale) / 2
  );
  ctx.scale(scale, scale);
  
  // Draw tiles
  for (let vy = -1; vy <= VIEWPORT_TILES_Y + 1; vy++) {
    for (let vx = -1; vx <= VIEWPORT_TILES_X + 1; vx++) {
      const tx = camX + vx;
      const ty = camY + vy;
      const screenX = vx * TILE_SIZE;
      const screenY = vy * TILE_SIZE;
      
      if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) {
        ctx.fillStyle = '#111';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        continue;
      }
      
      const tileType = map.tiles[ty][tx];
      const tileDef = TILE_DEFS[tileType];
      
      ctx.fillStyle = tileDef?.color || '#000';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      
      // Tile decorations
      if (tileType === 2) {
        // Tall grass - draw grass blades
        drawTallGrass(ctx, screenX, screenY, TILE_SIZE, frameCount);
      } else if (tileType === 3) {
        // Water - animated waves
        drawWater(ctx, screenX, screenY, TILE_SIZE, frameCount, tx, ty);
      } else if (tileType === 4) {
        // Tree
        drawTree(ctx, screenX, screenY, TILE_SIZE);
      } else if (tileType === 5) {
        // Building
        drawBuilding(ctx, screenX, screenY, TILE_SIZE);
      } else if (tileType === 6) {
        // Door
        drawDoor(ctx, screenX, screenY, TILE_SIZE);
      } else if (tileType === 10) {
        // Flower
        drawFlower(ctx, screenX, screenY, TILE_SIZE, frameCount);
      } else if (tileType === 9) {
        // Sign
        drawSign(ctx, screenX, screenY, TILE_SIZE);
      } else if (tileType === 11) {
        drawFence(ctx, screenX, screenY, TILE_SIZE);
      } else if (tileType === 12) {
        drawCounter(ctx, screenX, screenY, TILE_SIZE);
      } else if (tileType === 13) {
        drawShelf(ctx, screenX, screenY, TILE_SIZE);
      } else if (tileType === 14) {
        drawPC(ctx, screenX, screenY, TILE_SIZE, frameCount);
      } else if (tileType === 15) {
        drawHealPad(ctx, screenX, screenY, TILE_SIZE, frameCount);
      } else if (tileType === 16) {
        drawCutTree(ctx, screenX, screenY, TILE_SIZE);
      } else if (tileType === 7) {
        drawWall(ctx, screenX, screenY, TILE_SIZE);
      } else if (tileType === 1) {
        // Path - add subtle texture
        ctx.fillStyle = '#b8965a';
        for (let i = 0; i < 3; i++) {
          const dx = ((tx * 7 + i * 13) % 5) * 6;
          const dy = ((ty * 11 + i * 7) % 5) * 6;
          ctx.fillRect(screenX + dx, screenY + dy, 2, 2);
        }
      }
      
      // Grid lines (subtle)
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
  }
  
  // Draw NPCs
  for (const npc of npcs) {
    const npcScreenX = (npc.x - camX) * TILE_SIZE;
    const npcScreenY = (npc.y - camY) * TILE_SIZE;
    
    if (npcScreenX < -TILE_SIZE || npcScreenX > (VIEWPORT_TILES_X + 1) * TILE_SIZE) continue;
    if (npcScreenY < -TILE_SIZE || npcScreenY > (VIEWPORT_TILES_Y + 1) * TILE_SIZE) continue;
    
    if (npc.spriteType === 'sign') {
      // Already drawn as tile
    } else {
      drawSprite(
        ctx,
        PLAYER_SPRITES[npc.direction] || PLAYER_SPRITES.down,
        getNpcColors(npc.spriteType),
        npcScreenX, npcScreenY, TILE_SIZE
      );
    }
  }
  
  // Draw player
  const playerScreenX = (playerX - camX) * TILE_SIZE;
  const playerScreenY = (playerY - camY) * TILE_SIZE;
  
  // Walk animation
  const walkFrame = Math.floor(frameCount / 8) % 2;
  const sprite = PLAYER_SPRITES[playerDir] || PLAYER_SPRITES.down;
  const animatedSprite = sprite.map((row, i) => {
    if (i >= 6 && walkFrame === 1) {
      // Animate legs
      return [...row].reverse();
    }
    return row;
  });
  
  drawSprite(ctx, animatedSprite, PLAYER_COLORS, playerScreenX, playerScreenY, TILE_SIZE);
  
  ctx.restore();
}

// ===== TILE DECORATIONS =====
function drawTallGrass(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, frame: number) {
  const wave = Math.sin(frame * 0.05 + x * 0.1) * 2;
  ctx.fillStyle = '#3a8a2e';
  for (let i = 0; i < 5; i++) {
    const bx = x + (i * s / 5) + 2;
    const by = y + s - 4;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 2 + wave, y + 6);
    ctx.lineTo(bx + 4, by);
    ctx.fill();
  }
  ctx.fillStyle = '#2d6b22';
  for (let i = 0; i < 3; i++) {
    const bx = x + (i * s / 3) + 5;
    const by = y + s - 2;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 1 - wave * 0.5, y + 10);
    ctx.lineTo(bx + 3, by);
    ctx.fill();
  }
}

function drawWater(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, frame: number, tx: number, ty: number) {
  const wave = Math.sin(frame * 0.03 + tx * 0.5 + ty * 0.3);
  ctx.fillStyle = `rgba(41, 128, 185, ${0.3 + wave * 0.1})`;
  ctx.fillRect(x, y, s, s);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.moveTo(x + 4, y + s / 2 + wave * 3);
  ctx.quadraticCurveTo(x + s / 2, y + s / 2 - 4 + wave * 3, x + s - 4, y + s / 2 + wave * 3);
  ctx.stroke();
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  // Trunk
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x + s * 0.35, y + s * 0.6, s * 0.3, s * 0.4);
  // Canopy
  ctx.fillStyle = '#1b5e20';
  ctx.beginPath();
  ctx.arc(x + s / 2, y + s * 0.4, s * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.arc(x + s * 0.4, y + s * 0.35, s * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function drawBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = '#795548';
  ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x + 2, y + 2, s - 4, 4);
  // Window
  ctx.fillStyle = '#bbdefb';
  ctx.fillRect(x + s * 0.2, y + s * 0.3, s * 0.25, s * 0.25);
  ctx.fillRect(x + s * 0.55, y + s * 0.3, s * 0.25, s * 0.25);
}

function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = '#c4a86b';
  ctx.fillRect(x, y, s, s);
  ctx.fillStyle = '#4a2800';
  ctx.fillRect(x + s * 0.2, y + s * 0.1, s * 0.6, s * 0.85);
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(x + s * 0.65, y + s * 0.55, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawSign(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = '#4a7c3f';
  ctx.fillRect(x, y, s, s);
  ctx.fillStyle = '#795548';
  ctx.fillRect(x + s * 0.4, y + s * 0.5, s * 0.2, s * 0.5);
  ctx.fillStyle = '#a1887f';
  ctx.fillRect(x + s * 0.15, y + s * 0.15, s * 0.7, s * 0.4);
}

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, frame: number) {
  ctx.fillStyle = '#4a7c3f';
  ctx.fillRect(x, y, s, s);
  const colors = ['#e74c3c', '#f1c40f', '#e91e63', '#ff9800'];
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = colors[i];
    const fx = x + (i % 2) * s * 0.5 + s * 0.15;
    const fy = y + Math.floor(i / 2) * s * 0.5 + s * 0.15;
    const sz = 4 + Math.sin(frame * 0.03 + i) * 1;
    ctx.beginPath();
    ctx.arc(fx, fy, sz, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFence(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(x, y + s * 0.3, s, s * 0.15);
  ctx.fillRect(x, y + s * 0.6, s, s * 0.15);
  ctx.fillRect(x + s * 0.1, y + s * 0.1, s * 0.1, s * 0.8);
  ctx.fillRect(x + s * 0.5, y + s * 0.1, s * 0.1, s * 0.8);
  ctx.fillRect(x + s * 0.8, y + s * 0.1, s * 0.1, s * 0.8);
}

function drawCounter(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(x + 1, y + s * 0.2, s - 2, s * 0.6);
  ctx.fillStyle = '#a1887f';
  ctx.fillRect(x + 1, y + s * 0.2, s - 2, s * 0.15);
}

function drawShelf(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(x + 4, y + s * 0.3, s - 8, 3);
  ctx.fillRect(x + 4, y + s * 0.6, s - 8, 3);
  // Books
  const bookColors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'];
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = bookColors[i];
    ctx.fillRect(x + 6 + i * 5, y + s * 0.1, 4, s * 0.18);
    ctx.fillRect(x + 6 + i * 5, y + s * 0.35, 4, s * 0.22);
  }
}

function drawPC(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, frame: number) {
  ctx.fillStyle = '#37474f';
  ctx.fillRect(x + s * 0.1, y + s * 0.1, s * 0.8, s * 0.7);
  // Screen
  const glow = 0.7 + Math.sin(frame * 0.05) * 0.3;
  ctx.fillStyle = `rgba(33, 150, 243, ${glow})`;
  ctx.fillRect(x + s * 0.15, y + s * 0.15, s * 0.7, s * 0.5);
  // Base
  ctx.fillStyle = '#455a64';
  ctx.fillRect(x + s * 0.3, y + s * 0.8, s * 0.4, s * 0.15);
}

function drawHealPad(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, frame: number) {
  ctx.fillStyle = '#c4a86b';
  ctx.fillRect(x, y, s, s);
  const glow = 0.5 + Math.sin(frame * 0.08) * 0.3;
  ctx.fillStyle = `rgba(233, 30, 99, ${glow})`;
  ctx.beginPath();
  ctx.arc(x + s / 2, y + s / 2, s * 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Cross
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + s * 0.4, y + s * 0.25, s * 0.2, s * 0.5);
  ctx.fillRect(x + s * 0.25, y + s * 0.4, s * 0.5, s * 0.2);
}

function drawCutTree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = '#4a7c3f';
  ctx.fillRect(x, y, s, s);
  ctx.fillStyle = '#33691e';
  ctx.beginPath();
  ctx.arc(x + s / 2, y + s / 2, s * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x + s * 0.4, y + s * 0.4, s * 0.2, s * 0.2);
}

function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = '#555';
  ctx.fillRect(x, y, s, s);
  ctx.strokeStyle = '#444';
  ctx.strokeRect(x + 1, y + 1, s / 2 - 1, s / 2 - 1);
  ctx.strokeRect(x + s / 2, y + s / 2, s / 2 - 1, s / 2 - 1);
}

// ===== BATTLE RENDERING =====
export function renderBattle(
  ctx: CanvasRenderingContext2D,
  playerPoke: PokemonInstance,
  enemyPoke: PokemonInstance,
  width: number, height: number,
  frameCount: number,
  shakeOffset: { x: number; y: number },
) {
  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Battle ground
  ctx.fillStyle = '#2d4a3e';
  ctx.beginPath();
  ctx.ellipse(width * 0.25, height * 0.75, width * 0.22, height * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#3d5a4e';
  ctx.beginPath();
  ctx.ellipse(width * 0.72, height * 0.45, width * 0.18, height * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Player Pokémon (bottom-left, back view = flipped)
  const playerSize = Math.min(width * 0.28, height * 0.35);
  drawPokemonSprite(
    ctx, playerPoke.speciesId,
    width * 0.1 + shakeOffset.x, height * 0.5 - playerSize * 0.3 + shakeOffset.y,
    playerSize, true
  );
  
  // Enemy Pokémon (top-right)
  const enemySize = Math.min(width * 0.22, height * 0.28);
  drawPokemonSprite(
    ctx, enemyPoke.speciesId,
    width * 0.62, height * 0.15,
    enemySize
  );
}
