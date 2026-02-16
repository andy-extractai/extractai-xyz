import { GameState } from '../engine/state';
import { ITEMS } from '../data/items';

export function renderShop(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number) {
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
