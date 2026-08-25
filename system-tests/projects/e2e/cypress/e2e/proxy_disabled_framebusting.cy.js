/* eslint-disable no-undef */
describe('framebusting protections', () => {
  it('disables navigation preload on the browser network path, and leaves it enabled under forceHttp1', () => {
    // the document is served from Cypress's server-side resolve:url buffer,
    // and no service worker controls the client yet; the page installs a
    // service worker whose activate handler calls navigationPreload.enable()
    // (a no-op on the browser network path — see swSource in
    // proxy_disabled_framebusting_spec.ts) and then claims all clients. The
    // page script also makes its own window-realm navigationPreload.enable()
    // call (also a no-op on that path — see pageSource in the same file),
    // guarding the separate window-realm seam alongside the worker-realm one
    // above
    cy.visit('http://localhost:4466/')
    // service worker install/activate spawns a worker process, which can
    // outlast the default command timeout on loaded CI containers
    cy.get('#app', { timeout: 15000 }).should('have.text', 'sw-ready')

    // sw-ready already implies both enable() calls settled and that
    // worker-originated fetches are observably intercepted (the /probe
    // readiness check in pageSource), so this getState() call is a settled,
    // deterministic readout of whether Cypress's two preload seams actually
    // engaged - not a race against the worker's own timing
    cy.env(['expectedNavigationPreloadEnabled']).then(({ expectedNavigationPreloadEnabled }) => {
      cy.window().then((win) => win.navigator.serviceWorker.ready)
      .then((reg) => reg.navigationPreload.getState())
      .should('have.property', 'enabled', expectedNavigationPreloadEnabled)
    })
  })
})
