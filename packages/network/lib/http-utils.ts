import _ from 'lodash'
import { IncomingMessage } from 'http'

// https://github.com/cypress-io/cypress/issues/4298
// https://tools.ietf.org/html/rfc7230#section-3.3.3
// HEAD, 1xx, 204, and 304 responses should never contain anything after headers
const NO_BODY_STATUS_CODES = [204, 304]

export function responseMustHaveEmptyBody (req: IncomingMessage, res: IncomingMessage) {
  return _.includes(NO_BODY_STATUS_CODES, res.statusCode) || (req.method && req.method.toLowerCase() === 'head')
}

/**
 * HTTP options to make Node.js's HTTP libraries behave as leniently as possible.
 *
 * These should be used whenever Cypress is processing "real-world" HTTP requests - like when setting up a proxy
 * server or sending outgoing requests.
 */
export const lenientOptions = {
  // increase header buffer for incoming response (ClientRequest) request (Server) headers, from 16KB to 1MB
  // @see https://github.com/cypress-io/cypress/issues/76
  maxHeaderSize: 1024 ** 2,
  // allow requests which contain invalid/malformed headers
  // https://github.com/cypress-io/cypress/issues/5602
  insecureHTTPParser: true,
}
