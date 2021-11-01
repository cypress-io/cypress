it('has expected resolvedNodePath and resolvedNodeVersion', () => {
  expect(Cypress.config('nodeVersion')).to.eq('system')

  // Since this test is not run via the cli, resolvedNodePath will always be undefined and fall back to bundled node.
  expect(Cypress.config('resolvedNodePath')).to.be.undefined

  expect(Cypress.config('resolvedNodeVersion')).to.eq(Cypress.env('expectedNodeVersion'))
})
