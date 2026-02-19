/**
 * BattleAnimator - 战斗视觉动画门面
 *
 * 对外仅暴露 5 个高层方法：
 * - createBackground      创建战斗背景
 * - createMainBattleArea   创建双方精灵角色
 * - createCharacterSprite  创建单个角色精灵容器
 * - playTurnAnimations     播放完整回合动画序列（含飘字分批派发）
 * - playCatchAnimation     播放捕捉演出
 *
 * 内部实现包含：
 * - atlas 帧序缓存与排序
 * - 多段图集播放管线（still/hit 片段）
 * - 物理位移 + still 并行演出
 * - 缺图回退链（battle atlas → external still → shape）
 */

/** 缺图告警去重集合（同类告警仅输出一次） */
const BATTLE_ANIMATOR_WARNED = new Set();

/**
 * 输出一次性告警（同一 token 只打印一次）
 * @param {string} token - 去重标识
 * @param {string} message - 告警内容
 */
function warnAnimatorOnce(token, message) {
    if (BATTLE_ANIMATOR_WARNED.has(token)) {
        return;
    }
    BATTLE_ANIMATOR_WARNED.add(token);
    console.warn(message);
}

/**
 * 在容器内渲染属性图标（优先使用 TypeIconView，缺失时回退圆点）
 * @param {Phaser.Scene} scene - 当前场景
 * @param {Phaser.GameObjects.Container} container - 目标容器
 * @param {number} x - 图标 X 坐标
 * @param {number} y - 图标 Y 坐标
 * @param {string} type - 属性类型
 * @param {Object} [options={}] - { iconSize, fallbackOriginX }
 */
function renderBattleTypeIcon(scene, container, x, y, type, options = {}) {
    if (typeof TypeIconView !== 'undefined' && TypeIconView && typeof TypeIconView.render === 'function') {
        TypeIconView.render(scene, container, x, y, type, {
            iconSize: options.iconSize || 16,
            originX: options.fallbackOriginX ?? 0.5,
            originY: 0.5
        });
        return;
    }

    const radius = Math.max(4, Math.floor((options.iconSize || 16) / 2));
    const fallbackDot = scene.add.circle(x, y, radius, 0x8899aa, 1);
    container.add(fallbackDot);
}

/**
 * 获取精灵在指定动作类型下所有已加载的战斗图集 key
 * @param {Phaser.Scene} scene - 当前场景
 * @param {number} elfId - 精灵 ID
 * @param {string} clipType - 动作类型（'still' / 'hit'）
 * @returns {string[]} 已加载的图集 key 数组
 */
function getAvailableBattleAtlases(scene, elfId, clipType) {
    if (typeof AssetMappings === 'undefined' || typeof AssetMappings.getBattleClipKeys !== 'function') {
        return [];
    }
    const keys = AssetMappings.getBattleClipKeys(elfId, clipType);
    if (!Array.isArray(keys)) {
        return [];
    }
    return keys.filter((key) => scene.textures.exists(key));
}

/**
 * 获取精灵的首个可用战斗图集 key
 * @param {Phaser.Scene} scene - 当前场景
 * @param {number} elfId - 精灵 ID
 * @param {string} clipType - 动作类型
 * @returns {string|null} 图集 key 或 null
 */
function pickBattleAtlas(scene, elfId, clipType) {
    const keys = getAvailableBattleAtlases(scene, elfId, clipType);
    return keys.length > 0 ? keys[0] : null;
}

/**
 * 获取精灵的外部静态贴图 key（用于缺图回退链第二级）
 * @param {number} elfId - 精灵 ID
 * @returns {string|null} 贴图 key 或 null
 */
function getExternalStillKey(elfId) {
    if (typeof AssetMappings === 'undefined' || typeof AssetMappings.getExternalStillKey !== 'function') {
        return null;
    }
    return AssetMappings.getExternalStillKey(elfId);
}

