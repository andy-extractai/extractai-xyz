import Phaser from 'phaser';
import {
  TILE_SIZE, GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS,
  PLAYER_SPEED, FADE_DURATION, TEXT_SPEED, ENCOUNTER_RATE,
} from '../constants';
import { MAPS, MapData, TILE } from '../data/maps';
import { ROUTE_ENCOUNTERS, createPokemon, GamePokemon } from '../data/pokemon';
import { SHOP_INVENTORY } from '../data/items';
import { saveGame, loadGame, SaveData } from '../utils/save';

const TILE_TEXTURES: Record<number, string> = {
  [TILE.GRASS]: 'tile-grass',
  [TILE.PATH]: 'tile-path',
  [TILE.TREE]: 'tile-tree',
  [TILE.BUILDING_WALL]: 'tile-wall',
  [TILE.BUILDING_ROOF]: 'tile-roof',
  [TILE.WATER]: 'tile-water',
  [TILE.TALL_GRASS]: 'tile-tallgrass',
  [TILE.DOOR]: 'tile-door',
  [TILE.SIGN]: 'tile-sign',
  [TILE.LEDGE]: 'tile-ledge',
  [TILE.FENCE]: 'tile-fence',
  [TILE.FLOWER]: 'tile-flower',
  [TILE.BUILDING_FLOOR]: 'tile-floor',
  [TILE.COUNTER]: 'tile-counter',
  [TILE.HEAL_MACHINE]: 'tile-heal',
  [TILE.PC_MACHINE]: 'tile-pc',
  [TILE.SHELF]: 'tile-shelf',
  [TILE.TABLE]: 'tile-table',
  [TILE.MAT]: 'tile-mat',
};

export class OverworldScene extends Phaser.Scene {
  // Player state
  private playerSprite?: Phaser.GameObjects.Image;
  private playerGridX = 9;
  private playerGridY = 8;
  private playerDirection: 'down' | 'up' | 'left' | 'right' = 'down';
  private isMoving = false;
  private walkFrame = 1;

  // Map state
  private currentMap: MapData = MAPS.palletTown;
  private tileSprites: Phaser.GameObjects.Image[] = [];
  private npcSprites: Phaser.GameObjects.Image[] = [];
  private mapContainer?: Phaser.GameObjects.Container;

  // Game state
  private party: GamePokemon[] = [];
  private items: { id: string; count: number }[] = [];
  private money = 3000;
  private badges: string[] = [];
  private visitedMaps: string[] = ['palletTown'];
  private pokedexSeen: number[] = [];
  private pokedexCaught: number[] = [];
  private defeatedTrainers: string[] = [];

  // UI state
  private dialogActive = false;
  private dialogText?: Phaser.GameObjects.Text;
  private dialogBox?: Phaser.GameObjects.Graphics;
  private dialogQueue: string[] = [];
  private isTyping = false;
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private fullText = '';
  private dialogCallback?: () => void;

  // Map name display
  private mapNameBg?: Phaser.GameObjects.Graphics;
  private mapNameText?: Phaser.GameObjects.Text;

  // Keys
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() {
    super({ key: 'OverworldScene' });
  }

