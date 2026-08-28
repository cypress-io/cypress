/* eslint-disable no-undef */
// Companion to proxy_disabled_framebusting.cy.js. That spec keeps the AUT
// same-site with the runner's top, so the AUT document lives in the page
// target and the window-realm seam that initializeCDP installs there applies
// to it. This one puts the AUT on a different site from top, where Chromium
// gives it its own renderer and its own CDP target — a target the page
// session's bootstrap script never reaches.
//
// Both cases assert the same thing: after the fixture's window-realm
// navigationPreload.enable() settles, preload must be off.
describe('navigation preload seams', () => {
  const readPreloadState = () => {
    cy.get('#app', { timeout: 20000 }).should('have.text', 'sw-ready')

    cy.window().then((win) => win.navigator.serviceWorker.ready)
    .then((reg) => reg.navigationPreload.getState())
    .should('have.property', 'enabled', false)
  }

  // Control. The whole test runs on one site, so top is on localhost:4477 and
  // the AUT document is in the same renderer and the same CDP target.
  it('disables preload when the AUT shares a site with top', () => {
    cy.visit('http://localhost:4477/')
    readPreloadState()
  })

  // The gap. The first visit in a test switches top to that origin; every
  // later visit in the same test only swaps the AUT iframe's src (see
  // previouslyVisitedLocation in driver/src/cy/commands/navigation.ts), so top
  // stays on localhost:4477 while the AUT commits 127.0.0.1:4477 — a different
  // site, hosted out of process.
  //
  // cy.origin is here because the driver cannot run commands against a
  // cross-origin AUT without it. It is not what creates the out-of-process
  // frame; the cross-site visit above already did that.
  it('disables preload when the AUT is out of process', () => {
    cy.visit('http://localhost:4477/blank')
    cy.visit('http://127.0.0.1:4477/')

    cy.origin('http://127.0.0.1:4477', () => {
      cy.get('#app', { timeout: 20000 }).should('have.text', 'sw-ready')

      cy.window().then((win) => win.navigator.serviceWorker.ready)
      .then((reg) => reg.navigationPreload.getState())
      .should('have.property', 'enabled', false)
    })
  })
})
