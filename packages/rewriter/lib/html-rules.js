'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.install = void 0

const tslib_1 = require('tslib')
const find_1 = tslib_1.__importDefault(require('lodash/find'))
const constants_json_1 = require('./constants.json')
const js = tslib_1.__importStar(require('./js'))

function install (url, rewriter, deferSourceMapRewrite) {
  let currentlyInsideJsScriptTag = false
  let inlineJsIndex = 0

  rewriter.on('startTag', (startTag, raw) => {
    if (startTag.tagName !== 'script') {
      currentlyInsideJsScriptTag = false

      return rewriter.emitRaw(raw)
    }

    const typeAttr = (0, find_1.default)(startTag.attrs, { name: 'type' })

    if (typeAttr && typeAttr.value !== 'text/javascript' && typeAttr.value !== 'module') {
      // we don't care about intercepting non-JS <script> tags
      currentlyInsideJsScriptTag = false

      return rewriter.emitRaw(raw)
    }

    currentlyInsideJsScriptTag = true
    // rename subresource integrity attr since cypress's rewriting will invalidate SRI hashes
    // @see https://github.com/cypress-io/cypress/issues/2393
    const sriAttr = (0, find_1.default)(startTag.attrs, { name: 'integrity' })

    if (sriAttr) {
      sriAttr.name = constants_json_1.STRIPPED_INTEGRITY_TAG
    }

    return rewriter.emitStartTag(startTag)
  })

  rewriter.on('endTag', (_endTag, raw) => {
    currentlyInsideJsScriptTag = false

    return rewriter.emitRaw(raw)
  })

  rewriter.on('text', (_textToken, raw) => {
    if (!currentlyInsideJsScriptTag) {
      return rewriter.emitRaw(raw)
    }

    // rewrite inline JS in <script> tags
    // create a unique filename per inline script
    const fakeJsUrl = [url, inlineJsIndex++].join(':')

    return rewriter.emitRaw(js.rewriteJs(fakeJsUrl, raw, deferSourceMapRewrite))
  })
}
exports.install = install
