// The origin closes a pooled keep-alive socket while a request is being written to
// it. Cypress does not replay browser traffic through Node any more, so recovering
// from that is the browser's job — this spec is what says Cypress still lets it do
// that job, and does not report the recovered attempt twice.
// https://github.com/cypress-io/cypress/issues/24716
const PAIRS = 3

describe('stale keep-alive sockets', function () {
  it('recovers without surfacing the failed attempt to the test', function () {
    cy.intercept({ pathname: '/stale-socket' }).as('staleSocket')

    cy.visit('/stale-keepalive.html')

    cy.window().then((win) => {
      // each pair serves one request, leaving a pooled socket behind, then sends
      // another that reuses it — the origin answers that one with a FIN and no
      // response, the shape a keep-alive timeout takes when it crosses a request
      const pair = (i) => {
        return win.fetch(`/stale-socket?warm=${i}`)
        .then((res) => res.text())
        .then(() => win.fetch(`/stale-socket?race=${i}`))
        .then((res) => {
          expect(res.status, 'the browser retried the dead socket on a new connection').to.eq(200)
        })
      }

      return Cypress.Promise.each(Array.from({ length: PAIRS }, (_, i) => i), pair)
    })

    // proves the origin really did kill a reused socket, so a change in connection
    // pooling cannot quietly turn this into a test that never races anything
    cy.request('/stale-socket-stats').its('body.killedOnReusedSocket').should('be.gte', 1)

    // the wire saw more requests than this; the test must see only the ones it
    // made, since a browser-level retry sits below the layer Cypress intercepts at
    cy.get('@staleSocket.all').should('have.length', PAIRS * 2)
  })
})
