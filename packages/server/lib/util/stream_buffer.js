"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var debug_1 = __importDefault(require("debug"));
var stream_1 = __importDefault(require("stream"));
var debug = debug_1.default('cypress:server:stream_buffer');
function streamBuffer(initialSize) {
    if (initialSize === void 0) { initialSize = 2048; }
    var buffer = Buffer.allocUnsafe(initialSize);
    var bytesWritten = 0;
    var finished = false;
    var onWrite = function (chunk, enc, cb) {
        if (finished || !chunk || !buffer) {
            debug('received write after deleting buffer, ignoring %o', { chunkLength: chunk && chunk.length, enc: enc });
            return cb();
        }
        if (chunk.length + bytesWritten > buffer.length) {
            var newBufferLength = buffer.length;
            while (newBufferLength < chunk.length + bytesWritten) {
                newBufferLength *= 2;
            }
            debug('extending buffer to accomodate new chunk', {
                bufferLength: buffer.length,
                newBufferLength: newBufferLength,
            });
            var newBuffer = Buffer.allocUnsafe(newBufferLength);
            buffer.copy(newBuffer);
            buffer = newBuffer;
        }
        debug('appending chunk to buffer %o', { bytesWritten: bytesWritten, chunkLength: chunk.length });
        bytesWritten += chunk.copy(buffer, bytesWritten);
        // emit in case there are readers waiting
        writeable.emit('chunk', chunk);
        cb();
    };
    var onFinal = function (cb) {
        debug('stream buffer writeable final called');
        finished = true;
        cb();
    };
    var StreamBuffer = /** @class */ (function (_super) {
        __extends(StreamBuffer, _super);
        function StreamBuffer() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.readers = [];
            return _this;
        }
        StreamBuffer.prototype.createReadStream = function () {
            var bytesRead = 0;
            var readerId = lodash_1.default.uniqueId('reader');
            var onRead = function (size) {
                if (!buffer) {
                    debug('read requested after unpipeAll, ignoring %o', { size: size });
                    return;
                }
                // if there are unread bytes in the buffer,
                // send up to bytesWritten back
                if (bytesRead < bytesWritten) {
                    var chunkLength = bytesWritten - bytesRead;
                    var bytes = buffer.slice(bytesRead, bytesRead + chunkLength);
                    var bytesLength = bytes.length;
                    debug('reading unread bytes from buffer %o', {
                        readerId: readerId, bytesRead: bytesRead, bytesWritten: bytesWritten, chunkLength: chunkLength, readChunkLength: bytesLength,
                    });
                    bytesRead += bytesLength;
                    // if we can still push more bytes into
                    // the buffer then do it
                    if (readable.push(bytes)) {
                        return onRead(size);
                    }
                }
                // if it's finished and there are no unread bytes, EOF
                if (finished) {
                    // cleanup listeners that were added
                    writeable.removeListener('chunk', onRead);
                    writeable.removeListener('finish', onRead);
                    debug('buffered stream EOF %o', { readerId: readerId });
                    return readable.push(null);
                }
                // if we're not finished we may end up writing
                // more data - or we may end
                writeable.removeListener('chunk', onRead);
                writeable.once('chunk', onRead);
                // if the writeable stream buffer isn't finished
                // yet - then read() will not be called again,
                // so we restart reading when its finished
                writeable.removeListener('finish', onRead);
                writeable.once('finish', onRead);
            };
            var readable = new stream_1.default.Readable({
                read: onRead,
                // @ts-ignore
                autoDestroy: true,
            });
            this.readers.push(readable);
            return readable;
        };
        StreamBuffer.prototype.unpipeAll = function () {
            buffer = null; // aggressive GC
            lodash_1.default.invokeMap(this.readers, 'unpipe');
        };
        StreamBuffer.prototype._buffer = function () {
            return buffer;
        };
        StreamBuffer.prototype._finished = function () {
            return finished;
        };
        return StreamBuffer;
    }(stream_1.default.Writable));
    var writeable = new StreamBuffer({
        write: onWrite,
        final: onFinal,
        // @ts-ignore
        autoDestroy: true,
    });
    return writeable;
}
module.exports = {
    streamBuffer: streamBuffer,
};
