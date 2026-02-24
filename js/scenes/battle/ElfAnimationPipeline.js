/** BattleElfAnimationPipeline - 战斗通用 elf_animation 播放管线 */

const ENTRY_ANIM_OFFSET_Y = 80;
const ENTRY_FADE_DURATION_MS = 220;
const ENTRY_FADE_EASE = 'Sine.Out';
const ELF_ANIM_KEY_FRAME_NAME = '1 (45).png';
const ELF_ANIM_FRAME_RATE = 24;

const ELF_ANIM_WARNED = new Set();

function warnElfAnimOnce(token, message) {
    if (ELF_ANIM_WARNED.has(token)) {
        return;
    }
    ELF_ANIM_WARNED.add(token);
    console.warn(message);
}

function getElfAnimPipelineMappings() { return (typeof AssetMappings !== 'undefined' && AssetMappings) ? AssetMappings : null; }

function getElfAnimPreloadState() { return (typeof window !== 'undefined' && window.__seerElfAnimationPreloadState) ? window.__seerElfAnimationPreloadState : null; }

function getFrameOrderValue(frameName, fallbackIndex) {
    const parenMatch = frameName.match(/\((\d+)\)/);
    if (parenMatch) {
        return {
            group: 0,
            value: parseInt(parenMatch[1], 10),
            fallbackIndex
        };
    }

    const plainNumber = frameName.match(/^(\d+)(?:\.[a-zA-Z0-9]+)?$/);
    if (plainNumber) {
        return {
            group: 1,
            value: parseInt(plainNumber[1], 10),
            fallbackIndex
        };
    }

    const tailNumber = frameName.match(/(\d+)(?!.*\d)/);
    if (tailNumber) {
        return {
            group: 2,
            value: parseInt(tailNumber[1], 10),
            fallbackIndex
        };
    }

    return {
        group: 3,
        value: Number.MAX_SAFE_INTEGER,
        fallbackIndex
    };
}

function hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function getAtlasFrameNames(scene, atlasKey) {
    const atlasJson = scene.cache && scene.cache.json ? scene.cache.json.get(atlasKey) : null;
    if (atlasJson && atlasJson.frames && typeof atlasJson.frames === 'object') {
        return Object.keys(atlasJson.frames);
    }

    const texture = scene.textures.get(atlasKey);
    if (!texture) {
        return [];
    }
    return texture.getFrameNames().filter((name) => name !== '__BASE');
}

function getAnimationFrameName(animationFrame) {
    if (!animationFrame) {
        return null;
    }
    return animationFrame.textureFrame || animationFrame.name || null;
}

function getTextureFrameWidth(textureFrame) {
    if (!textureFrame || typeof textureFrame !== 'object') {
        return 0;
    }

    if (Number.isFinite(textureFrame.cutWidth) && textureFrame.cutWidth > 0) {
        return textureFrame.cutWidth;
    }
    if (Number.isFinite(textureFrame.width) && textureFrame.width > 0) {
        return textureFrame.width;
    }
    if (Number.isFinite(textureFrame.realWidth) && textureFrame.realWidth > 0) {
        return textureFrame.realWidth;
    }
    if (Number.isFinite(textureFrame.sourceSizeW) && textureFrame.sourceSizeW > 0) {
        return textureFrame.sourceSizeW;
    }
    return 0;
}

function getTextureFrameHeight(textureFrame) {
    if (!textureFrame || typeof textureFrame !== 'object') {
        return 0;
    }

    if (Number.isFinite(textureFrame.cutHeight) && textureFrame.cutHeight > 0) {
        return textureFrame.cutHeight;
    }
    if (Number.isFinite(textureFrame.height) && textureFrame.height > 0) {
        return textureFrame.height;
    }
    if (Number.isFinite(textureFrame.realHeight) && textureFrame.realHeight > 0) {
        return textureFrame.realHeight;
    }
    if (Number.isFinite(textureFrame.sourceSizeH) && textureFrame.sourceSizeH > 0) {
        return textureFrame.sourceSizeH;
    }
    return 0;
}

