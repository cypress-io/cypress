// A `cy.request` response crosses the socket without `body`, which the driver
// rebuilds from the final `allRequestResponses` entry's `'Response Body'`.
// This key says how: `'raw'` uses that value as-is, `'json'` parses it.
export const HTTP_RESPONSE_BODY_HINT = '__cypressResponseBodyFrom'

export type HttpResponseBodyHint = 'raw' | 'json'
