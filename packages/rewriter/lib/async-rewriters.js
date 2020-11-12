"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var threads_1 = require("./threads");
// these functions are not included in `./js` or `./html` because doing so
// would mean that `./threads/worker` would unnecessarily end up loading in the
// `./threads` module for each worker
function rewriteHtmlJsAsync(url, html, deferSourceMapRewrite) {
    return threads_1.queueRewriting({
        url: url,
        deferSourceMapRewrite: deferSourceMapRewrite,
        source: html,
        isHtml: true,
    });
}
exports.rewriteHtmlJsAsync = rewriteHtmlJsAsync;
function rewriteJsAsync(url, js, deferSourceMapRewrite) {
    return threads_1.queueRewriting({
        url: url,
        deferSourceMapRewrite: deferSourceMapRewrite,
        source: js,
    });
}
exports.rewriteJsAsync = rewriteJsAsync;
function rewriteJsSourceMapAsync(url, js, inputSourceMap) {
    return threads_1.queueRewriting({
        url: url,
        inputSourceMap: inputSourceMap,
        sourceMap: true,
        source: js,
    });
}
exports.rewriteJsSourceMapAsync = rewriteJsSourceMapAsync;
