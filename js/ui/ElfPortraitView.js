/**
 * ElfPortraitView - 精灵静态肖像渲染器
 *
 * 职责：
 * - 统一提供精灵静态图片的渲染接口
 * - 回退链：外部静态图 → 战斗图集的首帧
 * - 自动缩放以适配指定尺寸
 */

const ElfPortraitView = {
    /** @type {Set<string>} 已警告过缺失图片的精灵（避免重复警告） */
    _warnedMissing: new Set(),

    /**
     * 将精灵静态肖像添加到容器中
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.Container} container
     * @param {number} x
     * @param {number} y
     * @param {number} elfId
     * @param {Object} [options={}] - { maxSize, maxWidth, maxHeight, originX, originY, tint, alpha, warnTag }
     * @returns {Phaser.GameObjects.GameObject|null}
     */
    addStillPortrait(scene, container, x, y, elfId, options = {}) {
        if (!scene || !container || elfId == null) {
            return null;
        }

        const originX = options.originX ?? 0.5;
        const originY = options.originY ?? 0.5;

        const externalStillKey = this.getExternalStillKey(elfId);
        if (externalStillKey && scene.textures.exists(externalStillKey)) {
            return this.addImage(scene, container, x, y, externalStillKey, {
                maxSize: options.maxSize,
                maxWidth: options.maxWidth,
                maxHeight: options.maxHeight,
                originX,
                originY,
                tint: options.tint,
                alpha: options.alpha
            });
        }

        const battleStillKeys = this.getBattleStillKeys(elfId);
        for (const atlasKey of battleStillKeys) {
            if (!scene.textures.exists(atlasKey)) {
                continue;
            }

            const firstFrame = this.getFirstAtlasFrameName(scene, atlasKey);
            if (!firstFrame) {
                continue;
            }

            const sprite = scene.add.sprite(x, y, atlasKey, firstFrame).setOrigin(originX, originY);
            this.fitScale(sprite, options.maxSize, options.maxWidth, options.maxHeight);
            if (options.tint != null) {
                sprite.setTint(options.tint);
            }
            if (options.alpha != null) {
                sprite.setAlpha(options.alpha);
            }
            container.add(sprite);
            return sprite;
        }

        this.warnMissing(elfId, options.warnTag || 'ElfPortraitView', externalStillKey);
        return null;
    },

    /**
     * 添加图片到容器
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.Container} container
     * @param {number} x
     * @param {number} y
     * @param {string} key - 纹理键
     * @param {Object} [options={}]
     * @returns {Phaser.GameObjects.Image}
     */
    addImage(scene, container, x, y, key, options = {}) {
        const image = scene.add.image(x, y, key).setOrigin(options.originX ?? 0.5, options.originY ?? 0.5);
        this.fitScale(image, options.maxSize, options.maxWidth, options.maxHeight);
        if (options.tint != null) {
            image.setTint(options.tint);
        }
        if (options.alpha != null) {
            image.setAlpha(options.alpha);
        }
        container.add(image);
        return image;
    },

    /**
     * 等比缩放以适配限制尺寸
     * @param {Phaser.GameObjects.GameObject} displayObject
     * @param {number} [maxSize]
     * @param {number} [maxWidth]
     * @param {number} [maxHeight]
     */
    fitScale(displayObject, maxSize, maxWidth, maxHeight) {
        const widthLimit = maxSize || maxWidth;
        const heightLimit = maxSize || maxHeight;
        if (!widthLimit || !heightLimit || !displayObject.width || !displayObject.height) {
            return;
        }
        const scale = Math.min(widthLimit / displayObject.width, heightLimit / displayObject.height);
        displayObject.setScale(scale);
    },

    /**
     * 获取外部静态图纹理键
     * @param {number} elfId
     * @returns {string|null}
     */
    getExternalStillKey(elfId) {
        if (typeof AssetMappings === 'undefined' || typeof AssetMappings.getExternalStillKey !== 'function') {
            return null;
        }
        return AssetMappings.getExternalStillKey(elfId);
    },

    /**
     * 获取战斗图集键列表（用于首帧回退）
     * @param {number} elfId
     * @returns {string[]}
     */
    getBattleStillKeys(elfId) {
        if (typeof AssetMappings === 'undefined' || typeof AssetMappings.getBattleClipKeys !== 'function') {
            return [];
        }
        const keys = AssetMappings.getBattleClipKeys(elfId, 'still');
        return Array.isArray(keys) ? keys : [];
    },

    /**
     * 获取图集的第一帧名称
     * @param {Phaser.Scene} scene
     * @param {string} atlasKey
     * @returns {string|null}
     */
    getFirstAtlasFrameName(scene, atlasKey) {
        const frameNames = this.getAtlasFrameNames(scene, atlasKey);
        return frameNames.length ? frameNames[0] : null;
    },

    /**
     * 获取图集所有帧名称（按自然顺序排序）
     * @param {Phaser.Scene} scene
     * @param {string} atlasKey
     * @returns {string[]}
     */
    getAtlasFrameNames(scene, atlasKey) {
        if (!scene || !atlasKey) {
            return [];
        }

        let frameNames = [];
        const atlasJson = scene.cache && scene.cache.json ? scene.cache.json.get(atlasKey) : null;
        if (atlasJson && atlasJson.frames && typeof atlasJson.frames === 'object') {
            frameNames = Object.keys(atlasJson.frames);
        } else {
            const texture = scene.textures.get(atlasKey);
            if (!texture) {
                return [];
            }
            frameNames = texture.getFrameNames().filter((name) => name !== '__BASE');
        }

        return frameNames
            .map((name, index) => ({ name, order: this.getFrameOrderValue(name, index) }))
            .sort((a, b) => {
                if (a.order.group !== b.order.group) return a.order.group - b.order.group;
                if (a.order.value !== b.order.value) return a.order.value - b.order.value;
                if (a.order.fallbackIndex !== b.order.fallbackIndex) {
                    return a.order.fallbackIndex - b.order.fallbackIndex;
                }
                return a.name.localeCompare(b.name, 'en');
            })
            .map((item) => item.name);
    },

    /**
     * 计算帧排序权重（支持多种命名格式）
     * @param {string} frameName
     * @param {number} fallbackIndex
     * @returns {{ group: number, value: number, fallbackIndex: number }}
     */
    getFrameOrderValue(frameName, fallbackIndex) {
        const parenMatch = frameName.match(/\((\d+)\)/);
        if (parenMatch) return { group: 0, value: parseInt(parenMatch[1], 10), fallbackIndex };

        const plainNumber = frameName.match(/^(\d+)(?:\.[a-zA-Z0-9]+)?$/);
        if (plainNumber) return { group: 1, value: parseInt(plainNumber[1], 10), fallbackIndex };

        const tailNumber = frameName.match(/(\d+)(?!.*\d)/);
        if (tailNumber) return { group: 2, value: parseInt(tailNumber[1], 10), fallbackIndex };

        return { group: 3, value: Number.MAX_SAFE_INTEGER, fallbackIndex };
    },

    /**
     * 记录精灵图片缺失警告（每个精灵只警告一次）
     * @param {number} elfId
     * @param {string} warnTag
     * @param {string|null} externalStillKey
     */
    warnMissing(elfId, warnTag, externalStillKey) {
        const token = `${warnTag}:${elfId}`;
        if (this._warnedMissing.has(token)) {
            return;
        }
        this._warnedMissing.add(token);
        console.warn(`[${warnTag}] 精灵图片缺失: elfId=${elfId}, stillKey=${externalStillKey || 'null'}`);
    }
};

window.ElfPortraitView = ElfPortraitView;
