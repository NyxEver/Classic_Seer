/**
 * SaveTransfer - 存档导入导出工具
 * 负责导出文件构建、导入解析与严格结构校验。
 */
const SaveTransfer = {
    FILE_PREFIX: 'SEER',
    LEGACY_IV_KEYS: ['hp', 'atk', 'spAtk', 'def', 'spDef', 'spd'],

    /**
     * 获取游戏版本号
     * @returns {string}
     */
    getGameVersion() {
        const raw = typeof window !== 'undefined' ? window.GAME_VERSION : null;
        const version = typeof raw === 'string' ? raw.trim() : '';
        return version || '0.1.2';
    },

    /**
     * 构建导出文件名
     * @param {Date} [date]
     * @returns {string}
     */
    buildExportFileName(date = new Date()) {
        return `${this.FILE_PREFIX}_${this.formatTimestamp(date)}_${this.getGameVersion()}.json`;
    },

    /**
     * 导出当前存档
     * @returns {{ ok: boolean, fileName?: string, message?: string }}
     */
    exportCurrentSave() {
        const saveData = this.getCurrentSaveData();
        if (!saveData) {
            return { ok: false, message: '当前没有可导出的存档数据' };
        }

        const payload = {
            version: this.getGameVersion(),
            exportTime: new Date().toISOString(),
            saveData: saveData
        };

        const fileName = this.buildExportFileName();
        const json = JSON.stringify(payload, null, 2);
        this.downloadJson(fileName, json);
        return { ok: true, fileName: fileName };
    },

    /**
     * 解析并校验导入文本
     * @param {string} rawText
     * @returns {{ ok: boolean, data?: Object, message?: string }}
     */
    parseImportText(rawText) {
        let parsed;
        try {
            parsed = JSON.parse(rawText);
        } catch (_error) {
            return { ok: false, message: '存档文件无效或已损坏' };
        }

        const candidateSave = this.normalizeImportPayload(parsed);
        if (!candidateSave) {
            return { ok: false, message: '存档文件无效或已损坏' };
        }

        const validation = this.validateAndNormalizeSaveData(candidateSave);
        if (!validation.ok) {
            return { ok: false, message: '存档文件无效或已损坏' };
        }

        return { ok: true, data: validation.data };
    },

    /**
     * 写入导入后的存档数据
     * @param {Object} saveData
     * @returns {{ ok: boolean, message?: string }}
     */
    saveImportedData(saveData) {
        if (typeof SaveSystem === 'undefined' || !SaveSystem || typeof SaveSystem.save !== 'function') {
            return { ok: false, message: '存档系统不可用，导入失败' };
        }

        const success = SaveSystem.save(saveData);
        if (!success) {
            return { ok: false, message: '写入存档失败，请重试' };
        }

        return { ok: true };
    },

    /**
     * 读取文件文本
     * @param {File} file
     * @returns {Promise<string>}
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(typeof reader.result === 'string' ? reader.result : '');
            };
            reader.onerror = () => {
                reject(new Error('read_failed'));
            };
            reader.readAsText(file, 'utf-8');
        });
    },

    /**
     * 读取当前存档快照
     * @returns {Object|null}
     */
    getCurrentSaveData() {
        if (typeof PlayerData !== 'undefined' && PlayerData && typeof PlayerData.toSaveData === 'function') {
            const current = PlayerData.toSaveData();
            if (current && this.isPlainObject(current)) {
                return current;
            }
        }

        if (typeof SaveSystem !== 'undefined' && SaveSystem && typeof SaveSystem.load === 'function') {
            const loaded = SaveSystem.load();
            if (loaded && this.isPlainObject(loaded)) {
                return loaded;
            }
        }

        return null;
    },

    /**
     * 规范化导入载荷（兼容包装格式与旧版纯存档格式）
     * @param {Object} raw
     * @returns {Object|null}
     */
    normalizeImportPayload(raw) {
        if (!this.isPlainObject(raw)) {
            return null;
        }

        if (this.isPlainObject(raw.saveData)) {
            return raw.saveData;
        }

        return raw;
    },

    /**
     * 严格校验并标准化存档数据
     * @param {Object} candidate
     * @returns {{ ok: boolean, data?: Object }}
     */
    validateAndNormalizeSaveData(candidate) {
        if (!this.isPlainObject(candidate)) {
            return { ok: false };
        }

        const saveData = JSON.parse(JSON.stringify(candidate));

        if (!this.validateTopLevel(saveData)) {
            return { ok: false };
        }

        if (!this.isFiniteNumber(saveData.bgmVolume)) {
            saveData.bgmVolume = 1;
        }

        const normalizedElves = this.normalizeElfArray(saveData.elves);
        if (!normalizedElves.ok) {
            return { ok: false };
        }
        saveData.elves = normalizedElves.data;

        const normalizedStorage = this.normalizeElfArray(saveData.elfStorage);
        if (!normalizedStorage.ok) {
            return { ok: false };
        }
        saveData.elfStorage = normalizedStorage.data;

        return { ok: true, data: saveData };
    },

    /**
     * 校验顶层字段
     * @param {Object} saveData
     * @returns {boolean}
     */
    validateTopLevel(saveData) {
        if (typeof saveData.name !== 'string') {
            return false;
        }

        if (!this.isFiniteNumber(saveData.seerBeans)) {
            return false;
        }

        if (!Array.isArray(saveData.elves)) {
            return false;
        }

        if (!this.isPlainObject(saveData.items)) {
            return false;
        }

        if (!Object.values(saveData.items).every((count) => this.isFiniteNumber(count) && count >= 0)) {
            return false;
        }

        if (typeof saveData.currentMapId !== 'string') {
            return false;
        }

        if (!this.isPlainObject(saveData.questProgress)) {
            return false;
        }

        if (!(saveData.lastSaveTime === null || this.isFiniteNumber(saveData.lastSaveTime))) {
            return false;
        }

        if (!Array.isArray(saveData.seenElves) || !saveData.seenElves.every((id) => this.isFiniteNumber(id))) {
            return false;
        }

        if (!Array.isArray(saveData.caughtElves) || !saveData.caughtElves.every((id) => this.isFiniteNumber(id))) {
            return false;
        }

        if (!Array.isArray(saveData.elfStorage)) {
            return false;
        }

        const hasBgmVolume = Object.prototype.hasOwnProperty.call(saveData, 'bgmVolume');
        if (hasBgmVolume && (!this.isFiniteNumber(saveData.bgmVolume) || saveData.bgmVolume < 0 || saveData.bgmVolume > 1)) {
            return false;
        }

        return true;
    },

    /**
     * 校验并标准化精灵数组（背包与仓库复用）
     * @param {Array} elves
     * @returns {{ ok: boolean, data?: Array }}
     */
    normalizeElfArray(elves) {
        if (!Array.isArray(elves)) {
            return { ok: false };
        }

        const normalized = [];
        for (let index = 0; index < elves.length; index++) {
            const entry = this.normalizeElfEntry(elves[index]);
            if (!entry.ok) {
                return { ok: false };
            }
            normalized.push(entry.data);
        }

        return { ok: true, data: normalized };
    },

    /**
     * 校验并标准化单个精灵对象
     * @param {Object} elf
     * @returns {{ ok: boolean, data?: Object }}
     */
    normalizeElfEntry(elf) {
        if (!this.isPlainObject(elf)) {
            return { ok: false };
        }

        if (!this.isFiniteNumber(elf.elfId)) {
            return { ok: false };
        }

        if (!this.isFiniteNumber(elf.level)) {
            return { ok: false };
        }

        if (!this.isFiniteNumber(elf.currentHp)) {
            return { ok: false };
        }

        if (!Array.isArray(elf.skills)) {
            return { ok: false };
        }

        if (!elf.skills.every((skillId) => this.isFiniteNumber(skillId))) {
            return { ok: false };
        }

        if (!this.isPlainObject(elf.skillPP)) {
            return { ok: false };
        }

        if (!Object.values(elf.skillPP).every((pp) => this.isFiniteNumber(pp))) {
            return { ok: false };
        }

        if (!this.isPlainObject(elf.ev)) {
            return { ok: false };
        }

        if (!this.LEGACY_IV_KEYS.every((key) => this.isFiniteNumber(elf.ev[key]))) {
            return { ok: false };
        }

        const ivResult = this.normalizeIvValueForImport(elf.iv);
        if (!ivResult.ok) {
            return { ok: false };
        }

        const normalizedElf = {
            ...elf,
            iv: ivResult.value
        };

        return { ok: true, data: normalizedElf };
    },

    /**
     * 导入时校验并标准化 iv
     * @param {number|Object} iv
     * @returns {{ ok: boolean, value?: number }}
     */
    normalizeIvValueForImport(iv) {
        if (this.isFiniteNumber(iv)) {
            if (iv < 0 || iv > 31) {
                return { ok: false };
            }
            return { ok: true, value: Math.round(iv) };
        }

        if (this.isPlainObject(iv)) {
            if (!this.LEGACY_IV_KEYS.every((key) => this.isFiniteNumber(iv[key]))) {
                return { ok: false };
            }

            const total = this.LEGACY_IV_KEYS.reduce((sum, key) => sum + Number(iv[key]), 0);
            const average = total / this.LEGACY_IV_KEYS.length;
            const normalized = Phaser.Math.Clamp(Math.round(average), 0, 31);
            return { ok: true, value: normalized };
        }

        return { ok: false };
    },

    /**
     * 触发浏览器下载 JSON
     * @param {string} fileName
     * @param {string} content
     */
    downloadJson(fileName, content) {
        const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    },

    /**
     * 格式化时间戳为 YYYYMMDD_HHmmss
     * @param {Date} date
     * @returns {string}
     */
    formatTimestamp(date) {
        const year = String(date.getFullYear());
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}_${hours}${minutes}${seconds}`;
    },

    isPlainObject(value) {
        return !!value && typeof value === 'object' && !Array.isArray(value);
    },

    isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('SaveTransfer', SaveTransfer);
}

window.SaveTransfer = SaveTransfer;
