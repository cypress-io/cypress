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
var parse5_html_rewriting_stream_1 = __importDefault(require("parse5-html-rewriting-stream"));
var htmlRules = __importStar(require("./html-rules"));
// the HTML rewriter passes inline JS to the JS rewriter, hence
// the lack of basic `rewriteHtml` or `HtmlRewriter` exports here
function HtmlJsRewriter(url, deferSourceMapRewrite) {
    var rewriter = new parse5_html_rewriting_stream_1.default();
    htmlRules.install(url, rewriter, deferSourceMapRewrite);
    return rewriter;
}
exports.HtmlJsRewriter = HtmlJsRewriter;
function rewriteHtmlJs(url, html, deferSourceMapRewrite) {
    var out = '';
    var rewriter = HtmlJsRewriter(url, deferSourceMapRewrite);
    rewriter.on('data', function (chunk) {
        out += chunk;
    });
    rewriter.end(html);
    return new Promise(function (resolve) {
        rewriter.on('end', function () {
            resolve(out);
        });
    });
}
exports.rewriteHtmlJs = rewriteHtmlJs;
