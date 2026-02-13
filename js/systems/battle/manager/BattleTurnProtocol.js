/**
 * BattleTurnProtocol - 回合协议壳
 * 负责统一 result 协议结构、事件追加、兼容字段回填。
 */

const BattleTurnProtocol = {
    cloneAction(action) {
        if (!action || typeof action !== 'object') {
            return null;
        }
        return { ...action };
    },

    createTurnResult(manager) {
        return {
            protocolVersion: 2,
            turn: manager.turnCount,
            playerAction: this.cloneAction(manager.playerAction),
            enemyAction: null,
            events: [],
            outcome: {
                status: 'continue',
                battleEnded: false,
                winner: null,
                needSwitch: false,
                escaped: false,
                captured: false,
                actionRejected: false,
                reason: null
            }
        };
    },

    appendTurnEvent(manager, result, type, payload = {}) {
        const event = {
            type,
            turn: manager.turnCount,
            index: result.events.length,
            ...payload
        };
        result.events.push(event);
        return event;
    },

    getLastEvent(result, type) {
        if (!result || !Array.isArray(result.events)) {
            return null;
        }
        for (let i = result.events.length - 1; i >= 0; i--) {
            if (result.events[i].type === type) {
                return result.events[i];
            }
        }
        return null;
    },

    finalizeTurnResult(result) {
        const outcome = result.outcome || {};

        result.battleEnded = outcome.battleEnded === true;
        result.winner = outcome.winner || null;
        result.needSwitch = outcome.needSwitch === true;
        result.escaped = outcome.escaped === true;
        result.captured = outcome.captured === true;
        result.actionRejected = outcome.actionRejected === true;

        const catchEvent = this.getLastEvent(result, BattleManager.EVENT.CATCH_RESULT);
        result.catchAttempt = !!catchEvent;
        result.catchResult = catchEvent ? (catchEvent.result || null) : null;

        const switchEvent = this.getLastEvent(result, BattleManager.EVENT.SWITCH_DONE);
        result.switched = !!switchEvent;

        return result;
    },

    markActionRejected(result, reason) {
        result.outcome.status = 'rejected';
        result.outcome.actionRejected = true;
        result.outcome.reason = reason || 'action_rejected';
    },

    markNeedSwitch(result, reason = 'need_switch') {
        result.outcome.status = 'need_switch';
        result.outcome.needSwitch = true;
        result.outcome.reason = reason;
    },

    markBattleEnd(result, payload = {}) {
        result.outcome.status = 'battle_end';
        result.outcome.battleEnded = true;
        if (payload.winner) {
            result.outcome.winner = payload.winner;
        }
        if (payload.reason) {
            result.outcome.reason = payload.reason;
        }
        if (payload.escaped) {
            result.outcome.escaped = true;
        }
        if (payload.captured) {
            result.outcome.captured = true;
        }
    },

    appendActionSubmittedEvent(manager, result, actor, action) {
        this.appendTurnEvent(manager, result, BattleManager.EVENT.ACTION_SUBMITTED, {
            actor,
            actionType: action ? action.type : null,
            action: this.cloneAction(action)
        });
    },

    appendBattleEndEvent(manager, result, reason) {
        this.appendTurnEvent(manager, result, BattleManager.EVENT.BATTLE_END, {
            winner: result.outcome.winner,
            escaped: result.outcome.escaped,
            captured: result.outcome.captured,
            reason: reason || result.outcome.reason || null
        });
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleTurnProtocol', BattleTurnProtocol);
}

window.BattleTurnProtocol = BattleTurnProtocol;
