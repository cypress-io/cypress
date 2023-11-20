/**
 * Used in cy-in-cy tests in @packages/app.
 */
it('t1', () => {
  const setupFn = cy.stub().as('runSetup')

  cy.session('user1', setupFn)
  cy.log('after')
})
