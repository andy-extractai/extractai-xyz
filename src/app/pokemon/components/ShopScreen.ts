import { GameState } from '../engine/state';
import { ITEMS } from '../data/items';
import { getSellPrice } from '../engine/shopLogic';

export function renderShop(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number) {
  const shop = s.shop!;

  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('POKÉ MART', 20, 30);

  ctx.fillStyle = '#f1c40f';
  ctx.font = '14px monospace';
  ctx.fillText(`Money: $${s.player.money}`, 20, 55);

  if (shop.mode === 'select') {
    const options = ['BUY', 'SELL', 'EXIT'];
    options.forEach((opt, i) => {
      const y = h / 2 - 30 + i * 30;
      ctx.fillStyle = i === shop.selectedIndex ? '#4ade80' : '#fff';
      ctx.font = '16px monospace';
      ctx.fillText(`${i === shop.selectedIndex ? '▸ ' : '  '}${opt}`, w / 2 - 40, y);
    });
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.fillText('[Enter] to select, [ESC] to leave', 20, h - 15);
  } else if (shop.mode === 'buy') {
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('— BUY —', w / 2 - 30, 75);

    shop.items.forEach((item, i) => {
      const itemData = ITEMS[item.itemId];
      if (!itemData) return;
      const y = 100 + i * 28;
      const selected = i === shop.selectedIndex;
      ctx.fillStyle = selected ? '#4ade80' : '#fff';
      ctx.font = '13px monospace';
      ctx.fillText(`${selected ? '▸ ' : '  '}${itemData.name}`, 20, y);
      ctx.fillStyle = '#f1c40f';
      ctx.fillText(`$${itemData.price}`, w * 0.5, y);
      ctx.fillStyle = '#888';
      ctx.font = '10px monospace';
      ctx.fillText(`Own: ${s.player.bag[item.itemId] || 0}`, w * 0.72, y);

      if (selected) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`×${shop.quantity}`, w * 0.88, y);
        ctx.fillStyle = '#f1c40f';
        ctx.font = '11px monospace';
        ctx.fillText(`Total: $${itemData.price * shop.quantity}`, w * 0.5, y + 14);
      }
    });

    ctx.fillStyle = '#666';
    ctx.font = '11px monospace';
    ctx.fillText('[←/→] Qty  [Enter] Buy  [ESC] Back', 20, h - 15);
  } else if (shop.mode === 'sell') {
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('— SELL —', w / 2 - 30, 75);

    const sellableItems = Object.entries(s.player.bag)
      .filter(([id, qty]) => qty > 0 && ITEMS[id] && ITEMS[id].category !== 'key')
      .map(([id]) => id);

    if (sellableItems.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '13px monospace';
      ctx.fillText('No items to sell.', 20, 110);
    } else {
      sellableItems.forEach((itemId, i) => {
        const itemData = ITEMS[itemId];
        if (!itemData) return;
        const y = 100 + i * 28;
        const selected = i === shop.selectedIndex;
        ctx.fillStyle = selected ? '#e74c3c' : '#fff';
        ctx.font = '13px monospace';
        ctx.fillText(`${selected ? '▸ ' : '  '}${itemData.name}`, 20, y);
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`$${getSellPrice(itemId)}`, w * 0.5, y);
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.fillText(`Own: ${s.player.bag[itemId]}`, w * 0.72, y);

        if (selected) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 13px monospace';
          ctx.fillText(`×${shop.quantity}`, w * 0.88, y);
          ctx.fillStyle = '#f1c40f';
          ctx.font = '11px monospace';
          ctx.fillText(`Total: $${getSellPrice(itemId) * shop.quantity}`, w * 0.5, y + 14);
        }
      });
    }

    ctx.fillStyle = '#666';
    ctx.font = '11px monospace';
    ctx.fillText('[←/→] Qty  [Enter] Sell  [ESC] Back', 20, h - 15);
  }
}
