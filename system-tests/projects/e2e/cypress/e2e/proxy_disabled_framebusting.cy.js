/* eslint-disable no-undef */
describe('framebusting protections', () => {
  it('loads a framebusting page served through a nav-preload service worker', () => {
    // first visit: the document is served from Cypress's server-side resolve:url
    // buffer, and no service worker controls the client yet; the page installs a
    // service worker whose activate handler calls navigationPreload.enable() (a
    // no-op under proxy-disabled — see swSource in proxy_disabled_framebusting_spec.ts)
    // and then claims all clients. The page script also makes its own
    // window-realm navigationPreload.enable() call (also a no-op under
    // proxy-disabled — see pageSource in the same file), guarding the
    // separate window-realm seam alongside the worker-realm one above
    cy.visit('http://localhost:4466/')
    cy.get('#app').should('have.text', 'sw-ready')

    // bounce to another origin so the return navigation is a fresh document load
    // handled by the (still-registered) service worker
    cy.visit('http://localhost:4477/')
    cy.origin('http://localhost:4477', () => {
      cy.get('#other')
    })

    // the return visit's document navigation is handled by the active service
    // worker; a navigation preload request would bypass CDP Fetch interception and
    // deliver the raw X-Frame-Options / frame-ancestors headers to the renderer
    // (#34652), so with the proxy disabled Cypress disables preload and the SW
    // falls back to fetch(e.request), which is intercepted and stripped
    cy.visit('http://localhost:4466/')
    cy.get('#app').should('have.text', 'sw-ready')
  })
})
