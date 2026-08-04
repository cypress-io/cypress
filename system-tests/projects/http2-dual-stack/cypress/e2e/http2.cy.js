/* eslint-disable no-undef */
// Browser traffic negotiates h2 while Cypress's server-side HTTP/1.1
// requests succeed against the same dual-stack origin.
//
// The expected browser protocol is exposed public configuration so the same
// spec doubles as the downgrade contrast case: with the MITM proxy enabled
// all browser traffic terminates at the proxy and speaks HTTP/1.1
// (--expose expectedBrowserProtocol=1.1); with the proxy disabled
// (CYPRESS_INTERNAL_DISABLE_PROXY=1) the browser negotiates h2 directly.
describe('dual-stack h2 origin', () => {
  const expectedBrowserProtocol = Cypress.expose('expectedBrowserProtocol')

  it('browser traffic speaks the expected protocol, Cypress server-side traffic stays HTTP/1.1', () => {
    // cy.visit's resolve:url pre-flight hits this origin server-side over
    // HTTP/1.1 and succeeds (dual-stack) before the browser ever navigates
    cy.visit('/')

    // the visited document is served from that server-side pre-flight (the
    // buffered response fulfills the browser's navigation), so the protocol
    // embedded in the page is HTTP/1.1 in BOTH proxy modes — only subresource
    // traffic reaches the origin from the browser itself
    cy.get('#visit-protocol').should('have.text', '1.1')

    // in-page fetch — the first traffic that reaches the origin from the
    // browser, so this is where the negotiated browser protocol shows up
    cy.get('#browser-protocol').should('have.text', expectedBrowserProtocol)

    // 10 concurrent fetches — under h2 these multiplex over one connection
    cy.get('#api-request-count', { timeout: 10000 }).should('have.text', '10')

    // cy.request is a Node-side request from the Cypress server and stays
    // HTTP/1.1 regardless of proxy mode — the h2 MVP scopes server-side
    // commands to h1.1 on purpose
    cy.request('/api/data').its('body.protocol').should('eq', '1.1')
  })
})
