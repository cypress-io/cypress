"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var net_stubbing_1 = require("@packages/net-stubbing");
var debug = debug_1.default('cypress:proxy:http:error-middleware');
var LogError = function () {
    debug('error proxying request %o', {
        error: this.error,
        url: this.req.url,
        headers: this.req.headers,
    });
    this.next();
};
exports.AbortRequest = function () {
    if (this.outgoingReq) {
        debug('aborting outgoingReq');
        this.outgoingReq.abort();
    }
    this.next();
};
exports.UnpipeResponse = function () {
    if (this.incomingResStream) {
        debug('unpiping resStream from response');
        this.incomingResStream.unpipe();
    }
    this.next();
};
exports.DestroyResponse = function () {
    this.res.destroy();
    this.end();
};
exports.default = {
    LogError: LogError,
    InterceptError: net_stubbing_1.InterceptError,
    AbortRequest: exports.AbortRequest,
    UnpipeResponse: exports.UnpipeResponse,
    DestroyResponse: exports.DestroyResponse,
};
