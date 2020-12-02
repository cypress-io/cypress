import _ from 'lodash'
import { IncomingMessage } from 'http'

// https://github.com/cypress-io/cypress/issues/4298
// https://tools.ietf.org/html/rfc7230#section-3.3.3
// HEAD, 1xx, 204, and 304 responses should never contain anything after headers
const NO_BODY_STATUS_CODES = [204, 304]

export function responseMustHaveEmptyBody (req: IncomingMessage, res: IncomingMessage) {
  return _.includes(NO_BODY_STATUS_CODES, res.statusCode) || (req.method && req.method.toLowerCase() === 'head')
}
