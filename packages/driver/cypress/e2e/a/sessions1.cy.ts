it.only('s1 - t1', () => {
  cy.session('session1', () => {
    // do something
  }, {
    cacheAcrossSpecs: true,
  })

  cy.visit('https://example.cypress.io')
})

it('s1- t2', () => {
  cy.session('session2', () => {
    // do something
    // something else
  }, {
  })

  cy.visit('https://example.cypress.io')
  cy.visit('https://example.cypress.io')
  cy.visit('https://example.cypress.io')
})
