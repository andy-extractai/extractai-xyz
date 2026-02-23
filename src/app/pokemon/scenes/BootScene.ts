import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS } from '../constants';

// All Pokémon IDs we need sprites for
const POKEMON_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 16, 17, 18, 19, 20, 21, 22, 25, 35, 39, 43, 44, 52, 53, 54, 55, 56, 57, 63, 64, 69, 70];

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Show loading bar
    const barW = 400;
    const barH = 20;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = GAME_HEIGHT / 2;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.DARK_GRAY, 1);
    bg.fillRect(barX, barY, barW, barH);

    const bar = this.add.graphics();

    this.add.text(GAME_WIDTH / 2, barY - 40, 'Loading...', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(COLORS.HP_GREEN, 1);
      bar.fillRect(barX + 2, barY + 2, (barW - 4) * value, barH - 4);
    });

    // Load Pokémon sprites from PokéAPI
    for (const id of POKEMON_IDS) {
      this.load.image(
        `pokemon-front-${id}`,
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
      );
      this.load.image(
        `pokemon-back-${id}`,
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`
      );
    }

    // Load pokeball sprite
    this.load.image(
      'pokeball',
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'
    );

    // Generate tileset textures programmatically
    this.generateTileTextures();
    this.generatePlayerSprite();
  }

  generateTileTextures() {
    const size = 16;

    // ─── Grass tile — bright green with subtle darker crosshatch ───
    const grassGfx = this.make.graphics({ x: 0, y: 0 });
    grassGfx.fillStyle(0x78c840, 1);
    grassGfx.fillRect(0, 0, size, size);
    // Crosshatch pattern
    grassGfx.fillStyle(0x68b838, 1);
    grassGfx.fillRect(0, 0, 1, size);
    grassGfx.fillRect(0, 0, size, 1);
    grassGfx.fillRect(8, 0, 1, size);
    grassGfx.fillRect(0, 8, size, 1);
    // Small detail spots
    grassGfx.fillStyle(0x88d850, 1);
    grassGfx.fillRect(3, 3, 2, 2);
    grassGfx.fillRect(11, 11, 2, 2);
    grassGfx.fillRect(3, 11, 1, 1);
    grassGfx.fillRect(12, 4, 1, 1);
    grassGfx.generateTexture('tile-grass', size, size);
    grassGfx.destroy();

    // ─── Path tile — sandy tan (#d4b896) ───
    const pathGfx = this.make.graphics({ x: 0, y: 0 });
    pathGfx.fillStyle(0xd4b896, 1);
    pathGfx.fillRect(0, 0, size, size);
    pathGfx.fillStyle(0xc8ac88, 1);
    pathGfx.fillRect(0, 0, 1, size);
    pathGfx.fillRect(0, 0, size, 1);
    // Sandy speckle
    pathGfx.fillStyle(0xdcc4a0, 1);
    pathGfx.fillRect(3, 7, 1, 1);
    pathGfx.fillRect(11, 3, 1, 1);
    pathGfx.fillRect(8, 12, 1, 1);
    pathGfx.fillRect(6, 5, 1, 1);
    pathGfx.generateTexture('tile-path', size, size);
    pathGfx.destroy();

    // ─── Tree tile — distinct trunk and foliage ───
    const treeGfx = this.make.graphics({ x: 0, y: 0 });
    // Dark base (shadow)
    treeGfx.fillStyle(0x1a4a1d, 1);
    treeGfx.fillRect(0, 0, size, size);
    // Foliage — lush canopy
    treeGfx.fillStyle(0x2d6b30, 1);
    treeGfx.fillRect(1, 0, 14, 11);
    treeGfx.fillStyle(0x3d8b40, 1);
    treeGfx.fillRect(2, 1, 12, 8);
    treeGfx.fillStyle(0x4da850, 1);
    treeGfx.fillRect(4, 2, 8, 5);
    // Highlight spots on foliage
    treeGfx.fillStyle(0x58c060, 1);
    treeGfx.fillRect(5, 3, 2, 2);
    treeGfx.fillRect(10, 4, 2, 1);
    // Trunk — brown
    treeGfx.fillStyle(0x5a3a20, 1);
    treeGfx.fillRect(6, 11, 4, 5);
    treeGfx.fillStyle(0x7a5030, 1);
    treeGfx.fillRect(7, 11, 2, 5);
    treeGfx.generateTexture('tile-tree', size, size);
    treeGfx.destroy();

    // ─── Building wall — gray with window ───
    const wallGfx = this.make.graphics({ x: 0, y: 0 });
    wallGfx.fillStyle(0xb8b8b8, 1);
    wallGfx.fillRect(0, 0, size, size);
    wallGfx.fillStyle(0xa0a0a0, 1);
    wallGfx.fillRect(0, 0, 1, size);
    wallGfx.fillRect(0, size - 1, size, 1);
    wallGfx.fillStyle(0xd0d0d0, 1);
    wallGfx.fillRect(1, 0, size - 1, 1);
    // Window with light color
    wallGfx.fillStyle(0x70a0c8, 1);
    wallGfx.fillRect(4, 3, 8, 6);
    wallGfx.fillStyle(0x90c8e8, 1);
    wallGfx.fillRect(5, 4, 3, 2);
    wallGfx.fillStyle(0x505050, 1);
    wallGfx.fillRect(4, 3, 8, 1);
    wallGfx.fillRect(4, 3, 1, 6);
    wallGfx.fillRect(4, 6, 8, 1);
    wallGfx.generateTexture('tile-wall', size, size);
    wallGfx.destroy();

    // ─── Building roof — colored ───
    const roofGfx = this.make.graphics({ x: 0, y: 0 });
    roofGfx.fillStyle(0xd03030, 1);
    roofGfx.fillRect(0, 0, size, size);
    roofGfx.fillStyle(0xe04848, 1);
    roofGfx.fillRect(1, 1, size - 2, size - 3);
    roofGfx.fillStyle(0xb02020, 1);
    roofGfx.fillRect(0, size - 2, size, 2);
    // Roof ridge lines
    roofGfx.fillStyle(0xc83838, 1);
    roofGfx.fillRect(0, 4, size, 1);
    roofGfx.fillRect(0, 8, size, 1);
    roofGfx.generateTexture('tile-roof', size, size);
    roofGfx.destroy();

    // ─── Water tile — animated blue with lighter shimmer ───
    const waterGfx = this.make.graphics({ x: 0, y: 0 });
    waterGfx.fillStyle(0x4888d4, 1);
    waterGfx.fillRect(0, 0, size, size);
    // Wave details — lighter blue ripples
    waterGfx.fillStyle(0x68a8e8, 1);
    waterGfx.fillRect(1, 3, 5, 2);
    waterGfx.fillRect(9, 7, 5, 2);
    waterGfx.fillRect(3, 11, 4, 2);
    // Shimmer highlights
    waterGfx.fillStyle(0x88c8f8, 1);
    waterGfx.fillRect(2, 4, 2, 1);
    waterGfx.fillRect(10, 8, 2, 1);
    // Dark wave troughs
    waterGfx.fillStyle(0x3878c4, 1);
    waterGfx.fillRect(6, 5, 3, 1);
    waterGfx.fillRect(0, 9, 3, 1);
    waterGfx.fillRect(12, 13, 3, 1);
    waterGfx.generateTexture('tile-water', size, size);
    waterGfx.destroy();

    // ─── Tall grass — darker with vertical grass blades ───
    const tallGrassGfx = this.make.graphics({ x: 0, y: 0 });
    tallGrassGfx.fillStyle(0x48a028, 1);
    tallGrassGfx.fillRect(0, 0, size, size);
    // Grass blade stalks (vertical lines)
    tallGrassGfx.fillStyle(0x58b838, 1);
    tallGrassGfx.fillRect(1, 0, 2, 13);
    tallGrassGfx.fillRect(5, 2, 2, 11);
    tallGrassGfx.fillRect(9, 0, 2, 14);
    tallGrassGfx.fillRect(13, 3, 2, 10);
    // Darker blade edges
    tallGrassGfx.fillStyle(0x388818, 1);
    tallGrassGfx.fillRect(3, 0, 1, 11);
    tallGrassGfx.fillRect(7, 1, 1, 9);
    tallGrassGfx.fillRect(11, 0, 1, 12);
    // Blade tips — lighter
    tallGrassGfx.fillStyle(0x68c848, 1);
    tallGrassGfx.fillRect(1, 0, 1, 2);
    tallGrassGfx.fillRect(9, 0, 1, 2);
    tallGrassGfx.fillRect(5, 2, 1, 2);
    tallGrassGfx.fillRect(13, 3, 1, 2);
    tallGrassGfx.generateTexture('tile-tallgrass', size, size);
    tallGrassGfx.destroy();

    // ─── Door tile ───
    const doorGfx = this.make.graphics({ x: 0, y: 0 });
    doorGfx.fillStyle(0x8b6914, 1);
    doorGfx.fillRect(0, 0, size, size);
    doorGfx.fillStyle(0xa07828, 1);
    doorGfx.fillRect(2, 0, size - 4, size - 2);
    doorGfx.fillStyle(0xd0a030, 1);
    doorGfx.fillRect(size - 5, 7, 2, 2);
    doorGfx.generateTexture('tile-door', size, size);
    doorGfx.destroy();

    // ─── Sign tile ───
    const signGfx = this.make.graphics({ x: 0, y: 0 });
    signGfx.fillStyle(0x78c840, 1);
    signGfx.fillRect(0, 0, size, size);
    signGfx.fillStyle(0x8b6914, 1);
    signGfx.fillRect(3, 3, 10, 8);
    signGfx.fillStyle(0xc0a040, 1);
    signGfx.fillRect(4, 4, 8, 6);
    signGfx.fillStyle(0x5a3a20, 1);
    signGfx.fillRect(7, 11, 2, 5);
    signGfx.generateTexture('tile-sign', size, size);
    signGfx.destroy();

    // ─── Ledge tile ───
    const ledgeGfx = this.make.graphics({ x: 0, y: 0 });
    ledgeGfx.fillStyle(0x78c840, 1);
    ledgeGfx.fillRect(0, 0, size, size);
    ledgeGfx.fillStyle(0x5ea832, 1);
    ledgeGfx.fillRect(0, size - 4, size, 4);
    ledgeGfx.fillStyle(0x4e9822, 1);
    ledgeGfx.fillRect(0, size - 2, size, 2);
    ledgeGfx.generateTexture('tile-ledge', size, size);
    ledgeGfx.destroy();

    // ─── Fence ───
    const fenceGfx = this.make.graphics({ x: 0, y: 0 });
    fenceGfx.fillStyle(0x78c840, 1);
    fenceGfx.fillRect(0, 0, size, size);
    fenceGfx.fillStyle(0xd8c0a0, 1);
    fenceGfx.fillRect(0, 5, size, 3);
    fenceGfx.fillRect(0, 10, size, 3);
    fenceGfx.fillStyle(0xc0a880, 1);
    fenceGfx.fillRect(2, 3, 2, 10);
    fenceGfx.fillRect(12, 3, 2, 10);
    fenceGfx.generateTexture('tile-fence', size, size);
    fenceGfx.destroy();

    // ─── Flower ───
    const flowerGfx = this.make.graphics({ x: 0, y: 0 });
    flowerGfx.fillStyle(0x78c840, 1);
    flowerGfx.fillRect(0, 0, size, size);
    flowerGfx.fillStyle(0xff6060, 1);
    flowerGfx.fillRect(3, 4, 3, 3);
    flowerGfx.fillRect(10, 8, 3, 3);
    flowerGfx.fillStyle(0xffff60, 1);
    flowerGfx.fillRect(4, 5, 1, 1);
    flowerGfx.fillRect(11, 9, 1, 1);
    flowerGfx.generateTexture('tile-flower', size, size);
    flowerGfx.destroy();

    // ─── Building floor ───
    const floorGfx = this.make.graphics({ x: 0, y: 0 });
    floorGfx.fillStyle(0xf0e8d0, 1);
    floorGfx.fillRect(0, 0, size, size);
    floorGfx.fillStyle(0xe0d8c0, 1);
    floorGfx.fillRect(0, 0, size, 1);
    floorGfx.fillRect(0, 0, 1, size);
    floorGfx.generateTexture('tile-floor', size, size);
    floorGfx.destroy();

    // ─── Counter ───
    const counterGfx = this.make.graphics({ x: 0, y: 0 });
    counterGfx.fillStyle(0xc07020, 1);
    counterGfx.fillRect(0, 0, size, size);
    counterGfx.fillStyle(0xd88030, 1);
    counterGfx.fillRect(1, 1, size - 2, size - 2);
    counterGfx.fillStyle(0xa06018, 1);
    counterGfx.fillRect(0, size - 2, size, 2);
    counterGfx.generateTexture('tile-counter', size, size);
    counterGfx.destroy();

    // ─── Heal machine ───
    const healGfx = this.make.graphics({ x: 0, y: 0 });
    healGfx.fillStyle(0xf0e8d0, 1);
    healGfx.fillRect(0, 0, size, size);
    healGfx.fillStyle(0xf06060, 1);
    healGfx.fillRect(3, 3, 10, 10);
    healGfx.fillStyle(0xff8080, 1);
    healGfx.fillRect(6, 4, 4, 2);
    healGfx.fillRect(7, 3, 2, 4);
    healGfx.generateTexture('tile-heal', size, size);
    healGfx.destroy();

    // ─── PC machine ───
    const pcGfx = this.make.graphics({ x: 0, y: 0 });
    pcGfx.fillStyle(0xf0e8d0, 1);
    pcGfx.fillRect(0, 0, size, size);
    pcGfx.fillStyle(0x404040, 1);
    pcGfx.fillRect(2, 2, 12, 10);
    pcGfx.fillStyle(0x4080c0, 1);
    pcGfx.fillRect(3, 3, 10, 8);
    pcGfx.generateTexture('tile-pc', size, size);
    pcGfx.destroy();

    // ─── Shelf ───
    const shelfGfx = this.make.graphics({ x: 0, y: 0 });
    shelfGfx.fillStyle(0xf0e8d0, 1);
    shelfGfx.fillRect(0, 0, size, size);
    shelfGfx.fillStyle(0x8b6914, 1);
    shelfGfx.fillRect(1, 2, 14, 12);
    shelfGfx.fillStyle(0xa07828, 1);
    shelfGfx.fillRect(2, 3, 12, 4);
    shelfGfx.fillRect(2, 9, 12, 4);
    shelfGfx.generateTexture('tile-shelf', size, size);
    shelfGfx.destroy();

    // ─── Table ───
    const tableGfx = this.make.graphics({ x: 0, y: 0 });
    tableGfx.fillStyle(0xf0e8d0, 1);
    tableGfx.fillRect(0, 0, size, size);
    tableGfx.fillStyle(0xc09060, 1);
    tableGfx.fillRect(1, 4, 14, 8);
    tableGfx.fillStyle(0xd0a070, 1);
    tableGfx.fillRect(2, 5, 12, 6);
    tableGfx.generateTexture('tile-table', size, size);
    tableGfx.destroy();

    // ─── Mat ───
    const matGfx = this.make.graphics({ x: 0, y: 0 });
    matGfx.fillStyle(0xf0e8d0, 1);
    matGfx.fillRect(0, 0, size, size);
    matGfx.fillStyle(0xd03030, 1);
    matGfx.fillRect(1, 1, 14, 14);
    matGfx.fillStyle(0xe04040, 1);
    matGfx.fillRect(3, 3, 10, 10);
    matGfx.generateTexture('tile-mat', size, size);
    matGfx.destroy();
  }

  generatePlayerSprite() {
    const s = 16;

    // ─── Player: red jacket, dark pants, white/red cap ───

    // Down-facing frame 1
    const g1 = this.make.graphics({ x: 0, y: 0 });
    // Cap — red with white front
    g1.fillStyle(0xd03030, 1);
    g1.fillRect(4, 0, 8, 4);
    g1.fillStyle(0xffffff, 1);
    g1.fillRect(5, 0, 3, 2);
    // Hair peeking out
    g1.fillStyle(0x402010, 1);
    g1.fillRect(4, 3, 1, 2);
    g1.fillRect(11, 3, 1, 2);
    // Face
    g1.fillStyle(0xf8c090, 1);
    g1.fillRect(4, 4, 8, 4);
    // Eyes
    g1.fillStyle(0x202020, 1);
    g1.fillRect(5, 5, 2, 2);
    g1.fillRect(9, 5, 2, 2);
    // Body (red jacket)
    g1.fillStyle(0xd03030, 1);
    g1.fillRect(3, 8, 10, 4);
    // Jacket detail — zipper
    g1.fillStyle(0xb02020, 1);
    g1.fillRect(7, 8, 2, 4);
    // Dark pants
    g1.fillStyle(0x283060, 1);
    g1.fillRect(4, 12, 3, 3);
    g1.fillRect(9, 12, 3, 3);
    // Shoes
    g1.fillStyle(0x303030, 1);
    g1.fillRect(4, 15, 3, 1);
    g1.fillRect(9, 15, 3, 1);
    g1.generateTexture('player-down-1', s, s);
    g1.destroy();

    // Down-facing frame 2 (leg shift)
    const g2 = this.make.graphics({ x: 0, y: 0 });
    g2.fillStyle(0xd03030, 1);
    g2.fillRect(4, 0, 8, 4);
    g2.fillStyle(0xffffff, 1);
    g2.fillRect(5, 0, 3, 2);
    g2.fillStyle(0x402010, 1);
    g2.fillRect(4, 3, 1, 2);
    g2.fillRect(11, 3, 1, 2);
    g2.fillStyle(0xf8c090, 1);
    g2.fillRect(4, 4, 8, 4);
    g2.fillStyle(0x202020, 1);
    g2.fillRect(5, 5, 2, 2);
    g2.fillRect(9, 5, 2, 2);
    g2.fillStyle(0xd03030, 1);
    g2.fillRect(3, 8, 10, 4);
    g2.fillStyle(0xb02020, 1);
    g2.fillRect(7, 8, 2, 4);
    g2.fillStyle(0x283060, 1);
    g2.fillRect(3, 12, 3, 3);
    g2.fillRect(10, 12, 3, 3);
    g2.fillStyle(0x303030, 1);
    g2.fillRect(3, 15, 3, 1);
    g2.fillRect(10, 15, 3, 1);
    g2.generateTexture('player-down-2', s, s);
    g2.destroy();

    // Up-facing frame 1
    const gu1 = this.make.graphics({ x: 0, y: 0 });
    gu1.fillStyle(0xd03030, 1);
    gu1.fillRect(4, 0, 8, 5);
    // Back of cap
    gu1.fillStyle(0xb02020, 1);
    gu1.fillRect(5, 1, 6, 3);
    // Hair
    gu1.fillStyle(0x402010, 1);
    gu1.fillRect(4, 5, 8, 3);
    // Body
    gu1.fillStyle(0xd03030, 1);
    gu1.fillRect(3, 8, 10, 4);
    gu1.fillStyle(0xb02020, 1);
    gu1.fillRect(7, 8, 2, 4);
    // Pants
    gu1.fillStyle(0x283060, 1);
    gu1.fillRect(4, 12, 3, 3);
    gu1.fillRect(9, 12, 3, 3);
    gu1.fillStyle(0x303030, 1);
    gu1.fillRect(4, 15, 3, 1);
    gu1.fillRect(9, 15, 3, 1);
    gu1.generateTexture('player-up-1', s, s);
    gu1.destroy();

    // Up-facing frame 2
    const gu2 = this.make.graphics({ x: 0, y: 0 });
    gu2.fillStyle(0xd03030, 1);
    gu2.fillRect(4, 0, 8, 5);
    gu2.fillStyle(0xb02020, 1);
    gu2.fillRect(5, 1, 6, 3);
    gu2.fillStyle(0x402010, 1);
    gu2.fillRect(4, 5, 8, 3);
    gu2.fillStyle(0xd03030, 1);
    gu2.fillRect(3, 8, 10, 4);
    gu2.fillStyle(0xb02020, 1);
    gu2.fillRect(7, 8, 2, 4);
    gu2.fillStyle(0x283060, 1);
    gu2.fillRect(3, 12, 3, 3);
    gu2.fillRect(10, 12, 3, 3);
    gu2.fillStyle(0x303030, 1);
    gu2.fillRect(3, 15, 3, 1);
    gu2.fillRect(10, 15, 3, 1);
    gu2.generateTexture('player-up-2', s, s);
    gu2.destroy();

    // Left-facing frame 1
    const gl1 = this.make.graphics({ x: 0, y: 0 });
    gl1.fillStyle(0xd03030, 1);
    gl1.fillRect(4, 0, 8, 4);
    gl1.fillStyle(0xffffff, 1);
    gl1.fillRect(4, 0, 3, 2);
    gl1.fillStyle(0xf8c090, 1);
    gl1.fillRect(4, 4, 7, 4);
    gl1.fillStyle(0x202020, 1);
    gl1.fillRect(5, 5, 2, 2);
    gl1.fillStyle(0xd03030, 1);
    gl1.fillRect(3, 8, 9, 4);
    gl1.fillStyle(0xb02020, 1);
    gl1.fillRect(7, 8, 1, 4);
    gl1.fillStyle(0x283060, 1);
    gl1.fillRect(4, 12, 3, 3);
    gl1.fillRect(8, 12, 3, 3);
    gl1.fillStyle(0x303030, 1);
    gl1.fillRect(4, 15, 3, 1);
    gl1.fillRect(8, 15, 3, 1);
    gl1.generateTexture('player-left-1', s, s);
    gl1.destroy();

    // Left-facing frame 2
    const gl2 = this.make.graphics({ x: 0, y: 0 });
    gl2.fillStyle(0xd03030, 1);
    gl2.fillRect(4, 0, 8, 4);
    gl2.fillStyle(0xffffff, 1);
    gl2.fillRect(4, 0, 3, 2);
    gl2.fillStyle(0xf8c090, 1);
    gl2.fillRect(4, 4, 7, 4);
    gl2.fillStyle(0x202020, 1);
    gl2.fillRect(5, 5, 2, 2);
    gl2.fillStyle(0xd03030, 1);
    gl2.fillRect(3, 8, 9, 4);
    gl2.fillStyle(0xb02020, 1);
    gl2.fillRect(7, 8, 1, 4);
    gl2.fillStyle(0x283060, 1);
    gl2.fillRect(3, 12, 3, 3);
    gl2.fillRect(9, 12, 3, 3);
    gl2.fillStyle(0x303030, 1);
    gl2.fillRect(3, 15, 3, 1);
    gl2.fillRect(9, 15, 3, 1);
    gl2.generateTexture('player-left-2', s, s);
    gl2.destroy();

    // Right-facing frame 1
    const gr1 = this.make.graphics({ x: 0, y: 0 });
    gr1.fillStyle(0xd03030, 1);
    gr1.fillRect(4, 0, 8, 4);
    gr1.fillStyle(0xffffff, 1);
    gr1.fillRect(9, 0, 3, 2);
    gr1.fillStyle(0xf8c090, 1);
    gr1.fillRect(5, 4, 7, 4);
    gr1.fillStyle(0x202020, 1);
    gr1.fillRect(9, 5, 2, 2);
    gr1.fillStyle(0xd03030, 1);
    gr1.fillRect(4, 8, 9, 4);
    gr1.fillStyle(0xb02020, 1);
    gr1.fillRect(8, 8, 1, 4);
    gr1.fillStyle(0x283060, 1);
    gr1.fillRect(5, 12, 3, 3);
    gr1.fillRect(9, 12, 3, 3);
    gr1.fillStyle(0x303030, 1);
    gr1.fillRect(5, 15, 3, 1);
    gr1.fillRect(9, 15, 3, 1);
    gr1.generateTexture('player-right-1', s, s);
    gr1.destroy();

    // Right-facing frame 2
    const gr2 = this.make.graphics({ x: 0, y: 0 });
    gr2.fillStyle(0xd03030, 1);
    gr2.fillRect(4, 0, 8, 4);
    gr2.fillStyle(0xffffff, 1);
    gr2.fillRect(9, 0, 3, 2);
    gr2.fillStyle(0xf8c090, 1);
    gr2.fillRect(5, 4, 7, 4);
    gr2.fillStyle(0x202020, 1);
    gr2.fillRect(9, 5, 2, 2);
    gr2.fillStyle(0xd03030, 1);
    gr2.fillRect(4, 8, 9, 4);
    gr2.fillStyle(0xb02020, 1);
    gr2.fillRect(8, 8, 1, 4);
    gr2.fillStyle(0x283060, 1);
    gr2.fillRect(4, 12, 3, 3);
    gr2.fillRect(10, 12, 3, 3);
    gr2.fillStyle(0x303030, 1);
    gr2.fillRect(4, 15, 3, 1);
    gr2.fillRect(10, 15, 3, 1);
    gr2.generateTexture('player-right-2', s, s);
    gr2.destroy();

    // ─── NPC sprite ───
    const npc = this.make.graphics({ x: 0, y: 0 });
    npc.fillStyle(0x6080c0, 1);
    npc.fillRect(4, 0, 8, 4);
    npc.fillStyle(0xf8c090, 1);
    npc.fillRect(4, 4, 8, 4);
    npc.fillStyle(0x202020, 1);
    npc.fillRect(5, 5, 2, 2);
    npc.fillRect(9, 5, 2, 2);
    npc.fillStyle(0x4060a0, 1);
    npc.fillRect(3, 8, 10, 4);
    npc.fillStyle(0x283060, 1);
    npc.fillRect(4, 12, 3, 4);
    npc.fillRect(9, 12, 3, 4);
    npc.generateTexture('npc-sprite', s, s);
    npc.destroy();

    // ─── Nurse Joy sprite ───
    const nurse = this.make.graphics({ x: 0, y: 0 });
    nurse.fillStyle(0xf0a0b0, 1);
    nurse.fillRect(4, 0, 8, 4);
    nurse.fillStyle(0xf8c090, 1);
    nurse.fillRect(4, 4, 8, 4);
    nurse.fillStyle(0x202020, 1);
    nurse.fillRect(5, 5, 2, 2);
    nurse.fillRect(9, 5, 2, 2);
    nurse.fillStyle(0xffffff, 1);
    nurse.fillRect(3, 8, 10, 4);
    nurse.fillStyle(0xf08090, 1);
    nurse.fillRect(5, 8, 2, 1);
    nurse.fillStyle(0xf0f0f0, 1);
    nurse.fillRect(4, 12, 3, 4);
    nurse.fillRect(9, 12, 3, 4);
    nurse.generateTexture('nurse-sprite', s, s);
    nurse.destroy();

    // ─── Prof Oak sprite ───
    const oak = this.make.graphics({ x: 0, y: 0 });
    oak.fillStyle(0x808080, 1);
    oak.fillRect(4, 0, 8, 4);
    oak.fillStyle(0xf8c090, 1);
    oak.fillRect(4, 4, 8, 4);
    oak.fillStyle(0x202020, 1);
    oak.fillRect(5, 5, 2, 2);
    oak.fillRect(9, 5, 2, 2);
    oak.fillStyle(0xf0f0f0, 1);
    oak.fillRect(3, 8, 10, 4);
    oak.fillStyle(0x806040, 1);
    oak.fillRect(4, 12, 3, 4);
    oak.fillRect(9, 12, 3, 4);
    oak.generateTexture('oak-sprite', s, s);
    oak.destroy();
  }

  create() {
    // Handle any load errors gracefully - generate colored rectangle fallbacks
    for (const id of POKEMON_IDS) {
      if (!this.textures.exists(`pokemon-front-${id}`)) {
        const fallback = this.make.graphics({ x: 0, y: 0 });
        const color = 0x808080 + (id * 0x1234) & 0xffffff;
        fallback.fillStyle(color, 1);
        fallback.fillRect(0, 0, 96, 96);
        fallback.generateTexture(`pokemon-front-${id}`, 96, 96);
        fallback.destroy();
      }
      if (!this.textures.exists(`pokemon-back-${id}`)) {
        const fallback = this.make.graphics({ x: 0, y: 0 });
        const color = 0x808080 + (id * 0x1234) & 0xffffff;
        fallback.fillStyle(color, 1);
        fallback.fillRect(0, 0, 96, 96);
        fallback.generateTexture(`pokemon-back-${id}`, 96, 96);
        fallback.destroy();
      }
    }

    this.scene.start('TitleScene');
  }
}
