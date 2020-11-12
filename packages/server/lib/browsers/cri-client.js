"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bluebird_1 = __importDefault(require("bluebird"));
var debug_1 = __importDefault(require("debug"));
var lodash_1 = __importDefault(require("lodash"));
var chromeRemoteInterface = require('chrome-remote-interface');
exports.chromeRemoteInterface = chromeRemoteInterface;
var errors = require('../errors');
var debug = debug_1.default('cypress:server:browsers:cri-client');
// debug using cypress-verbose:server:browsers:cri-client:send:*
var debugVerboseSend = debug_1.default('cypress-verbose:server:browsers:cri-client:send:[-->]');
// debug using cypress-verbose:server:browsers:cri-client:recv:*
var debugVerboseReceive = debug_1.default('cypress-verbose:server:browsers:cri-client:recv:[<--]');
var WEBSOCKET_NOT_OPEN_RE = /^WebSocket is (?:not open|already in CLOSING or CLOSED state)/;
var isVersionGte = function (a, b) {
    return a.major > b.major || (a.major === b.major && a.minor >= b.minor);
};
var getMajorMinorVersion = function (version) {
    var _a = version.split('.', 2).map(Number), major = _a[0], minor = _a[1];
    return { major: major, minor: minor };
};
var maybeDebugCdpMessages = function (cri) {
    if (debugVerboseReceive.enabled) {
        cri._ws.on('message', function (data) {
            data = lodash_1.default
                .chain(JSON.parse(data))
                .tap(function (data) {
                ([
                    'params.data',
                    'result.data',
                ]).forEach(function (truncatablePath) {
                    var str = lodash_1.default.get(data, truncatablePath);
                    if (!lodash_1.default.isString(str)) {
                        return;
                    }
                    lodash_1.default.set(data, truncatablePath, lodash_1.default.truncate(str, {
                        length: 100,
                        omission: "... [truncated string of total bytes: " + str.length + "]",
                    }));
                });
                return data;
            })
                .value();
            debugVerboseReceive('received CDP message %o', data);
        });
    }
    if (debugVerboseSend.enabled) {
        var send_1 = cri._ws.send;
        cri._ws.send = function (data, callback) {
            debugVerboseSend('sending CDP command %o', JSON.parse(data));
            return send_1.call(cri._ws, data, callback);
        };
    }
};
exports.create = bluebird_1.default.method(function (target, onAsynchronousError) {
    var subscriptions = [];
    var enqueuedCommands = [];
    var closed = false; // has the user called .close on this?
    var connected = false; // is this currently connected to CDP?
    var cri;
    var client;
    var reconnect = function () {
        debug('disconnected, attempting to reconnect... %o', { closed: closed });
        connected = false;
        if (closed) {
            return;
        }
        return connect()
            .then(function () {
            debug('restoring subscriptions + running queued commands... %o', { subscriptions: subscriptions, enqueuedCommands: enqueuedCommands });
            subscriptions.forEach(function (sub) {
                cri.on(sub.eventName, sub.cb);
            });
            enqueuedCommands.forEach(function (cmd) {
                cri.send(cmd.command, cmd.params)
                    .then(cmd.p.resolve, cmd.p.reject);
            });
            enqueuedCommands = [];
        })
            .catch(function (err) {
            onAsynchronousError(errors.get('CDP_COULD_NOT_RECONNECT', err));
        });
    };
    var connect = function () {
        var _a;
        (_a = cri) === null || _a === void 0 ? void 0 : _a.close();
        debug('connecting %o', { target: target });
        return chromeRemoteInterface({
            target: target,
            local: true,
        })
            .then(function (newCri) {
            cri = newCri;
            connected = true;
            maybeDebugCdpMessages(cri);
            cri.send = bluebird_1.default.promisify(cri.send, { context: cri });
            cri.close = bluebird_1.default.promisify(cri.close, { context: cri });
            // @see https://github.com/cyrus-and/chrome-remote-interface/issues/72
            cri._notifier.on('disconnect', reconnect);
        });
    };
    return connect()
        .then(function () {
        var ensureMinimumProtocolVersion = function (protocolVersion) {
            return getProtocolVersion()
                .then(function (actual) {
                var minimum = getMajorMinorVersion(protocolVersion);
                if (!isVersionGte(actual, minimum)) {
                    errors.throw('CDP_VERSION_TOO_OLD', protocolVersion, actual);
                }
            });
        };
        var getProtocolVersion = lodash_1.default.memoize(function () {
            return client.send('Browser.getVersion')
                // could be any version <= 1.2
                .catchReturn({ protocolVersion: '0.0' })
                .then(function (_a) {
                var protocolVersion = _a.protocolVersion;
                return getMajorMinorVersion(protocolVersion);
            });
        });
        client = {
            ensureMinimumProtocolVersion: ensureMinimumProtocolVersion,
            getProtocolVersion: getProtocolVersion,
            send: bluebird_1.default.method(function (command, params) {
                var enqueue = function () {
                    return new bluebird_1.default(function (resolve, reject) {
                        enqueuedCommands.push({ command: command, params: params, p: { resolve: resolve, reject: reject } });
                    });
                };
                if (connected) {
                    return cri.send(command, params)
                        .catch(function (err) {
                        if (!WEBSOCKET_NOT_OPEN_RE.test(err.message)) {
                            throw err;
                        }
                        debug('encountered closed websocket on send %o', { command: command, params: params, err: err });
                        var p = enqueue();
                        reconnect();
                        return p;
                    });
                }
                return enqueue();
            }),
            on: function (eventName, cb) {
                subscriptions.push({ eventName: eventName, cb: cb });
                debug('registering CDP on event %o', { eventName: eventName });
                return cri.on(eventName, cb);
            },
            close: function () {
                closed = true;
                return cri.close();
            },
        };
        return client;
    });
});
