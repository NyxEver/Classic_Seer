/**
 * KloseSpawnService - 克洛斯星刷怪服务
 * 职责：刷新范围、最小间距、动态精灵渲染与游走绑定
 */

class KloseSpawnService {
    constructor(scene, moveController) {
        this.scene = scene;
        this.moveController = moveController;
        this._wildFrameCache = {};
    }

    spawnWildElves() {
        const wildElfPool = Array.isArray(this.scene.sceneConfig.wildElfPool)
            ? this.scene.sceneConfig.wildElfPool
            : [];

        if (!wildElfPool.length) {
            console.log(`[KloseScene] 子场景 ${this.scene.currentSubScene} 暂无野生精灵配置`);
            return;
        }

        const spawnAreas = Array.isArray(this.scene.sceneConfig.spawnAreas)
            ? this.scene.sceneConfig.spawnAreas
            : [];

        if (!spawnAreas.length) {
            console.warn(`[KloseScene] 子场景 ${this.scene.currentSubScene} 未配置 spawnAreas，跳过野生精灵刷新`);
            return;
        }

        const configuredRange = Array.isArray(this.scene.sceneConfig.spawnCountRange)
            ? this.scene.sceneConfig.spawnCountRange
            : [2, 4];

        let minCount = Math.floor(Number(configuredRange[0]));
        let maxCount = Math.floor(Number(configuredRange[1]));
        if (!Number.isFinite(minCount)) minCount = 2;
        if (!Number.isFinite(maxCount)) maxCount = minCount;
        minCount = Math.max(0, minCount);
        maxCount = Math.max(minCount, maxCount);

        const spawnCount = Phaser.Math.Between(minCount, maxCount);
        const minDistance = Math.max(0, Number(this.scene.sceneConfig.spawnMinDistance) || 0);
        const moveRadius = this.moveController.getSceneWildMoveRadius();
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

        for (let i = 0; i < spawnAreas.length * 6; i++) {
            const area = spawnAreas[Phaser.Math.Between(0, spawnAreas.length - 1)];
            const point = this.getRandomPointInAreaWithinBounds(area, 48);
            if (point) return { x: point.x, y: point.y, area };
        }

        return null;
    }

    getRandomPointInAreaWithinBounds(area, attempts = 36) {
        for (let i = 0; i < attempts; i++) {
            const point = this.getRandomPointInArea(area);
            if (point && this.moveController.isPointInsideWildBounds(point.x, point.y)) {
                return point;
            }
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
            if (!Number.isFinite(centerX)
                || !Number.isFinite(centerY)
                || !Number.isFinite(radiusX)
                || !Number.isFinite(radiusY)
                || radiusX <= 0
                || radiusY <= 0) {
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
        if (!Number.isFinite(x)
            || !Number.isFinite(y)
            || !Number.isFinite(width)
            || !Number.isFinite(height)
            || width <= 0
            || height <= 0) {
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
            if (!Number.isFinite(centerX)
                || !Number.isFinite(centerY)
                || !Number.isFinite(radiusX)
                || !Number.isFinite(radiusY)
                || radiusX <= 0
                || radiusY <= 0) {
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
        if (!Number.isFinite(areaX)
            || !Number.isFinite(areaY)
            || !Number.isFinite(width)
            || !Number.isFinite(height)
            || width <= 0
            || height <= 0) {
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
        const container = this.scene.add.container(x, y);
        const hasDynamicSprite = this.createWildDynamicSprite(container, elfId, 60);

        if (!hasDynamicSprite) {
            const baseData = DataLoader.getElf(elfId);
            const displayName = baseData ? baseData.name : `#${elfId}`;

            const graphics = this.scene.add.graphics();
            graphics.fillStyle(0xffaacc, 1);
            graphics.fillCircle(0, 0, 25);
            graphics.fillStyle(0xff88aa, 1);
            graphics.fillCircle(-8, -8, 8);
            graphics.fillCircle(8, -8, 8);
            container.add(graphics);

            const label = this.scene.add.text(0, 35, displayName, {
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
            this.scene.startBattle(container._wildElfId || elfId);
        });

        const moveProfile = this.moveController.getWildMoveProfile(container._wildElfId || elfId);
        this.moveController.addWildElfMovement(container, x, y, {
            spawnArea: options.spawnArea || null,
            moveRadius: options.moveRadius || null,
            moveProfile,
            isPointInsideArea: (px, py, area) => this.isPointInsideArea(px, py, area),
            getFallbackPoint: (area, attempts) => this.getRandomPointInAreaWithinBounds(area, attempts),
            onDirectionChange: (target, direction) => this.playWildDirection(target, direction)
        });

        this.scene.wildElves.push(container);
    }

    createWildDynamicSprite(container, elfId, maxSize) {
        const atlasKey = this.getWildDynamicAtlasKey(elfId, 'front');
        if (!atlasKey) return false;

        const firstFrame = this.getFirstWildFrame(atlasKey);
        if (!firstFrame) return false;

        const sprite = this.scene.add.sprite(0, 0, atlasKey, firstFrame);
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

        const available = keys.filter((key) => this.scene.textures.exists(key));
        return available.length ? available[0] : null;
    }

    getWildFrames(atlasKey) {
        if (this._wildFrameCache[atlasKey]) return this._wildFrameCache[atlasKey];

        let frames = [];
        const atlasJson = this.scene.cache && this.scene.cache.json
            ? this.scene.cache.json.get(atlasKey)
            : null;

        if (atlasJson && atlasJson.frames && typeof atlasJson.frames === 'object') {
            frames = Object.keys(atlasJson.frames);
        } else {
            const texture = this.scene.textures.get(atlasKey);
            if (!texture) {
                this._wildFrameCache[atlasKey] = [];
                return [];
            }
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
        if (this.scene.anims.exists(animKey)) {
            return animKey;
        }

        const frames = this.getWildFrames(atlasKey);
        if (!frames.length) return null;

        this.scene.anims.create({
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

        const shouldFlipX = direction === 'left' && atlasKey.includes('_right');
        container._wildSprite.setFlipX(shouldFlipX);

        const currentAnim = container._wildSprite.anims ? container._wildSprite.anims.currentAnim : null;
        if (container._wildDirection === direction && currentAnim && currentAnim.key === animKey) {
            return;
        }

        container._wildDirection = direction;
        container._wildSprite.play(animKey, true);
    }
}

window.KloseSpawnService = KloseSpawnService;
