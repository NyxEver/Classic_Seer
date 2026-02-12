/**
 * Project Seer - Main Entry Point
 * Phaser 3 Game Configuration and Initialization
 */

/**
 * 全局文本渲染修正：
 * 1) 中文字体回退链，避免不同系统字体度量差异导致裁切
 * 2) 为所有 Text 增加默认 padding，修复笔画被截断问题
 */
if (!window.__seerTextFactoryPatched) {
    const originalTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;
    Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, style) {
        const normalizedStyle = { ...(style || {}) };
        const cjkFallback = '"Microsoft YaHei","PingFang SC","Noto Sans SC","Helvetica Neue",Arial,sans-serif';

        if (!normalizedStyle.fontFamily) {
            normalizedStyle.fontFamily = cjkFallback;
        } else if (
            typeof normalizedStyle.fontFamily === 'string' &&
            !normalizedStyle.fontFamily.includes('Microsoft YaHei') &&
            !normalizedStyle.fontFamily.includes('PingFang SC') &&
            !normalizedStyle.fontFamily.includes('Noto Sans SC')
        ) {
            normalizedStyle.fontFamily = `${normalizedStyle.fontFamily},"Microsoft YaHei","PingFang SC","Noto Sans SC"`;
        }

        if (!normalizedStyle.padding) {
            normalizedStyle.padding = { x: 1, y: 3 };
        } else {
            normalizedStyle.padding = {
                x: normalizedStyle.padding.x ?? 1,
                y: Math.max(3, normalizedStyle.padding.y ?? 0)
            };
        }

        return originalTextFactory.call(this, x, y, text, normalizedStyle);
    };
    window.__seerTextFactoryPatched = true;
}

// Game configuration object
const gameConfig = {
    type: Phaser.AUTO,
    width: 1000,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false
    },

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
        PokedexScene,
        EvolutionScene,
        SkillLearnScene
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

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('game', game);
    AppContext.register('__seerGame', game);
}

window.__seerGame = game;

console.log('Project Seer initialized with Phaser', Phaser.VERSION);
