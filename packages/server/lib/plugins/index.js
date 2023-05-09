"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._reset = exports.execute = exports.has = exports.registerHandler = exports.getPluginPid = exports.registerEvent = void 0;
const data_context_1 = require("@packages/data-context");
const registerEvent = (event, callback) => {
    (0, data_context_1.getCtx)().lifecycleManager.registerEvent(event, callback);
};
exports.registerEvent = registerEvent;
const getPluginPid = () => {
    return (0, data_context_1.getCtx)().lifecycleManager.eventProcessPid;
};
exports.getPluginPid = getPluginPid;
const registerHandler = (handler) => {
    (0, data_context_1.registerServerPluginHandler)(handler);
};
exports.registerHandler = registerHandler;
const has = (event) => {
    return (0, data_context_1.getCtx)().lifecycleManager.hasNodeEvent(event);
};
exports.has = has;
const execute = (event, ...args) => {
    return (0, data_context_1.getCtx)().lifecycleManager.executeNodeEvent(event, args);
};
exports.execute = execute;
// for testing purposes
const _reset = () => {
    return (0, data_context_1.getCtx)().lifecycleManager.reinitializeCypress();
};
exports._reset = _reset;
