/* eslint-disable no-undef */
// `blockHosts` is configured globally to block localhost:3131. A test-level override
// must be able to change what is blocked at runtime, and must not leak into sibling
// tests.
const requestStatus = (win, port) => {
  // a blocked request comes back as a 503 with no CORS headers, so the cross-origin
  // fetch rejects rather than resolving with a readable response
  return win.fetch(`http://localhost:${port}/req`)
  .then((res) => res.status, () => 'blocked')
}

describe('blockHosts test config override', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3232')
  })

  it('blocks the configured host by default', () => {
    cy.window().then((win) => requestStatus(win, 3131)).should('eq', 'blocked')
  })

  it('allows an unconfigured host by default', () => {
    cy.window().then((win) => requestStatus(win, 3333)).should('eq', 200)
  })

  describe('overridden to null', { blockHosts: null }, () => {
    it('no longer blocks the configured host', () => {
      cy.window().then((win) => requestStatus(win, 3131)).should('eq', 200)
    })
  })

  describe('overridden to a different host', { blockHosts: 'localhost:3333' }, () => {
    it('blocks the host named by the override', () => {
      cy.window().then((win) => requestStatus(win, 3333)).should('eq', 'blocked')
    })

    it('no longer blocks the project-level host', () => {
      cy.window().then((win) => requestStatus(win, 3131)).should('eq', 200)
    })
  })

  it('restores blocking of the configured host after the override suites', () => {
    cy.window().then((win) => requestStatus(win, 3131)).should('eq', 'blocked')
  })

  it('still allows the unconfigured host after the override suites', () => {
    cy.window().then((win) => requestStatus(win, 3333)).should('eq', 200)
  })
})
