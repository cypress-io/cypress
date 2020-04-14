import { HtmlJsRewriter, rewriteHtmlJsAsync, rewriteJsAsync } from '@packages/rewriter'
import duplexify from 'duplexify'
import concatStream from 'concat-stream'
import stream from 'stream'

const pumpify = require('pumpify')
const utf8Stream = require('utf8-stream')

type SecurityOpts = {
  isHtml?: boolean
}

export const strip = async (url, source, opts: SecurityOpts = {}) => {
  if (opts.isHtml) {
    return rewriteHtmlJsAsync(url, source) // threaded
  }

  return rewriteJsAsync(url, source) // threaded
}

export const stripStream = (url, opts: SecurityOpts = {}) => {
  if (opts.isHtml) {
    return pumpify(
      utf8Stream(),
      HtmlJsRewriter(url), // non-threaded
    )
  }

  const pt = new (stream.PassThrough)()

  return duplexify(
    pumpify(
      utf8Stream(),
      concatStream(async (body) => {
        pt.write(await strip(url, body.toString()))
        pt.end()
      }),
    ),
    pt,
  )
}
