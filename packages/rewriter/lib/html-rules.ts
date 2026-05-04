import find from 'lodash/find'
import type RewritingStream from 'parse5-html-rewriting-stream'
import { STRIPPED_INTEGRITY_TAG } from './constants.json'
import * as js from './js'

// A `<base target>` is inherited by every untargeted <a> and <form> on the page.
// `_top` / `_parent` would navigate out of the AUT iframe, and the driver's
// runtime guards only inspect the element's own `target` attribute — so the
// attribute has to be stripped before the page loads.
const UNSAFE_BASE_TARGETS = new Set(['_top', '_parent'])

export function install (url: string, rewriter: RewritingStream, deferSourceMapRewrite?: js.DeferSourceMapRewriteFn) {
  let currentlyInsideJsScriptTag = false
  let inlineJsIndex = 0

  rewriter.on('startTag', (startTag, raw) => {
    if (startTag.tagName === 'base') {
      currentlyInsideJsScriptTag = false

      const targetAttr = find(startTag.attrs, { name: 'target' })

      if (targetAttr && UNSAFE_BASE_TARGETS.has(targetAttr.value.toLowerCase())) {
        startTag.attrs = startTag.attrs.filter((attr) => attr !== targetAttr)

        return rewriter.emitStartTag(startTag)
      }

      return rewriter.emitRaw(raw)
    }

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
      sriAttr.name = STRIPPED_INTEGRITY_TAG
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