/**
 * 解析帧名中的数字用于排序
 * 优先级：括号数字 (1) > 纯数字 1.png > 尾部数字 frame1 > 其他
 * @param {string} frameName - 帧名
 * @param {number} fallbackIndex - 原始索引（用于同组排序兜底）
 * @returns {{ group: number, value: number, fallbackIndex: number }}
 */
function getFrameOrderValue(frameName, fallbackIndex) {
    const parenMatch = frameName.match(/\((\d+)\)/);
    if (parenMatch) {
        return { group: 0, value: parseInt(parenMatch[1], 10), fallbackIndex };
    }

    const plainNumber = frameName.match(/^(\d+)(?:\.[a-zA-Z0-9]+)?$/);
    if (plainNumber) {
        return { group: 1, value: parseInt(plainNumber[1], 10), fallbackIndex };
    }

    const tailNumber = frameName.match(/(\d+)(?!.*\d)/);
    if (tailNumber) {
        return { group: 2, value: parseInt(tailNumber[1], 10), fallbackIndex };
    }

    return { group: 3, value: Number.MAX_SAFE_INTEGER, fallbackIndex };
}

/**
 * 获取图集的有序帧名列表（带缓存）
 * @param {Phaser.Scene} scene - 当前场景
 * @param {string} atlasKey - 图集 key
 * @returns {string[]} 排序后的帧名数组
 */
function getAtlasFrameNames(scene, atlasKey) {
    if (!scene._battleAnimatorFrameCache) {
        scene._battleAnimatorFrameCache = {};
    }
    if (scene._battleAnimatorFrameCache[atlasKey]) {
        return scene._battleAnimatorFrameCache[atlasKey];
    }

    let frameNames = [];
    const atlasJson = scene.cache && scene.cache.json ? scene.cache.json.get(atlasKey) : null;
    if (atlasJson && atlasJson.frames && typeof atlasJson.frames === 'object') {
        frameNames = Object.keys(atlasJson.frames);
    } else {
        const texture = scene.textures.get(atlasKey);
        if (!texture) {
            scene._battleAnimatorFrameCache[atlasKey] = [];
            return [];
        }
        frameNames = texture.getFrameNames().filter((name) => name !== '__BASE');
    }

    const ordered = frameNames
        .map((name, index) => ({ name, order: getFrameOrderValue(name, index) }))
        .sort((a, b) => {
            if (a.order.group !== b.order.group) {
                return a.order.group - b.order.group;
            }
            if (a.order.value !== b.order.value) {
                return a.order.value - b.order.value;
            }
            if (a.order.fallbackIndex !== b.order.fallbackIndex) {
                return a.order.fallbackIndex - b.order.fallbackIndex;
            }
            return a.name.localeCompare(b.name, 'en');
        })
        .map((item) => item.name);

    scene._battleAnimatorFrameCache[atlasKey] = ordered;
    return ordered;
}

/**
 * 获取图集的第一帧帧名
 * @param {Phaser.Scene} scene
 * @param {string} atlasKey
 * @returns {string|null}
 */
function getFirstAtlasFrameName(scene, atlasKey) {
    const frames = getAtlasFrameNames(scene, atlasKey);
    return frames.length > 0 ? frames[0] : null;
}

/**
 * 获取战斗动画帧率（循环播放较慢，单次较快）
 * @param {boolean} loop - 是否循环播放
 * @returns {number} 帧率
 */
function getBattleFrameRate(loop) {
    return loop ? 8 : 12;
}

/**
 * 确保指定图集的 Phaser 动画已创建（幂等）
 * @param {Phaser.Scene} scene
 * @param {string} atlasKey - 图集 key
 * @param {boolean} loop - 是否循环
 * @returns {string|null} 动画 key 或 null（帧为空时）
 */
function ensureBattleAnimation(scene, atlasKey, loop) {
    const suffix = loop ? 'loop' : 'once';
    const animKey = `battle_anim_${atlasKey}_${suffix}`;
    if (scene.anims.exists(animKey)) {
        return animKey;
    }

    const frameNames = getAtlasFrameNames(scene, atlasKey);
    if (frameNames.length === 0) {
        return null;
    }

    scene.anims.create({
        key: animKey,
        frames: frameNames.map((frame) => ({ key: atlasKey, frame })),
        frameRate: getBattleFrameRate(loop),
        repeat: loop ? -1 : 0
    });

    return animKey;
}

