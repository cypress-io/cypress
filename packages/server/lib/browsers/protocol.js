"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var chrome_remote_interface_1 = __importDefault(require("chrome-remote-interface"));
var network_1 = require("@packages/network");
var bluebird_1 = __importDefault(require("bluebird"));
var lazy_ass_1 = __importDefault(require("lazy-ass"));
var debug_1 = __importDefault(require("debug"));
var errors = require('../errors');
var is = require('check-more-types');
var debug = debug_1.default('cypress:server:browsers:protocol');
function _getDelayMsForRetry(i) {
    if (i < 10) {
        return 100;
    }
    if (i < 18) {
        return 500;
    }
    if (i < 63) { // after 5 seconds, begin logging and retrying
        errors.warning('CDP_RETRYING_CONNECTION', i);
        return 1000;
    }
    return;
}
exports._getDelayMsForRetry = _getDelayMsForRetry;
function _connectAsync(opts) {
    return bluebird_1.default.fromCallback(function (cb) {
        network_1.connect.createRetryingSocket(opts, cb);
    })
        .then(function (sock) {
        // can be closed, just needed to test the connection
        sock.end();
    });
}
exports._connectAsync = _connectAsync;
/**
 * Tries to find the starting page (probably blank tab)
 * among all targets returned by CRI.List call.
 *
 * @returns {string} web socket debugger url
 */
var findStartPage = function (targets) {
    debug('CRI List %o', { numTargets: targets.length, targets: targets });
    // activate the first available id
    // find the first target page that's a real tab
    // and not the dev tools or background page.
    // since we open a blank page first, it has a special url
    var newTabTargetFields = {
        type: 'page',
        url: 'about:blank',
    };
    var target = lodash_1.default.find(targets, newTabTargetFields);
    lazy_ass_1.default(target, 'could not find CRI target');
    debug('found CRI target %o', target);
    return target.webSocketDebuggerUrl;
};
var findStartPageTarget = function (connectOpts) {
    debug('CRI.List %o', connectOpts);
    // what happens if the next call throws an error?
    // it seems to leave the browser instance open
    // need to clone connectOpts, CRI modifies it
    return chrome_remote_interface_1.default.List(lodash_1.default.clone(connectOpts)).then(findStartPage);
};
/**
 * Waits for the port to respond with connection to Chrome Remote Interface
 * @param {number} port Port number to connect to
 */
exports.getWsTargetFor = function (port) {
    debug('Getting WS connection to CRI on port %d', port);
    lazy_ass_1.default(is.port(port), 'expected port number', port);
    var retryIndex = 0;
    // force ipv4
    // https://github.com/cypress-io/cypress/issues/5912
    var connectOpts = {
        host: '127.0.0.1',
        port: port,
        getDelayMsForRetry: function (i) {
            retryIndex = i;
            return _getDelayMsForRetry(i);
        },
    };
    return _connectAsync(connectOpts)
        .then(function () {
        var retry = function () {
            debug('attempting to find CRI target... %o', { retryIndex: retryIndex });
            return findStartPageTarget(connectOpts)
                .catch(function (err) {
                retryIndex++;
                var delay = _getDelayMsForRetry(retryIndex);
                debug('error finding CRI target, maybe retrying %o', { delay: delay, err: err });
                if (typeof delay === 'undefined') {
                    throw err;
                }
                return bluebird_1.default.delay(delay)
                    .then(retry);
            });
        };
        return retry();
    })
        .catch(function (err) {
        debug('failed to connect to CDP %o', { connectOpts: connectOpts, err: err });
        errors.throw('CDP_COULD_NOT_CONNECT', port, err);
    });
};
