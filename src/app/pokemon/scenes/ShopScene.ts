import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS, FADE_DURATION,
} from '../constants';
import { ITEM_DATA } from '../data/items';
import { GamePokemon } from '../data/pokemon';
import { saveGame, SaveData } from '../utils/save';

type ShopPhase = 'browsing' | 'quantity' | 'message';

interface ShopSceneData {
  shopItems: string[];
  money: number;
  items: { id: string; count: number }[];
  returnData: {
    currentMap: string;
    playerX: number;
    playerY: number;
    party: GamePokemon[];
    badges: string[];
    visitedMaps: string[];
    pokedexSeen: number[];
    pokedexCaught: number[];
  };
}

export class ShopScene extends Phaser.Scene {
  private phase: ShopPhase = 'browsing';
  private shopItems: string[] = [];
  private money = 0;
  private items: { id: string; count: number }[] = [];
  private returnData!: ShopSceneData['returnData'];

  private cursorIndex = 0;
  private quantity = 1;
  private scrollOffset = 0;
  private maxVisible = 6;

  // UI elements
  private itemTexts: Phaser.GameObjects.Text[] = [];
  private descText?: Phaser.GameObjects.Text;
  private priceText?: Phaser.GameObjects.Text;
  private moneyText?: Phaser.GameObjects.Text;
  private quantityText?: Phaser.GameObjects.Text;
  private totalText?: Phaser.GameObjects.Text;
  private messageText?: Phaser.GameObjects.Text;
  private quantityPanel?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'ShopScene' });
  }

  init(data: ShopSceneData) {
    this.shopItems = data.shopItems;
    this.money = data.money;
    this.items = data.items;
    this.returnData = data.returnData;
    this.cursorIndex = 0;
    this.scrollOffset = 0;
    this.quantity = 1;
  }

  create() {
    this.phase = 'browsing';
    this.itemTexts = [];
    this.cameras.main.fadeIn(FADE_DURATION, 0, 0, 0);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.DIALOG_BG, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title bar
    bg.fillStyle(COLORS.DIALOG_BORDER, 1);
    bg.fillRect(0, 0, GAME_WIDTH, 40);

    this.add.text(20, 12, 'POKé MART', {
      fontFamily: FONT_FAMILY, fontSize: '14px', color: '#f8f8f8',
    });

    // Money display (top-right)
    this.moneyText = this.add.text(GAME_WIDTH - 20, 12, `$${this.money}`, {
      fontFamily: FONT_FAMILY, fontSize: '14px', color: '#f8d030',
    }).setOrigin(1, 0);

    // Left panel (item list)
    const leftW = GAME_WIDTH * 0.55;
    const panelY = 50;
    const panelH = GAME_HEIGHT - 100;

    bg.fillStyle(0xe8e8e8, 1);
    bg.fillRoundedRect(10, panelY, leftW, panelH, 4);
    bg.lineStyle(2, COLORS.DIALOG_BORDER, 1);
    bg.strokeRoundedRect(10, panelY, leftW, panelH, 4);

    // Right panel (description)
    const rightX = leftW + 20;
    const rightW = GAME_WIDTH - rightX - 10;

    bg.fillStyle(0xe8e8e8, 1);
    bg.fillRoundedRect(rightX, panelY, rightW, panelH, 4);
    bg.lineStyle(2, COLORS.DIALOG_BORDER, 1);
    bg.strokeRoundedRect(rightX, panelY, rightW, panelH, 4);

    // Description text
    this.descText = this.add.text(rightX + 12, panelY + 12, '', {
      fontFamily: FONT_FAMILY, fontSize: '9px', color: '#181818',
      wordWrap: { width: rightW - 24 }, lineSpacing: 6,
    });

    // Price text
    this.priceText = this.add.text(rightX + 12, panelY + panelH - 40, '', {
      fontFamily: FONT_FAMILY, fontSize: '11px', color: '#181818',
    });

    // Render items
    this.renderItems();

    // Bottom instruction
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'ENTER: Buy    ESC: Exit', {
      fontFamily: FONT_FAMILY, fontSize: '8px', color: '#808080',
    }).setOrigin(0.5);

    // Message text (hidden initially)
    this.messageText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      fontFamily: FONT_FAMILY, fontSize: '11px', color: '#181818',
    }).setOrigin(0.5).setDepth(100).setVisible(false);

    // Input
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      this.handleInput(event);
    });
  }

  renderItems() {
    this.itemTexts.forEach(t => t.destroy());
    this.itemTexts = [];

    const startY = 64;
    const itemH = 30;
    const allItems = [...this.shopItems, 'CANCEL'];

    for (let i = 0; i < Math.min(this.maxVisible, allItems.length); i++) {
      const idx = i + this.scrollOffset;
      if (idx >= allItems.length) break;

      const isCancel = idx === this.shopItems.length;
      const prefix = idx === this.cursorIndex ? '▶ ' : '  ';
      let label: string;
      let priceStr = '';

      if (isCancel) {
        label = 'CANCEL';
      } else {
        const data = ITEM_DATA[allItems[idx]];
        label = data?.name || allItems[idx];
        priceStr = data ? `$${data.price}` : '';
      }

      const txt = this.add.text(24, startY + i * itemH, `${prefix}${label}`, {
        fontFamily: FONT_FAMILY, fontSize: '10px',
        color: idx === this.cursorIndex ? '#c03030' : '#181818',
      });
      this.itemTexts.push(txt);

      if (priceStr) {
        const priceTxt = this.add.text(GAME_WIDTH * 0.55 - 20, startY + i * itemH, priceStr, {
          fontFamily: FONT_FAMILY, fontSize: '10px',
          color: '#505050',
        }).setOrigin(1, 0);
        this.itemTexts.push(priceTxt);
      }
    }

    this.updateDescription();
  }

  updateDescription() {
    if (this.cursorIndex >= this.shopItems.length) {
      this.descText?.setText('Exit the shop.');
      this.priceText?.setText('');
      return;
    }

    const itemId = this.shopItems[this.cursorIndex];
    const data = ITEM_DATA[itemId];
    if (data) {
      this.descText?.setText(data.description);
      this.priceText?.setText(`Price: $${data.price}`);
    }
  }

  handleInput(event: KeyboardEvent) {
    if (this.phase === 'message') {
      if (event.code === 'Space' || event.code === 'Enter' || event.code === 'KeyZ') {
        this.messageText?.setVisible(false);
        this.phase = 'browsing';
      }
      return;
    }

    if (this.phase === 'quantity') {
      this.handleQuantityInput(event);
      return;
    }

    // browsing
    const totalOptions = this.shopItems.length + 1; // +1 for CANCEL

    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      if (this.cursorIndex > 0) {
        this.cursorIndex--;
        if (this.cursorIndex < this.scrollOffset) this.scrollOffset = this.cursorIndex;
        this.renderItems();
      }
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      if (this.cursorIndex < totalOptions - 1) {
        this.cursorIndex++;
        if (this.cursorIndex >= this.scrollOffset + this.maxVisible) {
          this.scrollOffset = this.cursorIndex - this.maxVisible + 1;
        }
        this.renderItems();
      }
    } else if (event.code === 'Escape' || event.code === 'Backspace' || event.code === 'KeyX') {
      this.exitShop();
    } else if (event.code === 'Space' || event.code === 'Enter' || event.code === 'KeyZ') {
      if (this.cursorIndex >= this.shopItems.length) {
        this.exitShop();
      } else {
        this.showQuantitySelector();
      }
    }
  }

  showQuantitySelector() {
    this.phase = 'quantity';
    this.quantity = 1;

    const itemId = this.shopItems[this.cursorIndex];
    const data = ITEM_DATA[itemId];
    if (!data) return;

    this.quantityPanel?.destroy();
    this.quantityPanel = this.add.container(0, 0);
    this.quantityPanel.setDepth(50);

    const panelX = GAME_WIDTH / 2 - 110;
    const panelY = GAME_HEIGHT / 2 - 65;
    const panelW = 220;
    const panelH = 130;

    const bg = this.add.graphics();
    bg.fillStyle(0xf8f8f8, 1);
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 4);
    bg.lineStyle(3, COLORS.DIALOG_BORDER, 1);
    bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 4);
    bg.lineStyle(2, 0xd8d8d8, 1);
    bg.strokeRoundedRect(panelX + 4, panelY + 4, panelW - 8, panelH - 8, 3);
    this.quantityPanel.add(bg);

    const title = this.add.text(panelX + panelW / 2, panelY + 14, `How many ${data.name}?`, {
      fontFamily: FONT_FAMILY, fontSize: '9px', color: '#181818',
    }).setOrigin(0.5, 0);
    this.quantityPanel.add(title);

    this.quantityText = this.add.text(panelX + panelW / 2, panelY + 42, 'x 1', {
      fontFamily: FONT_FAMILY, fontSize: '14px', color: '#181818',
    }).setOrigin(0.5, 0);
    this.quantityPanel.add(this.quantityText);

    this.totalText = this.add.text(panelX + panelW / 2, panelY + 72, `Total: $${data.price}`, {
      fontFamily: FONT_FAMILY, fontSize: '10px', color: '#505050',
    }).setOrigin(0.5, 0);
    this.quantityPanel.add(this.totalText);

    const hint = this.add.text(panelX + panelW / 2, panelY + panelH - 18, '\u25b2\u25bc Qty   ENTER Buy   ESC Cancel', {
      fontFamily: FONT_FAMILY, fontSize: '6px', color: '#808080',
    }).setOrigin(0.5, 0);
    this.quantityPanel.add(hint);
  }

  handleQuantityInput(event: KeyboardEvent) {
    const itemId = this.shopItems[this.cursorIndex];
    const data = ITEM_DATA[itemId];
    if (!data) return;

    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      this.quantity = Math.min(99, this.quantity + 1);
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      this.quantity = Math.max(1, this.quantity - 1);
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      this.quantity = Math.min(99, this.quantity + 10);
    } else if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      this.quantity = Math.max(1, this.quantity - 10);
    } else if (event.code === 'Escape' || event.code === 'Backspace' || event.code === 'KeyX') {
      this.quantityPanel?.destroy();
      this.quantityPanel = undefined;
      this.phase = 'browsing';
      return;
    } else if (event.code === 'Space' || event.code === 'Enter' || event.code === 'KeyZ') {
      this.buyItem(itemId, this.quantity);
      return;
    }

    this.quantityText?.setText(`x ${this.quantity}`);
    this.totalText?.setText(`Total: $${data.price * this.quantity}`);
  }

  buyItem(itemId: string, qty: number) {
    const data = ITEM_DATA[itemId];
    if (!data) return;

    const cost = data.price * qty;

    if (cost > this.money) {
      this.quantityPanel?.destroy();
      this.quantityPanel = undefined;
      this.showMessage("You don't have enough money!");
      return;
    }

    this.money -= cost;
    this.moneyText?.setText(`$${this.money}`);

    // Add to items
    const existing = this.items.find(i => i.id === itemId);
    if (existing) {
      existing.count += qty;
    } else {
      this.items.push({ id: itemId, count: qty });
    }

    this.quantityPanel?.destroy();
    this.quantityPanel = undefined;

    const itemName = qty > 1 ? `${data.name} x${qty}` : data.name;
    this.showMessage(`Bought ${itemName}!`);
  }

  showMessage(msg: string) {
    this.phase = 'message';
    this.messageText?.setText(msg).setVisible(true);
  }

  exitShop() {
    // Save updated state
    const saveData: SaveData = {
      playerName: 'RED',
      party: this.returnData.party,
      pc: [],
      items: this.items,
      money: this.money,
      badges: this.returnData.badges,
      currentMap: this.returnData.currentMap,
      playerX: this.returnData.playerX,
      playerY: this.returnData.playerY,
      visitedMaps: this.returnData.visitedMaps,
      pokedexSeen: this.returnData.pokedexSeen,
      pokedexCaught: this.returnData.pokedexCaught,
    };
    saveGame(saveData);

    this.cameras.main.fadeOut(FADE_DURATION, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('OverworldScene', {
        fromMap: this.returnData.currentMap,
        fromX: this.returnData.playerX,
        fromY: this.returnData.playerY,
      });
    });
  }
}
