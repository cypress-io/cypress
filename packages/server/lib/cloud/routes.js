"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const url_parse_1 = tslib_1.__importDefault(require("url-parse"));
const app_config = require('../../config/app.json');
const apiUrl = app_config[process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'development'].api_url;
const CLOUD_ENDPOINTS = {
    api: '',
    auth: 'auth',
    ping: 'ping',
    runs: 'runs',
    instances: 'runs/:id/instances',
    instanceTests: 'instances/:id/tests',
    instanceResults: 'instances/:id/results',
    instanceStdout: 'instances/:id/stdout',
    exceptions: 'exceptions',
    telemetry: 'telemetry',
};
const parseArgs = function (url, args = []) {
    lodash_1.default.each(args, (value) => {
        if (lodash_1.default.isObject(value)) {
            url.set('query', lodash_1.default.extend(url.query, value));
            return;
        }
        if (lodash_1.default.isString(value) || lodash_1.default.isNumber(value)) {
            url.set('pathname', url.pathname.replace(':id', value));
            return;
        }
    });
    return url;
};
const makeRoutes = (baseUrl, routes) => {
    return lodash_1.default.reduce(routes, (memo, value, key) => {
        memo[key] = function (...args) {
            let url = new url_parse_1.default(baseUrl, true);
            if (value) {
                url.set('pathname', value);
            }
            if (args.length) {
                url = parseArgs(url, args);
            }
            return url.toString();
        };
        return memo;
    }, {});
};
const apiRoutes = makeRoutes(apiUrl, CLOUD_ENDPOINTS);
module.exports = {
    apiUrl,
    apiRoutes,
    makeRoutes: (baseUrl) => makeRoutes(baseUrl, CLOUD_ENDPOINTS),
};
