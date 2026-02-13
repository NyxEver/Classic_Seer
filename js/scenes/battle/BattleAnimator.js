/**
 * BattleAnimator - battle visual facade.
 *
 * Public surface is intentionally small:
 * - createBackground
 * - createMainBattleArea
 * - createCharacterSprite
 * - playTurnAnimations
 * - playCatchAnimation
 */

const BATTLE_ANIMATOR_WARNED = new Set();

function warnAnimatorOnce(token, message) {
    if (BATTLE_ANIMATOR_WARNED.has(token)) {
        return;
    }
    BATTLE_ANIMATOR_WARNED.add(token);
    console.warn(message);
}

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

function pickBattleAtlas(scene, elfId, clipType) {
    const keys = getAvailableBattleAtlases(scene, elfId, clipType);
    return keys.length > 0 ? keys[0] : null;
}

function getExternalStillKey(elfId) {
    if (typeof AssetMappings === 'undefined' || typeof AssetMappings.getExternalStillKey !== 'function') {
        return null;
    }
    return AssetMappings.getExternalStillKey(elfId);
}

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

function getFirstAtlasFrameName(scene, atlasKey) {
    const frames = getAtlasFrameNames(scene, atlasKey);
    return frames.length > 0 ? frames[0] : null;
}

function getBattleFrameRate(loop) {
    return loop ? 8 : 12;
}

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

function applyBattleSideFlip(container) {
    if (!container || !container._animSprite || typeof container._animSprite.setFlipX !== 'function') {
        return;
    }
    container._animSprite.setFlipX(container._isPlayerSide === false);
}

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

function waitMs(scene, ms) {
    return new Promise((resolve) => {
        scene.time.delayedCall(ms, resolve);
    });
}

function getPhysicalStrikeX(scene, attackerIsPlayer) {
    if (attackerIsPlayer) {
        if (scene.enemyStatus && scene.enemyStatus.container) {
            return scene.enemyStatus.container.x - 40;
        }
        return scene.W - 320;
    }

    if (scene.playerStatus && scene.playerStatus.container) {
        return scene.playerStatus.container.x + 290;
    }
    return 320;
}

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

    createMainBattleArea() {
        this.playerSprite = this.createCharacterSprite(200, 230, this.playerElf, true);
        this.enemySprite = this.createCharacterSprite(this.W - 200, 230, this.enemyElf, false);
    },

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

    async playTurnAnimations(result, options = {}) {
        const events = Array.isArray(result && result.events) ? result.events : [];
        const catchEvent = events.find((event) => event.type === 'catch_result');

        return withAnimationLock(
            this,
            async () => {
                const catchResult = catchEvent
                    ? (catchEvent.result || null)
                    : ((result && result.catchResult) || null);

                if (catchResult) {
                    await this.playCatchAnimation(catchResult);
                }

                for (const event of events) {
                    if (event.type === 'skill_cast' || event.type === 'skillCast') {
                        await playSkillCastAnimation(this, event);
                        this.updateStatusHp('player');
                        this.updateStatusHp('enemy');
                        this.updateSkillPP();
                    }
                }

                this.updateStatusHp('player');
                this.updateStatusHp('enemy');
                this.updateSkillPP();

                return { catchResult };
            },
            options.onUnlock
        );
    },

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
