import Phaser from 'phaser';

// PokemonCenterScene is handled as an indoor map in the OverworldScene.
// This scene exists as a placeholder for potential future expansion
// (e.g., animated healing sequence, PC storage access).

export class PokemonCenterScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PokemonCenterScene' });
  }

  create() {
    // Healing is handled via NPC interaction in OverworldScene.
    // This scene is available for future expansion but not actively used.
    this.scene.start('OverworldScene', { loadSave: true });
  }
}
