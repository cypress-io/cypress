/**
 * Used in cy-in-cy tests in @packages/app.
 */
const stub = Cypress.sinon.stub().callsFake(() => {
  // The validation for t3 will fail, causing the
  // session to be recreated (rather than load from saved)
  if (stub.callCount === 3) {
    return false
  }
})

beforeEach(() => {
  cy.session('user1', () => {
    window.localStorage.foo = 'val'
  }, {
    validate: stub,
  })
})

it('t1', () => {
  assert(true)
})

it('t2', () => {
  assert(true)
})

it('t3', () => {
  assert(true)
})
