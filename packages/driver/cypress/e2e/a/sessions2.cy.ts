it.only('s2 - t1', () => {
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

it('s2 -t2', () => {
  cy.visit('https://example.cypress.io')
})
