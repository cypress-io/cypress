it('has expected resolvedNodePath and resolvedNodeVersion', () => {
  expect(Cypress.config('nodeVersion')).to.eq('bundled')

  expect(Cypress.config('resolvedNodePath')).to.be.undefined

  expect(Cypress.config('resolvedNodeVersion')).to.eq(Cypress.env('expectedNodeVersion'))
})
