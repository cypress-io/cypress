// this is designed to run as its own thread, managed by `threads.ts`
// WARNING: take care to not over-import modules here - the upfront
// mem/CPU cost is paid up to threads.MAX_WORKER_THREADS times

import { parentPort, isMainThread } from 'worker_threads'

if (isMainThread) {
  throw new Error(`${__filename} should only be run as a worker thread`)
}

import { rewriteJs } from '../js'
import { rewriteHtmlJs } from '../html'
import { RewriteRequest, RewriteResponse } from './types'

parentPort!.on('message', (req: RewriteRequest) => {
  const startedAt = Date.now()

  function _reply (res: RewriteResponse) {
    req.port.postMessage(res)
    req.port.close()
  }

  function _getThreadMs () {
    return Date.now() - startedAt
  }

  const rewriteFn = req.isHtml ? rewriteHtmlJs : rewriteJs

  try {
    const code = rewriteFn(req.source)

    _reply({ code, threadMs: _getThreadMs() })
  } catch (error) {
    _reply({ error, threadMs: _getThreadMs() })
  }
})

parentPort!.postMessage(true)