function buildMergedSequence(scene, atlases) {
    const deduped = new Map();
    let rawKeyFrameCount = 0;
    let orderIndex = 0;

    for (const atlas of atlases) {
        if (!atlas || !atlas.key) {
            continue;
        }
        if (!scene.textures.exists(atlas.key)) {
            return {
                ok: false,
                reason: `texture_missing:${atlas.key}`
            };
        }

        const frameNames = getAtlasFrameNames(scene, atlas.key);
        for (const frameName of frameNames) {
            if (frameName === ELF_ANIM_KEY_FRAME_NAME) {
                rawKeyFrameCount++;
            }

            if (!deduped.has(frameName)) {
                deduped.set(frameName, {
                    key: atlas.key,
                    frame: frameName,
                    order: getFrameOrderValue(frameName, orderIndex)
                });
            }
            orderIndex++;
        }
    }

    const merged = Array.from(deduped.values())
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
            return a.frame.localeCompare(b.frame, 'en');
        })
        .map((entry) => ({ key: entry.key, frame: entry.frame }));

    if (merged.length === 0) {
        return {
            ok: false,
            reason: 'sequence_empty'
        };
    }

    if (rawKeyFrameCount !== 1) {
        return {
            ok: false,
            reason: `key_frame_count_${rawKeyFrameCount}`
        };
    }

    const keyFrameIndex = merged.findIndex((entry) => entry.frame === ELF_ANIM_KEY_FRAME_NAME);
    if (keyFrameIndex < 0) {
        return {
            ok: false,
            reason: 'key_frame_missing_after_merge'
        };
    }

    return {
        ok: true,
        frames: merged,
        keyFrameIndex
    };
}

function resolvePipelineState(scene) {
    const mappings = getElfAnimPipelineMappings();
    const atlases = mappings && typeof mappings.getAllElfAnimationAtlases === 'function'
        ? mappings.getAllElfAnimationAtlases()
        : [];
    const preloadState = getElfAnimPreloadState();
    const preloadSignature = preloadState
        ? `${preloadState.manifestSize || 0}|${(preloadState.loadedKeys || []).length}|${(preloadState.failedKeys || []).length}|${preloadState.allLoaded ? '1' : '0'}`
        : 'no_preload';
    const manifestSignature = Array.isArray(atlases)
        ? atlases.map((atlas) => (atlas && atlas.key) || '').sort().join('|')
        : 'manifest_unavailable';
    const signature = `${manifestSignature}::${preloadSignature}`;

    if (scene._battleElfAnimPipelineState && scene._battleElfAnimPipelineState.signature === signature) {
        return scene._battleElfAnimPipelineState;
    }

    const state = {
        signature,
        available: false,
        reason: 'unknown',
        frames: [],
        keyFrameIndex: -1,
        animationKey: null,
        keyFrameName: ELF_ANIM_KEY_FRAME_NAME
    };

    if (!Array.isArray(atlases) || atlases.length === 0) {
        state.reason = 'manifest_empty';
    } else if (!preloadState || preloadState.completed !== true) {
        state.reason = 'preload_state_unavailable';
    } else if (preloadState.allLoaded !== true) {
        state.reason = 'preload_failed';
    } else {
        const merged = buildMergedSequence(scene, atlases);
        if (!merged.ok) {
            state.reason = merged.reason || 'sequence_invalid';
        } else {
            state.available = true;
            state.reason = null;
            state.frames = merged.frames;
            state.keyFrameIndex = merged.keyFrameIndex;
            state.animationKey = `elf_anim_global_${hashText(`${manifestSignature}:${merged.frames.length}`)}`;
        }
    }

    if (!state.available) {
        warnElfAnimOnce(
            `elf_anim_fallback:${state.reason}`,
            `[BattleElfAnimationPipeline] elf_animation 不可用，回退显隐兜底。reason=${state.reason}`
        );
    }

    scene._battleElfAnimPipelineState = state;
    return state;
}

