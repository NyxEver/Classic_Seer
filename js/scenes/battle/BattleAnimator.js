/**
 * BattleAnimator - BattleScene visual and animation facade methods.
 *
 * These methods run with BattleScene as `this`.
 */

const BattleAnimator = {
    createBackground() {
        if (this.battleBackgroundKey && this.textures.exists(this.battleBackgroundKey)) {
            this.createFilteredSceneBackground(this.battleBackgroundKey);
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

    createFilteredSceneBackground(backgroundKey) {
        const blurOffsets = [
            { x: -2, y: 0 },
            { x: 2, y: 0 },
            { x: 0, y: -2 },
            { x: 0, y: 2 }
        ];

        blurOffsets.forEach((offset) => {
            const blurLayer = this.add.image(this.W / 2 + offset.x, this.H / 2 + offset.y, backgroundKey);
            blurLayer.setDisplaySize(this.W + 4, this.H + 4);
            blurLayer.setAlpha(0.12);
            blurLayer.setDepth(-30);
        });

        const base = this.add.image(this.W / 2, this.H / 2, backgroundKey);
        base.setDisplaySize(this.W, this.H);
        base.setDepth(-25);

        this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x6f7f8f, 0.18).setDepth(-20);
        this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.42).setDepth(-19);
        this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x5b3a1b, 0.14).setDepth(-18);
    },

    createMainBattleArea() {
        this.playerSprite = this.createCharacterSprite(200, 230, this.playerElf, true);
        this.enemySprite = this.createCharacterSprite(this.W - 200, 230, this.enemyElf, false);
    },

    createCharacterSprite(x, y, elf, isPlayer) {
        const container = this.add.container(x, y);
        const size = 80;
        container._isPlayerSide = isPlayer;

        const stillAtlasKey = this.pickBattleAtlas(elf.id, 'still');
        const firstStillFrame = stillAtlasKey ? this.getFirstAtlasFrameName(stillAtlasKey) : null;

        if (stillAtlasKey && firstStillFrame) {
            const sprite = this.add.sprite(0, 0, stillAtlasKey, firstStillFrame);
            const maxSize = size * 2;
            const scale = Math.min(maxSize / sprite.width, maxSize / sprite.height);
            sprite.setScale(scale);
            container.add(sprite);

            container._animSprite = sprite;
            container._elfId = elf.id;
            this.applyBattleSideFlip(container);

            this.playElfClip(container, 'still', true);
        } else {
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

            this.addTypeVisual(container, 0, 20, elf.type, {
                iconSize: 18,
                fallbackFontSize: '14px',
                fallbackColor: '#dddddd',
                fallbackOriginX: 0.5
            });
        }

        return container;
    },

    applyBattleSideFlip(container) {
        if (!container || !container._animSprite) {
            return;
        }
        const shouldFlip = container._isPlayerSide === false;
        container._animSprite.setFlipX(shouldFlip);
    },

    getAvailableBattleAtlases(elfId, clipType) {
        if (typeof AssetMappings === 'undefined' || typeof AssetMappings.getBattleClipKeys !== 'function') {
            return [];
        }
        const keys = AssetMappings.getBattleClipKeys(elfId, clipType);
        if (!Array.isArray(keys)) {
            return [];
        }
        return keys.filter((key) => this.textures.exists(key));
    },

    pickBattleAtlas(elfId, clipType) {
        const keys = this.getAvailableBattleAtlases(elfId, clipType);
        if (!keys.length) {
            return null;
        }
        return keys[0];
    },

    getFrameOrderValue(frameName, fallbackIndex) {
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
    },

    getAtlasFrameNames(atlasKey) {
        if (!this._atlasFrameCache) {
            this._atlasFrameCache = {};
        }
        if (this._atlasFrameCache[atlasKey]) {
            return this._atlasFrameCache[atlasKey];
        }

        let frameNames = [];
        const atlasJson = this.cache && this.cache.json ? this.cache.json.get(atlasKey) : null;
        if (atlasJson && atlasJson.frames && typeof atlasJson.frames === 'object') {
            frameNames = Object.keys(atlasJson.frames);
        } else {
            const texture = this.textures.get(atlasKey);
            if (!texture) {
                this._atlasFrameCache[atlasKey] = [];
                return [];
            }
            frameNames = texture.getFrameNames().filter((name) => name !== '__BASE');
        }

        const ordered = frameNames
            .map((name, index) => ({ name, order: this.getFrameOrderValue(name, index) }))
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

        this._atlasFrameCache[atlasKey] = ordered;
        return ordered;
    },

    getFirstAtlasFrameName(atlasKey) {
        const frames = this.getAtlasFrameNames(atlasKey);
        return frames.length ? frames[0] : null;
    },

    getBattleFrameRate(loop) {
        return loop ? 8 : 12;
    },

    getClipDurationMs(elfId, clipType) {
        const atlasKeys = this.getAvailableBattleAtlases(elfId, clipType);
        if (!atlasKeys.length) {
            return 0;
        }

        const frameRate = this.getBattleFrameRate(false);
        let totalFrames = 0;
        for (const atlasKey of atlasKeys) {
            const frames = this.getAtlasFrameNames(atlasKey);
            totalFrames += frames.length;
        }

        if (totalFrames <= 0) {
            return 0;
        }
        return Math.ceil((totalFrames / frameRate) * 1000);
    },

    ensureBattleAnimation(atlasKey, loop) {
        const suffix = loop ? 'loop' : 'once';
        const animKey = `battle_anim_${atlasKey}_${suffix}`;

        if (this.anims.exists(animKey)) {
            return animKey;
        }

        const frameNames = this.getAtlasFrameNames(atlasKey);
        if (!frameNames.length) {
            return null;
        }

        const frameRate = this.getBattleFrameRate(loop);
        this.anims.create({
            key: animKey,
            frames: frameNames.map((frame) => ({ key: atlasKey, frame })),
            frameRate,
            repeat: loop ? -1 : 0
        });

        return animKey;
    },

    playAtlasClip(container, atlasKey, loop = false) {
        if (!container || !container.scene || !container._animSprite || !atlasKey) {
            return Promise.resolve(false);
        }

        const animKey = this.ensureBattleAnimation(atlasKey, loop);
        if (!animKey) {
            return Promise.resolve(false);
        }

        const sprite = container._animSprite;
        this.applyBattleSideFlip(container);
        if (loop) {
            sprite.play(animKey, true);
            return Promise.resolve(true);
        }

        return new Promise((resolve) => {
            let settled = false;
            const frames = this.getAtlasFrameNames(atlasKey);
            const frameRate = this.getBattleFrameRate(false);
            const safetyMs = Math.max(260, Math.ceil((frames.length / frameRate) * 1000) + 280);

            const finish = () => {
                if (settled) {
                    return;
                }
                settled = true;
                resolve(true);
            };

            const timer = this.time.delayedCall(safetyMs, finish);
            sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                if (timer && !timer.hasDispatched) {
                    timer.remove(false);
                }
                finish();
            });

            sprite.play(animKey, true);
        });
    },

    playElfClip(container, clipType, loop = false) {
        if (!container || !container.scene || !container._animSprite) {
            return Promise.resolve(false);
        }

        let atlasKeys = this.getAvailableBattleAtlases(container._elfId, clipType);
        if (!atlasKeys.length && clipType !== 'still') {
            atlasKeys = this.getAvailableBattleAtlases(container._elfId, 'still');
        }
        if (!atlasKeys.length) {
            return Promise.resolve(false);
        }

        if (loop) {
            return this.playAtlasClip(container, atlasKeys[0], true);
        }

        return atlasKeys.reduce((prev, atlasKey) => {
            return prev.then(async (playedAny) => {
                const played = await this.playAtlasClip(container, atlasKey, false);
                return playedAny || played;
            });
        }, Promise.resolve(false));
    },

    waitMs(ms) {
        return new Promise((resolve) => {
            this.time.delayedCall(ms, resolve);
        });
    },

    moveBattleSprite(container, x, y, duration = 260) {
        if (!container || !container.scene) {
            return Promise.resolve();
        }
        this.tweens.killTweensOf(container);
        return new Promise((resolve) => {
            this.tweens.add({
                targets: container,
                x,
                y,
                duration,
                ease: 'Sine.easeInOut',
                onComplete: resolve
            });
        });
    },

    playStrikeMotionWithStill(attacker, strikeX) {
        if (!attacker || !attacker.scene) {
            return Promise.resolve(false);
        }

        const startX = attacker.x;
        const startY = attacker.y;
        const attackDuration = Math.max(360, this.getClipDurationMs(attacker._elfId, 'still'));
        const attackFrameRate = this.getBattleFrameRate(false);
        const leadFrames = 5.5;
        let leadInMs = Math.round((leadFrames / attackFrameRate) * 1000);
        const maxLeadInMs = Math.max(80, attackDuration - 160);
        leadInMs = Math.min(Math.max(80, leadInMs), maxLeadInMs);

        const motionDuration = Math.max(160, attackDuration - leadInMs);
        const forwardDuration = Math.max(70, Math.round(motionDuration * 0.45));
        const backwardDuration = Math.max(70, motionDuration - forwardDuration);

        const motionPromise = new Promise((resolve) => {
            this.tweens.killTweensOf(attacker);
            this.time.delayedCall(leadInMs, () => {
                if (!attacker || !attacker.scene) {
                    resolve(false);
                    return;
                }

                this.tweens.add({
                    targets: attacker,
                    x: strikeX,
                    y: startY,
                    duration: forwardDuration,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        this.tweens.add({
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

        const stillPromise = this.playElfClip(attacker, 'still', false);
        return Promise.all([motionPromise, stillPromise]).then(([, played]) => {
            attacker.setPosition(startX, startY);
            return played;
        });
    },

    getPhysicalStrikeX(attackerIsPlayer) {
        if (attackerIsPlayer) {
            if (this.enemyStatus && this.enemyStatus.container) {
                return this.enemyStatus.container.x - 40;
            }
            return this.W - 320;
        }

        if (this.playerStatus && this.playerStatus.container) {
            return this.playerStatus.container.x + 290;
        }
        return 320;
    },

    async playSkillCastAnimation(skillEvent) {
        const attacker = skillEvent.actor === 'player' ? this.playerSprite : this.enemySprite;
        const defender = skillEvent.actor === 'player' ? this.enemySprite : this.playerSprite;
        const defenderElf = skillEvent.actor === 'player' ? this.enemyElf : this.playerElf;

        const skillCategory = skillEvent.skillCategory || 'status';
        const shouldStrike = skillCategory === 'physical' || skillCategory === 'special';

        if (shouldStrike) {
            const attackerIsPlayer = skillEvent.actor === 'player';
            const strikeX = this.getPhysicalStrikeX(attackerIsPlayer);

            await this.playStrikeMotionWithStill(attacker, strikeX);
            await this.waitMs(60);
            await this.playElfClip(defender, 'hit', false);
        } else {
            await this.waitMs(120);
        }

        await this.playElfClip(attacker, 'still', true);
        if (!defenderElf.isFainted()) {
            await this.playElfClip(defender, 'still', true);
        }
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
                                    this.playCapsuleShake(capsule, shakes, () => {
                                        if (success) {
                                            this.playSuccessEffect(capsule.x, capsule.y, () => {
                                                capsule.destroy();
                                                resolve();
                                            });
                                        } else {
                                            this.playFailEffect(capsule, () => {
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
    },

    playCapsuleShake(capsule, times, onComplete) {
        let shakeCount = 0;
        const doShake = () => {
            if (shakeCount >= times) {
                onComplete();
                return;
            }
            shakeCount++;

            this.tweens.add({
                targets: capsule,
                angle: 15,
                duration: 150,
                yoyo: true,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    this.tweens.add({
                        targets: capsule,
                        angle: -15,
                        duration: 150,
                        yoyo: true,
                        ease: 'Sine.easeInOut',
                        onComplete: () => {
                            this.time.delayedCall(300, doShake);
                        }
                    });
                }
            });
        };
        doShake();
    },

    playSuccessEffect(x, y, onComplete) {
        const stars = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const star = this.add.text(x, y, '✨', { fontSize: '24px' }).setOrigin(0.5);
            stars.push(star);

            this.tweens.add({
                targets: star,
                x: x + Math.cos(angle) * 60,
                y: y + Math.sin(angle) * 60,
                alpha: 0,
                duration: 600,
                ease: 'Power2',
                onComplete: () => star.destroy()
            });
        }

        const successText = this.add.text(x, y - 40, 'GET!', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffdd44',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(60);

        this.tweens.add({
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
    },

    playFailEffect(capsule, onComplete) {
        this.tweens.add({
            targets: capsule,
            scaleX: 1.5,
            scaleY: 0.5,
            duration: 150,
            yoyo: true,
            onComplete: () => {
                this.enemySprite.setPosition(capsule.x, capsule.y);
                this.tweens.add({
                    targets: this.enemySprite,
                    x: this.W - 200,
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
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleAnimator', BattleAnimator);
}

window.BattleAnimator = BattleAnimator;
