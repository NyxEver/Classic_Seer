/** 多段攻击效果处理器 */
const MultiHitEffectHandler = {
    type: 'multiHit',

    beforeDamage(context) {
        const effect = context.effect || {};
        const minHits = Math.max(1, Math.floor(effect.minHits || 2));
        const maxHits = Math.max(minHits, Math.floor(effect.maxHits || minHits));
        const hits = Math.floor(Math.random() * (maxHits - minHits + 1)) + minHits;
        context.damagePlan.hitCount = hits;
        context.damagePlan.singleRollHitCount = true;
        context.manager.log(`${context.attacker.getDisplayName()} 连续攻击 ${hits} 次！`);
        BattleEffectHelpers.appendEffectApplied(context, {
            side: context.targetSide,
            hits
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('multiHit', MultiHitEffectHandler);
}
