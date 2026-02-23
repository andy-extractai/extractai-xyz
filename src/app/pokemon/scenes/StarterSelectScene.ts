import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS, FADE_DURATION, TEXT_SPEED, TYPE_COLORS } from '../constants';
import { createPokemon, GamePokemon, POKEMON_DATA } from '../data/pokemon';

interface StarterOption {
  id: number;
  name: string;
  type: string;
  ballX: number;
}

const STARTERS: StarterOption[] = [
  { id: 1, name: 'BULBASAUR', type: 'Grass', ballX: 200 },
  { id: 4, name: 'CHARMANDER', type: 'Fire', ballX: 400 },
  { id: 7, name: 'SQUIRTLE', type: 'Water', ballX: 600 },
];

type Phase = 'intro' | 'walking' | 'choosing' | 'selected' | 'confirming' | 'done';

export class StarterSelectScene extends Phaser.Scene {
  private phase: Phase = 'intro';
  private dialogText?: Phaser.GameObjects.Text;
  private dialogBox?: Phaser.GameObjects.Graphics;
  private currentDialog: string[] = [];
  private dialogIndex = 0;
  private isTyping = false;
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private fullText = '';

  private selectedStarter = 1; // index into STARTERS
  private cursorIndex = 1;
  private ballSprites: Phaser.GameObjects.Image[] = [];
  private pokemonPreview?: Phaser.GameObjects.Image;
  private nameText?: Phaser.GameObjects.Text;
  private typeText?: Phaser.GameObjects.Text;
  private selectorArrow?: Phaser.GameObjects.Text;
  private infoPanel?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'StarterSelectScene' });
  }

  create() {
    this.phase = 'intro';
    this.dialogIndex = 0;
    this.ballSprites = [];

    this.cameras.main.fadeIn(FADE_DURATION, 0, 0, 0);

    // Lab background — wooden floor
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xf0e8d0);

    // Wooden floor pattern
    for (let x = 0; x < GAME_WIDTH; x += 32) {
      for (let y = GAME_HEIGHT - 200; y < GAME_HEIGHT; y += 32) {
        const shade = (x + y) % 64 === 0 ? 0xe0d8c0 : 0xf0e8d0;
        this.add.rectangle(x + 16, y + 16, 30, 30, shade);
        // Wood grain
        if ((x + y) % 96 === 0) {
          const grain = this.add.graphics();
          grain.lineStyle(1, 0xd8d0b8, 0.5);
          grain.lineBetween(x + 4, y + 8, x + 28, y + 8);
          grain.lineBetween(x + 4, y + 20, x + 28, y + 20);
        }
      }
    }

    // Lab walls
    this.add.rectangle(GAME_WIDTH / 2, 60, GAME_WIDTH, 120, 0xd0c8b0);
    this.add.rectangle(GAME_WIDTH / 2, 120, GAME_WIDTH, 4, 0xa09880);

    // Bookshelves with visible books
    for (let i = 0; i < 3; i++) {
      // Shelf frame
      this.add.rectangle(80 + i * 100, 40, 80, 60, 0x8b6914);
      // Shelf planks
      this.add.rectangle(80 + i * 100, 30, 70, 14, 0xa07828);
      this.add.rectangle(80 + i * 100, 50, 70, 14, 0xa07828);
      // Books (colorful spines)
      const bookColors = [0xc03030, 0x3050c0, 0x30a030, 0xc0a030, 0x8030a0];
      for (let b = 0; b < 5; b++) {
        this.add.rectangle(55 + i * 100 + b * 10, 30, 8, 10, bookColors[b]);
        this.add.rectangle(55 + i * 100 + b * 10, 50, 8, 10, bookColors[(b + 2) % 5]);
      }
    }

    // Table with Pokéballs — pedestals
    const tableY = 280;
    // Main table surface
    this.add.rectangle(GAME_WIDTH / 2, tableY, 500, 40, 0xc09060);
    this.add.rectangle(GAME_WIDTH / 2, tableY - 5, 490, 30, 0xd0a070);
    this.add.rectangle(GAME_WIDTH / 2, tableY + 15, 500, 10, 0xa07848);

    // Pedestal for each ball
    STARTERS.forEach((starter) => {
      // Small raised pedestal
      const ped = this.add.graphics();
      ped.fillStyle(0xe0d0b0, 1);
      ped.fillRoundedRect(starter.ballX - 20, tableY - 28, 40, 8, 2);
      ped.fillStyle(0xd0c0a0, 1);
      ped.fillRoundedRect(starter.ballX - 18, tableY - 26, 36, 4, 1);
    });

    // Place Pokéballs on table
    STARTERS.forEach((starter) => {
      // Ball shadow
      this.add.ellipse(starter.ballX, tableY - 18, 36, 10, 0x000000, 0.15);

      const ball = this.add.image(starter.ballX, tableY - 32, 'pokeball');
      ball.setScale(1.5);
      this.ballSprites.push(ball);
    });

    // Prof Oak sprite (large) — positioned behind table
    const oakSprite = this.add.image(GAME_WIDTH / 2, 200, 'oak-sprite');
    oakSprite.setScale(4);

    // Dialog box — OAK style at top
    this.createDialogBox();

    // Start intro dialog
    this.currentDialog = [
      'Welcome to the world of POKéMON!',
      'My name is OAK!',
      'People call me the POKéMON PROF!',
      'This world is inhabited by\ncreatures called POKéMON!',
      'For some people, POKéMON are\npets. Others use them for\nfights.',
      'Now, choose your very own\nPOKéMON partner!',
    ];

    this.showDialog(this.currentDialog[0]);

    // Input
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      this.handleInput(event);
    });
  }

  createDialogBox() {
    const boxH = 90;
    const boxY = GAME_HEIGHT - boxH - 10;

    this.dialogBox = this.add.graphics();
    // Authentic dialog box: off-white bg, dark border, inner inset
    this.dialogBox.fillStyle(COLORS.DIALOG_BG, 1);
    this.dialogBox.fillRoundedRect(20, boxY, GAME_WIDTH - 40, boxH, 4);
    this.dialogBox.lineStyle(3, COLORS.DIALOG_BORDER, 1);
    this.dialogBox.strokeRoundedRect(20, boxY, GAME_WIDTH - 40, boxH, 4);
    this.dialogBox.lineStyle(2, 0xd8d8d8, 1);
    this.dialogBox.strokeRoundedRect(24, boxY + 4, GAME_WIDTH - 48, boxH - 8, 3);

    // "OAK" speaker label
    const labelBg = this.add.graphics();
    labelBg.fillStyle(COLORS.DIALOG_BG, 1);
    labelBg.fillRoundedRect(30, boxY - 12, 50, 16, 3);
    labelBg.lineStyle(2, COLORS.DIALOG_BORDER, 1);
    labelBg.strokeRoundedRect(30, boxY - 12, 50, 16, 3);

    this.add.text(55, boxY - 4, 'OAK', {
      fontFamily: FONT_FAMILY,
      fontSize: '8px',
      color: '#181818',
    }).setOrigin(0.5);

    this.dialogText = this.add.text(40, boxY + 18, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#181818',
      wordWrap: { width: GAME_WIDTH - 80 },
      lineSpacing: 8,
    });
  }

  showDialog(text: string) {
    this.isTyping = true;
    this.fullText = text;
    if (this.dialogText) this.dialogText.setText('');

    let charIndex = 0;
    this.typewriterTimer = this.time.addEvent({
      delay: TEXT_SPEED,
      repeat: text.length - 1,
      callback: () => {
        if (this.dialogText) {
          charIndex++;
          this.dialogText.setText(text.substring(0, charIndex));
        }
        if (charIndex >= text.length) {
          this.isTyping = false;
        }
      },
    });
  }

  skipTypewriter() {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }
    if (this.dialogText) {
      this.dialogText.setText(this.fullText);
    }
    this.isTyping = false;
  }

  handleInput(event: KeyboardEvent) {
    if (this.phase === 'done') return;

    if (event.code === 'Space' || event.code === 'Enter') {
      if (this.isTyping) {
        this.skipTypewriter();
        return;
      }

      if (this.phase === 'intro') {
        this.dialogIndex++;
        if (this.dialogIndex < this.currentDialog.length) {
          this.showDialog(this.currentDialog[this.dialogIndex]);
        } else {
          this.phase = 'choosing';
          this.showChoosingUI();
        }
      } else if (this.phase === 'choosing') {
        this.phase = 'selected';
        this.showSelectedDialog();
      } else if (this.phase === 'confirming') {
        this.dialogIndex++;
        if (this.dialogIndex < this.currentDialog.length) {
          this.showDialog(this.currentDialog[this.dialogIndex]);
        } else {
          this.phase = 'done';
          this.startGame();
        }
      } else if (this.phase === 'selected') {
        if (this.isTyping) return;
        this.phase = 'confirming';
        this.dialogIndex = 0;
        this.currentDialog = [
          `So, you want ${STARTERS[this.cursorIndex].name}?`,
          `${STARTERS[this.cursorIndex].name} is your new\npartner!`,
          'Take good care of it!',
        ];
        this.showDialog(this.currentDialog[0]);
      }
    } else if (this.phase === 'choosing') {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        this.cursorIndex = Math.max(0, this.cursorIndex - 1);
        this.updateSelection();
      } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        this.cursorIndex = Math.min(STARTERS.length - 1, this.cursorIndex + 1);
        this.updateSelection();
      }
    }
  }

  showChoosingUI() {
    this.showDialog('Choose a POKéMON!');

    // Show selector arrow above balls
    this.selectorArrow = this.add.text(STARTERS[this.cursorIndex].ballX, 230, '▼', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#d03030',
    }).setOrigin(0.5);

    // Bounce animation
    this.tweens.add({
      targets: this.selectorArrow,
      y: 225,
      duration: 500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Show Pokemon preview
    this.showPreview();
  }

  showPreview() {
    const starter = STARTERS[this.cursorIndex];

    // Remove old preview
    if (this.pokemonPreview) this.pokemonPreview.destroy();
    if (this.infoPanel) this.infoPanel.destroy();

    // Show Pokemon sprite — pop up from ball position
    this.pokemonPreview = this.add.image(starter.ballX, 370, `pokemon-front-${starter.id}`);
    this.pokemonPreview.setScale(2.5);
    this.pokemonPreview.setAlpha(0);

    this.tweens.add({
      targets: this.pokemonPreview,
      alpha: 1,
      y: 360,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Info panel below preview — clean bordered box
    this.infoPanel = this.add.container(0, 0);

    const panelX = starter.ballX - 70;
    const panelY = 410;
    const panelW = 140;
    const panelH = 50;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.DIALOG_BG, 1);
    panelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 4);
    panelBg.lineStyle(2, COLORS.DIALOG_BORDER, 1);
    panelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 4);
    this.infoPanel.add(panelBg);

    // Name
    const nameT = this.add.text(starter.ballX, panelY + 12, starter.name, {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: '#181818',
    }).setOrigin(0.5);
    this.infoPanel.add(nameT);

    // Type badge — colored pill
    const typeColor = TYPE_COLORS[starter.type] || COLORS.NORMAL;
    const typeBadge = this.add.graphics();
    typeBadge.fillStyle(typeColor, 1);
    typeBadge.fillRoundedRect(starter.ballX - 30, panelY + 28, 60, 14, 4);
    this.infoPanel.add(typeBadge);

    const typeLabel = this.add.text(starter.ballX, panelY + 35, starter.type.toUpperCase(), {
      fontFamily: FONT_FAMILY,
      fontSize: '8px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.infoPanel.add(typeLabel);
  }

  updateSelection() {
    const starter = STARTERS[this.cursorIndex];

    // Move arrow
    if (this.selectorArrow) {
      this.tweens.killTweensOf(this.selectorArrow);
      this.selectorArrow.setX(starter.ballX);
      this.selectorArrow.setY(230);
      this.tweens.add({
        targets: this.selectorArrow,
        y: 225,
        duration: 500,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }

    // Pulse selected ball
    this.ballSprites.forEach((ball, i) => {
      this.tweens.killTweensOf(ball);
      ball.setScale(i === this.cursorIndex ? 1.8 : 1.5);
    });

    this.showPreview();
  }

  showSelectedDialog() {
    const starter = STARTERS[this.cursorIndex];
    this.showDialog(`You chose ${starter.name}!`);

    // Ball open animation — pop and fade
    const ball = this.ballSprites[this.cursorIndex];
    this.tweens.add({
      targets: ball,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
    });

    // Flash effect when ball opens
    this.cameras.main.flash(200, 255, 255, 255);

    // Pokemon sprite rises from ball position
    if (this.pokemonPreview) {
      this.tweens.add({
        targets: this.pokemonPreview,
        scaleX: 3,
        scaleY: 3,
        y: 340,
        duration: 500,
        ease: 'Back.easeOut',
      });
    }
  }

  startGame() {
    const starter = STARTERS[this.cursorIndex];
    const pokemon = createPokemon(starter.id, 5);

    this.cameras.main.fadeOut(FADE_DURATION, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('OverworldScene', {
        loadSave: false,
        newGame: true,
        starterPokemon: pokemon,
      });
    });
  }
}
