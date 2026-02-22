/**
 * ElfLabScene - 精灵实验室场景（Step1）
 * 每次进入随机展示一位博士，仅展示待机动画
 */

class ElfLabScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ElfLabScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        this.createBackground(width, height);
        this.createDoctorDisplay(width, height);
        this.createBottomBar();

        PlayerData.currentMapId = 'elf_lab';
        PlayerData.saveToStorage();

        console.log('[ElfLabScene] created');
    }

    createBackground(width, height) {
        const bgKey = 'bg_elf_lab';
        if (this.textures.exists(bgKey)) {
            const bg = this.add.image(width / 2, height / 2, bgKey);
            bg.setDisplaySize(width, height);
            bg.setDepth(-1);
            return;
        }

        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x203042, 0x203042, 0x101a24, 0x101a24, 1);
        graphics.fillRect(0, 0, width, height);
        console.warn('[ElfLabScene] 背景纹理缺失，使用后备底色');
    }

    createDoctorDisplay(width, height) {
        const variants = [
            {
                atlasKey: 'npc_elf_doctor_first_atlas',
                animKey: 'elf_lab_doctor_first_idle'
            },
            {
                atlasKey: 'npc_elf_doctor_second_atlas',
                animKey: 'elf_lab_doctor_second_idle'
            }
        ];

        const selected = variants[Phaser.Math.Between(0, variants.length - 1)];
        const frameNames = this.getOrderedAtlasFrames(selected.atlasKey);

        let doctorNode = null;
        if (frameNames.length) {
            this.ensureIdleAnimation(selected.animKey, selected.atlasKey, frameNames);

            const startFrame = frameNames[0];
            doctorNode = this.add.sprite(Math.round(width * 0.5), Math.round(height * 0.62), selected.atlasKey, startFrame);
            doctorNode.setOrigin(0.5, 1);

            const targetHeight = 208;
            if (doctorNode.height > 0) {
                doctorNode.setScale(targetHeight / doctorNode.height);
            }
            doctorNode.play(selected.animKey);
            doctorNode.setDepth(40);
        }

        if (!doctorNode) {
            const fallback = this.add.graphics();
            fallback.fillStyle(0x5a9ccf, 1);
            fallback.fillRoundedRect(-38, -116, 76, 132, 18);
            fallback.fillStyle(0xe6f7ff, 1);
            fallback.fillCircle(0, -132, 32);

            doctorNode = this.add.container(Math.round(width * 0.5), Math.round(height * 0.62), [fallback]);
            doctorNode.setDepth(40);

            console.warn('[ElfLabScene] 博士图集缺失，使用后备模型');
        }

    }

    getOrderedAtlasFrames(atlasKey) {
        if (!this.textures.exists(atlasKey)) {
            return [];
        }

        const texture = this.textures.get(atlasKey);
        const names = texture.getFrameNames().filter((name) => name !== '__BASE');
        names.sort((a, b) => {
            const aNum = Number.parseInt(String(a).replace(/\D/g, ''), 10);
            const bNum = Number.parseInt(String(b).replace(/\D/g, ''), 10);
            return aNum - bNum;
        });
        return names;
    }

    ensureIdleAnimation(animKey, atlasKey, frameNames) {
        if (this.anims.exists(animKey)) {
            return;
        }

        this.anims.create({
            key: animKey,
            frames: frameNames.map((frame) => ({ key: atlasKey, frame })),
            frameRate: 10,
            repeat: -1
        });
    }

    createBottomBar() {
        WorldSceneModalMixin.apply(this, 'ElfLabScene');
        this.worldBottomBar = WorldBottomBar.create(this, {
            onMap: () => this.openMapModalFromBottomBar(),
            onBag: () => this.openItemBagModal(),
            onElfManage: () => this.openElfManageModal(),
            onSettings: () => this.openSettingsFromBottomBar()
        });
    }

}
