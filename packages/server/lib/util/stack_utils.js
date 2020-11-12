"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var stackLineRegex = /^\s*(at )?.*@?\(?.*\:\d+\:\d+\)?$/;
// returns tuple of [message, stack]
exports.splitStack = function (stack) {
    var lines = stack.split('\n');
    return lodash_1.default.reduce(lines, function (memo, line) {
        if (memo.messageEnded || stackLineRegex.test(line)) {
            memo.messageEnded = true;
            memo[1].push(line);
        }
        else {
            memo[0].push(line);
        }
        return memo;
    }, [[], []]);
};
exports.unsplitStack = function (messageLines, stackLines) {
    return lodash_1.default.castArray(messageLines).concat(stackLines).join('\n');
};
exports.getStackLines = function (stack) {
    var _a = exports.splitStack(stack), stackLines = _a[1];
    return stackLines;
};
exports.stackWithoutMessage = function (stack) {
    return exports.getStackLines(stack).join('\n');
};
exports.replacedStack = function (err, newStack) {
    // if err already lacks a stack or we've removed the stack
    // for some reason, keep it stackless
    if (!err.stack)
        return err.stack;
    var errString = err.toString();
    var stackLines = exports.getStackLines(newStack);
    return exports.unsplitStack(errString, stackLines);
};
