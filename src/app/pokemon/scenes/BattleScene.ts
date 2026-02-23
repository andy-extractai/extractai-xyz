import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS, FADE_DURATION,
  TEXT_SPEED, TYPE_COLORS, getTypeEffectiveness,
} from '../constants';
import { GamePokemon, createPokemon, POKEMON_DATA, calculateStat, expForLevel } from '../data/pokemon';
import { MOVE_DATA, MoveData } from '../data/moves';
import { ITEM_DATA } from '../data/items';
import { saveGame, SaveData } from '../utils/save';

type BattlePhase = 'intro' | 'action' | 'fight' | 'bag' | 'pokemon' | 'animating' | 'messages' | 'ended';

interface BattleData {
  wildPokemon: GamePokemon;
  party: GamePokemon[];
  items: { id: string; count: number }[];
  returnData: {
    currentMap: string;
    playerX: number;
    playerY: number;
    money: number;
    badges: string[];
    visitedMaps: string[];
    pokedexSeen: number[];
    pokedexCaught: number[];
  };
}

// Status condition display info
const STATUS_DISPLAY: Record<string, { label: string; color: number }> = {
  poison: { label: 'PSN', color: COLORS.STATUS_PSN },
  burn: { label: 'BRN', color: COLORS.STATUS_BRN },
  paralyze: { label: 'PAR', color: COLORS.STATUS_PAR },
  freeze: { label: 'FRZ', color: COLORS.STATUS_FRZ },
  sleep: { label: 'SLP', color: COLORS.STATUS_SLP },
};

export class BattleScene extends Phaser.Scene {
  private phase: BattlePhase = 'intro';

  // Pokemon
  private playerPokemon!: GamePokemon;
  private enemyPokemon!: GamePokemon;
  private party: GamePokemon[] = [];
  private items: { id: string; count: number }[] = [];
  private returnData: BattleData['returnData'] = {} as BattleData['returnData'];
  private activePartyIndex = 0;

  // Sprites
  private playerSprite?: Phaser.GameObjects.Image;
  private enemySprite?: Phaser.GameObjects.Image;

  // HP Bar tracking for animation
  private playerDisplayHp = 0;
  private enemyDisplayHp = 0;

  // HP Bars
  private playerHpBar?: Phaser.GameObjects.Graphics;
  private enemyHpBar?: Phaser.GameObjects.Graphics;
  private playerHpText?: Phaser.GameObjects.Text;
  private enemyHpText?: Phaser.GameObjects.Text;
  private playerNameText?: Phaser.GameObjects.Text;
  private enemyNameText?: Phaser.GameObjects.Text;
  private playerLevelText?: Phaser.GameObjects.Text;
  private enemyLevelText?: Phaser.GameObjects.Text;
  private expBar?: Phaser.GameObjects.Graphics;

  // UI panels
  private actionPanel?: Phaser.GameObjects.Container;
  private movePanel?: Phaser.GameObjects.Container;
  private bagPanel?: Phaser.GameObjects.Container;
  private pokemonPanel?: Phaser.GameObjects.Container;

  // Dialog
  private dialogBox?: Phaser.GameObjects.Graphics;
  private dialogText?: Phaser.GameObjects.Text;
  private messageQueue: string[] = [];
  private isTyping = false;
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private fullText = '';
  private messageCallback?: () => void;

  // Cursor
  private cursorIndex = 0;
  private actionButtons: Phaser.GameObjects.Container[] = [];

