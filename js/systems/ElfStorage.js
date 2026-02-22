/**
 * ElfStorage - 精灵仓库管理器
 * 管理仓库存取、容量校验、分页筛选所需数据。
 */

function getElfStorageDependency(name) {
    if (typeof AppContext !== 'undefined' && typeof AppContext.get === 'function') {
        const dep = AppContext.get(name, null);
        if (dep) {
            return dep;
        }
    }
    if (typeof window !== 'undefined') {
        return window[name] || null;
    }
    return null;
}

const ELF_STORAGE_EMPTY_EV = { hp: 0, atk: 0, spAtk: 0, def: 0, spDef: 0, spd: 0 };

const ElfStorage = {
    MAX_CAPACITY: 999,
    BAG_CAPACITY: 6,

    getPlayerData() {
        return getElfStorageDependency('PlayerData');
    },

    ensureStorageArray() {
        const playerData = this.getPlayerData();
        if (!playerData) {
            return [];
        }
        if (!Array.isArray(playerData.elfStorage)) {
            playerData.elfStorage = [];
        }
        return playerData.elfStorage;
    },

    resolveIvValue(ivValue) {
        const playerData = this.getPlayerData();
        if (playerData && typeof playerData.normalizeIvValue === 'function') {
            return playerData.normalizeIvValue(ivValue);
        }

        if (Number.isFinite(ivValue)) {
            return Phaser.Math.Clamp(Math.round(ivValue), 0, 31);
        }

        if (ivValue && typeof ivValue === 'object') {
            const keys = ['hp', 'atk', 'spAtk', 'def', 'spDef', 'spd'];
            const values = keys
                .map((key) => Number(ivValue[key]))
                .filter((value) => Number.isFinite(value));
            if (values.length) {
                const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
                return Phaser.Math.Clamp(Math.round(avg), 0, 31);
            }
        }

        return 15;
    },

    normalizeElfData(elfData) {
        if (!elfData || typeof elfData !== 'object') {
            return null;
        }

        const normalized = {
            ...elfData,
            iv: this.resolveIvValue(elfData.iv),
            skills: Array.isArray(elfData.skills) ? [...elfData.skills] : [],
            skillPP: elfData.skillPP && typeof elfData.skillPP === 'object' ? { ...elfData.skillPP } : {},
            ev: elfData.ev && typeof elfData.ev === 'object' ? { ...elfData.ev } : { ...ELF_STORAGE_EMPTY_EV },
            obtainedAt: Number.isFinite(elfData.obtainedAt) ? elfData.obtainedAt : Date.now(),
            pendingSkills: Array.isArray(elfData.pendingSkills) ? [...elfData.pendingSkills] : []
        };

        if (typeof StatusEffect !== 'undefined' && StatusEffect && typeof StatusEffect.cloneState === 'function') {
            normalized.status = StatusEffect.cloneState(elfData.status);
        } else {
            normalized.status = elfData.status && typeof elfData.status === 'object'
                ? JSON.parse(JSON.stringify(elfData.status))
                : { weakening: {}, control: null };
        }

        return normalized;
    },

    persist() {
        const playerData = this.getPlayerData();
        if (!playerData || typeof playerData.saveToStorage !== 'function') {
            return;
        }
        playerData.saveToStorage();
    },

    add(elfData) {
        const storage = this.ensureStorageArray();
        if (storage.length >= this.MAX_CAPACITY) {
            return { success: false, reason: 'storage_full' };
        }

        const normalized = this.normalizeElfData(elfData);
        if (!normalized) {
            return { success: false, reason: 'invalid_elf_data' };
        }

        storage.push(normalized);
        this.persist();
        return { success: true, index: storage.length - 1 };
    },

    remove(index) {
        const storage = this.ensureStorageArray();
        if (!Number.isInteger(index) || index < 0 || index >= storage.length) {
            return null;
        }
        const removed = storage.splice(index, 1)[0] || null;
        if (removed) {
            this.persist();
        }
        return removed;
    },

    getAll() {
        return [...this.ensureStorageArray()];
    },

    getByType(typeId) {
        if (!typeId) {
            return this.getAll();
        }

        const dataLoader = getElfStorageDependency('DataLoader');
        if (!dataLoader || typeof dataLoader.getElf !== 'function') {
            return [];
        }

        return this.ensureStorageArray().filter((elfData) => {
            const baseData = dataLoader.getElf(elfData.elfId);
            return !!baseData && baseData.type === typeId;
        });
    },

    getCount() {
        return this.ensureStorageArray().length;
    },

    isFull() {
        return this.getCount() >= this.MAX_CAPACITY;
    },

    getSortedEntries(typeId = null) {
        const dataLoader = getElfStorageDependency('DataLoader');
        const entries = [];

        this.ensureStorageArray().forEach((elfData, storageIndex) => {
            if (!elfData || typeof elfData !== 'object') {
                return;
            }

            if (typeId && dataLoader && typeof dataLoader.getElf === 'function') {
                const baseData = dataLoader.getElf(elfData.elfId);
                if (!baseData || baseData.type !== typeId) {
                    return;
                }
            }

            entries.push({
                storageIndex,
                elfData,
                obtainedAt: Number.isFinite(elfData.obtainedAt) ? elfData.obtainedAt : 0
            });
        });

        entries.sort((a, b) => {
            if (a.obtainedAt !== b.obtainedAt) {
                return a.obtainedAt - b.obtainedAt;
            }
            return a.storageIndex - b.storageIndex;
        });

        return entries;
    },

    moveBagElfToStorage(bagIndex) {
        const playerData = this.getPlayerData();
        if (!playerData || !Array.isArray(playerData.elves)) {
            return { success: false, reason: 'player_data_unavailable' };
        }

        if (!Number.isInteger(bagIndex) || bagIndex < 0 || bagIndex >= playerData.elves.length) {
            return { success: false, reason: 'invalid_bag_index' };
        }

        if (playerData.elves.length <= 1) {
            return { success: false, reason: 'bag_keep_one' };
        }

        if (this.isFull()) {
            return { success: false, reason: 'storage_full' };
        }

        const movedElf = playerData.elves.splice(bagIndex, 1)[0];
        const addResult = this.add(movedElf);
        if (!addResult.success) {
            playerData.elves.splice(bagIndex, 0, movedElf);
            return addResult;
        }

        const nextSelectedIndex = playerData.elves.length > 0
            ? Math.min(bagIndex, playerData.elves.length - 1)
            : -1;

        this.persist();
        return {
            success: true,
            movedElf,
            nextSelectedIndex
        };
    },

    moveStorageElfToBag(storageIndex) {
        const playerData = this.getPlayerData();
        if (!playerData || !Array.isArray(playerData.elves)) {
            return { success: false, reason: 'player_data_unavailable' };
        }

        if (playerData.elves.length >= this.BAG_CAPACITY) {
            return { success: false, reason: 'bag_full' };
        }

        const movedElf = this.remove(storageIndex);
        if (!movedElf) {
            return { success: false, reason: 'invalid_storage_index' };
        }

        playerData.elves.push(movedElf);
        this.persist();
        return { success: true, movedElf };
    },

    swapStorageWithBag(storageIndex, bagIndex) {
        const playerData = this.getPlayerData();
        const storage = this.ensureStorageArray();
        if (!playerData || !Array.isArray(playerData.elves)) {
            return { success: false, reason: 'player_data_unavailable' };
        }

        if (!Number.isInteger(storageIndex) || storageIndex < 0 || storageIndex >= storage.length) {
            return { success: false, reason: 'invalid_storage_index' };
        }

        if (!Number.isInteger(bagIndex) || bagIndex < 0 || bagIndex >= playerData.elves.length) {
            return { success: false, reason: 'invalid_bag_index' };
        }

        const storageElf = storage[storageIndex];
        const bagElf = playerData.elves[bagIndex];
        playerData.elves[bagIndex] = storageElf;
        storage[storageIndex] = bagElf;
        this.persist();
        return {
            success: true,
            bagIndex,
            storageIndex
        };
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('ElfStorage', ElfStorage);
}

window.ElfStorage = ElfStorage;
