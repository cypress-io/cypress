import duplexify from 'duplexify'
import hyntax from 'hyntax'
import * as js from './js'
import stream from 'stream'

type Token = hyntax.Tokenizer.Token<hyntax.Tokenizer.TokenTypes.AnyTokenType>
type RewriteFn = (token: Token) => string

// input: raw HTML
// output: rewritten HTML
export function HtmlRewriter (rewriteTokenFn: RewriteFn) : stream.Transform {
  const htmlTokenizer = new hyntax.StreamTokenizer()
  const output = new stream.PassThrough()

  let lastEndPosition = 0

  htmlTokenizer.on('data', (tokens: Token[]) => {
    tokens.forEach((token) => {
      function spacing () {
        let out = ''

        if (token.startPosition > lastEndPosition + 1) {
          out = ' '.repeat(token.startPosition - lastEndPosition + 1)
        }

        lastEndPosition = token.endPosition

        return out
      }

      output.write(spacing() + rewriteTokenFn(token))
    })
  })

  const rewriter = duplexify(htmlTokenizer, output)

  return rewriter
}

export function rewriteHtml (html: string, rewriteTokenFn: RewriteFn) : string {
  let lastEndPosition = 0

  return hyntax.tokenize(html)
  .tokens
  .map((token) => {
    function spacing () {
      let out = ''

      if (token.startPosition > lastEndPosition + 1) {
        out = ' '.repeat(token.startPosition - lastEndPosition + 1)
      }

      lastEndPosition = token.endPosition

      return out
    }

    return spacing() + rewriteTokenFn(token)
  })
  .join('')
}

function _htmlJsRewriteFn (rewriteJsFn: js.RewriteNodeFn, rewriteHtmlFn?: RewriteFn) {
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

export function rewriteHtmlJs (html: string, rewriteJsFn: js.RewriteNodeFn, rewriteHtmlFn?: RewriteFn) : string {
  return rewriteHtml(html, _htmlJsRewriteFn(rewriteJsFn, rewriteHtmlFn))
}

export function HtmlJsRewriter (rewriteJsFn: js.RewriteNodeFn, rewriteHtmlFn?: RewriteFn) : stream.Transform {
  return HtmlRewriter(_htmlJsRewriteFn(rewriteJsFn, rewriteHtmlFn))
}
