import { queueRewriting } from './threads'
import { DeferSourceMapRewriteFn } from './js'

// these functions are not included in `./js` or `./html` because doing so
// would mean that `./threads/worker` would unnecessarily end up loading in the
// `./threads` module for each worker

export function rewriteHtmlJsAsync (url: string, html: string, deferSourceMapRewrite: DeferSourceMapRewriteFn): Promise<string> {
  return queueRewriting({
    url,
    deferSourceMapRewrite,
    source: html,
    isHtml: true,
  })
}

export function rewriteJsAsync (url: string, js: string, deferSourceMapRewrite: DeferSourceMapRewriteFn): Promise<string> {
  return queueRewriting({
    url,
    deferSourceMapRewrite,
    source: js,
  })
}

export function rewriteJsSourceMapAsync (url: string, js: string, inputSourceMap: any): Promise<string> {
  return queueRewriting({
    url,
    inputSourceMap,
    sourceMap: true,
    source: js,
  })
}
