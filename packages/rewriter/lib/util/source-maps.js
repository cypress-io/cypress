"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var url_1 = __importDefault(require("url"));
var sourceMapRe = /\n\/\/[ \t]*(?:#|@) sourceMappingURL=([^\s]+)\s*$/;
var dataUrlRe = /^data:application\/json;(?:charset=utf-8;)base64,([^\s]+)\s*$/;
exports.getMappingUrl = function (js) {
    var matches = sourceMapRe.exec(js);
    if (matches) {
        return matches[1];
    }
    return undefined;
};
exports.stripMappingUrl = function (js) {
    return js.replace(sourceMapRe, '');
};
exports.tryDecodeInlineUrl = function (url) {
    var matches = dataUrlRe.exec(url);
    if (matches) {
        try {
            var base64 = matches[1];
            // theoretically we could capture the charset properly and use it in the toString call here
            // but it is unlikely that non-utf-8 charsets will be encountered in the wild, and handling all
            // possible charsets is complex
            return JSON.parse(Buffer.from(base64, 'base64').toString());
        }
        catch (_a) {
            return;
        }
    }
};
exports.getPaths = function (urlStr) {
    try {
        var parsed = url_1.default.parse(urlStr, false);
        // if the sourceFileName is the same as the real filename, Chromium appends a weird "? [sm]" suffix to the filename
        // avoid this by appending some text to the filename
        // @see https://cs.chromium.org/chromium/src/third_party/devtools-frontend/src/front_end/sdk/SourceMap.js?l=445-447&rcl=a0c450d5b58f71b67134306b2e1c29a75326d3db
        var sourceFileName = path_1.default.basename(parsed.path || '') + " (original)";
        parsed.pathname = path_1.default.dirname(parsed.pathname || '');
        delete parsed.search;
        return { sourceRoot: parsed.format(), sourceFileName: sourceFileName, sourceMapName: sourceFileName + ".map" };
    }
    catch (_a) {
        return { sourceRoot: undefined, sourceFileName: 'source.js', sourceMapName: 'source.js.map' };
    }
};
exports.urlFormatter = function (url, js) {
    return [
        exports.stripMappingUrl(js),
        "//# sourceMappingURL=" + url,
    ].join('\n');
};
