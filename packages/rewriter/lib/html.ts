import RewritingStream from 'parse5-html-rewriting-stream'
import * as htmlRules from './html-rules'
import type stream from 'stream'
import type { DeferSourceMapRewriteFn } from './js'

// the HTML rewriter passes inline JS to the JS rewriter, hence
// the lack of basic `rewriteHtml` or `HtmlRewriter` exports here

export function HtmlJsRewriter (url: string, deferSourceMapRewrite?: DeferSourceMapRewriteFn): stream.Transform {
  const rewriter = new RewritingStream()

  // By default parse5 drops the already-parsed portion of its input buffer
  // once it grows past a 64KB waterline. RewritingStream reconstructs each
  // token's raw HTML by slicing that buffer using absolute source offsets, so
  // any token that spans a drop boundary gets sliced with a now-invalid
  // (negative) offset and its text is silently lost. On large pages this
  // manifested as missing text nodes — e.g. form labels disappearing.
  // Disabling buffer dropping keeps every offset valid; the full document is
  // already held in memory by the rewriting pipeline regardless.
  // @see https://github.com/cypress-io/cypress/issues/21145
  ;(rewriter as any).tokenizer.preprocessor.bufferWaterline = Infinity

  htmlRules.install(url, rewriter, deferSourceMapRewrite)

  return rewriter
}

export function rewriteHtmlJs (url: string, html: string, deferSourceMapRewrite?: DeferSourceMapRewriteFn): Promise<string> {
  let out = ''
  const rewriter = HtmlJsRewriter(url, deferSourceMapRewrite)

  rewriter.on('data', (chunk) => {
    out += chunk
  })

  rewriter.end(html)

  return new Promise<string>((resolve) => {
    rewriter.on('end', () => {
      resolve(out)
    })
  })
}
