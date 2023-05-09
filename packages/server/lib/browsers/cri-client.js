"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const chrome_remote_interface_1 = tslib_1.__importDefault(require("chrome-remote-interface"));
const errors = tslib_1.__importStar(require("../errors"));
const debug = (0, debug_1.default)('cypress:server:browsers:cri-client');
// debug using cypress-verbose:server:browsers:cri-client:send:*
const debugVerboseSend = (0, debug_1.default)('cypress-verbose:server:browsers:cri-client:send:[-->]');
// debug using cypress-verbose:server:browsers:cri-client:recv:*
const debugVerboseReceive = (0, debug_1.default)('cypress-verbose:server:browsers:cri-client:recv:[<--]');
const WEBSOCKET_NOT_OPEN_RE = /^WebSocket is (?:not open|already in CLOSING or CLOSED state)/;
const maybeDebugCdpMessages = (cri) => {
    if (debugVerboseReceive.enabled) {
        cri._ws.on('message', (data) => {
            data = lodash_1.default
                .chain(JSON.parse(data))
                .tap((data) => {
                ([
                    'params.data',
                    'result.data', // screenshot data
                ]).forEach((truncatablePath) => {
                    const str = lodash_1.default.get(data, truncatablePath);
                    if (!lodash_1.default.isString(str)) {
                        return;
                    }
                    lodash_1.default.set(data, truncatablePath, lodash_1.default.truncate(str, {
                        length: 100,
                        omission: `... [truncated string of total bytes: ${str.length}]`,
                    }));
                });
                return data;
            })
                .value();
            debugVerboseReceive('received CDP message %o', data);
        });
    }
    if (debugVerboseSend.enabled) {
        const send = cri._ws.send;
        cri._ws.send = (data, callback) => {
            debugVerboseSend('sending CDP command %o', JSON.parse(data));
            return send.call(cri._ws, data, callback);
        };
    }
};
const create = async (target, onAsynchronousError, host, port, onReconnect) => {
    const subscriptions = [];
    const enableCommands = [];
    let enqueuedCommands = [];
    let closed = false; // has the user called .close on this?
    let connected = false; // is this currently connected to CDP?
    let cri;
    let client;
    const reconnect = async () => {
        debug('disconnected, attempting to reconnect... %o', { closed });
        connected = false;
        if (closed) {
            enqueuedCommands = [];
            return;
        }
        try {
            await connect();
            debug('restoring subscriptions + running *.enable and queued commands... %o', { subscriptions, enableCommands, enqueuedCommands });
            // '*.enable' commands need to be resent on reconnect or any events in
            // that namespace will no longer be received
            await Promise.all(enableCommands.map((cmdName) => {
                return cri.send(cmdName);
            }));
            subscriptions.forEach((sub) => {
                cri.on(sub.eventName, sub.cb);
            });
            enqueuedCommands.forEach((cmd) => {
                cri.send(cmd.command, cmd.params)
                    .then(cmd.p.resolve, cmd.p.reject);
            });
            enqueuedCommands = [];
            if (onReconnect) {
                onReconnect(client);
            }
        }
        catch (err) {
            const cdpError = errors.get('CDP_COULD_NOT_RECONNECT', err);
            // If we cannot reconnect to CDP, we will be unable to move to the next set of specs since we use CDP to clean up and close tabs. Marking this as fatal
            cdpError.isFatalApiErr = true;
            onAsynchronousError(cdpError);
        }
    };
    const connect = async () => {
        await (cri === null || cri === void 0 ? void 0 : cri.close());
        debug('connecting %o', { target });
        cri = await (0, chrome_remote_interface_1.default)({
            host,
            port,
            target,
            local: true,
            useHostName: true,
        });
        connected = true;
        maybeDebugCdpMessages(cri);
        // @see https://github.com/cyrus-and/chrome-remote-interface/issues/72
        cri._notifier.on('disconnect', reconnect);
    };
    await connect();
    client = {
        targetId: target,
        async send(command, params) {
            const enqueue = () => {
                return new Promise((resolve, reject) => {
                    enqueuedCommands.push({ command, params, p: { resolve, reject } });
                });
            };
            // Keep track of '*.enable' commands so they can be resent when
            // reconnecting
            if (command.endsWith('.enable')) {
                enableCommands.push(command);
            }
            if (connected) {
                try {
                    return await cri.send(command, params);
                }
                catch (err) {
                    // This error occurs when the browser has been left open for a long
                    // time and/or the user's computer has been put to sleep. The
                    // socket disconnects and we need to recreate the socket and
                    // connection
                    if (!WEBSOCKET_NOT_OPEN_RE.test(err.message)) {
                        throw err;
                    }
                    debug('encountered closed websocket on send %o', { command, params, err });
                    const p = enqueue();
                    await reconnect();
                    return p;
                }
            }
            return enqueue();
        },
        on(eventName, cb) {
            subscriptions.push({ eventName, cb });
            debug('registering CDP on event %o', { eventName });
            return cri.on(eventName, cb);
        },
        close() {
            closed = true;
            return cri.close();
        },
    };
    return client;
};
exports.create = create;
