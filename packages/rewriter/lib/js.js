"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var astTypes = __importStar(require("ast-types"));
var debug_1 = __importDefault(require("debug"));
var js_rules_1 = require("./js-rules");
var recast = __importStar(require("recast"));
var sourceMaps = __importStar(require("./util/source-maps"));
var debug = debug_1.default('cypress:rewriter:js');
var defaultPrintOpts = {
    // will only affect reprinted quotes
    quote: 'single',
};
function _generateDriverError(url, err) {
    var args = JSON.stringify({
        errMessage: err.message,
        errStack: err.stack,
        url: url,
    });
    return "window.top.Cypress.utils.throwErrByPath('proxy.js_rewriting_failed', { args: " + args + " })";
}
function rewriteJsSourceMap(url, js, inputSourceMap) {
    try {
        var _a = sourceMaps.getPaths(url), sourceFileName = _a.sourceFileName, sourceMapName = _a.sourceMapName, sourceRoot = _a.sourceRoot;
        var ast = recast.parse(js, { sourceFileName: sourceFileName });
        astTypes.visit(ast, js_rules_1.jsRules);
        return recast.print(ast, __assign({ inputSourceMap: inputSourceMap,
            sourceMapName: sourceMapName,
            sourceRoot: sourceRoot }, defaultPrintOpts)).map;
    }
    catch (err) {
        debug('error while parsing JS %o', { err: err, js: js.slice ? js.slice(0, 500) : js });
        return { err: err };
    }
}
exports.rewriteJsSourceMap = rewriteJsSourceMap;
function _rewriteJsUnsafe(url, js, deferSourceMapRewrite) {
    var ast = recast.parse(js);
    try {
        astTypes.visit(ast, js_rules_1.jsRules);
    }
    catch (err) {
        // if visiting fails, it points to a bug in our rewriting logic, so raise the error to the driver
        return _generateDriverError(url, err);
    }
    var code = recast.print(ast, defaultPrintOpts).code;
    if (!deferSourceMapRewrite) {
        // no sourcemaps
        return sourceMaps.stripMappingUrl(code);
    }
    // get an ID that can be used to lazy-generate the source map later
    var sourceMapId = deferSourceMapRewrite({ url: url, js: js });
    return sourceMaps.urlFormatter(
    // using a relative URL ensures that required cookies + other headers are sent along
    // and can be reused if the user's sourcemap requires an HTTP request to be made
    "/__cypress/source-maps/" + sourceMapId + ".map", code);
}
exports._rewriteJsUnsafe = _rewriteJsUnsafe;
function rewriteJs(url, js, deferSourceMapRewrite) {
    try {
        // rewriting can throw on invalid JS or if there are bugs in the js-rules, so always wrap it
        return _rewriteJsUnsafe(url, js, deferSourceMapRewrite);
    }
    catch (err) {
        debug('error while parsing JS %o', { err: err, js: js.slice ? js.slice(0, 500) : js });
        return js;
    }
}
exports.rewriteJs = rewriteJs;
