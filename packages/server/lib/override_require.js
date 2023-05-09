"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overrideRequire = void 0;
const Module = require('module');
const overrideRequire = (requireOverride) => {
    const _load = Module._load;
    Module._load = function (...args) {
        const pkg = args;
        if (requireOverride) {
            const mockedDependency = requireOverride(pkg[0], _load);
            if (mockedDependency != null) {
                return mockedDependency;
            }
        }
        const ret = _load.apply(this, pkg);
        return ret;
    };
};
exports.overrideRequire = overrideRequire;
