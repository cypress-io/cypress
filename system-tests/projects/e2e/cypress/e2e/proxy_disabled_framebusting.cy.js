/* eslint-disable no-undef */
describe('framebusting protections', () => {
  it('disables navigation preload on the browser network path, and leaves it enabled under forceHttp1', () => {
    // the document is served from Cypress's server-side resolve:url buffer,
    // and no service worker controls the client yet; the page installs a
    // service worker whose activate handler calls navigationPreload.enable()
    // (a no-op on the browser network path — see
    // static/framebusting/sw.js) and then claims all clients. The
    // page script also makes its own window-realm navigationPreload.enable()
    // call (also a no-op on that path — see static/framebusting/index.html),
    // guarding the separate window-realm seam alongside the worker-realm one
    // above
    cy.visit('http://localhost:4466/')
    // service worker install/activate spawns a worker process, which can
    // outlast the default command timeout on loaded CI containers
    cy.get('#app', { timeout: 15000 }).should('have.text', 'sw-ready')

    // sw-ready already implies both enable() calls settled and that
    // worker-originated fetches are observably intercepted (the /probe
    // readiness check in static/framebusting/index.html), so this
    // getState() call is a settled, deterministic readout of whether
    // Cypress's two preload seams actually engaged - not a race against the
    // worker's own timing
    cy.env(['expectedNavigationPreloadEnabled']).then(({ expectedNavigationPreloadEnabled }) => {
      cy.window().then((win) => win.navigator.serviceWorker.ready)
      .then((reg) => reg.navigationPreload.getState())
      .should('have.property', 'enabled', expectedNavigationPreloadEnabled)
    })

    // sw-ready guarantees the worker controls this page, so a same-origin
    // fetch reaches its fetch handler. /__/assets/e2e-poison.js is under
    // Cypress's reserved client route and the worker answers it with a marker
    // body (see static/framebusting/sw.js): on the browser network path the
    // injected wrapper declines runner-namespace requests, so the marker cannot
    // come back and Cypress's own asset route answers instead. Under
    // forceHttp1 the rule is inert, so the marker must come back - pinning the
    // rule, not the network path, as the cause of the difference.
    //
    // The path is one Express owns (the runner's static asset route) rather
    // than an invented one: a clientRoute path no route handler owns loops back
    // through the proxy a second time and its 404 never reaches the browser.
    cy.env(['expectedRunnerNamespacePoisoned']).then(({ expectedRunnerNamespacePoisoned }) => {
      cy.window().then((win) => win.fetch('/__/assets/e2e-poison.js').then((res) => res.text()))
      .should(expectedRunnerNamespacePoisoned ? 'equal' : 'not.equal', 'SW-POISON')
    })
  })
})
