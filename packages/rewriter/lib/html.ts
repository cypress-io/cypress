import RewritingStream from 'parse5-html-rewriting-stream'
import * as htmlRules from './html-rules'
import stream from 'stream'

// the HTML rewriter passes inline JS to the JS rewriter, hence
// the lack of basic `rewriteHtml` or `HtmlRewriter` exports here

export function HtmlJsRewriter (url: string): stream.Transform {
  const rewriter = new RewritingStream()

  htmlRules.install(url, rewriter)

  return rewriter
}

export function rewriteHtmlJs (url: string, html: string): string {
  let out = ''
  const rewriter = HtmlJsRewriter(url)

  rewriter.on('data', (chunk) => {
    out += chunk
  })

  rewriter.write(html)

  return out
}
