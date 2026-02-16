const StatusEffectHandler = {
    type: 'status',

    onHit(context) {
        const effect = context.effect || {};
        const statusType = effect.status;
        if (!statusType) {
            return;
        }

        if (!BattleEffectHelpers.rollChance(effect.chance)) {
            return;
        }

        const side = BattleEffectHelpers.getSideByTarget(context, effect.target);
        const targetElf = BattleEffectHelpers.getElfBySide(context, side);
        if (!targetElf || targetElf.isFainted()) {
            return;
        }

        if (statusType === 'parasitism') {
            if (effect.immuneType && targetElf.type === effect.immuneType) {
                context.manager.log(`${targetElf.getDisplayName()} 免疫寄生效果！`);
                return;
            }

            if (!context.runtime || typeof context.runtime.applyParasitism !== 'function') {
                return;
            }

            context.runtime.applyParasitism(context.manager, side, {
                duration: effect.duration || 5,
                healRatio: Number.isFinite(effect.healRatio) ? effect.healRatio : 0.125,
                sourceSide: context.actorSide
            });
            context.manager.log(`${targetElf.getDisplayName()} 被寄生种子缠住了！`);
            BattleEffectHelpers.appendEffectApplied(context, {
                side,
                status: 'parasitism'
            });
            return;
        }

        const statusService = context.manager.getDependency('StatusEffect');
        if (!statusService || typeof statusService.applyStatus !== 'function') {
            return;
        }

        const applied = statusService.applyStatus(targetElf, statusType, {
            duration: effect.duration
        });

        if (applied.replacedStatus) {
            context.manager.appendTurnEvent(context.result, BattleManager.EVENT.STATUS_REMOVED, {
                target: side,
                status: applied.replacedStatus,
                reason: 'replaced'
            });
        }

        if (!applied.applied && !applied.refreshed) {
            return;
        }

        const statusName = statusService.getStatusName(statusType);
        if (applied.applied) {
            context.manager.log(`${targetElf.getDisplayName()} 陷入了${statusName}状态！`);
        } else {
            context.manager.log(`${targetElf.getDisplayName()} 的${statusName}状态回合刷新了！`);
        }

        context.manager.appendTurnEvent(context.result, BattleManager.EVENT.STATUS_APPLIED, {
            target: side,
            status: statusType,
            category: applied.category || null,
            duration: applied.duration,
            refreshed: !!applied.refreshed,
            replacedStatus: applied.replacedStatus || null
        });

        BattleEffectHelpers.appendEffectApplied(context, {
            side,
            status: statusType,
            refreshed: !!applied.refreshed
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('status', StatusEffectHandler);
}
