/* eslint-disable no-undef */
const ORIGIN = 'https://www.h2test.local:44701'

describe('http2 settings', () => {
  it('negotiates HTTP/2 settings over TLS', () => {
    cy.request(`${ORIGIN}/settings`).then((resp) => {
      expect(resp.status).to.eq(200)
      expect(resp.body.protocol).to.eq('2.0')
      expect(resp.body.localSettings.maxConcurrentStreams).to.be.greaterThan(0)
      expect(resp.body.remoteSettings.maxConcurrentStreams).to.be.greaterThan(0)
    })
  })
})
