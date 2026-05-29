describe('Bun Workspace Test', () => {
  it('should work with bun workspace dependencies', () => {
    cy.visit('/cypress/fixtures/workspace-test.html')
    cy.contains('Workspace Test Page').should('be.visible')
  })

  it('should be able to import workspace packages', () => {
    // This test verifies that workspace dependencies are properly resolved
    const { sharedFunction, useLodash } = require('@bun-workspace/shared')

    expect(sharedFunction).to.be.a('function')
    expect(sharedFunction()).to.equal('Hello from shared package!')
    expect(useLodash).to.be.a('function')
    expect(useLodash()).to.equal('Lodash is available')
  })
})
