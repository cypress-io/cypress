describe('Bun E2E Test', () => {
  it('should work with bun package manager', () => {
    cy.visit('/cypress/fixtures/bun-test.html')
    cy.contains('Bun Test Page').should('be.visible')
  })

  it('should be able to use lodash imported via bun', () => {
    // This test verifies that dependencies installed via bun are available
    const _ = require('lodash')

    expect(_.isArray).to.be.a('function')
    expect(_.isArray([])).to.be.true
    expect(_.isArray({})).to.be.false
  })
})
