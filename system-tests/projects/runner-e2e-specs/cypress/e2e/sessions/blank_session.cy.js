Cypress.config('experimentalSessionAndOrigin', true)

it('t1', () => {
  cy.session('blank_session', () => {})
  assert(true)
})
