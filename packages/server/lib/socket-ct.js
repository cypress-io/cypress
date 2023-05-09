"use strict";
var _SocketCt_destroyAutPromise;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketCt = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const dev_server_1 = tslib_1.__importDefault(require("@packages/server/lib/plugins/dev-server"));
const socket_base_1 = require("@packages/server/lib/socket-base");
const p_defer_1 = tslib_1.__importDefault(require("p-defer"));
const assert_1 = tslib_1.__importDefault(require("assert"));
const debug = (0, debug_1.default)('cypress:server:socket-ct');
class SocketCt extends socket_base_1.SocketBase {
    constructor(config) {
        super(config);
        _SocketCt_destroyAutPromise.set(this, void 0);
        // should we use this option at all for component testing 😕?
        if (config.watchForFileChanges) {
            dev_server_1.default.emitter.on('dev-server:compile:success', ({ specFile }) => {
                this.toRunner('dev-server:compile:success', { specFile });
            });
        }
    }
    startListening(server, automation, config, options) {
        return super.startListening(server, automation, config, options, {
            onSocketConnection: (socket) => {
                debug('do onSocketConnection');
                socket.on('aut:destroy:complete', () => {
                    (0, assert_1.default)(tslib_1.__classPrivateFieldGet(this, _SocketCt_destroyAutPromise, "f"));
                    tslib_1.__classPrivateFieldGet(this, _SocketCt_destroyAutPromise, "f").resolve();
                });
            },
        });
    }
    destroyAut() {
        tslib_1.__classPrivateFieldSet(this, _SocketCt_destroyAutPromise, (0, p_defer_1.default)(), "f");
        this.toRunner('aut:destroy:init');
        return tslib_1.__classPrivateFieldGet(this, _SocketCt_destroyAutPromise, "f").promise;
    }
}
exports.SocketCt = SocketCt;
_SocketCt_destroyAutPromise = new WeakMap();
