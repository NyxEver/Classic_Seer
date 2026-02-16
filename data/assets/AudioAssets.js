/**
 * AudioAssets - 音频资源子映射
 */

const AudioAssets = {
    /**
     * 背景音乐映射
     * key: 场景 key
     * value: BGM 音频名称
     */
    bgm: {
        BattleScene: 'seer_battle_1',
        KloseScene: 'klose_planet'
    },

    /**
     * BGM 文件路径映射
     * key: BGM 音频名称
     * value: 资源路径
     */
    bgmPaths: {
        seer_battle_1: 'assets/audio/bgm/seer_battle_1.mp3',
        klose_planet: 'assets/audio/bgm/stars/Klose_BGM.mp3'
    },

    /**
     * BGM Base64 数据键映射（用于 file://）
     * key: BGM 音频名称
     * value: BgmData 的字段名
     */
    bgmDataKeys: {
        seer_battle_1: 'seer_battle_1',
        klose_planet: 'Klose_BGM'
    }
};

window.AudioAssets = AudioAssets;