  init(data: { loadSave?: boolean; newGame?: boolean; starterPokemon?: GamePokemon; fromMap?: string; fromX?: number; fromY?: number }) {
    if (data.loadSave) {
      const save = loadGame();
      if (save) {
        this.party = save.party;
        this.items = save.items;
        this.money = save.money;
        this.badges = save.badges;
        this.visitedMaps = save.visitedMaps;
        this.pokedexSeen = save.pokedexSeen;
        this.pokedexCaught = save.pokedexCaught;
        this.defeatedTrainers = save.defeatedTrainers || [];
        this.currentMap = MAPS[save.currentMap] || MAPS.palletTown;
        this.playerGridX = save.playerX;
        this.playerGridY = save.playerY;
        return;
      }
    }

    if (data.newGame && data.starterPokemon) {
      this.party = [data.starterPokemon];
      this.items = [
        { id: 'potion', count: 5 },
        { id: 'poke-ball', count: 5 },
      ];
      this.money = 3000;
      this.badges = [];
      this.visitedMaps = ['palletTown'];
      this.pokedexSeen = [data.starterPokemon.id];
      this.pokedexCaught = [data.starterPokemon.id];
      this.currentMap = MAPS.oaksLab;
      this.playerGridX = 4;
      this.playerGridY = 8;
    }

    if (data.fromMap) {
      // Returning from battle — load save data for party/items/etc
      const save = loadGame();
      if (save) {
        this.party = save.party;
        this.items = save.items;
        this.money = save.money;
        this.badges = save.badges;
        this.visitedMaps = save.visitedMaps;
        this.pokedexSeen = save.pokedexSeen;
        this.pokedexCaught = save.pokedexCaught;
        this.defeatedTrainers = save.defeatedTrainers || [];
      }
      this.currentMap = MAPS[data.fromMap] || MAPS.palletTown;
      this.playerGridX = data.fromX ?? 9;
      this.playerGridY = data.fromY ?? 8;
    }
  }

  create() {
    this.cameras.main.fadeIn(FADE_DURATION, 0, 0, 0);
    this.isMoving = false;
    this.dialogActive = false;

    // Set up input
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Space/Enter for interaction
    this.input.keyboard?.on('keydown-SPACE', () => this.handleInteract());
    this.input.keyboard?.on('keydown-ENTER', () => this.handleInteract());

    // Build the map
    this.buildMap();

    // Show map name briefly
    this.showMapName();

    // Auto-save
    this.doSave();
  }

