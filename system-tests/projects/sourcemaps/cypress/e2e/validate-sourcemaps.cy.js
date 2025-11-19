it('should validate sourcemaps', () => {
  expect(Cypress.areSourceMapsAvailable).to.be[Cypress.env('areSourceMapsAvailable')]
  expect(Cypress.sourceMapProjectRoot).to.match(new RegExp(`${Cypress.env('sourceMapProjectRoot')}$`))
})