/**
 * 根据是否为玩家方设置精灵水平翻转
 * @param {Phaser.GameObjects.Container} container - 角色容器（需含 _animSprite 和 _isPlayerSide）
 */
function applyBattleSideFlip(container) {
    if (!container || !container._animSprite || typeof container._animSprite.setFlipX !== 'function') {
        return;
    }
    container._animSprite.setFlipX(container._isPlayerSide === false);
}

/**
 * 播放指定图集动画（单次播放返回 Promise，循环播放立即 resolve）
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Container} container - 角色容器
 * @param {string} atlasKey - 图集 key
 * @param {boolean} [loop=false] - 是否循环
 * @returns {Promise<boolean>} 是否成功播放
 */
function playAtlasClip(scene, container, atlasKey, loop = false) {
    if (!container || !container.scene || !container._animSprite || !atlasKey) {
        return Promise.resolve(false);
    }

    const animKey = ensureBattleAnimation(scene, atlasKey, loop);
    if (!animKey) {
        return Promise.resolve(false);
    }

    const sprite = container._animSprite;
    applyBattleSideFlip(container);

    if (loop) {
        sprite.play(animKey, true);
        return Promise.resolve(true);
    }

    return new Promise((resolve) => {
        let settled = false;
        const frames = getAtlasFrameNames(scene, atlasKey);
        const frameRate = getBattleFrameRate(false);
        const safetyMs = Math.max(260, Math.ceil((frames.length / frameRate) * 1000) + 280);

        const finish = () => {
            if (settled) {
                return;
            }
            settled = true;
            resolve(true);
        };

        const timer = scene.time.delayedCall(safetyMs, finish);
        sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            if (timer && !timer.hasDispatched) {
                timer.remove(false);
            }
            finish();
        });

        sprite.play(animKey, true);
    });
}

/**
 * 播放精灵指定动作类型的动画片段
 * 优先播放对应 clipType 的图集，缺失时回退到 'still'
 * 非循环模式下串行播放同 clipType 的所有图集片段
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Container} container - 角色容器（需为 atlas 渲染模式）
 * @param {string} clipType - 动作类型（'still' / 'hit'）
 * @param {boolean} [loop=false] - 是否循环
 * @returns {Promise<boolean>} 是否成功播放
 */
function playElfClip(scene, container, clipType, loop = false) {
    if (!container || !container.scene || container._renderMode !== 'atlas') {
        return Promise.resolve(false);
    }

    let atlasKeys = getAvailableBattleAtlases(scene, container._elfId, clipType);
    if (atlasKeys.length === 0 && clipType !== 'still') {
        atlasKeys = getAvailableBattleAtlases(scene, container._elfId, 'still');
    }
    if (atlasKeys.length === 0) {
        return Promise.resolve(false);
    }

    if (loop) {
        return playAtlasClip(scene, container, atlasKeys[0], true);
    }

    return atlasKeys.reduce((prev, atlasKey) => {
        return prev.then(async (playedAny) => {
            const played = await playAtlasClip(scene, container, atlasKey, false);
            return playedAny || played;
        });
    }, Promise.resolve(false));
}

/**
 * 等待指定毫秒（通过 Phaser 定时器实现）
 * @param {Phaser.Scene} scene
 * @param {number} ms - 毫秒数
 * @returns {Promise<void>}
 */
function waitMs(scene, ms) {
    return new Promise((resolve) => {
        scene.time.delayedCall(ms, resolve);
    });
}

/**
 * 计算物理攻击位移的目标 X 坐标
 * 综合考虑双方距离、前进比例与屏幕边界夹紧
 * @param {Phaser.Scene} scene - 战斗场景
 * @param {boolean} attackerIsPlayer - 攻击方是否为玩家
 * @returns {number} 位移目标 X 坐标
 */
