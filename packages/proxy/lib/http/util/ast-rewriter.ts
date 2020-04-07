import { HtmlJsRewriter, rewriteHtmlJs, rewriteJs } from '@packages/rewriter'
import duplexify from 'duplexify'
import concatStream from 'concat-stream'
import stream from 'stream'

const pumpify = require('pumpify')
const utf8Stream = require('utf8-stream')

type SecurityOpts = {
  isHtml?: boolean
}

export const strip = (source, opts: SecurityOpts = {}) => {
  if (opts.isHtml) {
    return rewriteHtmlJs(source)
  }

  return rewriteJs(source)
}

export const stripStream = (opts: SecurityOpts = {}) => {
  if (opts.isHtml) {
    return pumpify(
      utf8Stream(),
      HtmlJsRewriter(),
    )
  }

  const pt = new (stream.PassThrough)()

  return duplexify(
    pumpify(
      utf8Stream(),
      concatStream((body) => {
        pt.write(rewriteJs(body.toString()))
        pt.end()
      }),
    ),
    pt,
  )
}
