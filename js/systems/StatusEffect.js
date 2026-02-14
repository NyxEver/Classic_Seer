/**
 * StatusEffect - 异常状态系统
 * 负责状态施加、持续回合、回合末结算、行动限制与图标数据查询。
 */

const StatusEffect = {
    DEFINITIONS: {
        poison: {
            name: '中毒',
            category: 'weakening',
            minTurns: 1,
            maxTurns: 2,
            icon: 'zhongdu',
            endTurnDamageRatio: 1 / 8
        },
        frostbite: {
            name: '冻伤',
            category: 'weakening',
            minTurns: 1,
            maxTurns: 3,
            icon: 'dongshang',
            endTurnDamageRatio: 1 / 8
        },
        burn: {
            name: '烧伤',
            category: 'weakening',
            minTurns: 1,
            maxTurns: 3,
            icon: 'shaoshang',
            endTurnDamageRatio: 1 / 8
        },
        sleep: {
            name: '睡眠',
            category: 'control',
            minTurns: 1,
            maxTurns: 3,
            icon: 'shuimian'
        },
        paralysis: {
            name: '麻痹',
            category: 'control',
            minTurns: 1,
            maxTurns: 3,
            icon: 'mabi'
        },
        fear: {
            name: '害怕',
            category: 'control',
            minTurns: 1,
            maxTurns: 3,
            icon: 'haipa'
        },
        exhausted: {
            name: '疲惫',
            category: 'control',
            minTurns: 1,
            maxTurns: 3,
            icon: 'pibei'
        }
    },

    WEAKENING_ORDER: ['poison', 'frostbite', 'burn'],

    createEmptyState() {
        return {
            weakening: {},
            control: null
        };
    },

    cloneState(state) {
        return JSON.parse(JSON.stringify(this.ensureState(state)));
    },

    ensureState(state) {
        const normalized = state && typeof state === 'object' ? state : {};
        const weakening = normalized.weakening && typeof normalized.weakening === 'object'
            ? normalized.weakening
            : {};
        const control = normalized.control && typeof normalized.control === 'object'
            ? normalized.control
            : null;

        return {
            weakening,
            control
        };
    },

    ensureRuntime(elf) {
        if (!elf._statusRuntime || typeof elf._statusRuntime !== 'object') {
            elf._statusRuntime = {};
        }
        if (!Number.isFinite(elf._statusRuntime.skipTurnUntil)) {
            elf._statusRuntime.skipTurnUntil = -1;
        }
        return elf._statusRuntime;
    },

    ensureElfStatus(elf) {
        if (!elf || typeof elf !== 'object') {
            return this.createEmptyState();
        }

        const base = this.ensureState(elf.status || (elf._instanceData ? elf._instanceData.status : null));
        elf.status = base;
        if (elf._instanceData) {
            elf._instanceData.status = base;
        }
        this.ensureRuntime(elf);
        return base;
    },

    syncElfStatus(elf) {
        if (!elf || typeof elf !== 'object') {
            return;
        }
        if (typeof elf._syncInstanceData === 'function') {
            elf._syncInstanceData();
            return;
        }
        if (elf._instanceData) {
            elf._instanceData.status = this.ensureElfStatus(elf);
        }
    },

    clearAllOnInstanceData(instanceData) {
        if (!instanceData || typeof instanceData !== 'object') {
            return;
        }
        instanceData.status = this.createEmptyState();
    },

    getDefinition(statusType) {
        return this.DEFINITIONS[statusType] || null;
    },

    getStatusName(statusType) {
        const def = this.getDefinition(statusType);
        return def ? def.name : statusType;
    },

    getStatusCategory(statusType) {
        const def = this.getDefinition(statusType);
        return def ? def.category : null;
    },

    randomDuration(statusType) {
        const def = this.getDefinition(statusType);
        if (!def) {
            return 0;
        }
        if (def.minTurns === def.maxTurns) {
            return def.minTurns;
        }
        return Math.floor(Math.random() * (def.maxTurns - def.minTurns + 1)) + def.minTurns;
    },

    applyStatus(elf, statusType, options = {}) {
        const def = this.getDefinition(statusType);
        if (!def || !elf) {
            return {
                applied: false,
                refreshed: false,
                replacedStatus: null,
                statusType,
                duration: 0,
                category: null
            };
        }

        const state = this.ensureElfStatus(elf);
        const duration = Number.isFinite(options.duration)
            ? Math.max(1, Math.floor(options.duration))
            : this.randomDuration(statusType);

        const result = {
            applied: false,
            refreshed: false,
            replacedStatus: null,
            statusType,
            duration,
            category: def.category
        };

        if (def.category === 'weakening') {
            if (state.weakening[statusType]) {
                state.weakening[statusType].remainingTurns = duration;
                result.refreshed = true;
            } else {
                state.weakening[statusType] = {
                    remainingTurns: duration
                };
                result.applied = true;
            }
            this.syncElfStatus(elf);
            return result;
        }

        if (def.category === 'control') {
            const oldControl = state.control ? state.control.type : null;
            if (oldControl && oldControl !== statusType) {
                result.replacedStatus = oldControl;
            }

            if (oldControl === statusType) {
                result.refreshed = true;
            } else {
                result.applied = true;
            }

            state.control = {
                type: statusType,
                remainingTurns: duration
            };
            this.syncElfStatus(elf);
            return result;
        }

        return result;
    },

    removeStatus(elf, statusType) {
        if (!elf) {
            return false;
        }
        const state = this.ensureElfStatus(elf);
        let removed = false;

        if (state.weakening[statusType]) {
            delete state.weakening[statusType];
            removed = true;
        }

        if (state.control && state.control.type === statusType) {
            state.control = null;
            removed = true;
        }

        if (removed) {
            this.syncElfStatus(elf);
        }
        return removed;
    },

    clearAll(elf) {
        if (!elf) {
            return;
        }
        elf.status = this.createEmptyState();
        if (elf._instanceData) {
            elf._instanceData.status = elf.status;
        }
        const runtime = this.ensureRuntime(elf);
        runtime.skipTurnUntil = -1;
        this.syncElfStatus(elf);
    },

    hasAnyStatus(source) {
        if (!source || typeof source !== 'object') {
            return false;
        }

        const rawState = source.status || source;
        const state = this.ensureState(rawState);
        const weakening = Object.keys(state.weakening || {}).length > 0;
        const control = !!(state.control && state.control.type);
        return weakening || control;
    },

    getDisplayStatuses(elf) {
        const state = this.ensureElfStatus(elf);
        const activeWeakening = Object.keys(state.weakening || {}).filter((statusType) => !!this.getDefinition(statusType));
        activeWeakening.sort((a, b) => {
            const ai = this.WEAKENING_ORDER.indexOf(a);
            const bi = this.WEAKENING_ORDER.indexOf(b);
            return ai - bi;
        });

        const result = [...activeWeakening];
        if (state.control && state.control.type && this.getDefinition(state.control.type)) {
            result.push(state.control.type);
        }
        return result;
    },

    getDamagePowerMultiplier(attacker, skill) {
        if (!attacker || !skill || skill.power <= 0 || skill.category === 'status') {
            return 1;
        }

        const state = this.ensureElfStatus(attacker);
        if (state.weakening && state.weakening.burn) {
            return 0.5;
        }
        return 1;
    },

    canAct(elf, turnNumber) {
        if (!elf) {
            return { canAct: true, statusType: null, reason: null };
        }

        const runtime = this.ensureRuntime(elf);
        if (runtime.skipTurnUntil === turnNumber) {
            return {
                canAct: false,
                statusType: 'sleep',
                reason: 'woken_this_turn'
            };
        }

        const state = this.ensureElfStatus(elf);
        const controlType = state.control && state.control.type ? state.control.type : null;
        if (!controlType) {
            return { canAct: true, statusType: null, reason: null };
        }

        return {
            canAct: false,
            statusType: controlType,
            reason: 'control'
        };
    },

    onHitTarget(elf, turnNumber) {
        if (!elf) {
            return { removed: false, statusType: null };
        }

        const state = this.ensureElfStatus(elf);
        if (!state.control || state.control.type !== 'sleep') {
            return { removed: false, statusType: null };
        }

        state.control = null;
        const runtime = this.ensureRuntime(elf);
        runtime.skipTurnUntil = turnNumber;
        this.syncElfStatus(elf);
        return {
            removed: true,
            statusType: 'sleep'
        };
    },

    tickTurnEnd(elf) {
        const result = {
            damages: [],
            endedStatuses: []
        };

        if (!elf) {
            return result;
        }

        const state = this.ensureElfStatus(elf);
        let dirty = false;

        const weakeningKeys = Object.keys(state.weakening || {});
        for (const statusType of weakeningKeys) {
            const def = this.getDefinition(statusType);
            const entry = state.weakening[statusType];
            if (!def || !entry) {
                delete state.weakening[statusType];
                dirty = true;
                continue;
            }

            const oldHp = elf.currentHp;
            if (oldHp > 0 && def.endTurnDamageRatio) {
                const maxHp = Math.max(0, typeof elf.getMaxHp === 'function' ? elf.getMaxHp() : 0);
                let damage = Math.floor(maxHp * def.endTurnDamageRatio);
                if (damage < 1 && maxHp > 0) {
                    damage = 1;
                }

                if (damage > 0) {
                    elf.currentHp = Math.max(0, oldHp - damage);
                    const dealt = oldHp - elf.currentHp;
                    if (dealt > 0) {
                        result.damages.push({
                            statusType,
                            oldHp,
                            newHp: elf.currentHp,
                            damage: dealt
                        });
                        dirty = true;
                    }
                }
            }

            entry.remainingTurns = Math.max(0, (entry.remainingTurns || 0) - 1);
            if (entry.remainingTurns <= 0) {
                delete state.weakening[statusType];
                result.endedStatuses.push(statusType);
                dirty = true;
            }
        }

        if (state.control && state.control.type) {
            state.control.remainingTurns = Math.max(0, (state.control.remainingTurns || 0) - 1);
            if (state.control.remainingTurns <= 0) {
                result.endedStatuses.push(state.control.type);
                state.control = null;
                dirty = true;
            }
        }

        if (dirty) {
            this.syncElfStatus(elf);
        }

        return result;
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('StatusEffect', StatusEffect);
}

window.StatusEffect = StatusEffect;
