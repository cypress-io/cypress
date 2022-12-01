'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.rewriteHtmlJs = exports.HtmlJsRewriter = void 0

const tslib_1 = require('tslib')
const parse5_html_rewriting_stream_1 = tslib_1.__importDefault(require('parse5-html-rewriting-stream'))
const htmlRules = tslib_1.__importStar(require('./html-rules'))

// the HTML rewriter passes inline JS to the JS rewriter, hence
// the lack of basic `rewriteHtml` or `HtmlRewriter` exports here
function HtmlJsRewriter (url, deferSourceMapRewrite) {
  const rewriter = new parse5_html_rewriting_stream_1.default()

  htmlRules.install(url, rewriter, deferSourceMapRewrite)

  return rewriter
}
exports.HtmlJsRewriter = HtmlJsRewriter

function rewriteHtmlJs (url, html, deferSourceMapRewrite) {
  let out = ''
  const rewriter = HtmlJsRewriter(url, deferSourceMapRewrite)

  rewriter.on('data', (chunk) => {
    out += chunk
  })

  rewriter.end(html)

  return new Promise((resolve) => {
    rewriter.on('end', () => {
      resolve(out)
    })
  })
}
exports.rewriteHtmlJs = rewriteHtmlJs
