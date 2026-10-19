import { HTTP_RESPONSE_BODY_HINT } from '@packages/types'

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Checks the tag rather than `instanceof`, since a response can cross realms (`cy.origin`)
const isBinary = (value: unknown): boolean => {
  return ArrayBuffer.isView(value) || Object.prototype.toString.call(value) === '[object ArrayBuffer]'
}

// Rebuilds the `body` the server dropped before sending a `cy.request` response,
// so the response deep-equals the one the server built. Leaves uncompacted
// responses alone, such as the ones specs stub `Cypress.backend` with.
export const expandHttpResponse = <T>(resp: T): T => {
  if (!isPlainObject(resp)) {
    return resp
  }

  const hint = resp[HTTP_RESPONSE_BODY_HINT]

  if (hint !== 'raw' && hint !== 'json') {
    return resp
  }

  const all = resp.allRequestResponses
  const final: unknown = Array.isArray(all) ? all[all.length - 1] : undefined

  if (!isPlainObject(final)) {
    return resp
  }

  const { [HTTP_RESPONSE_BODY_HINT]: _hint, ...rest } = resp
  const raw = final['Response Body']
  let body: unknown

  if (hint === 'json') {
    if (typeof raw !== 'string') {
      return resp
    }

    body = JSON.parse(raw)
  } else if (isBinary(raw)) {
    // The socket serializer keeps shared references but sends each binary value
    // as its own attachment. An uncompacted response therefore reaches the
    // browser with a binary body copied and any other body shared, so match that.
    body = structuredClone(raw)
  } else {
    body = raw
  }

  // `body` is the first key the server writes, so put it back first
  // Safe because this rebuilds the exact shape the server compacted
  return { body, ...rest } as T
}
