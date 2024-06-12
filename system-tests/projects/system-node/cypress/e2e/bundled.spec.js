it('has expected resolvedNodePath and resolvedNodeVersion', () => {
  expect(Cypress.config('resolvedNodePath')).to.be.null

  expect(Cypress.config('resolvedNodeVersion')).to.eq(Cypress.env('expectedNodeVersion'))
})
