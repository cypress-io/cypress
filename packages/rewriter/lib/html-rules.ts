import find from 'lodash/find'
import RewritingStream from 'parse5-html-rewriting-stream'
import * as js from './js'

export function install (url: string, rewriter: RewritingStream, deferSourceMapRewrite?: js.DeferSourceMapRewriteFn) {
  let currentlyInsideJsScriptTag = false
  let inlineJsIndex = 0

  rewriter.on('startTag', (startTag, raw) => {
    if (startTag.tagName !== 'script') {
      currentlyInsideJsScriptTag = false

      return rewriter.emitRaw(raw)
    }

    const typeAttr = find(startTag.attrs, { name: 'type' })

    if (typeAttr && typeAttr.value !== 'text/javascript' && typeAttr.value !== 'module') {
      // we don't care about intercepting non-JS <script> tags
      currentlyInsideJsScriptTag = false

      return rewriter.emitRaw(raw)
    }

    currentlyInsideJsScriptTag = true

    // rename subresource integrity attr since cypress's rewriting will invalidate SRI hashes
    // @see https://github.com/cypress-io/cypress/issues/2393
    const sriAttr = find(startTag.attrs, { name: 'integrity' })

    if (sriAttr) {
      sriAttr.name = 'cypress:stripped-integrity'
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
