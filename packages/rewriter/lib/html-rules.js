"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var find_1 = __importDefault(require("lodash/find"));
var js = __importStar(require("./js"));
function install(url, rewriter, deferSourceMapRewrite) {
    var currentlyInsideJsScriptTag = false;
    var inlineJsIndex = 0;
    rewriter.on('startTag', function (startTag, raw) {
        if (startTag.tagName !== 'script') {
            currentlyInsideJsScriptTag = false;
            return rewriter.emitRaw(raw);
        }
        var typeAttr = find_1.default(startTag.attrs, { name: 'type' });
        if (typeAttr && typeAttr.value !== 'text/javascript' && typeAttr.value !== 'module') {
            // we don't care about intercepting non-JS <script> tags
            currentlyInsideJsScriptTag = false;
            return rewriter.emitRaw(raw);
        }
        currentlyInsideJsScriptTag = true;
        // rename subresource integrity attr since cypress's rewriting will invalidate SRI hashes
        // @see https://github.com/cypress-io/cypress/issues/2393
        var sriAttr = find_1.default(startTag.attrs, { name: 'integrity' });
        if (sriAttr) {
            sriAttr.name = 'cypress:stripped-integrity';
        }
        return rewriter.emitStartTag(startTag);
    });
    rewriter.on('endTag', function (_endTag, raw) {
        currentlyInsideJsScriptTag = false;
        return rewriter.emitRaw(raw);
    });
    rewriter.on('text', function (_textToken, raw) {
        if (!currentlyInsideJsScriptTag) {
            return rewriter.emitRaw(raw);
        }
        // rewrite inline JS in <script> tags
        // create a unique filename per inline script
        var fakeJsUrl = [url, inlineJsIndex++].join(':');
        return rewriter.emitRaw(js.rewriteJs(fakeJsUrl, raw, deferSourceMapRewrite));
    });
}
exports.install = install;