  buildMap() {
    // Clear old map
    this.tileSprites.forEach(s => s.destroy());
    this.tileSprites = [];
    this.npcSprites.forEach(s => s.destroy());
    this.npcSprites = [];
    if (this.mapContainer) {
      this.mapContainer.destroy();
    }

    this.mapContainer = this.add.container(0, 0);

    const map = this.currentMap;

    // Render tiles
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tileType = map.tiles[y][x];
        const texKey = TILE_TEXTURES[tileType] || 'tile-grass';
        const sprite = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, texKey);
        this.mapContainer.add(sprite);
        this.tileSprites.push(sprite);
      }
    }

    // Render NPCs
    map.npcs.forEach(npc => {
      let texKey = 'npc-sprite';
      if (npc.name === 'Nurse Joy') texKey = 'nurse-sprite';
      if (npc.name === 'Prof. Oak') texKey = 'oak-sprite';

      const sprite = this.add.image(
        npc.x * TILE_SIZE + TILE_SIZE / 2,
        npc.y * TILE_SIZE + TILE_SIZE / 2,
        texKey
      );
      this.mapContainer!.add(sprite);
      this.npcSprites.push(sprite);
    });

    // Player sprite
    if (this.playerSprite) this.playerSprite.destroy();
    this.playerSprite = this.add.image(
      this.playerGridX * TILE_SIZE + TILE_SIZE / 2,
      this.playerGridY * TILE_SIZE + TILE_SIZE / 2,
      `player-${this.playerDirection}-1`
    );
    this.mapContainer.add(this.playerSprite);

    // Center camera on player
    this.updateCamera();
  }

  updateCamera() {
    if (!this.playerSprite || !this.mapContainer) return;

    const mapPixelW = this.currentMap.width * TILE_SIZE;
    const mapPixelH = this.currentMap.height * TILE_SIZE;

    const playerPixelX = this.playerGridX * TILE_SIZE + TILE_SIZE / 2;
    const playerPixelY = this.playerGridY * TILE_SIZE + TILE_SIZE / 2;

    let camX = playerPixelX - GAME_WIDTH / 2;
    let camY = playerPixelY - GAME_HEIGHT / 2;

    // Clamp camera
    camX = Math.max(0, Math.min(camX, mapPixelW - GAME_WIDTH));
    camY = Math.max(0, Math.min(camY, mapPixelH - GAME_HEIGHT));

    // If map is smaller than screen, center it
    if (mapPixelW < GAME_WIDTH) camX = -(GAME_WIDTH - mapPixelW) / 2;
    if (mapPixelH < GAME_HEIGHT) camY = -(GAME_HEIGHT - mapPixelH) / 2;

    this.mapContainer.setPosition(-camX, -camY);
  }

  showMapName() {
    const name = this.currentMap.name;

    // Background bar — authentic style
    this.mapNameBg = this.add.graphics();
    this.mapNameBg.fillStyle(0x000000, 0.8);
    this.mapNameBg.fillRoundedRect(GAME_WIDTH / 2 - 120, 20, 240, 36, 4);
    this.mapNameBg.lineStyle(2, 0xf8f8f8, 0.6);
    this.mapNameBg.strokeRoundedRect(GAME_WIDTH / 2 - 120, 20, 240, 36, 4);
    this.mapNameBg.setAlpha(0);
    this.mapNameBg.setDepth(100);

    this.mapNameText = this.add.text(GAME_WIDTH / 2, 38, name, {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0).setDepth(101);

    this.tweens.add({
      targets: [this.mapNameBg, this.mapNameText],
      alpha: 1,
      duration: 300,
      ease: 'Power2',
      yoyo: true,
      hold: 2000,
    });
  }

  update() {
    if (this.dialogActive || this.isMoving) return;

    // Check directional input
    let dx = 0, dy = 0;
    let newDir: 'down' | 'up' | 'left' | 'right' = this.playerDirection;

    if (this.cursors?.up.isDown || this.wasd?.W.isDown) {
      dy = -1; newDir = 'up';
    } else if (this.cursors?.down.isDown || this.wasd?.S.isDown) {
      dy = 1; newDir = 'down';
    } else if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
      dx = -1; newDir = 'left';
    } else if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
      dx = 1; newDir = 'right';
    }

    if (dx === 0 && dy === 0) return;

    this.playerDirection = newDir;

    const newX = this.playerGridX + dx;
    const newY = this.playerGridY + dy;

    // Check map connections (walking off edge)
    if (newX < 0 || newX >= this.currentMap.width || newY < 0 || newY >= this.currentMap.height) {
      const connection = this.currentMap.connections.find(c => {
        if (c.direction === 'north' && dy === -1 && newY < 0) {
          return this.playerGridX >= c.fromXMin && this.playerGridX <= c.fromXMax;
        }
        if (c.direction === 'south' && dy === 1 && newY >= this.currentMap.height) {
          return this.playerGridX >= c.fromXMin && this.playerGridX <= c.fromXMax;
        }
        if (c.direction === 'east' && dx === 1 && newX >= this.currentMap.width) {
          return true;
        }
        if (c.direction === 'west' && dx === -1 && newX < 0) {
          return true;
        }
        return false;
      });

      if (connection) {
        this.transitionToMap(connection.targetMap, connection.targetX, connection.targetY);
      }
      return;
    }

    // Check collision
    if (this.currentMap.collision[newY]?.[newX]) {
      // Update facing direction sprite
      this.playerSprite?.setTexture(`player-${this.playerDirection}-1`);
      return;
    }

    // Check NPC collision
    const npcCollision = this.currentMap.npcs.find(n => n.x === newX && n.y === newY);
    if (npcCollision) {
      this.playerSprite?.setTexture(`player-${this.playerDirection}-1`);
      return;
    }

    // Move player
    this.movePlayer(newX, newY);
  }

  movePlayer(newX: number, newY: number) {
    this.isMoving = true;

    // Toggle walk frame
    this.walkFrame = this.walkFrame === 1 ? 2 : 1;
    this.playerSprite?.setTexture(`player-${this.playerDirection}-${this.walkFrame}`);

    const targetPixelX = newX * TILE_SIZE + TILE_SIZE / 2;
    const targetPixelY = newY * TILE_SIZE + TILE_SIZE / 2;

    this.tweens.add({
      targets: this.playerSprite,
      x: targetPixelX,
      y: targetPixelY,
      duration: PLAYER_SPEED,
      ease: 'Linear',
      onUpdate: () => {
        this.updateCamera();
      },
      onComplete: () => {
        this.playerGridX = newX;
        this.playerGridY = newY;
        this.isMoving = false;
        this.updateCamera();
        this.checkTileEvents(newX, newY);
      },
    });
  }

  checkTileEvents(x: number, y: number) {
    const tile = this.currentMap.tiles[y]?.[x];

    // Tall grass encounter
    if (tile === TILE.TALL_GRASS && this.currentMap.encounterZone) {
      if (Math.random() < ENCOUNTER_RATE) {
        this.triggerWildEncounter();
        return;
      }
    }

    // Door
    const door = this.currentMap.doors.find(d => d.x === x && d.y === y);
    if (door) {
      this.transitionToMap(door.targetMap, door.targetX, door.targetY);
      return;
    }

    // Mat (exit indoor maps)
    if (tile === TILE.MAT) {
      const matDoor = this.currentMap.doors.find(d => d.x === x && d.y === y);
      if (matDoor) {
        this.transitionToMap(matDoor.targetMap, matDoor.targetX, matDoor.targetY);
      }
    }
  }

  handleInteract() {
    // If dialog is active, advance it
    if (this.dialogActive) {
      if (this.isTyping) {
        this.skipTypewriter();
        return;
      }
      if (this.dialogQueue.length > 0) {
        this.showNextDialog();
      } else {
        this.hideDialog();
        if (this.dialogCallback) {
          const cb = this.dialogCallback;
          this.dialogCallback = undefined;
          cb();
        }
      }
      return;
    }

    // Check what's in front of player
    let checkX = this.playerGridX;
    let checkY = this.playerGridY;
    if (this.playerDirection === 'up') checkY--;
    if (this.playerDirection === 'down') checkY++;
    if (this.playerDirection === 'left') checkX--;
    if (this.playerDirection === 'right') checkX++;

    // Check for NPC
    const npc = this.currentMap.npcs.find(n => n.x === checkX && n.y === checkY);
    if (npc) {
      // Check if Nurse Joy for healing
      if (npc.name === 'Nurse Joy') {
        this.showDialogSequence(npc.dialog, () => {
          this.healParty();
        });
        return;
      }
      // Check if Clerk for shopping
      if (npc.name === 'Clerk') {
        this.doSave();
        this.scene.start('ShopScene', {
          shopItems: SHOP_INVENTORY.viridian,
          money: this.money,
          items: this.items,
          returnData: {
            currentMap: this.currentMap.id,
            playerX: this.playerGridX,
            playerY: this.playerGridY,
            party: this.party,
            badges: this.badges,
            visitedMaps: this.visitedMaps,
            pokedexSeen: this.pokedexSeen,
            pokedexCaught: this.pokedexCaught,
          },
        });
        return;
      }
      // Check if this is a trainer NPC
      if (npc.team && npc.team.length > 0) {
        const trainerKey = `${this.currentMap.id}_${npc.x}_${npc.y}`;
        if (this.defeatedTrainers.includes(trainerKey)) {
          // Already defeated — show defeated dialog
          this.showDialogSequence(npc.defeatedDialog || ['...']);
          return;
        }
        // Start trainer battle after dialog
        this.showDialogSequence(npc.dialog, () => {
          const team = npc.team!.map(t => createPokemon(t.id, t.level));
          const firstPokemon = team.shift()!;
          // Add to pokedex seen
          for (const p of [firstPokemon, ...team]) {
            if (!this.pokedexSeen.includes(p.id)) {
              this.pokedexSeen.push(p.id);
            }
          }
          this.doSave();
          this.cameras.main.fadeOut(FADE_DURATION, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('BattleScene', {
              wildPokemon: firstPokemon,
              party: this.party,
              items: this.items,
              returnData: {
                currentMap: this.currentMap.id,
                playerX: this.playerGridX,
                playerY: this.playerGridY,
                money: this.money,
                badges: this.badges,
                visitedMaps: this.visitedMaps,
                pokedexSeen: this.pokedexSeen,
                pokedexCaught: this.pokedexCaught,
                defeatedTrainers: this.defeatedTrainers,
              },
              trainerName: npc.name,
              trainerTeam: team,
              trainerKey,
            });
          });
        });
        return;
      }

      this.showDialogSequence(npc.dialog);
      return;
    }

    // Check for sign
    const sign = this.currentMap.signs.find(s => s.x === checkX && s.y === checkY);
    if (sign) {
      this.showDialogSequence([sign.text]);
      return;
    }

    // Check for door interaction (facing a door)
    const tile = this.currentMap.tiles[checkY]?.[checkX];
    if (tile === TILE.DOOR) {
      // Gym door special case (locked, no door entry in map data)
      if (this.currentMap.id === 'viridianCity' && checkX === 12 && checkY === 4) {
        this.showDialogSequence(["The door is locked..."]);
        return;
      }
      const door = this.currentMap.doors.find(d => d.x === checkX && d.y === checkY);
      if (door) {
        this.transitionToMap(door.targetMap, door.targetX, door.targetY);
      }
    }
  }

  showDialogSequence(texts: string[], callback?: () => void) {
    this.dialogActive = true;
    this.dialogQueue = [...texts];
    this.dialogCallback = callback;
    this.showNextDialog();
  }

  showNextDialog() {
    const text = this.dialogQueue.shift();
    if (!text) return;

    // Create dialog box if needed
    if (!this.dialogBox || !this.dialogText) {
      this.createDialogBox();
    }

    this.dialogBox!.setVisible(true);
    this.dialogText!.setVisible(true);

    // Typewriter effect
    this.isTyping = true;
    this.fullText = text;
    this.dialogText!.setText('');

    let charIndex = 0;
    this.typewriterTimer = this.time.addEvent({
      delay: TEXT_SPEED,
      repeat: text.length - 1,
      callback: () => {
        charIndex++;
        this.dialogText?.setText(text.substring(0, charIndex));
        if (charIndex >= text.length) {
          this.isTyping = false;
        }
      },
    });
  }

  createDialogBox() {
    const boxH = 80;
    const boxY = GAME_HEIGHT - boxH - 10;

    this.dialogBox = this.add.graphics();
    this.dialogBox.setDepth(200);
    // Authentic dialog box: off-white bg, dark border, inner inset
    this.dialogBox.fillStyle(COLORS.DIALOG_BG, 1);
    this.dialogBox.fillRoundedRect(20, boxY, GAME_WIDTH - 40, boxH, 4);
    this.dialogBox.lineStyle(3, COLORS.DIALOG_BORDER, 1);
    this.dialogBox.strokeRoundedRect(20, boxY, GAME_WIDTH - 40, boxH, 4);
    this.dialogBox.lineStyle(2, 0xd8d8d8, 1);
    this.dialogBox.strokeRoundedRect(24, boxY + 4, GAME_WIDTH - 48, boxH - 8, 3);

    this.dialogText = this.add.text(40, boxY + 16, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: '#181818',
      wordWrap: { width: GAME_WIDTH - 80 },
      lineSpacing: 8,
    }).setDepth(201);
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

  hideDialog() {
    this.dialogActive = false;
    this.dialogBox?.setVisible(false);
    this.dialogText?.setVisible(false);
  }

  healParty() {
    // Brief flash effect
    this.cameras.main.flash(400, 255, 255, 255);

    this.party.forEach(p => {
      p.currentHp = p.maxHp;
      p.status = undefined;
      p.moves.forEach(m => { m.pp = m.maxPp; });
    });

    // Show healing dialog
    this.showDialogSequence([
      'OK, I\'ll take your POKéMON\nfor a few seconds.',
      '...',
      'Thank you for waiting.',
      'We\'ve restored your POKéMON\nto full health!',
      'We hope to see you again!',
    ]);

    this.doSave();
  }

  transitionToMap(mapId: string, targetX: number, targetY: number) {
    this.doSave();

    // Fade to black transition
    this.cameras.main.fadeOut(FADE_DURATION, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.currentMap = MAPS[mapId];
      this.playerGridX = targetX;
      this.playerGridY = targetY;

      if (!this.visitedMaps.includes(mapId)) {
        this.visitedMaps.push(mapId);
      }

      // Rebuild the map
      this.buildMap();
      this.cameras.main.fadeIn(FADE_DURATION, 0, 0, 0);
      this.showMapName();
      this.doSave();
    });
  }

  triggerWildEncounter() {
    const zone = this.currentMap.encounterZone;
    if (!zone) return;

    const encounters = ROUTE_ENCOUNTERS[zone];
    if (!encounters || encounters.length === 0) return;

    // Weighted random selection
    const totalWeight = encounters.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    let selected = encounters[0];
    for (const enc of encounters) {
      roll -= enc.weight;
      if (roll <= 0) { selected = enc; break; }
    }

    const level = selected.minLevel + Math.floor(Math.random() * (selected.maxLevel - selected.minLevel + 1));
    const wildPokemon = createPokemon(selected.id, level);

    // Add to pokedex seen
    if (!this.pokedexSeen.includes(selected.id)) {
      this.pokedexSeen.push(selected.id);
    }

    // Battle transition: flash then horizontal wipe effect
    this.cameras.main.flash(200, 255, 255, 255);

    // Create horizontal wipe overlay
    const wipe = this.add.graphics();
    wipe.setDepth(999);

    this.time.delayedCall(200, () => {
      // Horizontal bars wipe effect
      let progress = 0;
      const wipeTimer = this.time.addEvent({
        delay: 20,
        repeat: 15,
        callback: () => {
          progress++;
          wipe.clear();
          wipe.fillStyle(0x000000, 1);
          // Draw alternating horizontal bars expanding from center
          for (let i = 0; i < 12; i++) {
            const barH = GAME_HEIGHT / 12;
            const barW = (GAME_WIDTH / 16) * progress;
            const x = i % 2 === 0 ? 0 : GAME_WIDTH - barW;
            wipe.fillRect(x, i * barH, barW, barH);
          }
        },
      });

      this.time.delayedCall(500, () => {
        this.cameras.main.fadeOut(FADE_DURATION, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          wipe.destroy();
          this.scene.start('BattleScene', {
            wildPokemon,
            party: this.party,
            items: this.items,
            returnData: {
              currentMap: this.currentMap.id,
              playerX: this.playerGridX,
              playerY: this.playerGridY,
              money: this.money,
              badges: this.badges,
              visitedMaps: this.visitedMaps,
              pokedexSeen: this.pokedexSeen,
              pokedexCaught: this.pokedexCaught,
              defeatedTrainers: this.defeatedTrainers,
            },
          });
        });
      });
    });
  }

  doSave() {
    const saveData: SaveData = {
      playerName: 'RED',
      party: this.party,
      pc: [],
      items: this.items,
      money: this.money,
      badges: this.badges,
      currentMap: this.currentMap.id,
      playerX: this.playerGridX,
      playerY: this.playerGridY,
      visitedMaps: this.visitedMaps,
      pokedexSeen: this.pokedexSeen,
      pokedexCaught: this.pokedexCaught,
      defeatedTrainers: this.defeatedTrainers,
    };
    saveGame(saveData);
  }
}
