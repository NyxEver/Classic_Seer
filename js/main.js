/**
 * Project Seer - Main Entry Point
 * Phaser 3 Game Configuration and Initialization
 */

// Game configuration object
const gameConfig = {
    type: Phaser.AUTO,
    width: 1000,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',

    // Scene list - order matters for initial scene
    scene: [
        BootScene,
        MainMenuScene,
        SpaceshipScene,
        CaptainRoomScene,
        TeleportScene,
        KloseScene,
        ElfBagScene,
        ItemBagScene,
        ElfManageScene,
        BattleScene,
        SettingsScene,
        PokedexScene
    ],

    // Physics configuration (if needed later)
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },

    // Scale configuration for responsive display
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Create and start the game
const game = new Phaser.Game(gameConfig);

console.log('Project Seer initialized with Phaser', Phaser.VERSION);
