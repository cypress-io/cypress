// Regression test for https://github.com/cypress-io/cypress/issues/29927
//
// With test isolation enabled, the AUT must be reset to about:blank between
// tests even when the preceding test was skipped. A skipped (pending) test does
// not run Mocha's afterEach/afterAll hook phase, so previously the page visited
// in the `before` hook leaked into the first test that ran after the skipped
// test — causing that test to pass when it should have started from a clean page.
describe('test isolation is preserved after a skipped test', () => {
  before(() => {
    cy.visit('cypress/e2e/index.html')
    // confirm the before hook actually loaded the page so the assertions below
    // are meaningful (i.e. the element existed before the reset).
    cy.get('.from-before-hook').should('exist')
  })

  // NOTE: the first test is intentionally skipped — a skipped (pending) test
  // never triggers the test isolation reset, which is the scenario under test.
  it.skip('skipped first test', () => {
    expect(true).to.equal(true)
  })

  it('does not inherit the page from the before hook', () => {
    // the page should have been reset to about:blank after the skipped test, so
    // the element added by the before hook's visit must no longer exist.
    cy.get('.from-before-hook').should('not.exist')
  })

  it('continues to reset state on subsequent tests', () => {
    cy.get('.from-before-hook').should('not.exist')
  })
})
