const EqualizeHpEffectHandler = {
    type: 'equalizeHp',

    onHit(context) {
        const effect = context.effect || {};
        const attacker = context.attacker;
        const defender = context.defender;

        if (!attacker || !defender || defender.isFainted()) {
            return;
        }

        if (effect.requireTargetHigherHp && defender.currentHp <= attacker.currentHp) {
            context.manager.log(`${defender.getDisplayName()} 的体力不高于自身，技能失败。`);
            return;
        }

        const oldHp = defender.currentHp;
        const nextHp = Math.max(0, Math.min(defender.getMaxHp(), attacker.currentHp));
        if (oldHp === nextHp) {
            return;
        }

        defender.currentHp = nextHp;
        if (typeof defender._syncInstanceData === 'function') {
            defender._syncInstanceData();
        }

        const side = context.targetSide;
        if (nextHp < oldHp) {
            context.manager.log(`${defender.getDisplayName()} 的体力被压制到与对手相同！`);
            BattleEffectHelpers.appendHpChange(context, side, oldHp, nextHp, 'effect_damage', {
                effectType: 'equalizeHp'
            });
            if (context.runtime && typeof context.runtime.recordDamageTaken === 'function') {
                context.runtime.recordDamageTaken(context.manager, side, oldHp - nextHp);
            }
        } else {
            context.manager.log(`${defender.getDisplayName()} 的体力被调整到与对手相同！`);
            BattleEffectHelpers.appendHpChange(context, side, oldHp, nextHp, 'effect_heal', {
                effectType: 'equalizeHp'
            });
        }

        BattleEffectHelpers.appendEffectApplied(context, {
            side,
            effectType: 'equalizeHp'
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('equalizeHp', EqualizeHpEffectHandler);
}
