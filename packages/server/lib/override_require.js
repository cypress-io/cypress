"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Module = require('module');
exports.overrideRequire = function (requireOverride) {
    var _load = Module._load;
    Module._load = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var pkg = args;
        if (requireOverride) {
            var mockedDependency = requireOverride(pkg[0], _load);
            if (mockedDependency != null) {
                return mockedDependency;
            }
        }
        var ret = _load.apply(this, pkg);
        return ret;
    };
};
