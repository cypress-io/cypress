it('has expected resolvedNodePath and resolvedNodeVersion', () => {
  cy.env(['expectedNodeVersion']).then(({ expectedNodeVersion }) => {
    expect(Cypress.config('resolvedNodePath')).to.be.null

    expect(Cypress.config('resolvedNodeVersion')).to.eq(expectedNodeVersion)
  })
})
