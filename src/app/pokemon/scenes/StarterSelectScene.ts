import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS, FADE_DURATION, TEXT_SPEED } from '../constants';
import { createPokemon, GamePokemon, POKEMON_DATA } from '../data/pokemon';

interface StarterOption {
  id: number;
  name: string;
  type: string;
  ballX: number;
}

const STARTERS: StarterOption[] = [
  { id: 1, name: 'BULBASAUR', type: 'GRASS', ballX: 200 },
  { id: 4, name: 'CHARMANDER', type: 'FIRE', ballX: 400 },
  { id: 7, name: 'SQUIRTLE', type: 'WATER', ballX: 600 },
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

  constructor() {
    super({ key: 'StarterSelectScene' });
  }

  create() {
    this.phase = 'intro';
    this.dialogIndex = 0;

    this.cameras.main.fadeIn(FADE_DURATION, 0, 0, 0);

    // Lab background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xf0e8d0);

    // Floor pattern
    for (let x = 0; x < GAME_WIDTH; x += 32) {
      for (let y = GAME_HEIGHT - 200; y < GAME_HEIGHT; y += 32) {
        this.add.rectangle(x + 16, y + 16, 30, 30, (x + y) % 64 === 0 ? 0xe8e0c8 : 0xf0e8d0);
      }
    }

    // Lab walls
    this.add.rectangle(GAME_WIDTH / 2, 60, GAME_WIDTH, 120, 0xd0c8b0);
    this.add.rectangle(GAME_WIDTH / 2, 120, GAME_WIDTH, 4, 0xa09880);

    // Bookshelves
    for (let i = 0; i < 3; i++) {
      this.add.rectangle(80 + i * 100, 40, 80, 60, 0x8b6914);
      this.add.rectangle(80 + i * 100, 30, 70, 15, 0xa07828);
      this.add.rectangle(80 + i * 100, 50, 70, 15, 0xa07828);
    }

    // Table with Pokéballs
    const tableY = 280;
    this.add.rectangle(GAME_WIDTH / 2, tableY, 500, 40, 0xc09060);
    this.add.rectangle(GAME_WIDTH / 2, tableY - 5, 490, 30, 0xd0a070);
    this.add.rectangle(GAME_WIDTH / 2, tableY + 15, 500, 10, 0xa07848);

    // Place Pokéballs on table
    STARTERS.forEach((starter, i) => {
      // Ball shadow
      this.add.ellipse(starter.ballX, tableY - 15, 36, 10, 0x000000, 0.2);

      const ball = this.add.image(starter.ballX, tableY - 28, 'pokeball');
      ball.setScale(1.5);
      this.ballSprites.push(ball);
    });

    // Prof Oak sprite (large)
    const oakSprite = this.add.image(GAME_WIDTH / 2, 200, 'oak-sprite');
    oakSprite.setScale(4);

    // Dialog box
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
    this.dialogBox.fillStyle(0xf8f8f8, 1);
    this.dialogBox.fillRoundedRect(20, boxY, GAME_WIDTH - 40, boxH, 4);
    this.dialogBox.lineStyle(3, 0x404040, 1);
    this.dialogBox.strokeRoundedRect(20, boxY, GAME_WIDTH - 40, boxH, 4);
    // Inner shadow effect
    this.dialogBox.lineStyle(1, 0xd0d0d0, 1);
    this.dialogBox.strokeRoundedRect(23, boxY + 3, GAME_WIDTH - 46, boxH - 6, 3);

    this.dialogText = this.add.text(40, boxY + 18, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#303030',
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
    if (this.nameText) this.nameText.destroy();
    if (this.typeText) this.typeText.destroy();

    // Show Pokemon sprite
    this.pokemonPreview = this.add.image(GAME_WIDTH / 2, 380, `pokemon-front-${starter.id}`);
    this.pokemonPreview.setScale(3);
    this.pokemonPreview.setAlpha(0);

    this.tweens.add({
      targets: this.pokemonPreview,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });

    // Name and type
    this.nameText = this.add.text(GAME_WIDTH / 2, 430, starter.name, {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#303030',
    }).setOrigin(0.5);

    this.typeText = this.add.text(GAME_WIDTH / 2, 455, `Type: ${starter.type}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#606060',
    }).setOrigin(0.5);
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

    // Ball open animation
    const ball = this.ballSprites[this.cursorIndex];
    this.tweens.add({
      targets: ball,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
    });
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
