Cypress.config('experimentalSessionAndOrigin', true)

it('t1', () => {
  const setupFn = cy.stub().as('runSetup')

  cy.session('blank_session', setupFn)
  cy.log('after')
})
