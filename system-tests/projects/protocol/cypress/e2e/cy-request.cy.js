describe('cy.request protocol capture', { baseUrl: 'http://localhost:3131' }, () => {
  it('captures a successful cy.request', () => {
    cy.request('/index.html').then((response) => {
      expect(response.status).to.eq(200)
    })

    // Settling delay so the protocol stub records the events deterministically
    // (matches the convention used by the other specs in this project).
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000, { log: false })
  })

  it('captures a non-2xx cy.request when failOnStatusCode is false', () => {
    cy.request({
      url: '/does-not-exist.html',
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(404)
    })

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000, { log: false })
  })

  it('captures a network failure', () => {
    // Port 1 reliably refuses TCP — produces ECONNREFUSED.
    // cy.on('fail') swallows the rejection so the test passes once the
    // cyRequestFailed event has been recorded by the protocol.
    cy.on('fail', (err) => {
      expect(err.message).to.match(/ECONNREFUSED|ETIMEDOUT|ENOTFOUND/)

      return false
    })

    cy.request({
      url: 'http://127.0.0.1:1/never',
      retryOnNetworkFailure: false,
      timeout: 2000,
    })
  })
})
