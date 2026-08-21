/* eslint-disable no-undef */
describe('framebusting protections', () => {
  it('loads a framebusting page served through a nav-preload service worker', () => {
    // first visit: the document is served from Cypress's server-side resolve:url
    // buffer, and no service worker controls the client yet; the page installs a
    // service worker that claims all clients and enables navigation preload
    cy.visit('http://localhost:4466/')
    cy.get('#app').should('have.text', 'sw-ready')
    cy.window().its('navigator.serviceWorker.controller').should('exist')

    // bounce to another origin so the return navigation is a fresh document load
    // handled by the (still-registered) service worker
    cy.visit('http://localhost:4477/')
    cy.origin('http://localhost:4477', () => {
      cy.get('#other')
    })

    // the return visit's document is fetched via the service worker's navigation
    // preload request; with the proxy disabled that request bypasses CDP Fetch
    // interception, so the raw X-Frame-Options / frame-ancestors headers reach the
    // renderer and the AUT iframe refuses to load (#34652)
    cy.visit('http://localhost:4466/')
    cy.get('#app').should('have.text', 'sw-ready')
  })
})
