import { ITEMS } from '../data/items';

export interface ShopBuyResult {
  success: boolean;
  newMoney: number;
  newBag: Record<string, number>;
  error?: string;
}

export interface ShopSellResult {
  success: boolean;
  newMoney: number;
  newBag: Record<string, number>;
  error?: string;
}

export function buyItem(
  itemId: string,
  quantity: number,
  currentMoney: number,
  currentBag: Record<string, number>
): ShopBuyResult {
  const item = ITEMS[itemId];
  if (!item) return { success: false, newMoney: currentMoney, newBag: currentBag, error: 'Item not found' };
  const totalCost = item.price * quantity;
  if (totalCost > currentMoney) return { success: false, newMoney: currentMoney, newBag: currentBag, error: 'Not enough money' };
  if (quantity <= 0) return { success: false, newMoney: currentMoney, newBag: currentBag, error: 'Invalid quantity' };
  const newBag = { ...currentBag };
  newBag[itemId] = (newBag[itemId] || 0) + quantity;
  return { success: true, newMoney: currentMoney - totalCost, newBag };
}

export function sellItem(
  itemId: string,
  quantity: number,
  currentMoney: number,
  currentBag: Record<string, number>
): ShopSellResult {
  const item = ITEMS[itemId];
  if (!item) return { success: false, newMoney: currentMoney, newBag: currentBag, error: 'Item not found' };
  const owned = currentBag[itemId] || 0;
  if (quantity <= 0) return { success: false, newMoney: currentMoney, newBag: currentBag, error: 'Invalid quantity' };
  if (owned < quantity) return { success: false, newMoney: currentMoney, newBag: currentBag, error: 'Not enough items' };
  if (item.category === 'key') return { success: false, newMoney: currentMoney, newBag: currentBag, error: 'Cannot sell key items' };
  const sellPrice = Math.floor(item.price / 2);
  const totalEarned = sellPrice * quantity;
  const newBag = { ...currentBag };
  newBag[itemId] = owned - quantity;
  if (newBag[itemId] === 0) delete newBag[itemId];
  return { success: true, newMoney: currentMoney + totalEarned, newBag };
}

export function getSellPrice(itemId: string): number {
  const item = ITEMS[itemId];
  if (!item) return 0;
  return Math.floor(item.price / 2);
}

export function getMaxBuyable(itemId: string, currentMoney: number): number {
  const item = ITEMS[itemId];
  if (!item || item.price === 0) return 0;
  return Math.floor(currentMoney / item.price);
}
