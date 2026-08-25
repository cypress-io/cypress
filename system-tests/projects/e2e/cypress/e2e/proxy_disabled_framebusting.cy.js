/* eslint-disable no-undef */
describe('framebusting protections', () => {
  it('loads a framebusting page served through a nav-preload service worker', () => {
    // first visit: the document is served from Cypress's server-side resolve:url
    // buffer, and no service worker controls the client yet; the page installs a
    // service worker whose activate handler calls navigationPreload.enable() (a
    // no-op on the browser network (CDP Fetch) path — see swSource in
    // proxy_disabled_framebusting_spec.ts) and then claims all clients. The page
    // script also makes its own window-realm navigationPreload.enable() call
    // (also a no-op on that path — see pageSource in the same file), guarding
    // the separate window-realm seam alongside the worker-realm one above
    cy.visit('http://localhost:4466/')
    // service worker install/activate spawns a worker process, which can
    // outlast the default command timeout on loaded CI containers
    cy.get('#app', { timeout: 15000 }).should('have.text', 'sw-ready')

    // bounce to another page on the same origin so the return navigation is a
    // fresh document load handled by the service worker; staying in the
    // worker's scope keeps it alive, so the return visit exercises the
    // navigation-preload path rather than a worker cold-start (see the spec
    // file's /other.html comment)
    cy.visit('http://localhost:4466/other.html')
    cy.get('#other')

    // the return visit's document navigation is handled by the active service
    // worker; a navigation preload request would bypass CDP Fetch interception and
    // deliver the raw X-Frame-Options / frame-ancestors headers to the renderer
    // (#34652), so on the browser network path Cypress disables preload and the
    // SW falls back to fetch(e.request), which is intercepted and stripped
    cy.visit('http://localhost:4466/')
    cy.get('#app').should('have.text', 'sw-ready')
  })
})