function getPhysicalStrikeX(scene, attackerIsPlayer) {
    const attackerSprite = attackerIsPlayer ? scene.playerSprite : scene.enemySprite;
    const defenderSprite = attackerIsPlayer ? scene.enemySprite : scene.playerSprite;

    let targetX = null;
    if (attackerSprite && defenderSprite) {
        const direction = attackerIsPlayer ? 1 : -1;
        const distance = Math.abs(defenderSprite.x - attackerSprite.x);
        const advance = Math.max(90, Math.min(140, Math.round(distance * 0.24)));
        targetX = attackerSprite.x + direction * advance;
    } else if (attackerSprite) {
        targetX = attackerSprite.x + (attackerIsPlayer ? 120 : -120);
    } else {
        targetX = attackerIsPlayer ? (scene.W * 0.36) : (scene.W * 0.64);
    }

    const minX = Math.max(80, Math.floor(scene.W * 0.15));
    const maxX = Math.min(scene.W - 80, Math.floor(scene.W * 0.85));
    return Math.max(minX, Math.min(maxX, targetX));
}

/**
 * 计算精灵 still 动画的持续时间（毫秒）
 * @param {Phaser.Scene} scene
 * @param {number} elfId - 精灵 ID
 * @returns {number} 持续毫秒数
 */
function getStillClipDurationMs(scene, elfId) {
    const atlasKeys = getAvailableBattleAtlases(scene, elfId, 'still');
    if (atlasKeys.length === 0) {
        return 0;
    }

    let totalFrames = 0;
    for (const atlasKey of atlasKeys) {
        totalFrames += getAtlasFrameNames(scene, atlasKey).length;
    }
    if (totalFrames <= 0) {
        return 0;
    }

    return Math.ceil((totalFrames / getBattleFrameRate(false)) * 1000);
}

/**
 * 物理攻击演出：still 动画与前冲-回退位移并行执行
 * 位移在 still 动画的前导帧后启动，前冲到 strikeX 后回退原位
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Container} attacker - 攻击方容器
 * @param {number} strikeX - 前冲目标 X 坐标
 * @returns {Promise<boolean>} 是否播放成功
 */
function playStrikeMotionWithStill(scene, attacker, strikeX) {
    if (!attacker || !attacker.scene) {
        return Promise.resolve(false);
    }

    const startX = attacker.x;
    const startY = attacker.y;
    const attackDuration = Math.max(360, getStillClipDurationMs(scene, attacker._elfId));
    const attackFrameRate = getBattleFrameRate(false);
    const leadFrames = 5.5;
    let leadInMs = Math.round((leadFrames / attackFrameRate) * 1000);
    const maxLeadInMs = Math.max(80, attackDuration - 160);
    leadInMs = Math.min(Math.max(80, leadInMs), maxLeadInMs);

    const motionDuration = Math.max(160, attackDuration - leadInMs);
    const forwardDuration = Math.max(70, Math.round(motionDuration * 0.45));
    const backwardDuration = Math.max(70, motionDuration - forwardDuration);

    const motionPromise = new Promise((resolve) => {
        scene.tweens.killTweensOf(attacker);
        scene.time.delayedCall(leadInMs, () => {
            if (!attacker || !attacker.scene) {
                resolve(false);
                return;
            }

            scene.tweens.add({
                targets: attacker,
                x: strikeX,
                y: startY,
                duration: forwardDuration,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    scene.tweens.add({
                        targets: attacker,
                        x: startX,
                        y: startY,
                        duration: backwardDuration,
                        ease: 'Sine.easeInOut',
                        onComplete: () => {
                            attacker.setPosition(startX, startY);
                            resolve(true);
                        }
                    });
                }
            });
        });
    });

    const stillPromise = playElfClip(scene, attacker, 'still', false);
    return Promise.all([motionPromise, stillPromise]).then(([, played]) => {
        attacker.setPosition(startX, startY);
        return played;
    });
}

