/**
 * BootScene - Initial loading scene
 * Responsible for loading core resources and displaying loading state
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    /**
     * Preload method
     * Used for loading core resources before game starts
     */
    preload() {
        // TODO: Load core assets here
        // Example: this.load.image('logo', 'assets/images/logo.png');

        // For now, we simulate a brief loading time
        // This will be replaced with actual asset loading later
    }

    /**
     * Create method
     * Called after preload completes, sets up the initial scene
     */
    create() {
        // Get canvas center coordinates
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Display "Loading..." text centered on screen
        this.loadingText = this.add.text(centerX, centerY, 'Loading...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });

        // Set text origin to center for proper alignment
        this.loadingText.setOrigin(0.5, 0.5);

        // Add a subtle pulsing animation to the loading text
        this.tweens.add({
            targets: this.loadingText,
            alpha: { from: 1, to: 0.5 },
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        console.log('BootScene created successfully');

        // TODO: After loading completes, transition to MainMenuScene
        // For now, we stay on this scene for testing
        // SceneManager.changeScene(this, 'MainMenuScene');
    }

    /**
     * Update method
     * Called every frame, can be used for loading progress updates
     */
    update() {
        // Will be used for loading progress bar updates if needed
    }
}