  // Stat stages (battle modifiers)
  private playerStatStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, speed: 0 };
  private enemyStatStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, speed: 0 };

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: BattleData) {
    this.party = data.party;
    this.items = data.items;
    this.returnData = data.returnData;
    this.enemyPokemon = data.wildPokemon;

    // Find first non-fainted party member
    this.activePartyIndex = this.party.findIndex(p => p.currentHp > 0);
    if (this.activePartyIndex === -1) this.activePartyIndex = 0;
    this.playerPokemon = this.party[this.activePartyIndex];

    // Reset stat stages
    this.playerStatStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, speed: 0 };
    this.enemyStatStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, speed: 0 };

    // Init display HP
    this.playerDisplayHp = this.playerPokemon.currentHp;
    this.enemyDisplayHp = this.enemyPokemon.currentHp;
  }

  create() {
    this.phase = 'intro';
    this.actionButtons = [];
    this.cameras.main.fadeIn(FADE_DURATION, 0, 0, 0);

    // Battle background
    this.drawBattleBackground();

    // Enemy sprite (right side, top)
    this.enemySprite = this.add.image(580, 150, `pokemon-front-${this.enemyPokemon.id}`);
    this.enemySprite.setScale(3);
    this.enemySprite.setOrigin(0.5, 1);

    // Player sprite (left side, bottom)
    this.playerSprite = this.add.image(200, 340, `pokemon-back-${this.playerPokemon.id}`);
    this.playerSprite.setScale(3);
    this.playerSprite.setOrigin(0.5, 1);

    // Draw HP panels
    this.drawEnemyHpPanel();
    this.drawPlayerHpPanel();

    // Dialog box at bottom
    this.createDialogBox();

    // Slide in animation
    this.enemySprite.setX(GAME_WIDTH + 200);
    this.playerSprite.setX(-200);

    this.tweens.add({
      targets: this.enemySprite,
      x: 580,
      duration: 600,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: this.playerSprite,
      x: 200,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        this.showMessages([
          `A wild ${this.enemyPokemon.name} appeared!`,
          `Go! ${this.playerPokemon.name}!`,
        ], () => {
          this.showActionMenu();
        });
      },
    });

    // Input handler
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      this.handleInput(event);
    });
  }

  drawBattleBackground() {
    const bg = this.add.graphics();

    // Sky gradient
    bg.fillStyle(COLORS.BATTLE_SKY, 1);
    bg.fillRect(0, 0, GAME_WIDTH, 360);

    // Ground area
    bg.fillStyle(COLORS.BATTLE_GROUND, 1);
    bg.fillRect(0, 300, GAME_WIDTH, 60);

    // Enemy platform
    bg.fillStyle(COLORS.BATTLE_PLATFORM, 1);
    bg.fillEllipse(560, 180, 220, 40);
    bg.fillStyle(COLORS.BATTLE_PLATFORM_DARK, 1);
    bg.fillEllipse(560, 185, 200, 20);

    // Player platform
    bg.fillStyle(COLORS.BATTLE_PLATFORM, 1);
    bg.fillEllipse(220, 350, 260, 50);
    bg.fillStyle(COLORS.BATTLE_PLATFORM_DARK, 1);
    bg.fillEllipse(220, 355, 240, 25);

    // Bottom half (UI area) — authentic off-white
    bg.fillStyle(COLORS.DIALOG_BG, 1);
    bg.fillRect(0, 370, GAME_WIDTH, GAME_HEIGHT - 370);
    bg.lineStyle(3, COLORS.DIALOG_BORDER, 1);
    bg.lineBetween(0, 370, GAME_WIDTH, 370);
  }

  // ─── Enemy HP Panel (top-left) ───

  drawEnemyHpPanel() {
    const panelX = 30;
    const panelY = 40;
    const panelW = 280;
    const panelH = 70;

    const panel = this.add.graphics();
    // White box with black border, slight rounded corner
    panel.fillStyle(0xf8f8f8, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 4);
    panel.lineStyle(2, COLORS.DIALOG_BORDER, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 4);

    // Name (left-aligned, bold)
    this.enemyNameText = this.add.text(panelX + 12, panelY + 8, this.enemyPokemon.name.toUpperCase(), {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: '#181818',
    });

    // Level (right-aligned with "Lv" prefix)
    this.enemyLevelText = this.add.text(panelX + panelW - 12, panelY + 8, `Lv${this.enemyPokemon.level}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#181818',
    }).setOrigin(1, 0);

    // Status condition badge
    this.drawStatusBadge(panelX + 12, panelY + 24, this.enemyPokemon, 'enemy');

    // "HP" label in small text
    this.add.text(panelX + 12, panelY + 34, 'HP', {
      fontFamily: FONT_FAMILY,
      fontSize: '7px',
      color: '#f89020',
    });

    // HP bar background — thin 6px tall
    const hpBarX = panelX + 42;
    const hpBarY = panelY + 33;
    const hpBarW = 196;
    const hpBarH = 6;

    const barBg = this.add.graphics();
    barBg.fillStyle(COLORS.HP_BAR_BG, 1);
    barBg.fillRoundedRect(hpBarX - 1, hpBarY - 1, hpBarW + 2, hpBarH + 2, 2);
    barBg.fillStyle(0x101010, 1);
    barBg.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);

    // HP bar fill
    this.enemyHpBar = this.add.graphics();
    this.updateHpBar(this.enemyHpBar, hpBarX, hpBarY, hpBarW, hpBarH, this.enemyPokemon.currentHp, this.enemyPokemon.maxHp);

    // No HP numbers for enemy (authentic FireRed)
    this.enemyHpText = this.add.text(panelX + panelW - 12, panelY + 48, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '9px',
      color: '#181818',
    }).setOrigin(1, 0);
  }

  // ─── Player HP Panel (bottom-right) ───

  drawPlayerHpPanel() {
    const panelX = GAME_WIDTH - 310;
    const panelY = 260;
    const panelW = 280;
    const panelH = 90;

    const panel = this.add.graphics();
    panel.fillStyle(0xf8f8f8, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 4);
    panel.lineStyle(2, COLORS.DIALOG_BORDER, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 4);

    // Name
    this.playerNameText = this.add.text(panelX + 12, panelY + 8, this.playerPokemon.name.toUpperCase(), {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: '#181818',
    });

    // Level
    this.playerLevelText = this.add.text(panelX + panelW - 12, panelY + 8, `Lv${this.playerPokemon.level}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#181818',
    }).setOrigin(1, 0);

    // Status condition badge
    this.drawStatusBadge(panelX + 12, panelY + 24, this.playerPokemon, 'player');

    // "HP" label
    this.add.text(panelX + 12, panelY + 34, 'HP', {
      fontFamily: FONT_FAMILY,
      fontSize: '7px',
      color: '#f89020',
    });

    // HP bar — thin 6px tall
    const hpBarX = panelX + 42;
    const hpBarY = panelY + 33;
    const hpBarW = 196;
    const hpBarH = 6;

    const barBg = this.add.graphics();
    barBg.fillStyle(COLORS.HP_BAR_BG, 1);
    barBg.fillRoundedRect(hpBarX - 1, hpBarY - 1, hpBarW + 2, hpBarH + 2, 2);
    barBg.fillStyle(0x101010, 1);
    barBg.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);

    this.playerHpBar = this.add.graphics();
    this.updateHpBar(this.playerHpBar, hpBarX, hpBarY, hpBarW, hpBarH, this.playerPokemon.currentHp, this.playerPokemon.maxHp);

    // HP numbers below bar (player only, authentic)
    this.playerHpText = this.add.text(panelX + panelW - 12, panelY + 44, `${this.playerPokemon.currentHp}/${this.playerPokemon.maxHp}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '9px',
      color: '#181818',
    }).setOrigin(1, 0);

    // EXP bar at bottom of panel
    const expBarY = panelY + 60;
    this.add.text(panelX + 12, expBarY, 'EXP', {
      fontFamily: FONT_FAMILY,
      fontSize: '6px',
      color: '#4080c0',
    });

    this.add.graphics()
      .fillStyle(COLORS.HP_BAR_BG, 1)
      .fillRoundedRect(panelX + 41, expBarY - 1, 198, 7, 2)
      .fillStyle(0x101010, 1)
      .fillRect(panelX + 42, expBarY, 196, 5);

    const expPct = (this.playerPokemon.exp - expForLevel(this.playerPokemon.level)) /
                   (this.playerPokemon.expToNext - expForLevel(this.playerPokemon.level));
    this.expBar = this.add.graphics();
    this.expBar.fillStyle(COLORS.EXP_BLUE, 1);
    this.expBar.fillRect(panelX + 42, expBarY, Math.max(0, 196 * Math.min(1, expPct)), 5);
  }

  drawStatusBadge(x: number, y: number, pokemon: GamePokemon, _owner: string) {
    if (!pokemon.status) return;
    const info = STATUS_DISPLAY[pokemon.status];
    if (!info) return;

    const gfx = this.add.graphics();
    gfx.fillStyle(info.color, 1);
    gfx.fillRoundedRect(x, y, 30, 12, 3);
    this.add.text(x + 15, y + 6, info.label, {
      fontFamily: FONT_FAMILY,
      fontSize: '6px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  updateHpBar(bar: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, current: number, max: number) {
    bar.clear();
    const pct = Math.max(0, current / max);
    let color = COLORS.HP_GREEN;
    if (pct <= 0.2) color = COLORS.HP_RED;
    else if (pct <= 0.5) color = COLORS.HP_YELLOW;
    bar.fillStyle(color, 1);
    if (pct > 0) {
      bar.fillRoundedRect(x, y, Math.max(2, w * pct), h, 1);
    }
  }

  // ─── Dialog Box (bottom, full width left half) ───

  createDialogBox() {
    const boxH = 80;
    const boxY = GAME_HEIGHT - boxH - 10;

    this.dialogBox = this.add.graphics();
    this.dialogBox.setDepth(10);
    // Authentic Pokémon dialog box: white bg, black border, 3px border, inner 2px white inset
    this.dialogBox.fillStyle(COLORS.DIALOG_BG, 1);
    this.dialogBox.fillRoundedRect(20, boxY, GAME_WIDTH / 2 - 10, boxH, 4);
    this.dialogBox.lineStyle(3, COLORS.DIALOG_BORDER, 1);
    this.dialogBox.strokeRoundedRect(20, boxY, GAME_WIDTH / 2 - 10, boxH, 4);
    this.dialogBox.lineStyle(2, 0xd8d8d8, 1);
    this.dialogBox.strokeRoundedRect(24, boxY + 4, GAME_WIDTH / 2 - 18, boxH - 8, 3);

    this.dialogText = this.add.text(40, boxY + 16, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#181818',
      wordWrap: { width: GAME_WIDTH / 2 - 60 },
      lineSpacing: 6,
    }).setDepth(11);
  }

  showMessages(messages: string[], callback?: () => void) {
    this.phase = 'messages';
    this.messageQueue = [...messages];
    this.messageCallback = callback;
    this.showNextMessage();
  }

  showNextMessage() {
    const msg = this.messageQueue.shift();
    if (!msg) {
      this.phase = 'action';
      if (this.messageCallback) {
        const cb = this.messageCallback;
        this.messageCallback = undefined;
        cb();
      }
      return;
    }

    this.isTyping = true;
    this.fullText = msg;
    this.dialogText?.setText('');
    this.hideMenuPanels();

    let charIndex = 0;
    this.typewriterTimer = this.time.addEvent({
      delay: TEXT_SPEED,
      repeat: msg.length - 1,
      callback: () => {
        charIndex++;
        this.dialogText?.setText(msg.substring(0, charIndex));
        if (charIndex >= msg.length) {
          this.isTyping = false;
        }
      },
    });
  }

  skipTypewriter() {
    if (this.typewriterTimer) this.typewriterTimer.destroy();
    if (this.dialogText) this.dialogText.setText(this.fullText);
    this.isTyping = false;
  }

  // ─── Action Menu — FIGHT / BAG / POKéMON / RUN ───

  showActionMenu() {
    this.phase = 'action';
    this.cursorIndex = 0;
    this.hideMenuPanels();
    this.actionButtons = [];

    this.dialogText?.setText(`What will\n${this.playerPokemon.name} do?`);

    // Action buttons panel (right half of bottom)
    const panelX = GAME_WIDTH / 2 + 10;
    const panelY = GAME_HEIGHT - 90;
    const panelW = GAME_WIDTH / 2 - 30;
    const panelH = 80;

    this.actionPanel = this.add.container(0, 0);

    // Panel background with authentic border
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.DIALOG_BG, 1);
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 4);
    bg.lineStyle(3, COLORS.DIALOG_BORDER, 1);
    bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 4);
    this.actionPanel.add(bg);

    const labels = ['FIGHT', 'BAG', 'POKéMON', 'RUN'];
    const halfW = (panelW - 20) / 2;
    const halfH = (panelH - 16) / 2;
    const positions = [
      { x: panelX + 8, y: panelY + 6 },
      { x: panelX + 8 + halfW + 4, y: panelY + 6 },
      { x: panelX + 8, y: panelY + 6 + halfH + 4 },
      { x: panelX + 8 + halfW + 4, y: panelY + 6 + halfH + 4 },
    ];

    labels.forEach((label, i) => {
      const btn = this.createActionButton(positions[i].x, positions[i].y, halfW, halfH, label, i === 0);
      this.actionPanel!.add(btn);
      this.actionButtons.push(btn);
    });

    this.actionPanel.setDepth(20);
  }

  createActionButton(x: number, y: number, w: number, h: number, label: string, selected: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    const gfx = this.add.graphics();

    if (selected) {
      // Selected: black bg, white text
      gfx.fillStyle(COLORS.DIALOG_BORDER, 1);
      gfx.fillRoundedRect(x, y, w, h, 3);
    } else {
      // Unselected: white bg, black text, bordered
      gfx.fillStyle(0xf8f8f8, 1);
      gfx.fillRoundedRect(x, y, w, h, 3);
      gfx.lineStyle(2, COLORS.DIALOG_BORDER, 1);
      gfx.strokeRoundedRect(x, y, w, h, 3);
    }
    container.add(gfx);

    const txt = this.add.text(x + w / 2, y + h / 2, label, {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: selected ? '#f8f8f8' : '#181818',
    }).setOrigin(0.5);
    container.add(txt);

    return container;
  }

  updateActionButtons() {
    if (!this.actionPanel) return;

    const panelX = GAME_WIDTH / 2 + 10;
    const panelY = GAME_HEIGHT - 90;
    const panelW = GAME_WIDTH / 2 - 30;
    const panelH = 80;
    const halfW = (panelW - 20) / 2;
    const halfH = (panelH - 16) / 2;
    const positions = [
      { x: panelX + 8, y: panelY + 6 },
      { x: panelX + 8 + halfW + 4, y: panelY + 6 },
      { x: panelX + 8, y: panelY + 6 + halfH + 4 },
      { x: panelX + 8 + halfW + 4, y: panelY + 6 + halfH + 4 },
    ];
    const labels = ['FIGHT', 'BAG', 'POKéMON', 'RUN'];

    // Rebuild buttons
    this.actionButtons.forEach(btn => btn.destroy());
    this.actionButtons = [];

    labels.forEach((label, i) => {
      const btn = this.createActionButton(positions[i].x, positions[i].y, halfW, halfH, label, i === this.cursorIndex);
      this.actionPanel!.add(btn);
      this.actionButtons.push(btn);
    });
  }

  // ─── Move Selection ───

  showMoveMenu() {
    this.phase = 'fight';
    this.cursorIndex = 0;
    this.hideMenuPanels();

    const panelY = GAME_HEIGHT - 90;
    const panelH = 80;

    this.movePanel = this.add.container(0, 0);

    // Full-width move panel
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.DIALOG_BG, 1);
    bg.fillRoundedRect(20, panelY, GAME_WIDTH - 40, panelH, 4);
    bg.lineStyle(3, COLORS.DIALOG_BORDER, 1);
    bg.strokeRoundedRect(20, panelY, GAME_WIDTH - 40, panelH, 4);
    this.movePanel.add(bg);

    // Move names in 2x2 grid (left side)
    const moves = this.playerPokemon.moves;
    const positions = [
      { x: 50, y: panelY + 12 },
      { x: 260, y: panelY + 12 },
      { x: 50, y: panelY + 44 },
      { x: 260, y: panelY + 44 },
    ];

    for (let i = 0; i < 4; i++) {
      const move = moves[i];
      const name = move ? move.name : '-----';
      const isSelected = i === 0;

      const txt = this.add.text(positions[i].x, positions[i].y, (isSelected ? '▶ ' : '  ') + name.toUpperCase(), {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        color: '#181818',
      });
      txt.name = `move-${i}`;
      this.movePanel.add(txt);
    }

    // Move info on right side
    this.updateMoveInfo(0);

    this.movePanel.setDepth(20);
  }

  updateMoveInfo(index: number) {
    // Clear old info
    this.movePanel?.getAll().filter((o: any) => o.name === 'moveInfo').forEach((o: any) => o.destroy());

    // Update cursor arrows on move names
    const moves = this.playerPokemon.moves;
    const positions = [
      { x: 50, y: GAME_HEIGHT - 78 },
      { x: 260, y: GAME_HEIGHT - 78 },
      { x: 50, y: GAME_HEIGHT - 46 },
      { x: 260, y: GAME_HEIGHT - 46 },
    ];
    for (let i = 0; i < 4; i++) {
      const moveText = this.movePanel?.getAll().find((o: any) => o.name === `move-${i}`) as Phaser.GameObjects.Text | undefined;
      if (moveText) {
        const name = moves[i] ? moves[i].name : '-----';
        moveText.setText((i === index ? '▶ ' : '  ') + name.toUpperCase());
      }
    }

    const move = this.playerPokemon.moves[index];
    if (!move) return;

    const moveData = MOVE_DATA[move.name];
    if (!moveData) return;

    const infoX = 520;
    const infoY = GAME_HEIGHT - 78;

    // Divider line
    const divider = this.add.graphics();
    divider.lineStyle(2, COLORS.DIALOG_BORDER, 0.3);
    divider.lineBetween(490, GAME_HEIGHT - 84, 490, GAME_HEIGHT - 16);
    divider.name = 'moveInfo';
    this.movePanel?.add(divider);

    // Type badge — colored pill
    const typeColor = TYPE_COLORS[moveData.type] || COLORS.NORMAL;
    const typeBadge = this.add.graphics();
    typeBadge.fillStyle(typeColor, 1);
    typeBadge.fillRoundedRect(infoX, infoY, 80, 16, 4);
    typeBadge.name = 'moveInfo';
    this.movePanel?.add(typeBadge);

    const typeLabel = this.add.text(infoX + 40, infoY + 8, moveData.type.toUpperCase(), {
      fontFamily: FONT_FAMILY,
      fontSize: '8px',
      color: '#ffffff',
    }).setOrigin(0.5);
    typeLabel.name = 'moveInfo';
    this.movePanel?.add(typeLabel);

    // PP display
    const ppText = this.add.text(infoX, infoY + 26, `PP  ${move.pp}/${move.maxPp}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '9px',
      color: '#181818',
    });
    ppText.name = 'moveInfo';
    this.movePanel?.add(ppText);
  }

  // ─── Bag Menu ───

  showBagMenu() {
    this.phase = 'bag';
    this.cursorIndex = 0;
    this.hideMenuPanels();

    const panelX = 20;
    const panelY = GAME_HEIGHT - 250;
    const panelW = GAME_WIDTH - 40;
    const panelH = 240;

    this.bagPanel = this.add.container(0, 0);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.DIALOG_BG, 1);
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 4);
    bg.lineStyle(3, COLORS.DIALOG_BORDER, 1);
    bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 4);
    bg.lineStyle(2, 0xd8d8d8, 1);
    bg.strokeRoundedRect(panelX + 4, panelY + 4, panelW - 8, panelH - 8, 3);
    this.bagPanel.add(bg);

    const title = this.add.text(panelX + 20, panelY + 10, 'BAG', {
      fontFamily: FONT_FAMILY, fontSize: '12px', color: '#181818',
    });
    this.bagPanel.add(title);

    const usableItems = this.items.filter(item => item.count > 0);

    if (usableItems.length === 0) {
      const empty = this.add.text(panelX + 40, panelY + 40, 'No items!', {
        fontFamily: FONT_FAMILY, fontSize: '10px', color: '#808080',
      });
      this.bagPanel.add(empty);
    } else {
      usableItems.forEach((item, i) => {
        const data = ITEM_DATA[item.id];
        const prefix = i === 0 ? '▶ ' : '  ';
        const txt = this.add.text(panelX + 30, panelY + 40 + i * 24, `${prefix}${data?.name || item.id}  x${item.count}`, {
          fontFamily: FONT_FAMILY, fontSize: '10px', color: '#181818',
        });
        txt.name = `bag-item-${i}`;
        this.bagPanel!.add(txt);
      });
    }

    // Back option
    const backPrefix = usableItems.length === 0 ? '▶ ' : '  ';
    const backText = this.add.text(panelX + 30, panelY + panelH - 30, `${backPrefix}BACK`, {
      fontFamily: FONT_FAMILY, fontSize: '10px', color: '#181818',
    });
    backText.name = 'bag-back';
    this.bagPanel.add(backText);

    this.bagPanel.setDepth(30);
  }

  // ─── Pokémon Menu ───

  showPokemonMenu() {
    this.phase = 'pokemon';
    this.cursorIndex = 0;
    this.hideMenuPanels();

    const panelX = 20;
    const panelY = GAME_HEIGHT - 280;
    const panelW = GAME_WIDTH - 40;
    const panelH = 270;

    this.pokemonPanel = this.add.container(0, 0);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.DIALOG_BG, 1);
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 4);
    bg.lineStyle(3, COLORS.DIALOG_BORDER, 1);
    bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 4);
    bg.lineStyle(2, 0xd8d8d8, 1);
    bg.strokeRoundedRect(panelX + 4, panelY + 4, panelW - 8, panelH - 8, 3);
    this.pokemonPanel.add(bg);

    const title = this.add.text(panelX + 20, panelY + 10, 'POKéMON', {
      fontFamily: FONT_FAMILY, fontSize: '12px', color: '#181818',
    });
    this.pokemonPanel.add(title);

    this.party.forEach((poke, i) => {
      const y = panelY + 38 + i * 30;
      const fainted = poke.currentHp <= 0;
      const active = i === this.activePartyIndex;
      const selected = i === 0;

      const prefix = selected ? '▶ ' : '  ';
      const nameStr = `${prefix}${active ? '★ ' : ''}${poke.name}  Lv${poke.level}  HP:${poke.currentHp}/${poke.maxHp}`;
      const txt = this.add.text(panelX + 24, y, nameStr, {
        fontFamily: FONT_FAMILY, fontSize: '9px',
        color: fainted ? '#c04040' : '#181818',
      });
      txt.name = `poke-${i}`;
      this.pokemonPanel!.add(txt);
    });

    // Back option
    const backText = this.add.text(panelX + 24, panelY + panelH - 30, '  BACK', {
      fontFamily: FONT_FAMILY, fontSize: '10px', color: '#181818',
    });
    backText.name = 'poke-back';
    this.pokemonPanel.add(backText);

    this.pokemonPanel.setDepth(30);
  }

  hideMenuPanels() {
    this.actionPanel?.destroy();
    this.actionPanel = undefined;
    this.movePanel?.destroy();
    this.movePanel = undefined;
    this.bagPanel?.destroy();
    this.bagPanel = undefined;
    this.pokemonPanel?.destroy();
    this.pokemonPanel = undefined;
    this.actionButtons = [];
  }

  // ─── Input Handling ───

  handleInput(event: KeyboardEvent) {
    if (this.phase === 'messages' || this.phase === 'animating') {
      if (event.code === 'Space' || event.code === 'Enter') {
        if (this.isTyping) {
          this.skipTypewriter();
        } else {
          this.showNextMessage();
        }
      }
      return;
    }

    if (this.phase === 'ended') {
      if (event.code === 'Space' || event.code === 'Enter') {
        if (this.isTyping) { this.skipTypewriter(); return; }
        this.showNextMessage();
      }
      return;
    }

    if (this.phase === 'action') {
      this.handleActionInput(event);
    } else if (this.phase === 'fight') {
      this.handleFightInput(event);
    } else if (this.phase === 'bag') {
      this.handleBagInput(event);
    } else if (this.phase === 'pokemon') {
      this.handlePokemonInput(event);
    }
  }

  handleActionInput(event: KeyboardEvent) {
    let changed = false;

    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      if (this.cursorIndex >= 2) { this.cursorIndex -= 2; changed = true; }
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      if (this.cursorIndex < 2) { this.cursorIndex += 2; changed = true; }
    } else if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      if (this.cursorIndex % 2 === 1) { this.cursorIndex--; changed = true; }
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      if (this.cursorIndex % 2 === 0) { this.cursorIndex++; changed = true; }
    } else if (event.code === 'Space' || event.code === 'Enter') {
      switch (this.cursorIndex) {
        case 0: this.showMoveMenu(); return;
        case 1: this.showBagMenu(); return;
        case 2: this.showPokemonMenu(); return;
        case 3: this.attemptRun(); return;
      }
    }

    if (changed) {
      this.updateActionButtons();
    }
  }

  handleFightInput(event: KeyboardEvent) {
    const maxMoves = this.playerPokemon.moves.length;

    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      if (this.cursorIndex >= 2) this.cursorIndex -= 2;
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      if (this.cursorIndex + 2 < maxMoves) this.cursorIndex += 2;
    } else if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      if (this.cursorIndex % 2 === 1) this.cursorIndex--;
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      if (this.cursorIndex % 2 === 0 && this.cursorIndex + 1 < maxMoves) this.cursorIndex++;
    } else if (event.code === 'Escape' || event.code === 'Backspace') {
      this.showActionMenu();
      return;
    } else if (event.code === 'Space' || event.code === 'Enter') {
      const move = this.playerPokemon.moves[this.cursorIndex];
      if (move && move.pp > 0) {
        this.executeTurn(move.name);
      } else if (move && move.pp <= 0) {
        this.dialogText?.setText('No PP left for this move!');
      }
      return;
    }

    this.updateMoveInfo(this.cursorIndex);
  }

  handleBagInput(event: KeyboardEvent) {
    const usableItems = this.items.filter(item => item.count > 0);
    const totalOptions = usableItems.length + 1; // +1 for BACK

    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      this.cursorIndex = Math.max(0, this.cursorIndex - 1);
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      this.cursorIndex = Math.min(totalOptions - 1, this.cursorIndex + 1);
    } else if (event.code === 'Escape' || event.code === 'Backspace') {
      this.showActionMenu();
      return;
    } else if (event.code === 'Space' || event.code === 'Enter') {
      if (this.cursorIndex >= usableItems.length) {
        this.showActionMenu();
        return;
      }

      const item = usableItems[this.cursorIndex];
      this.useItem(item);
      return;
    }

    // Update cursor arrows in bag
    this.updateBagCursor(usableItems);
  }

  updateBagCursor(usableItems: { id: string; count: number }[]) {
    usableItems.forEach((item, i) => {
      const txt = this.bagPanel?.getAll().find((o: any) => o.name === `bag-item-${i}`) as Phaser.GameObjects.Text | undefined;
      if (txt) {
        const data = ITEM_DATA[item.id];
        const prefix = i === this.cursorIndex ? '▶ ' : '  ';
        txt.setText(`${prefix}${data?.name || item.id}  x${item.count}`);
      }
    });
    const back = this.bagPanel?.getAll().find((o: any) => o.name === 'bag-back') as Phaser.GameObjects.Text | undefined;
    if (back) {
      back.setText(this.cursorIndex >= usableItems.length ? '▶ BACK' : '  BACK');
    }
  }

  handlePokemonInput(event: KeyboardEvent) {
    const totalOptions = this.party.length + 1; // +1 for BACK

    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      this.cursorIndex = Math.max(0, this.cursorIndex - 1);
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      this.cursorIndex = Math.min(totalOptions - 1, this.cursorIndex + 1);
    } else if (event.code === 'Escape' || event.code === 'Backspace') {
      this.showActionMenu();
      return;
    } else if (event.code === 'Space' || event.code === 'Enter') {
      if (this.cursorIndex >= this.party.length) {
        this.showActionMenu();
        return;
      }

      const selected = this.party[this.cursorIndex];
      if (selected.currentHp <= 0) {
        this.dialogText?.setText('That POKéMON has fainted!');
        return;
      }
      if (this.cursorIndex === this.activePartyIndex) {
        this.dialogText?.setText('Already in battle!');
        return;
      }

      this.switchPokemon(this.cursorIndex);
      return;
    }

    // Update cursor arrows in pokemon list
    this.updatePokemonCursor();
  }

  updatePokemonCursor() {
    this.party.forEach((poke, i) => {
      const txt = this.pokemonPanel?.getAll().find((o: any) => o.name === `poke-${i}`) as Phaser.GameObjects.Text | undefined;
      if (txt) {
        const fainted = poke.currentHp <= 0;
        const active = i === this.activePartyIndex;
        const prefix = i === this.cursorIndex ? '▶ ' : '  ';
        txt.setText(`${prefix}${active ? '★ ' : ''}${poke.name}  Lv${poke.level}  HP:${poke.currentHp}/${poke.maxHp}`);
        txt.setColor(fainted ? '#c04040' : '#181818');
      }
    });
    const back = this.pokemonPanel?.getAll().find((o: any) => o.name === 'poke-back') as Phaser.GameObjects.Text | undefined;
    if (back) {
      back.setText(this.cursorIndex >= this.party.length ? '▶ BACK' : '  BACK');
    }
  }

  // ─── Battle Logic ───

  executeTurn(playerMoveName: string) {
    this.phase = 'animating';
    this.hideMenuPanels();

    const playerMove = MOVE_DATA[playerMoveName];
    if (!playerMove) return;

    // Deduct PP
    const moveSlot = this.playerPokemon.moves.find(m => m.name === playerMoveName);
    if (moveSlot) moveSlot.pp--;

    // Enemy selects random move
    const enemyMoves = this.enemyPokemon.moves.filter(m => m.pp > 0);
    const enemyMoveSlot = enemyMoves.length > 0
      ? enemyMoves[Math.floor(Math.random() * enemyMoves.length)]
      : { name: 'Tackle', pp: 1, maxPp: 1 }; // Struggle fallback
    const enemyMove = MOVE_DATA[enemyMoveSlot.name] || MOVE_DATA['Tackle']!;
    if (enemyMoveSlot.name !== 'Tackle' || enemyMoves.length > 0) {
      enemyMoveSlot.pp--;
    }

    // Determine order
    const playerSpeed = this.getEffectiveStat(this.playerPokemon, 'speed', this.playerStatStages);
    const enemySpeed = this.getEffectiveStat(this.enemyPokemon, 'speed', this.enemyStatStages);

    // Quick Attack priority
    const playerPriority = playerMoveName === 'Quick Attack' ? 1 : 0;
    const enemyPriority = enemyMoveSlot.name === 'Quick Attack' ? 1 : 0;

    let playerFirst: boolean;
    if (playerPriority !== enemyPriority) {
      playerFirst = playerPriority > enemyPriority;
    } else if (playerSpeed !== enemySpeed) {
      playerFirst = playerSpeed >= enemySpeed;
    } else {
      playerFirst = Math.random() >= 0.5;
    }

    const messages: string[] = [];
    const actions: (() => void)[] = [];

    // Execute moves in order
    if (playerFirst) {
      this.queueAttack(messages, actions, this.playerPokemon, this.enemyPokemon, playerMove, true);
      this.queueAttack(messages, actions, this.enemyPokemon, this.playerPokemon, enemyMove, false);
    } else {
      this.queueAttack(messages, actions, this.enemyPokemon, this.playerPokemon, enemyMove, false);
      this.queueAttack(messages, actions, this.playerPokemon, this.enemyPokemon, playerMove, true);
    }

    // Execute all messages
    this.showMessages(messages, () => {
      // Check for fainting
      if (this.enemyPokemon.currentHp <= 0) {
        this.enemyFainted();
      } else if (this.playerPokemon.currentHp <= 0) {
        this.playerFainted();
      } else {
        this.showActionMenu();
      }
    });
  }

  queueAttack(messages: string[], _actions: (() => void)[], attacker: GamePokemon, defender: GamePokemon, move: MoveData, isPlayer: boolean) {
    // Check if attacker already fainted
    if (attacker.currentHp <= 0) return;

    messages.push(`${attacker.name} used ${move.name}!`);

    // Accuracy check
    if (move.accuracy < 100 && Math.random() * 100 > move.accuracy) {
      messages.push(`${attacker.name}'s attack missed!`);
      return;
    }

    if (move.category === 'Status') {
      this.applyStatusMove(messages, move, attacker, defender, isPlayer);
      return;
    }

    // Calculate damage
    const damage = this.calculateDamage(attacker, defender, move, isPlayer);
    const effectiveness = getTypeEffectiveness(move.type, defender.types);

    defender.currentHp = Math.max(0, defender.currentHp - damage);

    // Update HP bars with smooth animation + hit flash
    if (isPlayer) {
      this.animateHpBar(false, defender);
      this.flashSprite(this.enemySprite);
    } else {
      this.animateHpBar(true, defender);
      this.flashSprite(this.playerSprite);
    }

    if (effectiveness > 1) {
      messages.push("It's super effective!");
    } else if (effectiveness > 0 && effectiveness < 1) {
      messages.push("It's not very effective...");
    } else if (effectiveness === 0) {
      messages.push("It doesn't affect the target...");
    }

    // Check for secondary effects
    if (move.effect && move.effect.chance && Math.random() * 100 < move.effect.chance) {
      if (['burn', 'poison', 'paralyze', 'freeze', 'sleep'].includes(move.effect.type)) {
        if (!defender.status) {
          defender.status = move.effect.type as GamePokemon['status'];
          const statusNames: Record<string, string> = {
            burn: 'burned', poison: 'poisoned', paralyze: 'paralyzed',
            freeze: 'frozen', sleep: 'fell asleep',
          };
          messages.push(`${defender.name} was ${statusNames[move.effect.type]}!`);
        }
      }
    }
  }

  flashSprite(sprite?: Phaser.GameObjects.Image) {
    if (!sprite) return;

    // Brief flash white then shake
    const origX = sprite.x;
    this.tweens.add({
      targets: sprite,
      alpha: 0.2,
      duration: 80,
      yoyo: true,
      repeat: 2,
      ease: 'Linear',
    });

    // Shake effect
    this.tweens.add({
      targets: sprite,
      x: origX - 4,
      duration: 40,
      yoyo: true,
      repeat: 3,
      ease: 'Linear',
      onComplete: () => {
        sprite.setX(origX);
      },
    });
  }

  applyStatusMove(messages: string[], move: MoveData, attacker: GamePokemon, defender: GamePokemon, isPlayer: boolean) {
    if (!move.effect) return;

    if (move.effect.type === 'flee') {
      if (isPlayer) {
        messages.push('Got away safely!');
        this.time.delayedCall(500, () => this.endBattle());
      }
      return;
    }

    if (move.effect.type === 'lowerStat' && move.effect.stat) {
      const stages = isPlayer ? this.enemyStatStages : this.playerStatStages;
      const stat = move.effect.stat as keyof typeof stages;
      if (stages[stat] > -6) {
        stages[stat] += (move.effect.stages || -1);
        stages[stat] = Math.max(-6, stages[stat]);
        const statNames: Record<string, string> = { atk: 'Attack', def: 'Defense', spAtk: 'Sp. Atk', spDef: 'Sp. Def', speed: 'Speed' };
        messages.push(`${defender.name}'s ${statNames[stat] || stat} fell!`);
      } else {
        messages.push(`${defender.name}'s stat won't go any lower!`);
      }
      return;
    }

    if (move.effect.type === 'raiseStat' && move.effect.stat) {
      const stages = isPlayer ? this.playerStatStages : this.enemyStatStages;
      const stat = move.effect.stat as keyof typeof stages;
      if (stages[stat] < 6) {
        stages[stat] += (move.effect.stages || 1);
        stages[stat] = Math.min(6, stages[stat]);
        const statNames: Record<string, string> = { atk: 'Attack', def: 'Defense', spAtk: 'Sp. Atk', spDef: 'Sp. Def', speed: 'Speed' };
        messages.push(`${attacker.name}'s ${statNames[stat] || stat} rose!`);
      }
      return;
    }

    if (move.effect.type === 'poison' || move.effect.type === 'sleep') {
      if (!defender.status) {
        defender.status = move.effect.type;
        const statusNames: Record<string, string> = {
          poison: 'poisoned', sleep: 'fell asleep',
        };
        messages.push(`${defender.name} was ${statusNames[move.effect.type]}!`);
      } else {
        messages.push("But it failed!");
      }
      return;
    }
  }

  calculateDamage(attacker: GamePokemon, defender: GamePokemon, move: MoveData, isPlayer: boolean): number {
    const level = attacker.level;
    const power = move.power;
    if (power === 0) return 0;

    const atkStages = isPlayer ? this.playerStatStages : this.enemyStatStages;
    const defStages = isPlayer ? this.enemyStatStages : this.playerStatStages;

    let atk: number, def: number;
    if (move.category === 'Physical') {
      atk = this.getEffectiveStat(attacker, 'atk', atkStages);
      def = this.getEffectiveStat(defender, 'def', defStages);
    } else {
      atk = this.getEffectiveStat(attacker, 'spAtk', atkStages);
      def = this.getEffectiveStat(defender, 'spDef', defStages);
    }

    const typeMultiplier = getTypeEffectiveness(move.type, defender.types);
    const stab = attacker.types.includes(move.type) ? 1.5 : 1;
    const random = 0.85 + Math.random() * 0.15;

    const baseDmg = ((2 * level / 5 + 2) * power * (atk / def) / 50 + 2);
    return Math.max(1, Math.floor(baseDmg * typeMultiplier * stab * random));
  }

  getEffectiveStat(pokemon: GamePokemon, stat: string, stages: Record<string, number>): number {
    const base = (pokemon.stats as Record<string, number>)[stat] || 10;
    const stage = stages[stat] || 0;
    const multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
    return Math.floor(base * multiplier);
  }

  animateHpBar(isEnemy: boolean, pokemon: GamePokemon) {
    const bar = isEnemy ? this.enemyHpBar : this.playerHpBar;
    const hpText = isEnemy ? this.enemyHpText : this.playerHpText;
    if (!bar) return;

    const panelX = isEnemy ? 72 : GAME_WIDTH - 268;
    const panelY = isEnemy ? 73 : 293;
    const hpBarH = 6;

    const startHp = isEnemy ? this.enemyDisplayHp : this.playerDisplayHp;
    const endHp = pokemon.currentHp;

    // Smooth HP tween over 800ms
    this.tweens.addCounter({
      from: startHp,
      to: endHp,
      duration: 800,
      ease: 'Linear',
      onUpdate: (tween) => {
        const currentDisplayHp = Math.round(tween.getValue() ?? endHp);
        this.updateHpBar(bar, panelX, panelY, 196, hpBarH, currentDisplayHp, pokemon.maxHp);
        if (!isEnemy) {
          hpText?.setText(`${Math.max(0, currentDisplayHp)}/${pokemon.maxHp}`);
        }
      },
      onComplete: () => {
        if (isEnemy) {
          this.enemyDisplayHp = endHp;
        } else {
          this.playerDisplayHp = endHp;
        }
      },
    });
  }

  // ─── Battle Results ───

  enemyFainted() {
    // Enemy faint animation
    this.tweens.add({
      targets: this.enemySprite,
      y: (this.enemySprite?.y || 150) + 50,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
    });

    // Calculate EXP
    const enemyData = POKEMON_DATA[this.enemyPokemon.id];
    const expGain = Math.floor((enemyData?.expYield || 50) * this.enemyPokemon.level / 7);

    this.playerPokemon.exp += expGain;

    const messages = [
      `${this.enemyPokemon.name} fainted!`,
      `${this.playerPokemon.name} gained ${expGain} EXP. Points!`,
    ];

    // Check level up
    while (this.playerPokemon.exp >= this.playerPokemon.expToNext) {
      this.playerPokemon.level++;
      this.playerPokemon.expToNext = expForLevel(this.playerPokemon.level + 1);

      // Recalculate stats
      const data = POKEMON_DATA[this.playerPokemon.id];
      if (data) {
        const oldMaxHp = this.playerPokemon.maxHp;
        this.playerPokemon.stats = {
          hp: calculateStat(data.baseStats.hp, this.playerPokemon.ivs.hp, this.playerPokemon.level, true),
          atk: calculateStat(data.baseStats.atk, this.playerPokemon.ivs.atk, this.playerPokemon.level, false),
          def: calculateStat(data.baseStats.def, this.playerPokemon.ivs.def, this.playerPokemon.level, false),
          spAtk: calculateStat(data.baseStats.spAtk, this.playerPokemon.ivs.spAtk, this.playerPokemon.level, false),
          spDef: calculateStat(data.baseStats.spDef, this.playerPokemon.ivs.spDef, this.playerPokemon.level, false),
          speed: calculateStat(data.baseStats.speed, this.playerPokemon.ivs.speed, this.playerPokemon.level, false),
        };
        this.playerPokemon.maxHp = this.playerPokemon.stats.hp;
        this.playerPokemon.currentHp += (this.playerPokemon.maxHp - oldMaxHp);

        messages.push(`${this.playerPokemon.name} grew to level ${this.playerPokemon.level}!`);

        // Check for new moves
        const newMoves = data.levelUpMoves.filter(m => m.level === this.playerPokemon.level);
        for (const newMove of newMoves) {
          if (this.playerPokemon.moves.length < 4) {
            const moveData = MOVE_DATA[newMove.move];
            this.playerPokemon.moves.push({ name: newMove.move, pp: moveData?.pp || 20, maxPp: moveData?.pp || 20 });
            messages.push(`${this.playerPokemon.name} learned ${newMove.move}!`);
          }
        }

        // Check for evolution
        if (data.evolutionLevel && this.playerPokemon.level >= data.evolutionLevel && data.evolvesTo) {
          const evoData = POKEMON_DATA[data.evolvesTo];
          if (evoData) {
            const oldName = this.playerPokemon.name;
            this.playerPokemon.id = evoData.id;
            this.playerPokemon.name = evoData.name;
            this.playerPokemon.types = [...evoData.types];
            messages.push(`What? ${oldName} is evolving!`);
            messages.push(`Congratulations! Your ${oldName} evolved into ${evoData.name}!`);

            // Update pokedex
            if (!this.returnData.pokedexSeen.includes(evoData.id)) {
              this.returnData.pokedexSeen.push(evoData.id);
            }
            if (!this.returnData.pokedexCaught.includes(evoData.id)) {
              this.returnData.pokedexCaught.push(evoData.id);
            }
          }
        }
      }
    }

    this.phase = 'ended';
    this.showMessages(messages, () => {
      this.endBattle();
    });
  }

  playerFainted() {
    // Player faint animation
    this.tweens.add({
      targets: this.playerSprite,
      y: (this.playerSprite?.y || 340) + 50,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
    });

    // Check for other party members
    const nextAlive = this.party.findIndex((p, i) => i !== this.activePartyIndex && p.currentHp > 0);

    if (nextAlive !== -1) {
      this.showMessages([
        `${this.playerPokemon.name} fainted!`,
      ], () => {
        this.switchPokemon(nextAlive);
      });
    } else {
      this.phase = 'ended';
      this.showMessages([
        `${this.playerPokemon.name} fainted!`,
        'You have no more POKéMON that can fight!',
        'You blacked out!',
      ], () => {
        // Heal party and return to last Pokémon Center
        this.party.forEach(p => {
          p.currentHp = p.maxHp;
          p.status = undefined;
          p.moves.forEach(m => { m.pp = m.maxPp; });
        });
        this.returnData.currentMap = 'palletTown';
        this.returnData.playerX = 9;
        this.returnData.playerY = 8;
        this.endBattle();
      });
    }
  }

  switchPokemon(index: number) {
    this.activePartyIndex = index;
    this.playerPokemon = this.party[index];

    // Reset player stat stages
    this.playerStatStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, speed: 0 };

    this.hideMenuPanels();

    this.showMessages([`Go! ${this.playerPokemon.name}!`], () => {
      // Update sprite
      this.playerSprite?.setTexture(`pokemon-back-${this.playerPokemon.id}`);
      this.playerSprite?.setAlpha(1);
      this.playerSprite?.setY(340);

      // Redraw the entire scene cleanly
      this.scene.restart({
        wildPokemon: this.enemyPokemon,
        party: this.party,
        items: this.items,
        returnData: this.returnData,
      } as BattleData);
    });
  }

  attemptRun() {
    this.phase = 'animating';
    this.hideMenuPanels();

    const playerSpeed = this.getEffectiveStat(this.playerPokemon, 'speed', this.playerStatStages);
    const enemySpeed = this.getEffectiveStat(this.enemyPokemon, 'speed', this.enemyStatStages);
    const escapeChance = (playerSpeed * 128 / enemySpeed + 30) / 256;

    if (Math.random() < Math.min(1, escapeChance)) {
      this.showMessages(['Got away safely!'], () => {
        this.endBattle();
      });
    } else {
      this.showMessages(["Can't escape!"], () => {
        // Enemy gets a free attack
        const enemyMoves = this.enemyPokemon.moves.filter(m => m.pp > 0);
        if (enemyMoves.length > 0) {
          const move = enemyMoves[Math.floor(Math.random() * enemyMoves.length)];
          const moveData = MOVE_DATA[move.name];
          if (moveData) {
            const msgs: string[] = [];
            this.queueAttack(msgs, [], this.enemyPokemon, this.playerPokemon, moveData, false);
            this.showMessages(msgs, () => {
              if (this.playerPokemon.currentHp <= 0) {
                this.playerFainted();
              } else {
                this.showActionMenu();
              }
            });
          } else {
            this.showActionMenu();
          }
        } else {
          this.showActionMenu();
        }
      });
    }
  }

  useItem(item: { id: string; count: number }) {
    const data = ITEM_DATA[item.id];
    if (!data) return;
    this.hideMenuPanels();
    this.phase = 'animating';

    if (data.effect?.type === 'heal') {
      const healAmount = data.effect.value || 20;
      const oldHp = this.playerPokemon.currentHp;
      this.playerPokemon.currentHp = Math.min(this.playerPokemon.maxHp, this.playerPokemon.currentHp + healAmount);
      const healed = this.playerPokemon.currentHp - oldHp;
      item.count--;

      this.animateHpBar(false, this.playerPokemon);

      this.showMessages([
        `Used ${data.name}!`,
        `${this.playerPokemon.name} recovered ${healed} HP!`,
      ], () => {
        // Enemy gets a free attack after item use
        this.enemyTurnAfterItem();
      });
    } else if (data.effect?.type === 'catch') {
      item.count--;
      const catchRate = POKEMON_DATA[this.enemyPokemon.id]?.catchRate || 45;
      const hpFactor = (3 * this.enemyPokemon.maxHp - 2 * this.enemyPokemon.currentHp) / (3 * this.enemyPokemon.maxHp);
      const chance = (catchRate * hpFactor * (data.effect.value || 1)) / 255;

      this.showMessages([`You threw a ${data.name}!`], () => {
        if (Math.random() < chance) {
          // Caught!
          if (!this.returnData.pokedexCaught.includes(this.enemyPokemon.id)) {
            this.returnData.pokedexCaught.push(this.enemyPokemon.id);
          }

          if (this.party.length < 6) {
            this.party.push(this.enemyPokemon);
          }

          this.phase = 'ended';
          this.showMessages([
            `Gotcha! ${this.enemyPokemon.name} was caught!`,
          ], () => {
            this.endBattle();
          });
        } else {
          this.showMessages([
            'Oh no! The POKéMON broke free!',
          ], () => {
            this.enemyTurnAfterItem();
          });
        }
      });
    } else {
      this.showActionMenu();
    }
  }

  enemyTurnAfterItem() {
    const enemyMoves = this.enemyPokemon.moves.filter(m => m.pp > 0);
    if (enemyMoves.length > 0) {
      const move = enemyMoves[Math.floor(Math.random() * enemyMoves.length)];
      const moveData = MOVE_DATA[move.name];
      if (moveData) {
        move.pp--;
        const msgs: string[] = [];
        this.queueAttack(msgs, [], this.enemyPokemon, this.playerPokemon, moveData, false);
        this.showMessages(msgs, () => {
          if (this.playerPokemon.currentHp <= 0) {
            this.playerFainted();
          } else {
            this.showActionMenu();
          }
        });
        return;
      }
    }
    this.showActionMenu();
  }

  endBattle() {
    // Save before returning
    const saveData: SaveData = {
      playerName: 'RED',
      party: this.party,
      pc: [],
      items: this.items,
      money: this.returnData.money,
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
        loadSave: false,
        fromMap: this.returnData.currentMap,
        fromX: this.returnData.playerX,
        fromY: this.returnData.playerY,
        newGame: false,
      });
    });
  }
}
