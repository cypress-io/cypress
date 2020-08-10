// this is designed to run as its own thread, managed by `threads.ts`
// WARNING: take care to not over-import modules here - the upfront
// mem/CPU cost is paid up to threads.MAX_WORKER_THREADS times

import { parentPort, isMainThread, threadId } from 'worker_threads'

if (isMainThread) {
  throw new Error(`${__filename} should only be run as a worker thread`)
}

import { rewriteJs, rewriteJsSourceMap } from '../js'
import { rewriteHtmlJs } from '../html'
import { RewriteRequest, RewriteResponse } from './types'

parentPort!.postMessage(true)

let _idCounter = 0

parentPort!.on('message', async (req: RewriteRequest) => {
  if (req.shutdown) {
    return process.exit()
  }

  const startedAt = Date.now()

  function _deferSourceMapRewrite (deferredSourceMap) {
    const uniqueId = [threadId, _idCounter++].join('.')

    _reply({
      threadMs: _getThreadMs(),
      deferredSourceMap: {
        uniqueId,
        ...deferredSourceMap,
      },
    })

    return uniqueId
  }

  function _reply (res: RewriteResponse) {
    req.port.postMessage(res)
  }

  function _getThreadMs () {
    return Date.now() - startedAt
  }

  function _getOutput () {
    if (req.isHtml) {
      return rewriteHtmlJs(req.url, req.source, _deferSourceMapRewrite)
    }

    if (req.sourceMap) {
      return rewriteJsSourceMap(req.url, req.source, req.inputSourceMap)
    }

    return rewriteJs(req.url, req.source, _deferSourceMapRewrite)
  }

  try {
    const output = await _getOutput()

    _reply({ output, threadMs: _getThreadMs() })
  } catch (error) {
    _reply({ error, threadMs: _getThreadMs() })
  }

  return req.port.close()
})
