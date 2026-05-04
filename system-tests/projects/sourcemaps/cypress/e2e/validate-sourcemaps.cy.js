it('should validate sourcemaps', () => {
  cy.env(['areSourceMapsAvailable', 'sourceMapProjectRoot']).then(({ areSourceMapsAvailable, sourceMapProjectRoot }) => {
    expect(Cypress.areSourceMapsAvailable).to.be[areSourceMapsAvailable]
    expect(Cypress.sourceMapProjectRoot).to.match(new RegExp(`${sourceMapProjectRoot}$`))
  })
})
