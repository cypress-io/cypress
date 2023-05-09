"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenSuiteIntoRunnables = void 0;
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const flattenSuiteIntoRunnables = (suite, tests = [], hooks = []) => {
    if (lodash_1.default.isArray(suite)) {
        return lodash_1.default.map(suite, (s) => (0, exports.flattenSuiteIntoRunnables)(s))
            .reduce((arr1, arr2) => [arr1[0].concat(arr2[0]), arr1[1].concat(arr2[1])], [tests, hooks]);
    }
    // if we dont have a suite, return early
    if (!suite || !suite.suites) {
        return [tests, hooks];
    }
    tests = tests.concat(suite.tests);
    hooks = hooks.concat(suite.hooks);
    if (suite.suites.length) {
        return (0, exports.flattenSuiteIntoRunnables)(suite.suites, tests, hooks);
    }
    return [tests, hooks];
};
exports.flattenSuiteIntoRunnables = flattenSuiteIntoRunnables;
