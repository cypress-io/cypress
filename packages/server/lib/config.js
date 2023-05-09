"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResolvedRuntimeConfig = exports.setUrls = void 0;
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const configUtils = tslib_1.__importStar(require("@packages/config"));
exports.setUrls = configUtils.setUrls;
function getResolvedRuntimeConfig(config, runtimeConfig) {
    const resolvedRuntimeFields = lodash_1.default.mapValues(runtimeConfig, (v) => ({ value: v, from: 'runtime' }));
    return {
        ...config,
        ...runtimeConfig,
        resolved: { ...config.resolved, ...resolvedRuntimeFields },
    };
}
exports.getResolvedRuntimeConfig = getResolvedRuntimeConfig;
