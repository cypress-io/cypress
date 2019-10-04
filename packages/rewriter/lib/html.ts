import duplexify from 'duplexify'
import hyntax from 'hyntax'
// import js from './js'
import stream from 'stream'

type Token = hyntax.Tokenizer.Token<hyntax.Tokenizer.TokenTypes.AnyTokenType>
type RewriteFn = (token: Token) => string

// input: raw HTML
// output: rewritten HTML
export function HtmlRewriter (rewriteTokenFn: RewriteFn) : stream.Transform {
  const htmlTokenizer = new hyntax.StreamTokenizer()
  const output = new stream.PassThrough()

  htmlTokenizer.on('data', (tokens: Token[]) => {
    tokens.forEach((token) => {
      output.write(rewriteTokenFn(token))
    })
  })

  const rewriter = duplexify(htmlTokenizer, output)

  return rewriter
}

// export function HtmlJsRewriter (rewriteTokenFn: RewriteFn, rewriteJsFn: ) : stream.Transform {
//   const jsRewriter = js.JsRewriter(rew
// }
