import { drawPokemonSprite } from '../engine/renderer';
import { roundRectPath } from './utils';

export function renderIntroScreen(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) {
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

export function renderNamingScreen(ctx: CanvasRenderingContext2D, w: number, h: number, inputName: string) {
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

export function renderStarterSelect(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number, selectedStarter: number) {
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
