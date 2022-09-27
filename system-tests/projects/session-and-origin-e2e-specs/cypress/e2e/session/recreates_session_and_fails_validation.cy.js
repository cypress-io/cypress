/**
 * Used in cy-in-cy tests in @packages/app.
 */
let setupFn
let validateFn

before(() => {
  setupFn = cy.stub().as('runSetup')
  validateFn = cy.stub().callsFake(() => {
    if (validateFn.callCount >= 2) {
      return false
    }
  }).as('runValidation')
})

it('t1', () => {
  cy.session('user1', setupFn, {
    validate: validateFn,
  })

  cy.log('after')
})

it('t2', () => {
  cy.session('user1', setupFn, {
    validate: validateFn,
  })

  cy.log('after')
})
