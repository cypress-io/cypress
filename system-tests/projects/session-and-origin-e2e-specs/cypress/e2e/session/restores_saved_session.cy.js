/**
 * Used in cy-in-cy tests in @packages/app.
 */
let setupFn
let validateFn

before(() => {
  setupFn = cy.stub().as('runSetup')
  validateFn = cy.stub().as('runValidation')
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

// https://github.com/cypress-io/cypress/issues/22381
describe('test sessionid integrity is maintained', () => {
  it('use same session 2x and 2nd does not provide setup', () => {
    cy.session('session-2', setupFn)
    cy.session('session-2')
  })

  it('restore prev session 2x and 2nd does not provide setup', () => {
    cy.session('session-2', setupFn)
    cy.session('session-2')
  })

  it('restore prev session without setup', () => {
    cy.session('session-2')
  })

  it('fails when trying to use existing sessionid with diff args', () => {
    cy.session('session-2', () => {
    // something else
    })
  })
})
