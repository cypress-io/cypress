"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommonRoutes = void 0;
const tslib_1 = require("tslib");
const http_proxy_1 = tslib_1.__importDefault(require("http-proxy"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const express_1 = require("express");
const send_1 = tslib_1.__importDefault(require("send"));
const resolve_dist_1 = require("@packages/resolve-dist");
const xhrs_1 = tslib_1.__importDefault(require("./controllers/xhrs"));
const runner_1 = require("./controllers/runner");
const iframes_1 = require("./controllers/iframes");
const data_context_1 = require("@packages/data-context");
const makeGraphQLServer_1 = require("@packages/graphql/src/makeGraphQLServer");
const debug = (0, debug_1.default)('cypress:server:routes');
const createCommonRoutes = ({ config, networkProxy, testingType, getSpec, remoteStates, nodeProxy, }) => {
    const router = (0, express_1.Router)();
    const { clientRoute, namespace } = config;
    if (process.env.CYPRESS_INTERNAL_VITE_DEV) {
        const proxy = http_proxy_1.default.createProxyServer({
            target: `http://localhost:${process.env.CYPRESS_INTERNAL_VITE_APP_PORT}/`,
        });
        router.get('/__cypress/assets/*', (req, res) => {
            proxy.web(req, res, {}, (e) => { });
        });
    }
    else {
        router.get('/__cypress/assets/*', (req, res) => {
            const pathToFile = (0, resolve_dist_1.getPathToDist)('app', req.params[0]);
            return (0, send_1.default)(req, pathToFile).pipe(res);
        });
    }
    router.use(`/${namespace}/graphql/*`, makeGraphQLServer_1.graphQLHTTP);
    router.get(`/${namespace}/runner/*`, (req, res) => {
        runner_1.runner.handle(req, res);
    });
    router.all(`/${namespace}/xhrs/*`, (req, res, next) => {
        xhrs_1.default.handle(req, res, config, next);
    });
    router.get(`/${namespace}/iframes/*`, (req, res) => {
        if (testingType === 'e2e') {
            iframes_1.iframesController.e2e({ config, getSpec, remoteStates }, req, res);
        }
        if (testingType === 'component') {
            iframes_1.iframesController.component({ config, nodeProxy }, req, res);
        }
    });
    if (!clientRoute) {
        throw Error(`clientRoute is required. Received ${clientRoute}`);
    }
    router.get(clientRoute, (req, res) => {
        var _a, _b;
        const nonProxied = (_b = (_a = req.proxiedUrl) === null || _a === void 0 ? void 0 : _a.startsWith('/')) !== null && _b !== void 0 ? _b : false;
        // Chrome plans to make document.domain immutable in Chrome 109, with the default value
        // of the Origin-Agent-Cluster header becoming 'true'. We explicitly disable this header
        // so that we can continue to support tests that visit multiple subdomains in a single spec.
        // https://github.com/cypress-io/cypress/issues/20147
        res.setHeader('Origin-Agent-Cluster', '?0');
        (0, data_context_1.getCtx)().html.appHtml(nonProxied)
            .then((html) => res.send(html))
            .catch((e) => res.status(500).send({ stack: e.stack }));
    });
    // serve static assets from the dist'd Vite app
    router.get([
        `${clientRoute}assets/*`,
        `${clientRoute}shiki/*`,
    ], (req, res) => {
        debug('proxying static assets %s, params[0] %s', req.url, req.params[0]);
        const pathToFile = (0, resolve_dist_1.getPathToDist)('app', 'assets', req.params[0]);
        return (0, send_1.default)(req, pathToFile).pipe(res);
    });
    router.all('*', (req, res) => {
        networkProxy.handleHttpRequest(req, res);
    });
    // when we experience uncaught errors
    // during routing just log them out to
    // the console and send 500 status
    // and report to raygun (in production)
    const errorHandlingMiddleware = (err, req, res) => {
        console.log(err.stack); // eslint-disable-line no-console
        res.set('x-cypress-error', err.message);
        res.set('x-cypress-stack', JSON.stringify(err.stack));
        res.sendStatus(500);
    };
    router.use(errorHandlingMiddleware);
    return router;
};
exports.createCommonRoutes = createCommonRoutes;
