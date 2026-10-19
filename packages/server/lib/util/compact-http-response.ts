import { HTTP_RESPONSE_BODY_HINT } from '@packages/types'
import type { HttpResponseBodyHint } from '@packages/types'

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// A `cy.request` response holds its body twice: as `body`, and as the raw
// `'Response Body'` of the final `allRequestResponses` entry. Only the raw copy
// needs to cross the socket, so this drops `body` and adds a hint the driver
// rebuilds it from. Anything that isn't a full response passes through.
export const compactHttpResponse = <T>(resp: T): T => {
  if (!isPlainObject(resp) || !Object.prototype.hasOwnProperty.call(resp, 'body')) {
    return resp
  }

  const all = resp.allRequestResponses
  const final: unknown = Array.isArray(all) ? all[all.length - 1] : undefined

  if (!isPlainObject(final)) {
    return resp
  }

  const raw = final['Response Body']
  let hint: HttpResponseBodyHint

  if (resp.body === raw) {
    hint = 'raw'
  } else if (typeof raw === 'string') {
    // The server only ever replaces a string body with the result of
    // `JSON.parse`, so a differing body means that parse succeeded.
    hint = 'json'
  } else {
    return resp
  }

  const { body, ...rest } = resp

  // Safe because the result only reaches the driver, which restores `T` with `expandHttpResponse`
  return { ...rest, [HTTP_RESPONSE_BODY_HINT]: hint } as T
}
