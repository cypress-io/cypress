"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("./constants");
var NoopMountHook = function (_) { };
var DefaultMountHooks = {
    setup: NoopMountHook,
    mount: NoopMountHook,
};
/** Mount Options */
// TODO: do we really need six ways to add stylesheets? Can we just overload one option?
exports.DefaultStyleOptions = {
    cssFile: '',
    cssFiles: [],
    styles: '',
    style: '',
    stylesheet: '',
    stylesheets: [],
};
exports.DefaultMountOptions = __assign({}, DefaultMountHooks, exports.DefaultStyleOptions, { mountModeEnabled: true, rootId: constants_1.rootId });
