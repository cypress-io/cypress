import _ from 'lodash'
import RequestMiddleware from '../../../lib/http/request-middleware'
import { expect } from 'chai'

describe('http/request-middleware', function () {
  it('exports the members in the correct order', function () {
    expect(_.keys(RequestMiddleware)).to.have.ordered.members([
      'LogRequest',
      'MaybeEndRequestWithBufferedResponse',
      'InterceptRequest',
      'RedirectToClientRouteIfUnloaded',
      'EndRequestsToBlockedHosts',
      'StripUnsupportedAcceptEncoding',
      'MaybeSetBasicAuthHeaders',
      'SendRequestOutgoing',
    ])
  })
})
