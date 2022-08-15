it.only('s1 - t1', () => {
  cy.session('global_session', () => {
    // do something
  }, {
    cacheAcrossSpecs: true,
  })

  cy.session('local_session', () => {
    // do something
    // something else
  }, {
  })

  cy.visit('https://example.cypress.io')
})

it('s1- t2', () => {
  cy.session('local_session', () => {
    // do something
    // something else
  }, {
  })

  cy.visit('https://example.cypress.io')
})
