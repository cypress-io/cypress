it('should validate sourcemaps', () => {
  expect(Cypress.areSourceMapsAvailable).to.be[Cypress.env('areSourceMapsAvailable')]
})
