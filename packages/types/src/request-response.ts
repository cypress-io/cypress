// A `cy.request` response carries its body twice: as `body`, and as the raw
// `'Response Body'` of the final `allRequestResponses` entry. The server sends
// only the raw copy over the socket, plus a hint telling the driver how its own
// `body` was derived from it, and the driver rebuilds `body` on arrival.
export const HTTP_RESPONSE_BODY_HINT = '__cypressResponseBodyFrom'

type BodyHint = 'raw' | 'json'

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const finalRequestResponse = (resp: Record<string, unknown>): Record<string, unknown> | undefined => {
  const all = resp.allRequestResponses

  if (!Array.isArray(all) || all.length === 0) {
    return undefined
  }

  const last: unknown = all[all.length - 1]

  return isPlainObject(last) ? last : undefined
}

// Checks the tag rather than `instanceof`, since a response can cross realms (`cy.origin`)
const isBinary = (value: unknown): boolean => {
  return ArrayBuffer.isView(value) || Object.prototype.toString.call(value) === '[object ArrayBuffer]'
}

const isBodyHint = (value: unknown): value is BodyHint => {
  return value === 'raw' || value === 'json'
}

/**
 * Drops `body` from a `cy.request` response before it crosses the socket.
 * Anything that isn't a full response is returned unchanged.
 */
export function compactHttpResponse<T> (resp: T): T {
  if (!isPlainObject(resp) || !Object.prototype.hasOwnProperty.call(resp, 'body')) {
    return resp
  }

  const final = finalRequestResponse(resp)

  if (!final) {
    return resp
  }

  const raw = final['Response Body']
  let hint: BodyHint

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

/**
 * Restores the `body` that `compactHttpResponse` dropped, so the response
 * deep-equals what the server built. Uncompacted responses are returned unchanged.
 */
export function expandHttpResponse<T> (resp: T): T {
  if (!isPlainObject(resp) || !isBodyHint(resp[HTTP_RESPONSE_BODY_HINT])) {
    return resp
  }

  const final = finalRequestResponse(resp)

  if (!final) {
    return resp
  }

  const { [HTTP_RESPONSE_BODY_HINT]: hint, ...rest } = resp
  const raw = final['Response Body']
  let body: unknown

  if (hint === 'json') {
    if (typeof raw !== 'string') {
      return resp
    }

    body = JSON.parse(raw)
  } else if (isBinary(raw)) {
    // The socket serializer preserves shared references but sends every binary
    // value as its own attachment, so binary bodies always arrived as a separate copy
    body = structuredClone(raw)
  } else {
    body = raw
  }

  // `body` is the first key the server writes, so put it back first
  // Safe because this rebuilds the exact shape `compactHttpResponse` was given
  return { body, ...rest } as T
}
