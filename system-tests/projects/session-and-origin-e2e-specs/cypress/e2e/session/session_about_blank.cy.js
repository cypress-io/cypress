/**
 * Regression test for https://github.com/cypress-io/cypress/issues/31988
 *
 * With test isolation enabled (the default), Cypress parks the AUT on
 * about:blank between tests. The next test's cy.session create flow then calls
 * navigateAboutBlank() while the AUT is already on about:blank — a no-op
 * navigation that does not reliably fire a `load` event. Before the fix, that
 * left the surrounding `cy.then()` waiting until its 20s internal timeout:
 *
 *   CypressError: `cy.then()` timed out after waiting `20000ms`.
 *   Your callback function returned a promise that never resolved.
 *     ...await navigateAboutBlank()...
 *
 * Each test below creates a NEW session, so the create workflow (and its
 * navigateAboutBlank() call) runs on every test, including the consecutive ones
 * that start on about:blank. The run must complete without hanging.
 */

const setup = () => {
  // Visiting /login moves the AUT off about:blank and, via the page's onload,
  // populates cookies + localStorage so the session is non-empty.
  cy.visit('https://localhost:4466/login')
}

it('creates a session in the first test', () => {
  cy.session('about-blank-regression-1', setup)
})

it('creates a session on a consecutive test that starts on about:blank', () => {
  cy.session('about-blank-regression-2', setup)
})

it('creates a session on a third consecutive test', () => {
  cy.session('about-blank-regression-3', setup)
})
