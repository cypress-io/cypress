/**
 * Used in cy-in-cy tests in @packages/app.
 */
it('t1', { retries: 1 }, () => {
  const setupFn = cy.stub()
  const validateFn = cy.stub()

  validateFn.onCall(0).throws(new Error('validation error'))
  validateFn.onCall(1).returns(true)

  cy.session('blank_session', setupFn, {
    validate: validateFn,
  })
})