/**
 * 播放技能释放动画序列
 * - 物理/特殊技能：前冲 + still → 等待 → 受击方播 hit 或闪烁
 * - 状态技能：仅等待 120ms
 * 播放完毕后双方回到 still 循环
 * @param {Phaser.Scene} scene - 战斗场景
 * @param {Object} skillEvent - skill_cast 事件数据
 */
async function playSkillCastAnimation(scene, skillEvent) {
    const attacker = skillEvent.actor === 'player' ? scene.playerSprite : scene.enemySprite;
    const defender = skillEvent.actor === 'player' ? scene.enemySprite : scene.playerSprite;
    const defenderElf = skillEvent.actor === 'player' ? scene.enemyElf : scene.playerElf;

    const skillCategory = skillEvent.skillCategory || 'status';
    const shouldStrike = skillCategory === 'physical' || skillCategory === 'special';

    if (shouldStrike) {
        const strikeX = getPhysicalStrikeX(scene, skillEvent.actor === 'player');
        await playStrikeMotionWithStill(scene, attacker, strikeX);
        await waitMs(scene, 60);

        const playedHit = await playElfClip(scene, defender, 'hit', false);
        if (!playedHit && defender && defender.scene) {
            scene.tweens.add({
                targets: defender,
                alpha: 0.35,
                duration: 80,
                yoyo: true,
                repeat: 1
            });
        }
    } else {
        await waitMs(scene, 120);
    }

    await playElfClip(scene, attacker, 'still', true);
    if (!defenderElf.isFainted()) {
        await playElfClip(scene, defender, 'still', true);
    }
}

/**
 * 动画锁包装器：在 task 执行期间锁定动画状态，结束后解锁
 * 支持嵌套计数，全部解锁后触发 onUnlock 回调
 * @param {Phaser.Scene} scene - 战斗场景
 * @param {Function} task - 异步任务
 * @param {Function} [onUnlock] - 解锁后回调
 * @returns {Promise<*>} task 的返回值
 */
function withAnimationLock(scene, task, onUnlock) {
    scene._animationLockCount = (scene._animationLockCount || 0) + 1;
    scene.isAnimationPlaying = true;

    return Promise.resolve()
        .then(task)
        .finally(() => {
            scene._animationLockCount = Math.max(0, (scene._animationLockCount || 1) - 1);
            if (scene._animationLockCount === 0) {
                scene.isAnimationPlaying = false;
                if (typeof onUnlock === 'function') {
                    onUnlock();
                }
            }
        });
}

/**
 * 绘制带模糊高斯层和暗色滤镜的战斗背景
 * @param {Phaser.Scene} scene - 战斗场景
 * @param {string} backgroundKey - 背景贴图 key
 */
function drawFilteredSceneBackground(scene, backgroundKey) {
    const blurOffsets = [
        { x: -2, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: -2 },
        { x: 0, y: 2 }
    ];

    blurOffsets.forEach((offset) => {
        const blurLayer = scene.add.image(scene.W / 2 + offset.x, scene.H / 2 + offset.y, backgroundKey);
        blurLayer.setDisplaySize(scene.W + 4, scene.H + 4);
        blurLayer.setAlpha(0.12);
        blurLayer.setDepth(-30);
    });

    const base = scene.add.image(scene.W / 2, scene.H / 2, backgroundKey);
    base.setDisplaySize(scene.W, scene.H);
    base.setDepth(-25);

    scene.add.rectangle(scene.W / 2, scene.H / 2, scene.W, scene.H, 0x6f7f8f, 0.18).setDepth(-20);
    scene.add.rectangle(scene.W / 2, scene.H / 2, scene.W, scene.H, 0x000000, 0.42).setDepth(-19);
    scene.add.rectangle(scene.W / 2, scene.H / 2, scene.W, scene.H, 0x5b3a1b, 0.14).setDepth(-18);
}

/**
 * 播放胶囊摇晃动画（左右摆动指定次数）
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Graphics} capsule - 胶囊图形
 * @param {number} times - 摇晃次数
 * @param {Function} onComplete - 完成后回调
 */
