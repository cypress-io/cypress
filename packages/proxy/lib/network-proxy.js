"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("./http");
var NetworkProxy = /** @class */ (function () {
    function NetworkProxy(opts) {
        this.http = new http_1.Http(opts);
    }
    NetworkProxy.prototype.handleHttpRequest = function (req, res) {
        this.http.handle(req, res);
    };
    NetworkProxy.prototype.handleSourceMapRequest = function (req, res) {
        this.http.handleSourceMapRequest(req, res);
    };
    NetworkProxy.prototype.setHttpBuffer = function (buffer) {
        this.http.setBuffer(buffer);
    };
    NetworkProxy.prototype.reset = function () {
        this.http.reset();
    };
    return NetworkProxy;
}());
exports.NetworkProxy = NetworkProxy;
