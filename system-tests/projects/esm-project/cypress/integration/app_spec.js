it('is true', () => {
  expect(Cypress.env('hello')).to.eq('esm')
})