function playCapsuleShake(scene, capsule, times, onComplete) {
    let shakeCount = 0;
    const doShake = () => {
        if (shakeCount >= times) {
            onComplete();
            return;
        }
        shakeCount++;

        scene.tweens.add({
            targets: capsule,
            angle: 15,
            duration: 150,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                scene.tweens.add({
                    targets: capsule,
                    angle: -15,
                    duration: 150,
                    yoyo: true,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        scene.time.delayedCall(300, doShake);
                    }
                });
            }
        });
    };
    doShake();
}

/**
 * 播放捕捉成功特效（星星散射 + GET! 文字上浮）
 * @param {Phaser.Scene} scene
 * @param {number} x - 特效中心 X
 * @param {number} y - 特效中心 Y
 * @param {Function} onComplete - 完成后回调
 */
function playSuccessEffect(scene, x, y, onComplete) {
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const star = scene.add.text(x, y, '✨', { fontSize: '24px' }).setOrigin(0.5);

        scene.tweens.add({
            targets: star,
            x: x + Math.cos(angle) * 60,
            y: y + Math.sin(angle) * 60,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => star.destroy()
        });
    }

    const successText = scene.add.text(x, y - 40, 'GET!', {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#ffdd44',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5).setDepth(60);

    scene.tweens.add({
        targets: successText,
        y: y - 80,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
            successText.destroy();
            onComplete();
        }
    });
}

/**
 * 播放捕捉失败特效（胶囊变形 → 敌方精灵弹出复原）
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Graphics} capsule - 胶囊图形
 * @param {Function} onComplete - 完成后回调
 */
function playFailEffect(scene, capsule, onComplete) {
    scene.tweens.add({
        targets: capsule,
        scaleX: 1.5,
        scaleY: 0.5,
        duration: 150,
        yoyo: true,
        onComplete: () => {
            scene.enemySprite.setPosition(capsule.x, capsule.y);
            scene.tweens.add({
                targets: scene.enemySprite,
                x: scene.W - 200,
                y: 230,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                duration: 400,
                ease: 'Back.easeOut',
                onComplete
            });
        }
    });
}

