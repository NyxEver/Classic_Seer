/**
 * MapModalScene - 地图弹窗场景
 * 承载星球与飞船模块入口能力。
 */
class MapModalScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MapModalScene' });
        this.callerSceneKey = 'CaptainRoomScene';
        this.callerSceneData = {};
    }

    init(data = {}) {
        this.callerSceneKey = typeof data.callerSceneKey === 'string' && data.callerSceneKey
            ? data.callerSceneKey
            : this.detectCallerSceneKey();
        this.callerSceneData = data.callerSceneData && typeof data.callerSceneData === 'object'
            ? data.callerSceneData
            : {};
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
        this.W = this.cameras.main.width;
        this.H = this.cameras.main.height;

        const overlayState = ModalOverlayLayer.mount(this, { alpha: 0, depth: 5100 });
        this.baseDepth = overlayState && Number.isFinite(overlayState.depth) ? overlayState.depth : 5100;

        this.modalW = Math.min(860, this.W - 90);
        this.modalH = Math.min(390, this.H - 80);
        this.modalX = Math.floor((this.W - this.modalW) / 2);
        this.modalY = Math.floor((this.H - this.modalH) / 2);

        this.root = this.add.container(this.modalX, this.modalY).setDepth(this.baseDepth + 1);

        this.createFrame();
        this.createCloseButton();
        this.createPanels();
    }

    detectCallerSceneKey() {
        const activeScenes = this.scene.manager.getScenes(true);
        const candidate = activeScenes.find((scene) => {
            if (!scene || scene.scene.key === 'MapModalScene') {
                return false;
            }
            const key = scene.scene.key;
            return key === 'CaptainRoomScene'
                || key === 'ElfLabScene'
                || key === 'SpaceStationScene'
                || key === 'KloseScene'
                || key === 'HelkaScene';
        });

        return candidate ? candidate.scene.key : 'CaptainRoomScene';
    }

    createFrame() {
        if (this.textures.exists('map_modal_bg')) {
            const bg = this.add.image(this.modalW / 2, this.modalH / 2, 'map_modal_bg');
            const scale = Math.max(this.modalW / bg.width, this.modalH / bg.height);
            bg.setScale(scale);

            const maskShape = this.make.graphics({ x: this.modalX, y: this.modalY, add: false });
            maskShape.fillStyle(0xffffff, 1);
            maskShape.fillRoundedRect(0, 0, this.modalW, this.modalH, 18);

            this.backgroundMaskShape = maskShape;
            this.backgroundMask = maskShape.createGeometryMask();
            bg.setMask(this.backgroundMask);

            this.backgroundImage = bg;
            this.root.add(bg);
        } else {
            const bgFallback = this.add.graphics();
            bgFallback.fillStyle(0x13253a, 0.98);
            bgFallback.fillRoundedRect(0, 0, this.modalW, this.modalH, 18);
            this.root.add(bgFallback);
        }

        const frame = this.add.graphics();
        frame.fillStyle(0x102a44, 0.56);
        frame.fillRoundedRect(0, 0, this.modalW, this.modalH, 18);
        frame.lineStyle(3, 0x74b4f2, 1);
        frame.strokeRoundedRect(0, 0, this.modalW, this.modalH, 18);
        frame.lineStyle(1.5, 0xb8dcff, 0.7);
        frame.strokeRoundedRect(8, 8, this.modalW - 16, this.modalH - 16, 14);
        this.root.add(frame);
    }

    createCloseButton() {
        const x = this.modalX + this.modalW - 24;
        const y = this.modalY + 24;
        const closeBg = this.add.circle(x, y, 14, 0x1f4468)
            .setDepth(this.baseDepth + 4)
            .setInteractive({ useHandCursor: true });
        const closeText = this.add.text(x, y, 'X', {
            fontSize: '13px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(this.baseDepth + 5);

        closeBg.on('pointerover', () => closeBg.setFillStyle(0x2f628f));
        closeBg.on('pointerout', () => closeBg.setFillStyle(0x1f4468));
        closeBg.on('pointerdown', () => this.closeModal());
    }

    createPanels() {
        const planets = this.buildPlanets();
        const modules = this.buildModules();

        const modulePanelWidth = Math.min(460, this.modalW - 18);
        const modulePanelHeight = 126;

        MapPlanetPanel.render(this, this.root, {
            x: 28,
            y: 72,
            width: this.modalW - 56,
            height: 174,
            planets,
            onPlanetClick: (planet) => this.handlePlanetClick(planet)
        });

        MapModulePanel.render(this, this.root, {
            x: 8,
            y: this.modalH - modulePanelHeight - 8,
            width: modulePanelWidth,
            height: modulePanelHeight,
            modules,
            onModuleClick: (module) => this.handleModuleClick(module)
        });
    }

    buildPlanets() {
        const mapId = String(PlayerData.currentMapId || '').toLowerCase();
        const hereOnKlose = mapId.startsWith('klose');
        const hereOnHelka = mapId.startsWith('helka');

        return [
            {
                id: 'klose',
                label: '克洛斯星',
                iconKey: 'ui_klose_icon',
                locked: false,
                isHere: hereOnKlose,
                targetScene: 'KloseScene',
                sceneData: { subScene: 1 },
                forceRestart: true
            },
            {
                id: 'helka',
                label: '赫尔卡星',
                iconKey: 'ui_helka_icon',
                locked: false,
                isHere: hereOnHelka,
                targetScene: 'HelkaScene',
                sceneData: { subScene: 1 },
                forceRestart: true
            },
            { id: 'unknown_1', label: '未知星球', locked: true },
            { id: 'unknown_2', label: '未知星球', locked: true }
        ];
    }

    buildModules() {
        const key = this.callerSceneKey;
        return [
            { id: 'captain', label: '船长室', shortLabel: '船', locked: false, isHere: key === 'CaptainRoomScene', targetScene: 'CaptainRoomScene' },
            { id: 'lab', label: '实验室', shortLabel: '研', locked: false, isHere: key === 'ElfLabScene', targetScene: 'ElfLabScene' },
            { id: 'station', label: '空间站', shortLabel: '站', locked: false, isHere: key === 'SpaceStationScene', targetScene: 'SpaceStationScene' },
            { id: 'mach', label: '机械室', shortLabel: '锁', locked: true },
            { id: 'invent', label: '发明室', shortLabel: '锁', locked: true },
            { id: 'data', label: '资料室', shortLabel: '锁', locked: true },
            { id: 'coach', label: '教官室', shortLabel: '锁', locked: true },
            { id: 'watch', label: '瞭望台', shortLabel: '锁', locked: true }
        ];
    }

    handlePlanetClick(planet) {
        if (!planet || planet.locked) {
            return;
        }
        this.transitionToScene(planet.targetScene, planet.sceneData || {}, !!planet.forceRestart);
    }

    handleModuleClick(module) {
        if (!module || module.locked) {
            return;
        }
        if (module.targetScene === this.callerSceneKey) {
            this.closeModal();
            return;
        }
        this.transitionToScene(module.targetScene, {});
    }

    transitionToScene(targetScene, targetData = {}, forceRestart = false) {
        if (!targetScene) {
            this.closeModal();
            return;
        }

        const callerKey = this.callerSceneKey;
        if (callerKey && this.scene.get(callerKey) && this.scene.isActive(callerKey)) {
            if (forceRestart || callerKey !== targetScene) {
                this.scene.stop(callerKey);
            }
        }

        this.cleanupModalArtifacts();
        ModalOverlayLayer.unmount(this);
        const started = SceneRouter.start(this, targetScene, targetData);
        if (!started && targetScene !== 'CaptainRoomScene') {
            SceneRouter.start(this, 'CaptainRoomScene', {});
        }
    }

    cleanupModalArtifacts() {
        if (this.backgroundImage && typeof this.backgroundImage.clearMask === 'function') {
            this.backgroundImage.clearMask(true);
        }
        if (this.backgroundMaskShape && this.backgroundMaskShape.scene) {
            this.backgroundMaskShape.destroy();
        }
        this.backgroundMask = null;
        this.backgroundMaskShape = null;
        this.backgroundImage = null;
    }

    closeModal() {
        this.cleanupModalArtifacts();
        ModalOverlayLayer.unmount(this);
        this.scene.stop();
    }
}

window.MapModalScene = MapModalScene;
