it('has expected resolvedNodePath and resolvedNodeVersion', () => {
  cy.env(['expectedNodePath', 'expectedNodeVersion']).then(({ expectedNodePath, expectedNodeVersion }) => {
    expect(Cypress.config('resolvedNodePath')).to.eq(expectedNodePath)

    expect(Cypress.config('resolvedNodeVersion')).to.eq(expectedNodeVersion)
  })
})
