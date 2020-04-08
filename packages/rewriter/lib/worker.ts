/**
 * This is a worker thread for purposes of rewriting only.
 */
import { parentPort, isMainThread } from 'worker_threads'

if (isMainThread) {
  throw new Error(`${__filename} should only be run as a worker thread`)
}

import { rewriteJs } from './js'
import { rewriteHtmlJs } from './html'
import { RewriteRequest, RewriteResponse } from './types'

parentPort!.on('message', (msg: RewriteRequest) => {
  function _reply (res: RewriteResponse) {
    msg.port.postMessage(res)
  }

  const rewriteFn = msg.isHtml ? rewriteHtmlJs : rewriteJs

  try {
    const code = rewriteFn(msg.source)

    _reply({ code })
  } catch (error) {
    _reply({ error })
  }

  msg.port.close()
})