const BattleAnimator = {
    /**
     * 创建战斗背景
     * 优先使用场景传入的背景贴图（带模糊 + 暗化滤镜），缺失时绘制默认渐变背景
     * 以 BattleScene 的 this 执行
     */
    createBackground() {
        if (this.battleBackgroundKey && this.textures.exists(this.battleBackgroundKey)) {
            drawFilteredSceneBackground(this, this.battleBackgroundKey);
            return;
        }

        const g = this.add.graphics();
        g.fillGradientStyle(0x5588bb, 0x5588bb, 0x334466, 0x334466, 1);
        g.fillRect(0, 0, this.W, this.H);
        g.fillStyle(0x446633, 1);
        g.fillRect(0, 280, this.W, 150);
        g.lineStyle(2, 0x335522);
        g.lineBetween(0, 280, this.W, 280);
    },

    /**
     * 创建双方精灵容器并赋值到 this.playerSprite / this.enemySprite
     * 以 BattleScene 的 this 执行
     */
    createMainBattleArea() {
        this.playerSprite = this.createCharacterSprite(200, 230, this.playerElf, true);
        this.enemySprite = this.createCharacterSprite(this.W - 200, 230, this.enemyElf, false);
    },

    /**
     * 创建单个角色精灵容器
     * 回退链：battle atlas → external still → 几何 shape + 属性图标
     * @param {number} x - 容器 X
     * @param {number} y - 容器 Y
     * @param {Elf} elf - 精灵实例
     * @param {boolean} isPlayer - 是否为玩家方
     * @returns {Phaser.GameObjects.Container} 创建的容器（含 _animSprite / _renderMode / _elfId）
     */
    createCharacterSprite(x, y, elf, isPlayer) {
        const container = this.add.container(x, y);
        const size = 80;

        container._isPlayerSide = isPlayer;
        container._elfId = elf.id;
        container._renderMode = 'shape';

        const stillAtlasKey = pickBattleAtlas(this, elf.id, 'still');
        const firstStillFrame = stillAtlasKey ? getFirstAtlasFrameName(this, stillAtlasKey) : null;

        if (stillAtlasKey && firstStillFrame) {
            const sprite = this.add.sprite(0, 0, stillAtlasKey, firstStillFrame);
            const maxSize = size * 2;
            const scale = Math.min(maxSize / sprite.width, maxSize / sprite.height);
            sprite.setScale(scale);

            container.add(sprite);
            container._animSprite = sprite;
            container._renderMode = 'atlas';

            applyBattleSideFlip(container);
            playElfClip(this, container, 'still', true);
            return container;
        }

        const externalStillKey = getExternalStillKey(elf.id);
        if (externalStillKey && this.textures.exists(externalStillKey)) {
            const image = this.add.image(0, 0, externalStillKey);
            const maxSize = size * 1.9;
            const scale = Math.min(maxSize / image.width, maxSize / image.height);
            image.setScale(scale);
            if (!isPlayer) {
                image.setFlipX(true);
            }

            container.add(image);
            container._animSprite = image;
            container._renderMode = 'external';

            warnAnimatorOnce(
                `battle-fallback-external:${elf.id}`,
                `[BattleAnimator] battle atlas 缺失，回退 external still: elfId=${elf.id}, key=${externalStillKey}`
            );
            return container;
        }

        warnAnimatorOnce(
            `battle-fallback-shape:${elf.id}`,
            `[BattleAnimator] 精灵贴图缺失，回退 shape: elfId=${elf.id}, atlas=${stillAtlasKey || 'null'}, still=${externalStillKey || 'null'}`
        );

        const circle = this.add.graphics();
        const color = isPlayer ? 0x4499ee : 0xee5544;
        circle.fillStyle(color, 1);
        circle.fillCircle(0, 0, size);
        circle.lineStyle(4, 0xffffff, 0.9);
        circle.strokeCircle(0, 0, size);
        container.add(circle);

        const nameText = this.add.text(0, -10, elf.name, {
            fontSize: '22px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(nameText);

        renderBattleTypeIcon(this, container, 0, 20, elf.type, {
            iconSize: 18,
            fallbackOriginX: 0.5
        });

        return container;
    },

    /**
     * 播放完整回合动画序列
     * 流程：捕捉演出 → 遍历 skill_cast 事件并逐技能播放 → 飘字分批派发 → 刷新 HUD
     * 飘字策略：每个技能动画后立即派发该技能窗口内的 hp_change，避免延迟到回合末
     * @param {Object} result - 回合结果对象（protocolVersion=2）
     * @param {Object} [options={}] - { onUnlock: Function }
     * @returns {Promise<{ catchResult, floatTextsQueued }>}
     */
    async playTurnAnimations(result, options = {}) {
        const events = Array.isArray(result && result.events) ? result.events : [];
        const catchEvent = events.find((event) => event.type === 'catch_result');

        return withAnimationLock(
            this,
            async () => {
                const catchResult = catchEvent
                    ? (catchEvent.result || null)
                    : ((result && result.catchResult) || null);
                let floatTextsQueued = false;

                const isSkillCastEvent = (event) => event && (event.type === 'skill_cast' || event.type === 'skillCast');
                const isHpChangeEvent = (event) => {
                    return event
                        && (event.type === BattleManager.EVENT.HP_CHANGE || event.type === 'hp_change')
                        && Number.isFinite(event.delta)
                        && event.delta !== 0;
                };

                /** 将 HP 变化事件批量派发为飘字 */
                const queueFloatTexts = (hpEvents) => {
                    if (!Array.isArray(hpEvents) || hpEvents.length === 0) {
                        return;
                    }
                    if (typeof this.showTurnFloatTexts !== 'function') {
                        return;
                    }

                    this.showTurnFloatTexts({ events: hpEvents });
                    floatTextsQueued = true;
                };

                const consumedHpIndexes = new Set();
                /** 派发 [startIndex, endIndex) 范围内的 hp_change 事件 */
                const queueHpChangesInRange = (startIndex, endIndex) => {
                    if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex) || startIndex >= endIndex) {
                        return;
                    }

                    const hpEvents = [];
                    for (let index = startIndex; index < endIndex; index++) {
                        const event = events[index];
                        if (!isHpChangeEvent(event)) {
                            continue;
                        }

                        hpEvents.push(event);
                        consumedHpIndexes.add(index);
                    }

                    queueFloatTexts(hpEvents);
                };

                if (catchResult) {
                    await this.playCatchAnimation(catchResult);
                }

                for (let eventIndex = 0; eventIndex < events.length; eventIndex++) {
                    const event = events[eventIndex];
                    if (isSkillCastEvent(event)) {
                        await playSkillCastAnimation(this, event);

                        this.updateStatusHp('player');
                        this.updateStatusHp('enemy');
                        this.updateSkillPP();

                        let nextSkillIndex = events.length;
                        for (let index = eventIndex + 1; index < events.length; index++) {
                            if (isSkillCastEvent(events[index])) {
                                nextSkillIndex = index;
                                break;
                            }
                        }

                        queueHpChangesInRange(eventIndex + 1, nextSkillIndex);
                    }
                }

                const remainingHpEvents = [];
                for (let index = 0; index < events.length; index++) {
                    if (consumedHpIndexes.has(index)) {
                        continue;
                    }

                    const event = events[index];
                    if (isHpChangeEvent(event)) {
                        remainingHpEvents.push(event);
                    }
                }
                queueFloatTexts(remainingHpEvents);

                this.updateStatusHp('player');
                this.updateStatusHp('enemy');
                this.updateSkillPP();

                return {
                    catchResult,
                    floatTextsQueued
                };
            },
            options.onUnlock
        );
    },

    /**
     * 播放捕捉演出动画
     * 流程：胶囊飞出 → 敌方精灵缩小 → 胶囊落地 → 摇晃 → 成功/失败特效
     * @param {Object} catchResult - 捕捉结果数据（{ shakes, success }）
     * @returns {Promise<void>}
     */
    playCatchAnimation(catchResult) {
        return new Promise((resolve) => {
            const shakes = catchResult.shakes;
            const success = catchResult.success;

            const capsule = this.add.graphics();
            const capsuleX = this.playerSprite.x + 50;
            const capsuleY = this.playerSprite.y - 50;
            const targetX = this.enemySprite.x;
            const targetY = this.enemySprite.y - 30;

            capsule.fillStyle(0xee4444, 1);
            capsule.fillCircle(0, -8, 15);
            capsule.fillStyle(0xffffff, 1);
            capsule.fillCircle(0, 8, 15);
            capsule.fillStyle(0x222222, 1);
            capsule.fillRect(-18, -3, 36, 6);
            capsule.fillStyle(0xffffff, 1);
            capsule.fillCircle(0, 0, 6);
            capsule.setPosition(capsuleX, capsuleY);
            capsule.setDepth(50);

            this.tweens.add({
                targets: capsule,
                x: targetX,
                y: targetY,
                duration: 500,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    this.tweens.add({
                        targets: this.enemySprite,
                        scaleX: 0,
                        scaleY: 0,
                        alpha: 0,
                        duration: 300,
                        ease: 'Back.easeIn',
                        onComplete: () => {
                            this.tweens.add({
                                targets: capsule,
                                y: targetY + 50,
                                duration: 200,
                                ease: 'Bounce.easeOut',
                                onComplete: () => {
                                    playCapsuleShake(this, capsule, shakes, () => {
                                        if (success) {
                                            playSuccessEffect(this, capsule.x, capsule.y, () => {
                                                capsule.destroy();
                                                resolve();
                                            });
                                        } else {
                                            playFailEffect(this, capsule, () => {
                                                capsule.destroy();
                                                this.enemySprite.setScale(1);
                                                this.enemySprite.setAlpha(1);
                                                resolve();
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleAnimator', BattleAnimator);
}

window.BattleAnimator = BattleAnimator;
