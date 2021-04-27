it('has expected resolvedNodePath and resolvedNodeVersion', () => {
  expect(Cypress.config('nodeVersion')).to.eq('system')
  expect(Cypress.config('resolvedNodePath')).to.eq(Cypress.env('expectedNodePath'))
  expect(Cypress.config('resolvedNodeVersion')).to.eq(Cypress.env('expectedNodeVersion'))
})
