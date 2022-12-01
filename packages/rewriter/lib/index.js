'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.STRIPPED_INTEGRITY_TAG = exports.terminateAllWorkers = exports.createInitialWorkers = exports.DeferredSourceMapCache = exports.rewriteHtmlJsAsync = exports.rewriteJsAsync = exports.HtmlJsRewriter = void 0

let html_1 = require('./html')

Object.defineProperty(exports, 'HtmlJsRewriter', { enumerable: true, get () {
  return html_1.HtmlJsRewriter
} })

let async_rewriters_1 = require('./async-rewriters')

Object.defineProperty(exports, 'rewriteJsAsync', { enumerable: true, get () {
  return async_rewriters_1.rewriteJsAsync
} })

Object.defineProperty(exports, 'rewriteHtmlJsAsync', { enumerable: true, get () {
  return async_rewriters_1.rewriteHtmlJsAsync
} })

let deferred_source_map_cache_1 = require('./deferred-source-map-cache')

Object.defineProperty(exports, 'DeferredSourceMapCache', { enumerable: true, get () {
  return deferred_source_map_cache_1.DeferredSourceMapCache
} })

let threads_1 = require('./threads')

Object.defineProperty(exports, 'createInitialWorkers', { enumerable: true, get () {
  return threads_1.createInitialWorkers
} })

Object.defineProperty(exports, 'terminateAllWorkers', { enumerable: true, get () {
  return threads_1.terminateAllWorkers
} })

let constants_json_1 = require('./constants.json')

Object.defineProperty(exports, 'STRIPPED_INTEGRITY_TAG', { enumerable: true, get () {
  return constants_json_1.STRIPPED_INTEGRITY_TAG
} })
