/**
 * Used in cy-in-cy tests in @packages/app.
 */
it('t1', { retries: 1 }, () => {
  const setupFn = cy.stub().as('runSetup')
  const validateFn = cy.stub().throws(new Error('validation error')).as('runValidation')

  cy.session('blank_session', setupFn, {
    validate: validateFn,
  })
})
