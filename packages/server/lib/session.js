"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearSessions = exports.getState = exports.getSession = exports.getActiveSessions = exports.saveSession = void 0;
const state = {
    globalSessions: {},
    specSessions: {},
};
function saveSession(data) {
    if (!data.id)
        throw new Error('session data had no id');
    if (data.cacheAcrossSpecs) {
        state.globalSessions[data.id] = data;
        return;
    }
    state.specSessions[data.id] = data;
}
exports.saveSession = saveSession;
function getActiveSessions() {
    return state.globalSessions;
}
exports.getActiveSessions = getActiveSessions;
function getSession(id) {
    const session = state.globalSessions[id] || state.specSessions[id];
    if (!session)
        throw new Error(`session with id "${id}" not found`);
    return session;
}
exports.getSession = getSession;
function getState() {
    return state;
}
exports.getState = getState;
function clearSessions(clearAllSessions = false) {
    state.specSessions = {};
    if (clearAllSessions) {
        state.globalSessions = {};
    }
}
exports.clearSessions = clearSessions;
