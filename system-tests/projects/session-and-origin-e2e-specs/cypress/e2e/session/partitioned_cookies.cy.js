/**
 * Used in session_spec system-tests. Verifies that partitioned cookies (CHIPS)
 * are cleared when Cypress clears session data.
 *
 * Regression test for https://github.com/cypress-io/cypress/issues/33302:
 * a partitioned cookie carries a `partitionKey`, and CDP only removes it when
 * that key is supplied to Network.deleteCookies. Before the fix, the stale
 * partitioned cookie survived clearing, breaking cy.session() recreation.
 */
/// <reference types="cypress" />
window.top.__cySkipValidateConfig = true
Cypress.config('isInteractive', true)

const getSessionCookieNames = () => {
  return cy.then(() => Cypress.session.getCurrentSessionData())
  .then(({ cookies }) => cookies.map((cookie) => cookie.name))
}

// CHIPS is Chromium-only; skip elsewhere.
describe('partitioned cookies (CHIPS)', { browser: 'chrome' }, () => {
  it('clears a partitioned cookie when clearing session data', () => {
    // the Set-Cookie response sets `pck` with the `Partitioned` attribute, so
    // Chrome stores it keyed to the https://localhost top-level site.
    cy.visit('https://localhost:4466/set-partitioned-cookie')

    getSessionCookieNames().should('include', 'pck')

    cy.then(() => Cypress.session.clearCurrentSessionData())

    // before the fix the partitioned cookie could not be deleted and would
    // still be present here.
    getSessionCookieNames().should('not.include', 'pck')
  })
})
