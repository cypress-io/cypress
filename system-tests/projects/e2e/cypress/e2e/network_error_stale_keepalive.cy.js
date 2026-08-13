// Recovering a request written to a dead pooled socket is the browser's job now
// that Cypress no longer replays traffic through Node. Cypress must let it, and
// must not report the recovered attempt twice.
const PAIRS = 3

describe('stale keep-alive sockets', function () {
  it('recovers without surfacing the failed attempt to the test', function () {
    cy.intercept({ pathname: '/stale-socket' }).as('staleSocket')

    cy.visit('/stale-keepalive.html')

    cy.window().then((win) => {
      // the warm request leaves a pooled socket behind; the raced one reuses it
      // and is met with a FIN, the shape of a keep-alive timeout crossing a request
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

    // a change in connection pooling would otherwise leave this racing nothing
    cy.request('/stale-socket-stats').its('body.killedOnReusedSocket').should('be.gte', 1)

    // the wire saw more requests than this — a browser-level retry sits below the
    // layer Cypress intercepts at
    cy.get('@staleSocket.all').should('have.length', PAIRS * 2)
  })
})
