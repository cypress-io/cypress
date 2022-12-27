/**
 * Used in cy-in-cy tests in @packages/app.
 */
it('t1', () => {
  const setupFn = cy.stub().as('runSetup')
  const validateFn = cy.stub().callsFake(() => {
    expect(true).to.be.false
  }).as('runValidation')

  cy.session('blank_session', setupFn, {
    validate: validateFn,
  })
})
