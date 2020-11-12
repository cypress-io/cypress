"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var concat_stream_1 = __importDefault(require("concat-stream"));
/**
 * Wrapper for `concat-stream` to handle empty streams.
 */
exports.concatStream = function (opts, cb) {
    var _cb = cb;
    if (!_cb) {
        _cb = opts;
        opts = {};
    }
    return concat_stream_1.default(opts, function (buf) {
        if (!lodash_1.default.get(buf, 'length')) {
            // concat-stream can give an empty array if the stream has
            // no data - just call the callback with an empty buffer
            return _cb(Buffer.from(''));
        }
        return _cb(buf);
    });
};
