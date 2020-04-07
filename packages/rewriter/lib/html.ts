import duplexify from 'duplexify'
import hyntax from 'hyntax'
import * as js from './js'
import stream from 'stream'

type Token = hyntax.Tokenizer.Token<hyntax.Tokenizer.TokenTypes.AnyTokenType>
export type RewriteHtmlNodeFn = (token: Token) => string

function Spacing () {
  let lastEndPosition = 0

  return (token: Token) => {
    let out = ''

    if (token.startPosition > lastEndPosition + 1) {
      out = ' '.repeat(token.startPosition - lastEndPosition - 1)
    }

    lastEndPosition = token.endPosition

    return out
  }
}

// input: raw HTML
// output: rewritten HTML
export function HtmlRewriter (rewriteTokenFn: RewriteHtmlNodeFn): stream.Transform {
  const htmlTokenizer = new hyntax.StreamTokenizer()
  const output = new stream.PassThrough()
  const spacing = Spacing()

  htmlTokenizer.on('data', (tokens: Token[]) => {
    tokens.forEach((token) => {
      output.write(spacing(token) + rewriteTokenFn(token))
    })
  })

  const rewriter = duplexify(htmlTokenizer, output)

  return rewriter
}

export function rewriteHtml (html: string, rewriteTokenFn: RewriteHtmlNodeFn): string {
  const spacing = Spacing()

  return hyntax.tokenize(html)
  .tokens
  .map((token) => {
    return spacing(token) + rewriteTokenFn(token)
  })
  .join('')
}

function _htmlJsRewriteFn (rewriteJsFn: js.RewriteNodeFn, rewriteHtmlFn?: RewriteHtmlNodeFn) {
  return function (token) {
    if (token.type === 'token:script-tag-content') {
      return js.rewriteJs(token.content, rewriteJsFn)
    }

    if (rewriteHtmlFn) {
      return rewriteHtmlFn(token)
    }

    return token.content
  }
}

export function rewriteHtmlJs (html: string, rewriteJsFn: js.RewriteNodeFn, rewriteHtmlFn?: RewriteHtmlNodeFn): string {
  return rewriteHtml(html, _htmlJsRewriteFn(rewriteJsFn, rewriteHtmlFn))
}

export function HtmlJsRewriter (rewriteJsFn: js.RewriteNodeFn, rewriteHtmlFn?: RewriteHtmlNodeFn): stream.Transform {
  return HtmlRewriter(_htmlJsRewriteFn(rewriteJsFn, rewriteHtmlFn))
}
