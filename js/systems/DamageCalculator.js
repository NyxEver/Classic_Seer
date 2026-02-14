/**
 * DamageCalculator - 伤害计算系统
 * 实现战斗中的伤害计算逻辑
 */

const DamageCalculator = {
    /**
     * 截断到小数点后 4 位（不四舍五入）
     * @param {number} value - 待截断的值
     * @returns {number}
     */
    truncate4(value) {
        return Math.floor(value * 10000) / 10000;
    },

    /**
     * 生成指定范围内的随机整数
     * @param {number} min - 最小值（包含）
     * @param {number} max - 最大值（包含）
     * @returns {number}
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 计算伤害值
     * 公式：floor((((等级*0.4+2)*技能威力*攻击方的攻击/防御方的防御)/50+2)*本系加成*克制系数*(R/255))
     * 
     * @param {Elf} attacker - 攻击方精灵实例
     * @param {Elf} defender - 防御方精灵实例
     * @param {Object} skill - 技能数据
     * @returns {Object} - { damage, isCritical, effectiveness, stab }
     */
    calculate(attacker, defender, skill) {
        const randomInt = (typeof this === 'object' && this && typeof this.randomInt === 'function')
            ? this.randomInt.bind(this)
            : DamageCalculator.randomInt.bind(DamageCalculator);
        const truncate4 = (typeof this === 'object' && this && typeof this.truncate4 === 'function')
            ? this.truncate4.bind(this)
            : DamageCalculator.truncate4.bind(DamageCalculator);

        // 非伤害技能返回 0
        if (skill.power === 0) {
            return {
                damage: 0,
                isCritical: false,
                effectiveness: 1,
                stab: false
            };
        }

        // 根据技能类型选择攻击和防御数值
        let attackStat, defenseStat;
        if (skill.category === 'physical') {
            attackStat = attacker.getAtk();
            defenseStat = defender.getDef();
        } else if (skill.category === 'special') {
            attackStat = attacker.getSpAtk();
            defenseStat = defender.getSpDef();
        } else {
            // 状态技能不造成伤害
            return {
                damage: 0,
                isCritical: false,
                effectiveness: 1,
                stab: false
            };
        }

        // 计算暴击
        let isCritical = false;
        let critMultiplier = 1;
        if (skill.critRate && skill.critRate > 0) {
            const critRoll = randomInt(1, skill.critRate);
            if (critRoll === 1) {
                isCritical = true;
                critMultiplier = 1.5;
            }
        }

        // 1. 计算基础值
        const powerMultiplier = (typeof StatusEffect !== 'undefined' && StatusEffect && typeof StatusEffect.getDamagePowerMultiplier === 'function')
            ? StatusEffect.getDamagePowerMultiplier(attacker, skill)
            : 1;
        const effectivePower = Math.max(0, Math.floor(skill.power * powerMultiplier));

        const levelFactor = truncate4(attacker.level * 0.4 + 2);
        const atkDefRatio = truncate4(attackStat / defenseStat);
        const baseDamage = truncate4((levelFactor * effectivePower * atkDefRatio) / 50 + 2);

        // 2. 应用加成
        // 本系加成（STAB）
        const stab = (skill.type === attacker.type);
        const stabMultiplier = stab ? 1.5 : 1;

        // 属性克制
        const typeEffect = DataLoader.getTypeEffectiveness(skill.type, defender.type);

        // 随机系数 R (217-255)
        const R = randomInt(217, 255);
        const randomFactor = R / 255; // 此处不截断

        // 3. 最终伤害
        let finalDamage = Math.floor(baseDamage * stabMultiplier * typeEffect * randomFactor * critMultiplier);

        // 最小伤害为 1（对于有效攻击）
        if (typeEffect > 0) {
            finalDamage = Math.max(finalDamage, 1);
        }

        console.log(`[DamageCalculator] ${attacker.getDisplayName()} -> ${defender.getDisplayName()}`);
        console.log(`  技能: ${skill.name} (${skill.type}, ${skill.category}, 威力${skill.power}${effectivePower !== skill.power ? ` -> ${effectivePower}` : ''})`);
        console.log(`  攻击/防御: ${attackStat}/${defenseStat}, 等级因子: ${levelFactor}`);
        console.log(`  基础伤害: ${baseDamage}, STAB: ${stab}, 克制: ${typeEffect}, 暴击: ${isCritical}`);
        console.log(`  随机系数: ${R}/255 = ${randomFactor.toFixed(4)}`);
        console.log(`  最终伤害: ${finalDamage}`);

        return {
            damage: finalDamage,
            isCritical: isCritical,
            effectiveness: typeEffect,
            stab: stab
        };
    },

    /**
     * 检查技能是否命中
     * @param {Object} skill - 技能数据
     * @param {number} accuracyMod - 命中率修正（等级变化）
     * @returns {boolean}
     */
    checkHit(skill, accuracyMod = 0) {
        const randomInt = (typeof this === 'object' && this && typeof this.randomInt === 'function')
            ? this.randomInt.bind(this)
            : DamageCalculator.randomInt.bind(DamageCalculator);

        // 必中技能
        if (skill.accuracy === 0 || skill.accuracy >= 100) {
            return true;
        }

        // 基础命中率
        let hitChance = skill.accuracy;

        // 应用命中率修正（每级 ±15%）
        // accuracyMod > 0: 降低对手命中 -> 提高闪避
        // 这里简化处理：accuracyMod 直接影响命中率
        hitChance += accuracyMod * 15;

        // 限制在 0-100 范围
        hitChance = Math.max(0, Math.min(100, hitChance));

        const roll = randomInt(1, 100);
        const hit = roll <= hitChance;

        console.log(`[DamageCalculator] 命中检定: ${roll} <= ${hitChance}? ${hit}`);

        return hit;
    },

    /**
     * 获取属性克制描述文本
     * @param {number} effectiveness - 克制倍率
     * @returns {string}
     */
    getEffectivenessText(effectiveness) {
        if (effectiveness === 0) {
            return '完全无效...';
        } else if (effectiveness === 0.5) {
            return '效果不佳...';
        } else if (effectiveness === 2) {
            return '效果拔群！';
        }
        return '';
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('DamageCalculator', DamageCalculator);
}

// 导出为全局对象
window.DamageCalculator = DamageCalculator;
