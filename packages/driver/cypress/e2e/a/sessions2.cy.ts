it.only('s2 - t1', () => {
  cy.session('session1', () => {
    // do something
  }, {
    cacheAcrossSpecs: true,
  })

  cy.visit('https://example.cypress.io')
})

it('s2 -t2', () => {
  cy.session('session2', () => {
    // do something
    // something else
  }, {
  })

  cy.visit('https://example.cypress.io')
})
