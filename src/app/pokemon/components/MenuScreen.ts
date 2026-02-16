import { GameState } from '../engine/state';
import { drawPokemonSprite } from '../engine/renderer';
import { SPECIES } from '../data/pokemon';
import { MOVES } from '../data/moves';
import { ITEMS } from '../data/items';
import { drawHPBar, getStatusColor, roundRectPath } from './utils';

export function renderMenu(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number) {
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

      drawPokemonSprite(ctx, poke.speciesId, 20, y + 2, 44);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`${poke.nickname || species.name}`, 70, y + 20);

      ctx.fillStyle = '#aaa';
      ctx.font = '11px monospace';
      ctx.fillText(`Lv${poke.level}`, 70, y + 36);

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

    // Key Items section
    const keyItemsY = 55 + Math.max(items.length, 1) * 28 + 20;
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('KEY ITEMS', 20, keyItemsY);
    const keyItems: { name: string; desc: string }[] = [];
    if (s.player.hasBicycle) keyItems.push({ name: 'Bicycle', desc: 'A folding bike. Press B to ride.' });
    if (keyItems.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '12px monospace';
      ctx.fillText('No key items', 20, keyItemsY + 20);
    } else {
      keyItems.forEach((ki, i) => {
        ctx.fillStyle = '#fff';
        ctx.font = '13px monospace';
        ctx.fillText(`  ${ki.name}`, 20, keyItemsY + 20 + i * 22);
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.fillText(ki.desc, 200, keyItemsY + 20 + i * 22);
      });
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

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i < locations.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(mapArea.x + locations[i].x * mapArea.w, mapArea.y + locations[i].y * mapArea.h);
      ctx.lineTo(mapArea.x + locations[i + 1].x * mapArea.w, mapArea.y + locations[i + 1].y * mapArea.h);
      ctx.stroke();
    }

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
