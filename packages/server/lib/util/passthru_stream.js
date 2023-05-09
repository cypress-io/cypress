"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passthruStream = void 0;
const through = require('through');
function passthruStream() {
    return through(function (chunk) {
        this.queue(chunk);
    });
}
exports.passthruStream = passthruStream;
