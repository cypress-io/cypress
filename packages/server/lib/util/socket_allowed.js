"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var debug_1 = __importDefault(require("debug"));
var debug = debug_1.default('cypress:server:util:socket_allowed');
/**
 * Utility to validate incoming, local socket connections against a list of
 * expected client TCP ports.
 */
var SocketAllowed = /** @class */ (function () {
    function SocketAllowed() {
        var _this = this;
        this.allowedLocalPorts = [];
        /**
         * Add a socket to the allowed list.
         */
        this.add = function (socket) {
            var localPort = socket.localPort;
            debug('allowing socket %o', { localPort: localPort });
            _this.allowedLocalPorts.push(localPort);
            socket.once('close', function () {
                debug('allowed socket closed, removing %o', { localPort: localPort });
                _this._remove(socket);
            });
        };
    }
    SocketAllowed.prototype._remove = function (socket) {
        lodash_1.default.pull(this.allowedLocalPorts, socket.localPort);
    };
    /**
     * Is this socket that this request originated allowed?
     */
    SocketAllowed.prototype.isRequestAllowed = function (req) {
        var _a = req.socket, remotePort = _a.remotePort, remoteAddress = _a.remoteAddress;
        var isAllowed = this.allowedLocalPorts.includes(remotePort)
            && ['127.0.0.1', '::1'].includes(remoteAddress);
        debug('is incoming request allowed? %o', { isAllowed: isAllowed, reqUrl: req.url, remotePort: remotePort, remoteAddress: remoteAddress });
        return isAllowed;
    };
    return SocketAllowed;
}());
exports.SocketAllowed = SocketAllowed;
