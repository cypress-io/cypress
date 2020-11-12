"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var bluebird_1 = __importDefault(require("bluebird"));
var debug_1 = __importDefault(require("debug"));
var request_promise_1 = __importDefault(require("@cypress/request-promise"));
var url = __importStar(require("url"));
var network_1 = require("@packages/network");
var debug = debug_1.default('cypress:server:ensure-url');
exports.retryIsListening = function (urlStr, options) {
    var retryIntervals = options.retryIntervals, onRetry = options.onRetry;
    var delaysRemaining = lodash_1.default.clone(retryIntervals);
    var run = function () {
        debug('checking that baseUrl is available', {
            baseUrl: urlStr,
            delaysRemaining: delaysRemaining,
            retryIntervals: retryIntervals,
        });
        return exports.isListening(urlStr)
            .catch(function (err) {
            var delay = delaysRemaining.shift();
            if (!delay) {
                throw err;
            }
            onRetry({
                delay: delay,
                attempt: retryIntervals.length - delaysRemaining.length,
                remaining: delaysRemaining.length + 1,
            });
            return bluebird_1.default.delay(delay)
                .then(function () {
                return run();
            });
        });
    };
    return run();
};
exports.isListening = function (urlStr) {
    // takes a urlStr and verifies the hostname + port is listening
    var _a = url.parse(urlStr), hostname = _a.hostname, protocol = _a.protocol, port = _a.port;
    if (port == null) {
        port = protocol === 'https:' ? '443' : '80';
    }
    if (process.env.HTTP_PROXY) {
        // cannot make arbitrary connections behind a proxy, attempt HTTP/HTTPS
        // For some reason, TypeScript gets confused by the "agent" parameter
        // and required double ts-ignore to allow it on local machines and on CI
        // @ts-ignore
        return request_promise_1.default({
            url: urlStr,
            // @ts-ignore
            agent: network_1.agent,
            proxy: null,
        })
            .catch({ name: 'StatusCodeError' }, function () { }); // we just care if it can connect, not if it's a valid resource
    }
    return network_1.connect.getAddress(Number(port), String(hostname));
};
