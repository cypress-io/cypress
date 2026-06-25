require('../../spec_helper')

const { HttpIntercept } = require('@packages/network-interception')
const { INTERCEPT_HEADERS } = require('@packages/net-stubbing')
const { createStripInternalHeaders } = require('../../../lib/intercept-middleware/strip-internal-headers')

describe('lib/intercept-middleware/strip-internal-headers', () => {
  it('strips headers before the origin and restores them on the response after', async () => {
    const httpIntercept = new HttpIntercept()
    const [extraTargetHeader] = INTERCEPT_HEADERS

    httpIntercept.use(createStripInternalHeaders(INTERCEPT_HEADERS))

    let originHeaders

    const response = await httpIntercept.handle({
      inFlightInterceptId: 'req-1',
      url: 'http://example.com/',
      method: 'GET',
      headers: {
        [extraTargetHeader]: 'true',
        'accept': 'text/html',
      },
    }, async (request) => {
      originHeaders = { ...request.headers }

      return {
        statusCode: 200,
        headers: {},
        body: 'ok',
      }
    })

    expect(originHeaders).to.deep.eq({ accept: 'text/html' })
    expect(response.headers).to.deep.eq({
      [extraTargetHeader]: 'true',
    })

    expect(response.body).to.eq('ok')
  })
})
