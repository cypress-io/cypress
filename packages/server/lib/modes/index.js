"use strict";
const tslib_1 = require("tslib");
const data_context_1 = require("@packages/data-context");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const makeDataContext_1 = require("../makeDataContext");
const random_1 = tslib_1.__importDefault(require("../util/random"));
const telemetry_1 = require("@packages/telemetry");
module.exports = (mode, options) => {
    var _a;
    if (mode === 'smokeTest') {
        return require('./smoke_test').run(options);
    }
    if (mode === 'run') {
        lodash_1.default.defaults(options, {
            socketId: random_1.default.id(10),
            isTextTerminal: true,
            browser: 'electron',
            quiet: false,
            morgan: false,
            report: true,
        });
    }
    const span = telemetry_1.telemetry.startSpan({ name: `initialize:mode:${mode}` });
    const ctx = (0, data_context_1.setCtx)((0, makeDataContext_1.makeDataContext)({ mode: mode === 'run' ? mode : 'open', modeOptions: options }));
    (_a = telemetry_1.telemetry.getSpan('cypress')) === null || _a === void 0 ? void 0 : _a.setAttribute('name', `cypress:${mode}`);
    const loadingPromise = ctx.initializeMode().then(() => {
        span === null || span === void 0 ? void 0 : span.end();
    });
    if (mode === 'run') {
        // run must always be deterministic - if the user doesn't specify
        // a testingType, we default to e2e
        options.testingType = options.testingType || 'e2e';
        return require('./run').run(options, loadingPromise);
    }
    if (mode === 'interactive') {
        // Either launchpad or straight to e2e tests
        return require('./interactive').run(options, loadingPromise);
    }
};
