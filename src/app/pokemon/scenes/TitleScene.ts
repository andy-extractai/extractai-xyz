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

  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    this.menuActive = false;
    this.menuIndex = 0;
    this.menuItems = [];
    this.hasSave = hasSaveData();

    this.cameras.main.setBackgroundColor(COLORS.BLACK);

    // Fade from black to dark blue
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.TITLE_BG);
    bg.setAlpha(0);

    this.tweens.add({
      targets: bg,
      alpha: 1,
      duration: 1000,
      ease: 'Power2',
    });

    // Animated Charizard silhouette using simple shapes
    const charizard = this.add.graphics();
    charizard.setAlpha(0);
    // Body
    charizard.fillStyle(0x1a1a3e, 1);
    charizard.fillCircle(GAME_WIDTH / 2, 220, 60);
    // Head
    charizard.fillCircle(GAME_WIDTH / 2 + 40, 165, 25);
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
    charizard.fillStyle(0xf08030, 0.6);
    charizard.fillCircle(GAME_WIDTH / 2 - 95, 278, 10);
    charizard.fillStyle(0xf8d020, 0.4);
    charizard.fillCircle(GAME_WIDTH / 2 - 95, 275, 6);

    this.tweens.add({
      targets: charizard,
      alpha: 0.5,
      duration: 2000,
      ease: 'Power2',
      delay: 500,
    });

    // Gentle floating animation for charizard
    this.tweens.add({
      targets: charizard,
      y: -8,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: 1500,
    });

    // "POKéMON" title text with outline effect
    const titleShadow = this.add.text(GAME_WIDTH / 2 + 2, 82, 'POKéMON', {
      fontFamily: FONT_FAMILY,
      fontSize: '42px',
      color: '#000000',
    }).setOrigin(0.5).setAlpha(0);

    const titleText = this.add.text(GAME_WIDTH / 2, 80, 'POKéMON', {
      fontFamily: FONT_FAMILY,
      fontSize: '42px',
      color: '#ffcb05',
      stroke: '#3b4cca',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);

    // Subtitle
    const subtitle = this.add.text(GAME_WIDTH / 2, 130, 'FIRE RED VERSION', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#e04040',
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

    // "PRESS START" blinking text
    const pressStart = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, 'PRESS START', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0);

    this.time.delayedCall(1500, () => {
      pressStart.setAlpha(1);
      this.blinkTimer = this.time.addEvent({
        delay: 600,
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

    // Menu background
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x000000, 0.7);
    menuBg.fillRoundedRect(GAME_WIDTH / 2 - 120, GAME_HEIGHT - 180, 240, 120, 4);
    menuBg.lineStyle(2, 0xffffff, 1);
    menuBg.strokeRoundedRect(GAME_WIDTH / 2 - 120, GAME_HEIGHT - 180, 240, 120, 4);

    const startY = GAME_HEIGHT - 155;
    const items: string[] = [];

    if (this.hasSave) {
      items.push('CONTINUE');
    }
    items.push('NEW GAME');

    items.forEach((item, i) => {
      const text = this.add.text(GAME_WIDTH / 2 - 60, startY + i * 40, item, {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        color: '#ffffff',
      });
      this.menuItems.push(text);
    });

    // Cursor
    this.cursor = this.add.text(GAME_WIDTH / 2 - 85, startY, '▶', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#ffffff',
    });

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
