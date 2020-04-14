import { queueRewriting } from './threads'

// these functions are not included in `./js` or `./html` because doing so
// would mean that `./threads/worker` would unnecessarily end up loading in the
// `./threads` module for each worker

export function rewriteHtmlJsAsync (url: string, html: string): Promise<string> {
  return queueRewriting({
    url,
    source: html,
    isHtml: true,
  })
}

export function rewriteJsAsync (url: string, js: string): Promise<string> {
  return queueRewriting({
    url,
    source: js,
  })
}
