"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isListening = exports.retryIsListening = void 0;
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const request_promise_1 = tslib_1.__importDefault(require("@cypress/request-promise"));
const url = tslib_1.__importStar(require("url"));
const network_1 = require("@packages/network");
const debug = (0, debug_1.default)('cypress:server:ensure-url');
const retryIsListening = (urlStr, options) => {
    const { retryIntervals, onRetry } = options;
    const delaysRemaining = lodash_1.default.clone(retryIntervals);
    const run = () => {
        debug('checking that baseUrl is available', {
            baseUrl: urlStr,
            delaysRemaining,
            retryIntervals,
        });
        return (0, exports.isListening)(urlStr)
            .catch((err) => {
            const delay = delaysRemaining.shift();
            if (!delay) {
                throw err;
            }
            onRetry({
                delay,
                attempt: retryIntervals.length - delaysRemaining.length,
                remaining: delaysRemaining.length + 1,
            });
            return bluebird_1.default.delay(delay)
                .then(() => {
                return run();
            });
        });
    };
    return run();
};
exports.retryIsListening = retryIsListening;
const isListening = (urlStr) => {
    // takes a urlStr and verifies the hostname + port is listening
    let { hostname, protocol, port } = url.parse(urlStr);
    if (port == null) {
        port = protocol === 'https:' ? '443' : '80';
    }
    if (process.env.HTTP_PROXY) {
        // cannot make arbitrary connections behind a proxy, attempt HTTP/HTTPS
        // For some reason, TypeScript gets confused by the "agent" parameter
        // and required double ts-ignore to allow it on local machines and on CI
        // @ts-ignore
        return (0, request_promise_1.default)({
            url: urlStr,
            // @ts-ignore
            agent: network_1.agent,
            proxy: null,
        })
            .catch({ name: 'StatusCodeError' }, () => { }); // we just care if it can connect, not if it's a valid resource
    }
    return network_1.connect.getAddress(Number(port), String(hostname));
};
exports.isListening = isListening;
