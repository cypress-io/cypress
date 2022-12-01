'use strict'
// this is designed to run as its own thread, managed by `threads.ts`
// WARNING: take care to not over-import modules here - the upfront
// mem/CPU cost is paid up to threads.MAX_WORKER_THREADS times
Object.defineProperty(exports, '__esModule', { value: true })
const worker_threads_1 = require('worker_threads')

if (worker_threads_1.isMainThread) {
  throw new Error(`${__filename} should only be run as a worker thread`)
}

const js_1 = require('../js')
const html_1 = require('../html')

worker_threads_1.parentPort.postMessage(true)
let _idCounter = 0

worker_threads_1.parentPort.on('message', async (req) => {
  if (req.shutdown) {
    return process.exit()
  }

  const startedAt = Date.now()

  function _deferSourceMapRewrite (deferredSourceMap) {
    const uniqueId = [worker_threads_1.threadId, _idCounter++].join('.')

    _reply({
      threadMs: _getThreadMs(),
      deferredSourceMap: {
        uniqueId,
        ...deferredSourceMap,
      },
    })

    return uniqueId
  }
  function _reply (res) {
    req.port.postMessage(res)
  }
  function _getThreadMs () {
    return Date.now() - startedAt
  }
  function _getOutput () {
    if (req.isHtml) {
      return (0, html_1.rewriteHtmlJs)(req.url, req.source, _deferSourceMapRewrite)
    }

    if (req.sourceMap) {
      return (0, js_1.rewriteJsSourceMap)(req.url, req.source, req.inputSourceMap)
    }

    return (0, js_1.rewriteJs)(req.url, req.source, _deferSourceMapRewrite)
  }
  try {
    const output = await _getOutput()

    _reply({ output, threadMs: _getThreadMs() })
  } catch (error) {
    _reply({ error, threadMs: _getThreadMs() })
  }

  return req.port.close()
})
