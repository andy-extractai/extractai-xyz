import { PokemonInstance, StatusEffect } from '../data/types';

export function findFirstAlive(team: PokemonInstance[]): number {
  return Math.max(0, team.findIndex(p => p.currentHp > 0));
}

export function drawHPBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, current: number, max: number) {
  const ratio = Math.max(0, current / max);
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = ratio > 0.5 ? '#4ade80' : ratio > 0.2 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(x, y, w * ratio, h);
  ctx.strokeStyle = '#555';
  ctx.strokeRect(x, y, w, h);
}

export function getStatusColor(status: StatusEffect): string {
  switch (status) {
    case 'poison': return '#a855f7';
    case 'burn': return '#ef4444';
    case 'paralyze': return '#f59e0b';
    case 'sleep': return '#6b7280';
    case 'freeze': return '#3b82f6';
    default: return '#fff';
  }
}

export function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
