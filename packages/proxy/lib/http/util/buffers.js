"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var debug_1 = __importDefault(require("debug"));
var network_1 = require("@packages/network");
var debug = debug_1.default('cypress:proxy:http:util:buffers');
var stripPort = function (url) {
    try {
        return network_1.uri.removeDefaultPort(url).format();
    }
    catch (e) {
        return url;
    }
};
var HttpBuffers = /** @class */ (function () {
    function HttpBuffers() {
        this.buffer = undefined;
    }
    HttpBuffers.prototype.reset = function () {
        debug('resetting buffers');
        delete this.buffer;
    };
    HttpBuffers.prototype.set = function (obj) {
        obj = lodash_1.default.cloneDeep(obj);
        obj.url = stripPort(obj.url);
        obj.originalUrl = stripPort(obj.originalUrl);
        if (this.buffer) {
            debug('warning: overwriting existing buffer...', { buffer: lodash_1.default.pick(this.buffer, 'url') });
        }
        debug('setting buffer %o', lodash_1.default.pick(obj, 'url'));
        this.buffer = obj;
    };
    HttpBuffers.prototype.get = function (str) {
        if (this.buffer && this.buffer.url === stripPort(str)) {
            return this.buffer;
        }
    };
    HttpBuffers.prototype.take = function (str) {
        var foundBuffer = this.get(str);
        if (foundBuffer) {
            delete this.buffer;
            debug('found request buffer %o', { buffer: lodash_1.default.pick(foundBuffer, 'url') });
            return foundBuffer;
        }
    };
    return HttpBuffers;
}());
exports.HttpBuffers = HttpBuffers;
