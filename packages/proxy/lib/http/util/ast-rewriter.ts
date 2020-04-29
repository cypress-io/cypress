import { HtmlJsRewriter, rewriteHtmlJsAsync, rewriteJsAsync } from '@packages/rewriter'
import duplexify from 'duplexify'
import { concatStream } from '@packages/network'
import stream from 'stream'
import { SecurityOpts } from './rewriter'

const pumpify = require('pumpify')
const utf8Stream = require('utf8-stream')

export const strip = async (source: string, opts: SecurityOpts) => {
  if (opts.isHtml) {
    return rewriteHtmlJsAsync(opts.url, source, opts.deferSourceMapRewrite) // threaded
  }

  return rewriteJsAsync(opts.url, source, opts.deferSourceMapRewrite) // threaded
}

export const stripStream = (opts: SecurityOpts) => {
  if (opts.isHtml) {
    return pumpify(
      utf8Stream(),
      HtmlJsRewriter(opts.url, opts.deferSourceMapRewrite), // non-threaded
    )
  }

  const pt = new (stream.PassThrough)()

  return duplexify(
    pumpify(
      utf8Stream(),
      concatStream(async (body) => {
        pt.write(await strip(body.toString(), opts))
        pt.end()
      }),
    ),
    pt,
  )
}
