/** 恢复全部PP效果处理器 */
const RestoreAllPPEffectHandler = {
    type: 'restoreAllPP',

    onHit(context) {
        const dataLoader = context.manager.getDependency('DataLoader');
        if (!dataLoader) {
            return;
        }

        let restoredSkills = 0;
        context.attacker.skills.forEach((skillId) => {
            const skill = dataLoader.getSkill(skillId);
            if (!skill) {
                return;
            }
            const oldPP = context.attacker.skillPP[skillId] || 0;
            if (oldPP === skill.pp) {
                return;
            }
            context.attacker.skillPP[skillId] = skill.pp;
            BattleEffectHelpers.appendPpChange(context, context.actorSide, skillId, oldPP, skill.pp, 'effect_restore_pp', {
                effectType: 'restoreAllPP'
            });
            restoredSkills += 1;
        });

        if (restoredSkills > 0) {
            if (typeof context.attacker._syncInstanceData === 'function') {
                context.attacker._syncInstanceData();
            }
            context.manager.log(`${context.attacker.getDisplayName()} 的所有技能 PP 已恢复！`);
            BattleEffectHelpers.appendEffectApplied(context, {
                side: context.actorSide,
                restoredSkills
            });
        }
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('restoreAllPP', RestoreAllPPEffectHandler);
}
