/**
 * KloseScene - 克洛斯星场景
 * 支持多个子场景，使用真实背景图片
 */

class KloseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'KloseScene' });

        // 当前子场景 (1, 2, 3)
        this.currentSubScene = 1;

        // 玩家位置
        this.playerX = 500;
        this.playerY = 400;

        // 野生精灵数组
        this.wildElves = [];
    }

    init(data) {
        // 接收子场景参数
        this.currentSubScene = data.subScene || 1;
        // 自定义入口点（从其他场景返回时使用）
        this.customEntry = data.customEntry || null;
        console.log(`[KloseScene] 进入子场景 ${this.currentSubScene}`, this.customEntry);
    }

    create() {
        const { width, height } = this.cameras.main;

        // 获取场景配置
        this.sceneConfig = AssetMappings.kloseScenes[this.currentSubScene];
        if (!this.sceneConfig) {
            console.error(`[KloseScene] 未找到子场景 ${this.currentSubScene} 配置`);
            return;
        }

        // 设置玩家入口位置（优先使用自定义入口点）
        if (this.customEntry) {
            this.playerX = this.customEntry.x;
            this.playerY = this.customEntry.y;
        } else {
            this.playerX = this.sceneConfig.entryPoint.x;
            this.playerY = this.sceneConfig.entryPoint.y;
        }

        // 创建背景
        this.createBackground(width, height);

        // 创建玩家角色
        this.createPlayer();

        // 生成野生精灵
        this.spawnWildElves();

        // 创建传送热点
        this.createHotspots();

        // 创建返回按钮
        this.createBackButton();

        // 创建点击移动区域
        this.createMoveArea(width, height);

        // 更新存档位置
        PlayerData.currentMapId = `klose_${this.currentSubScene}`;
        PlayerData.saveToStorage();

        console.log(`[KloseScene] 子场景 ${this.currentSubScene} 创建完成`);
    }

    // ========== 背景 ==========
    createBackground(width, height) {
        const bgKey = this.sceneConfig.background;

        if (this.textures.exists(bgKey)) {
            // 使用真实背景图片
            const bg = this.add.image(width / 2, height / 2, bgKey);
            bg.setDisplaySize(width, height);
            bg.setDepth(-1);
        } else {
            // 后备：绘制简单背景
            const graphics = this.add.graphics();
            graphics.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x5a9ac0, 0x5a9ac0, 1);
            graphics.fillRect(0, 0, width, height * 0.4);
            graphics.fillGradientStyle(0x4a8a3a, 0x4a8a3a, 0x3a7a2a, 0x3a7a2a, 1);
            graphics.fillRect(0, height * 0.4, width, height * 0.6);
            console.warn(`[KloseScene] 背景 ${bgKey} 未找到，使用后备背景`);
        }

        // 场景名称
        const sceneNames = { 1: '克洛斯星', 2: '克洛斯星沼泽', 3: '克洛斯星林间' };
        this.add.text(width / 2, 30, sceneNames[this.currentSubScene] || '克洛斯星', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);
    }

    // ========== 玩家角色 ==========
    createPlayer() {
        this.player = this.add.container(this.playerX, this.playerY);

        const graphics = this.add.graphics();

        // 身体
        graphics.fillStyle(0x4a7aaa, 1);
        graphics.fillRoundedRect(-15, -20, 30, 40, 8);

        // 头部
        graphics.fillStyle(0xffcc99, 1);
        graphics.fillCircle(0, -35, 20);

        // 头盔
        graphics.fillStyle(0x3a5a8a, 1);
        graphics.fillRoundedRect(-22, -55, 44, 25, 8);

        // 面罩
        graphics.fillStyle(0x88ccff, 0.6);
        graphics.fillCircle(0, -35, 12);

        this.player.add(graphics);

        // 玩家名称
        const nameTag = this.add.text(0, 35, PlayerData.playerName || '赛尔', {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#00000080',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.player.add(nameTag);
        this.player.setDepth(10);
    }

    // ========== 移动系统 ==========
    createMoveArea(width, height) {
        const moveZone = this.add.zone(width / 2, height / 2, width, height);
        moveZone.setDepth(0);
        moveZone.setInteractive();

        moveZone.on('pointerup', (pointer) => {
            this.movePlayerTo(pointer.x, pointer.y);
        });
    }

    movePlayerTo(targetX, targetY) {
        const { width, height } = this.cameras.main;
        targetX = Phaser.Math.Clamp(targetX, 50, width - 50);
        targetY = Phaser.Math.Clamp(targetY, 100, height - 80);

        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
        const duration = distance * 2;

        this.tweens.add({
            targets: this.player,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: 'Linear'
        });

        this.playerX = targetX;
        this.playerY = targetY;
    }

    // ========== 野生精灵 ==========
    spawnWildElves() {
        const wildElfPool = Array.isArray(this.sceneConfig.wildElfPool) ? this.sceneConfig.wildElfPool : [];
        if (!wildElfPool.length) {
            console.log(`[KloseScene] 子场景 ${this.currentSubScene} 暂无野生精灵配置`);
            return;
        }

        const spawnAreas = Array.isArray(this.sceneConfig.spawnAreas) ? this.sceneConfig.spawnAreas : [];
        if (!spawnAreas.length) {
            console.warn(`[KloseScene] 子场景 ${this.currentSubScene} 未配置 spawnAreas，跳过野生精灵刷新`);
            return;
        }

        const configuredRange = Array.isArray(this.sceneConfig.spawnCountRange)
            ? this.sceneConfig.spawnCountRange
            : [2, 4];
        let minCount = Math.floor(Number(configuredRange[0]));
        let maxCount = Math.floor(Number(configuredRange[1]));
        if (!Number.isFinite(minCount)) minCount = 2;
        if (!Number.isFinite(maxCount)) maxCount = minCount;
        minCount = Math.max(0, minCount);
        maxCount = Math.max(minCount, maxCount);

        const spawnCount = Phaser.Math.Between(minCount, maxCount);
        const minDistance = Math.max(0, Number(this.sceneConfig.spawnMinDistance) || 0);
        const moveRadius = this.getSceneWildMoveRadius();
        const points = [];

        for (let i = 0; i < spawnCount; i++) {
            const spawnPoint = this.pickSpawnPoint(spawnAreas, points, minDistance);
            if (!spawnPoint) break;

            points.push({ x: spawnPoint.x, y: spawnPoint.y });
            const elfId = wildElfPool[Phaser.Math.Between(0, wildElfPool.length - 1)];
            this.createWildElf(spawnPoint.x, spawnPoint.y, elfId, {
                spawnArea: spawnPoint.area,
                moveRadius
            });
        }
    }

    getSceneWildMoveRadius() {
        const cfg = this.sceneConfig && this.sceneConfig.wildMoveRadius ? this.sceneConfig.wildMoveRadius : {};
        const radiusX = Math.floor(Number(cfg.x));
        const radiusY = Math.floor(Number(cfg.y));
        return {
            x: Number.isFinite(radiusX) && radiusX > 0 ? radiusX : 40,
            y: Number.isFinite(radiusY) && radiusY > 0 ? radiusY : 30
        };
    }

    getWildWorldBounds() {
        const { width, height } = this.cameras.main;
        return {
            minX: 50,
            maxX: width - 50,
            minY: 120,
            maxY: height - 70
        };
    }

    isPointInsideWildBounds(x, y) {
        const bounds = this.getWildWorldBounds();
        return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
    }

    getRandomPointInAreaWithinBounds(area, attempts = 36) {
        for (let i = 0; i < attempts; i++) {
            const point = this.getRandomPointInArea(area);
            if (point && this.isPointInsideWildBounds(point.x, point.y)) {
                return point;
            }
        }
        return null;
    }

    pickSpawnPoint(spawnAreas, existingPoints, minDistance) {
        const attempts = 120;
        for (let i = 0; i < attempts; i++) {
            const area = spawnAreas[Phaser.Math.Between(0, spawnAreas.length - 1)];
            const point = this.getRandomPointInAreaWithinBounds(area);
            if (!point) continue;
            if (!minDistance || this.isPointFarEnough(point, existingPoints, minDistance)) {
                return { x: point.x, y: point.y, area };
            }
        }

        // 兜底：在区域内找任意一点，避免因约束过强导致完全不刷新
        for (let i = 0; i < spawnAreas.length * 6; i++) {
            const area = spawnAreas[Phaser.Math.Between(0, spawnAreas.length - 1)];
            const point = this.getRandomPointInAreaWithinBounds(area, 48);
            if (point) return { x: point.x, y: point.y, area };
        }
        return null;
    }

    getRandomPointInArea(area) {
        if (!area || typeof area !== 'object') return null;

        const type = area.type || 'rect';
        if (type === 'ellipse') {
            const centerX = Number(area.x);
            const centerY = Number(area.y);
            const radiusX = Number(area.radiusX);
            const radiusY = Number(area.radiusY);
            if (!Number.isFinite(centerX) || !Number.isFinite(centerY)
                || !Number.isFinite(radiusX) || !Number.isFinite(radiusY)
                || radiusX <= 0 || radiusY <= 0) {
                return null;
            }

            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const scale = Math.sqrt(Math.random());
            return {
                x: centerX + Math.cos(angle) * radiusX * scale,
                y: centerY + Math.sin(angle) * radiusY * scale
            };
        }

        const x = Number(area.x);
        const y = Number(area.y);
        const width = Number(area.width);
        const height = Number(area.height);
        if (!Number.isFinite(x) || !Number.isFinite(y)
            || !Number.isFinite(width) || !Number.isFinite(height)
            || width <= 0 || height <= 0) {
            return null;
        }

        return {
            x: Phaser.Math.FloatBetween(x, x + width),
            y: Phaser.Math.FloatBetween(y, y + height)
        };
    }

    isPointInsideArea(x, y, area) {
        if (!area || typeof area !== 'object') return false;
        const type = area.type || 'rect';

        if (type === 'ellipse') {
            const centerX = Number(area.x);
            const centerY = Number(area.y);
            const radiusX = Number(area.radiusX);
            const radiusY = Number(area.radiusY);
            if (!Number.isFinite(centerX) || !Number.isFinite(centerY)
                || !Number.isFinite(radiusX) || !Number.isFinite(radiusY)
                || radiusX <= 0 || radiusY <= 0) {
                return false;
            }
            const nx = (x - centerX) / radiusX;
            const ny = (y - centerY) / radiusY;
            return (nx * nx + ny * ny) <= 1;
        }

        const areaX = Number(area.x);
        const areaY = Number(area.y);
        const width = Number(area.width);
        const height = Number(area.height);
        if (!Number.isFinite(areaX) || !Number.isFinite(areaY)
            || !Number.isFinite(width) || !Number.isFinite(height)
            || width <= 0 || height <= 0) {
            return false;
        }

        return x >= areaX && x <= areaX + width && y >= areaY && y <= areaY + height;
    }

    isPointFarEnough(point, existingPoints, minDistance) {
        const minDistanceSq = minDistance * minDistance;
        return existingPoints.every((p) => {
            const dx = point.x - p.x;
            const dy = point.y - p.y;
            return (dx * dx + dy * dy) >= minDistanceSq;
        });
    }

    createWildElf(x, y, elfId = 10, options = {}) {
        const container = this.add.container(x, y);
        const hasDynamicSprite = this.createWildDynamicSprite(container, elfId, 60);

        if (!hasDynamicSprite) {
            const baseData = DataLoader.getElf(elfId);
            const displayName = baseData ? baseData.name : `#${elfId}`;

            // 后备：简单圆形
            const graphics = this.add.graphics();
            graphics.fillStyle(0xffaacc, 1);
            graphics.fillCircle(0, 0, 25);
            graphics.fillStyle(0xff88aa, 1);
            graphics.fillCircle(-8, -8, 8);
            graphics.fillCircle(8, -8, 8);
            container.add(graphics);

            const label = this.add.text(0, 35, displayName, {
                fontSize: '10px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            container.add(label);
        }

        container.setDepth(Math.max(5, Math.floor(y)));
        container.setSize(60, 60);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            this.startBattle(container._wildElfId || elfId);
        });

        this.addWildElfMovement(container, x, y, options.spawnArea || null, options.moveRadius || null);
        this.wildElves.push(container);
    }

    createWildDynamicSprite(container, elfId, maxSize) {
        const atlasKey = this.getWildDynamicAtlasKey(elfId, 'front');
        if (!atlasKey) return false;

        const firstFrame = this.getFirstWildFrame(atlasKey);
        if (!firstFrame) return false;

        const sprite = this.add.sprite(0, 0, atlasKey, firstFrame);
        const scale = Math.min(maxSize / sprite.width, maxSize / sprite.height);
        sprite.setScale(scale);
        container.add(sprite);

        container._wildElfId = elfId;
        container._wildSprite = sprite;
        container._wildDirection = 'front';

        this.playWildDirection(container, 'front');
        return true;
    }

    getWildDynamicAtlasKey(elfId, direction) {
        if (typeof AssetMappings === 'undefined' || typeof AssetMappings.getExternalDynamicKeys !== 'function') {
            return null;
        }

        const keys = AssetMappings.getExternalDynamicKeys(elfId, direction);
        if (!Array.isArray(keys) || !keys.length) return null;

        const available = keys.filter((key) => this.textures.exists(key));
        return available.length ? available[0] : null;
    }

    getWildFrames(atlasKey) {
        if (!this._wildFrameCache) this._wildFrameCache = {};
        if (this._wildFrameCache[atlasKey]) return this._wildFrameCache[atlasKey];

        let frames = [];
        const atlasJson = this.cache && this.cache.json ? this.cache.json.get(atlasKey) : null;
        if (atlasJson && atlasJson.frames && typeof atlasJson.frames === 'object') {
            frames = Object.keys(atlasJson.frames);
        } else {
            const texture = this.textures.get(atlasKey);
            if (!texture) {
                this._wildFrameCache[atlasKey] = [];
                return [];
            }
            // 按图集原始顺序播放，避免重排打乱导出动画节奏
            frames = texture.getFrameNames().filter((name) => name !== '__BASE');
        }

        this._wildFrameCache[atlasKey] = frames;
        return frames;
    }

    getFirstWildFrame(atlasKey) {
        const frames = this.getWildFrames(atlasKey);
        return frames.length ? frames[0] : null;
    }

    ensureWildAnimation(atlasKey, direction) {
        const animKey = `wild_${atlasKey}_${direction}`;
        if (this.anims.exists(animKey)) {
            return animKey;
        }

        const frames = this.getWildFrames(atlasKey);
        if (!frames.length) return null;

        this.anims.create({
            key: animKey,
            frames: frames.map((frame) => ({ key: atlasKey, frame })),
            frameRate: Math.max(6, Math.min(14, frames.length * 2)),
            repeat: -1
        });

        return animKey;
    }

    playWildDirection(container, direction) {
        if (!container || !container._wildSprite) return;

        const elfId = container._wildElfId;
        const atlasKey = this.getWildDynamicAtlasKey(elfId, direction);
        if (!atlasKey) return;

        const animKey = this.ensureWildAnimation(atlasKey, direction);
        if (!animKey) return;

        const currentAnim = container._wildSprite.anims ? container._wildSprite.anims.currentAnim : null;
        if (container._wildDirection === direction && currentAnim && currentAnim.key === animKey) {
            return;
        }

        container._wildDirection = direction;
        container._wildSprite.play(animKey, true);
    }

    getDirectionFromVector(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx >= 0 ? 'right' : 'left';
        }
        return dy >= 0 ? 'front' : 'back';
    }

    addWildElfMovement(container, originX, originY, spawnArea = null, moveRadius = null) {
        const radiusX = moveRadius && Number.isFinite(Number(moveRadius.x))
            ? Math.max(0, Math.floor(Number(moveRadius.x)))
            : 40;
        const radiusY = moveRadius && Number.isFinite(Number(moveRadius.y))
            ? Math.max(0, Math.floor(Number(moveRadius.y)))
            : 30;

        const moveElf = () => {
            if (!container || !container.scene) return;

            let target = null;
            for (let i = 0; i < 24; i++) {
                const candidateX = originX + Phaser.Math.Between(-radiusX, radiusX);
                const candidateY = originY + Phaser.Math.Between(-radiusY, radiusY);
                const insideArea = !spawnArea || this.isPointInsideArea(candidateX, candidateY, spawnArea);
                if (insideArea && this.isPointInsideWildBounds(candidateX, candidateY)) {
                    target = { x: candidateX, y: candidateY };
                    break;
                }
            }

            if (!target && spawnArea) {
                target = this.getRandomPointInAreaWithinBounds(spawnArea, 48);
            }
            if (!target) {
                const bounds = this.getWildWorldBounds();
                target = {
                    x: Phaser.Math.Clamp(originX, bounds.minX, bounds.maxX),
                    y: Phaser.Math.Clamp(originY, bounds.minY, bounds.maxY)
                };
            }

            const newX = target.x;
            const newY = target.y;
            const moveDirection = this.getDirectionFromVector(newX - container.x, newY - container.y);
            this.playWildDirection(container, moveDirection);

            this.tweens.add({
                targets: container,
                x: newX,
                y: newY,
                duration: Phaser.Math.Between(2000, 4000),
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    container.setDepth(Math.max(5, Math.floor(container.y)));
                },
                onComplete: () => {
                    this.time.delayedCall(Phaser.Math.Between(1000, 3000), moveElf);
                }
            });
        };

        this.time.delayedCall(Phaser.Math.Between(500, 2000), moveElf);
    }

    // ========== 传送热点 ==========
    createHotspots() {
        const hotspots = this.sceneConfig.hotspots || [];

        hotspots.forEach(hotspot => {
            // 处理 scene 和 entry 类型热点
            if (hotspot.type !== 'scene' && hotspot.type !== 'entry') return;

            const zone = this.add.zone(
                hotspot.x + hotspot.width / 2,
                hotspot.y + hotspot.height / 2,
                hotspot.width,
                hotspot.height
            );
            zone.setInteractive({ useHandCursor: true });
            zone.setDepth(15);

            // 热点指示器
            const indicator = this.add.container(hotspot.x + hotspot.width / 2, hotspot.y + hotspot.height / 2);

            // 使用配置的箭头方向
            const arrowSymbol = hotspot.arrow === 'left' ? '←' : '→';
            const arrow = this.add.text(0, -20, arrowSymbol, {
                fontSize: '24px',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            const label = this.add.text(0, 10, hotspot.label, {
                fontSize: '14px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            indicator.add([arrow, label]);
            indicator.setDepth(15);

            // 箭头闪烁动画
            this.tweens.add({
                targets: arrow,
                alpha: 0.3,
                duration: 800,
                yoyo: true,
                repeat: -1
            });

            zone.on('pointerdown', () => {
                // entry 类型热点：使用 targetEntry 作为目标场景的入口位置
                const entryPoint = hotspot.targetEntry || null;
                this.goToSubScene(hotspot.targetScene, entryPoint);
            });
        });
    }

    goToSubScene(subSceneId, customEntryPoint = null) {
        console.log(`[KloseScene] 前往子场景 ${subSceneId}`, customEntryPoint);
        this.scene.restart({ subScene: subSceneId, customEntry: customEntryPoint });
    }

    // ========== 战斗触发 ==========
    startBattle(elfId = 10) {
        const baseData = DataLoader.getElf(elfId);
        const displayName = baseData ? baseData.name : `#${elfId}`;
        console.log(`遭遇野生${displayName}！`);
        const wildElf = EncounterSystem.createWildElf(elfId, 2, 5);
        EncounterSystem.startWildBattle(this, wildElf);
    }

    /**
     * 返回当前场景背景资源 key（供 BattleScene 复用）
     * @returns {string|null}
     */
    getBattleBackgroundKey() {
        return this.sceneConfig ? this.sceneConfig.background : null;
    }

    // ========== 返回按钮 ==========
    createBackButton() {
        const btn = this.add.container(80, 550);
        btn.setDepth(20);

        // 根据当前场景决定返回目标
        const hotspots = this.sceneConfig.hotspots || [];
        const backHotspot = hotspots.find(h => h.type === 'back');

        let buttonLabel, buttonAction;

        if (this.currentSubScene === 1) {
            // 场景1：返回传送仓
            buttonLabel = '← 返回传送舱';
            buttonAction = () => SceneManager.changeScene(this, 'TeleportScene');
        } else if (backHotspot) {
            // 其他场景：返回上一个场景
            buttonLabel = '← 返回上一区域';
            buttonAction = () => this.goToSubScene(backHotspot.targetScene);
        } else {
            buttonLabel = '← 返回传送舱';
            buttonAction = () => SceneManager.changeScene(this, 'TeleportScene');
        }

        const bg = this.add.graphics();
        bg.fillStyle(0x3a7a3a, 1);
        bg.fillRoundedRect(-70, -20, 140, 40, 8);
        bg.lineStyle(2, 0x5a9a5a, 1);
        bg.strokeRoundedRect(-70, -20, 140, 40, 8);

        const label = this.add.text(0, 0, buttonLabel, {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.add([bg, label]);

        const hitArea = new Phaser.Geom.Rectangle(-70, -20, 140, 40);
        btn.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        btn.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x5a9a5a, 1);
            bg.fillRoundedRect(-70, -20, 140, 40, 8);
            bg.lineStyle(2, 0x7aba7a, 1);
            bg.strokeRoundedRect(-70, -20, 140, 40, 8);
        });

        btn.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x3a7a3a, 1);
            bg.fillRoundedRect(-70, -20, 140, 40, 8);
            bg.lineStyle(2, 0x5a9a5a, 1);
            bg.strokeRoundedRect(-70, -20, 140, 40, 8);
        });

        btn.on('pointerup', buttonAction);
    }
}
