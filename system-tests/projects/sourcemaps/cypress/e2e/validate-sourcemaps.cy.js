it('should validate sourcemaps', () => {
  expect(Cypress.areSourceMapsEnabled).to.be[Cypress.env('areSourceMapsEnabled')]
})
