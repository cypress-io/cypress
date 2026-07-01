/* eslint-disable no-undef */
// https://github.com/cypress-io/cypress/issues/21151
// `blockHosts` is configured globally to block localhost:3131. A test-level
// override must be able to unblock it at runtime, and the override must not
// leak into sibling tests.
const requestReq = (win) => {
  return new Promise((resolve) => {
    const xhr = new win.XMLHttpRequest

    xhr.open('GET', 'http://localhost:3131/req')
    xhr.setRequestHeader('Content-Type', 'text/plain')
    xhr.send()
    xhr.onload = () => resolve(xhr)
    // a request blocked by the proxy returns a 503 without CORS headers, which
    // the cross-origin XHR surfaces as a zero status
    xhr.onerror = () => resolve(xhr)
  })
}

describe('blockHosts test config override', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3232')
  })

  it('blocks the configured host by default', () => {
    cy.window().then(requestReq).its('status').should('eq', 0)
  })

  describe('with a blockHosts override', { blockHosts: null }, () => {
    it('no longer blocks the host', () => {
      cy.window().then(requestReq).its('status').should('eq', 200)
    })
  })

  it('restores blocking after the override suite', () => {
    cy.window().then(requestReq).its('status').should('eq', 0)
  })
})
