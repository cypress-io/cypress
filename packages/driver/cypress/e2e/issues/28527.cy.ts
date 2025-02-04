describe('issue 28527', { testIsolation: false, retries: 2 }, () => {
  before(() => {
    cy.visit('/fixtures/empty.html')
  })

  beforeEach(() => {
    // ensure we run the tests in run mode
    // @ts-expect-error
    Cypress.config('isInteractive', false)
    // @ts-expect-error
    Cypress.config('exit', true)
  })

  // there can only be one test in this file to ensure we are testing the scenario
  // where a test fails and the runner does not navigate to about:blank between retries
  it('fails and then retries and verifies about:blank is not displayed', () => {
    cy.then(() => {
      // fail the first attempt to ensure we don't go to about:blank before the second attempt
      if (Cypress.currentRetry < 2) {
        throw new Error(`attempt ${Cypress.currentRetry + 1} error`)
      }
    })

    cy.get('title').should('have.text', 'Empty HTML Fixture')
    cy.url().should('include', '/fixtures/empty.html')
    cy.url().should('not.include', 'about:blank')
    cy.then(() => {
      expect(Cypress.currentRetry).to.equal(2)
    })
  })
})
