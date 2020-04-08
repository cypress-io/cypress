import { HtmlJsRewriter, rewriteHtmlJsAsync, rewriteJsAsync } from '@packages/rewriter'
import duplexify from 'duplexify'
import concatStream from 'concat-stream'
import stream from 'stream'

const pumpify = require('pumpify')
const utf8Stream = require('utf8-stream')

type SecurityOpts = {
  isHtml?: boolean
}

export const strip = async (source, opts: SecurityOpts = {}) => {
  if (opts.isHtml) {
    return rewriteHtmlJsAsync(source) // threaded
  }

  return rewriteJsAsync(source) // threaded
}

export const stripStream = (opts: SecurityOpts = {}) => {
  if (opts.isHtml) {
    return pumpify(
      utf8Stream(),
      HtmlJsRewriter(), // non-threaded
    )
  }

  const pt = new (stream.PassThrough)()

  return duplexify(
    pumpify(
      utf8Stream(),
      concatStream(async (body) => {
        pt.write(await strip(body.toString()))
        pt.end()
      }),
    ),
    pt,
  )
}
