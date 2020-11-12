"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var through = require('through');
function passthruStream() {
    return through(function (chunk) {
        this.queue(chunk);
    });
}
exports.passthruStream = passthruStream;
