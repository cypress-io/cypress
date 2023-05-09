"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serve = exports.makeServeConfig = exports.handle = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const send_1 = tslib_1.__importDefault(require("send"));
const resolve_dist_1 = require("@packages/resolve-dist");
const debug = (0, debug_1.default)('cypress:server:runner-ct');
const handle = (req, res) => {
    const pathToFile = (0, resolve_dist_1.getPathToDist)('runner', req.params[0]);
    return (0, send_1.default)(req, pathToFile)
        .pipe(res);
};
exports.handle = handle;
const makeServeConfig = (options) => {
    const config = {
        ...options.config,
        browser: options.getCurrentBrowser(),
    };
    // TODO: move the component file watchers in here
    // and update them in memory when they change and serve
    // them straight to the HTML on load
    debug('serving runner index.html with config %o', lodash_1.default.pick(config, 'version', 'platform', 'arch', 'projectName'));
    // base64 before embedding so user-supplied contents can't break out of <script>
    // https://github.com/cypress-io/cypress/issues/4952
    const base64Config = Buffer.from(JSON.stringify(config)).toString('base64');
    return {
        base64Config,
        projectName: config.projectName,
        namespace: config.namespace,
    };
};
exports.makeServeConfig = makeServeConfig;
const serve = (req, res, options) => {
    const config = (0, exports.makeServeConfig)(options);
    const runnerPath = process.env.CYPRESS_INTERNAL_RUNNER_PATH || (0, resolve_dist_1.getPathToIndex)('runner');
    return res.render(runnerPath, config);
};
exports.serve = serve;