function ensureSceneAnimation(scene, state) {
    if (!state || !state.available || !state.animationKey) {
        return null;
    }

    if (scene.anims.exists(state.animationKey)) {
        return state.animationKey;
    }

    scene.anims.create({
        key: state.animationKey,
        frames: state.frames,
        frameRate: ELF_ANIM_FRAME_RATE,
        repeat: 0
    });
    return state.animationKey;
}

const BattleElfAnimationPipeline = {
    ENTRY_ANIM_OFFSET_Y,
    FADE_DURATION_MS: ENTRY_FADE_DURATION_MS,
    FADE_EASE: ENTRY_FADE_EASE,
    KEY_FRAME_NAME: ELF_ANIM_KEY_FRAME_NAME,
    getState(scene) {
        return resolvePipelineState(scene);
    },

    playSequence(scene, options = {}) {
        const state = resolvePipelineState(scene);
        if (!state.available) {
            return Promise.resolve({
                played: false,
                keyFrameTriggered: false,
                reason: state.reason || 'unavailable'
            });
        }

        const animKey = ensureSceneAnimation(scene, state);
        if (!animKey || state.frames.length === 0) {
            return Promise.resolve({
                played: false,
                keyFrameTriggered: false,
                reason: 'animation_key_unavailable'
            });
        }

        const firstFrame = state.frames[0];
        const x = Number.isFinite(options.x) ? options.x : (scene.W * 0.5);
        const y = Number.isFinite(options.y) ? options.y : (scene.H * 0.5);
        const depth = Number.isFinite(options.depth) ? options.depth : 56;
        const scale = Number.isFinite(options.scale) ? options.scale : 0.7;
        const originX = Number.isFinite(options.originX) ? options.originX : 0.5;
        const originY = Number.isFinite(options.originY) ? options.originY : 1;
        const keyFrameCallback = typeof options.onKeyFrame === 'function' ? options.onKeyFrame : null;

        const effectSprite = scene.add.sprite(x, y, firstFrame.key, firstFrame.frame);
        effectSprite.setDepth(depth);
        effectSprite.setScale(scale);

        const firstTextureFrame = scene.textures.getFrame(firstFrame.key, firstFrame.frame);
        const firstFrameHeight = getTextureFrameHeight(firstTextureFrame) || effectSprite.height || 1;
        const lockedDisplayOriginY = firstFrameHeight * originY;
        const enforceLockedDisplayOrigin = (frameObj = null) => {
            const frameWidth = frameObj
                ? (getTextureFrameWidth(frameObj) || effectSprite.width || 1)
                : (getTextureFrameWidth(firstTextureFrame) || effectSprite.width || 1);
            effectSprite.setDisplayOrigin(frameWidth * originX, lockedDisplayOriginY);
        };

        enforceLockedDisplayOrigin(firstTextureFrame);

        return new Promise((resolve) => {
            let settled = false;
            let keyFrameTriggered = false;
            const safetyMs = Math.max(
                360,
                Math.ceil((state.frames.length / ELF_ANIM_FRAME_RATE) * 1000) + 320
            );

            const cleanupAndResolve = () => {
                if (settled) {
                    return;
                }
                settled = true;
                effectSprite.removeAllListeners();
                if (effectSprite && effectSprite.scene) {
                    effectSprite.destroy();
                }
                resolve({
                    played: true,
                    keyFrameTriggered,
                    reason: null
                });
            };

            const safetyTimer = scene.time.delayedCall(safetyMs, cleanupAndResolve);

            effectSprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, (_animation, frame) => {
                enforceLockedDisplayOrigin(frame && frame.frame ? frame.frame : null);
                const frameName = getAnimationFrameName(frame);
                if (!keyFrameTriggered && frameName === state.keyFrameName) {
                    keyFrameTriggered = true;
                    if (keyFrameCallback) {
                        keyFrameCallback();
                    }
                }
            });

            effectSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                if (safetyTimer && !safetyTimer.hasDispatched) {
                    safetyTimer.remove(false);
                }
                cleanupAndResolve();
            });

            effectSprite.play(animKey, true);
        });
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleElfAnimationPipeline', BattleElfAnimationPipeline);
}

window.BattleElfAnimationPipeline = BattleElfAnimationPipeline;
