import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS, FADE_DURATION } from '../constants';
import { hasSaveData } from '../utils/save';

export class TitleScene extends Phaser.Scene {
  private blinkTimer?: Phaser.Time.TimerEvent;
  private menuActive = false;
  private menuIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private cursor?: Phaser.GameObjects.Text;
  private hasSave = false;
  private menuContainer?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    this.menuActive = false;
    this.menuIndex = 0;
    this.menuItems = [];
    this.hasSave = hasSaveData();

    this.cameras.main.setBackgroundColor(COLORS.BLACK);

    // Dark navy background
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.TITLE_BG);
    bg.setAlpha(0);

    this.tweens.add({
      targets: bg,
      alpha: 1,
      duration: 1000,
      ease: 'Power2',
    });

    // Animated Charizard silhouette
    const charizard = this.add.graphics();
    charizard.setAlpha(0);
    // Body
    charizard.fillStyle(0x2a2a4e, 1);
    charizard.fillCircle(GAME_WIDTH / 2, 220, 60);
    // Head
    charizard.fillCircle(GAME_WIDTH / 2 + 40, 165, 25);
    // Snout
    charizard.fillTriangle(
      GAME_WIDTH / 2 + 55, 160,
      GAME_WIDTH / 2 + 72, 155,
      GAME_WIDTH / 2 + 58, 172
    );
    // Wing left
    charizard.fillTriangle(
      GAME_WIDTH / 2 - 30, 200,
      GAME_WIDTH / 2 - 100, 140,
      GAME_WIDTH / 2 - 20, 170
    );
    // Wing right
    charizard.fillTriangle(
      GAME_WIDTH / 2 + 20, 200,
      GAME_WIDTH / 2 + 110, 150,
      GAME_WIDTH / 2 + 30, 170
    );
    // Tail
    charizard.fillTriangle(
      GAME_WIDTH / 2 - 50, 240,
      GAME_WIDTH / 2 - 90, 280,
      GAME_WIDTH / 2 - 40, 260
    );
    // Tail flame
    charizard.fillStyle(0xf08030, 0.7);
    charizard.fillCircle(GAME_WIDTH / 2 - 95, 278, 12);
    charizard.fillStyle(0xf8d020, 0.5);
    charizard.fillCircle(GAME_WIDTH / 2 - 95, 274, 7);
    charizard.fillStyle(0xf8f880, 0.3);
    charizard.fillCircle(GAME_WIDTH / 2 - 94, 272, 4);

    this.tweens.add({
      targets: charizard,
      alpha: 0.5,
      duration: 2000,
      ease: 'Power2',
      delay: 500,
    });

    // Gentle floating animation
    this.tweens.add({
      targets: charizard,
      y: -8,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: 1500,
    });

    // "POKéMON" title — shadow layer
    const titleShadow = this.add.text(GAME_WIDTH / 2 + 3, 83, 'POKéMON', {
      fontFamily: FONT_FAMILY,
      fontSize: '42px',
      color: '#000000',
    }).setOrigin(0.5).setAlpha(0);

    // "POKéMON" title — main text with blue outline
    const titleText = this.add.text(GAME_WIDTH / 2, 80, 'POKéMON', {
      fontFamily: FONT_FAMILY,
      fontSize: '42px',
      color: '#ffcb05',
      stroke: '#3b4cca',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);

    // "FIRE RED VERSION" subtitle in white
    const subtitle = this.add.text(GAME_WIDTH / 2, 130, 'FIRE RED VERSION', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0);

    // Animate title in
    this.tweens.add({
      targets: [titleText, titleShadow],
      alpha: 1,
      duration: 1200,
      ease: 'Power2',
      delay: 300,
    });

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 1000,
      ease: 'Power2',
      delay: 800,
    });

    // Shimmer/pulse effect on the logo
    this.tweens.add({
      targets: titleText,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: 2000,
    });

    // Subtle glow pulse on shadow
    this.tweens.add({
      targets: titleShadow,
      alpha: { from: 0.8, to: 1 },
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: 2000,
    });

    // "PRESS START" blinking at ~1Hz
    const pressStart = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, 'PRESS START', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0);

    this.time.delayedCall(1500, () => {
      pressStart.setAlpha(1);
      this.blinkTimer = this.time.addEvent({
        delay: 500, // ~1Hz (on 500ms, off 500ms)
        loop: true,
        callback: () => {
          pressStart.setVisible(!pressStart.visible);
        },
      });
    });

    // Input handling
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (!this.menuActive) {
        if (event.code === 'Space' || event.code === 'Enter') {
          this.showMenu(pressStart);
        }
      } else {
        this.handleMenuInput(event);
      }
    });
  }

  showMenu(pressStart: Phaser.GameObjects.Text) {
    this.menuActive = true;
    pressStart.setVisible(false);
    if (this.blinkTimer) this.blinkTimer.destroy();

    // Authentic Pokémon menu box — white bg, black border, cursor arrow
    this.menuContainer = this.add.container(0, 0);

    const menuX = GAME_WIDTH / 2 - 120;
    const menuY = GAME_HEIGHT - 180;
    const menuW = 240;

    const items: string[] = [];
    if (this.hasSave) items.push('CONTINUE');
    items.push('NEW GAME');

    const menuH = 30 + items.length * 36;

    const menuBg = this.add.graphics();
    // White background
    menuBg.fillStyle(0xf8f8f8, 1);
    menuBg.fillRoundedRect(menuX, menuY, menuW, menuH, 4);
    // Black border
    menuBg.lineStyle(3, COLORS.DIALOG_BORDER, 1);
    menuBg.strokeRoundedRect(menuX, menuY, menuW, menuH, 4);
    // Inner inset
    menuBg.lineStyle(2, 0xd8d8d8, 1);
    menuBg.strokeRoundedRect(menuX + 4, menuY + 4, menuW - 8, menuH - 8, 3);
    this.menuContainer.add(menuBg);

    const startY = menuY + 18;

    items.forEach((item, i) => {
      const text = this.add.text(GAME_WIDTH / 2 - 50, startY + i * 36, item, {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        color: '#181818',
      });
      this.menuItems.push(text);
      this.menuContainer!.add(text);
    });

    // Cursor arrow (▶)
    this.cursor = this.add.text(GAME_WIDTH / 2 - 75, startY, '▶', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#181818',
    });
    this.menuContainer.add(this.cursor);

    this.menuIndex = 0;
  }

  handleMenuInput(event: KeyboardEvent) {
    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      this.menuIndex = Math.max(0, this.menuIndex - 1);
      this.updateCursor();
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      this.menuIndex = Math.min(this.menuItems.length - 1, this.menuIndex + 1);
      this.updateCursor();
    } else if (event.code === 'Space' || event.code === 'Enter') {
      this.selectMenuItem();
    }
  }

  updateCursor() {
    if (this.cursor && this.menuItems[this.menuIndex]) {
      this.cursor.setY(this.menuItems[this.menuIndex].y);
    }
  }

  selectMenuItem() {
    const selectedText = this.menuItems[this.menuIndex]?.text;

    this.cameras.main.fadeOut(FADE_DURATION, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (selectedText === 'CONTINUE') {
        this.scene.start('OverworldScene', { loadSave: true });
      } else {
        this.scene.start('StarterSelectScene');
      }
    });
  }
}
