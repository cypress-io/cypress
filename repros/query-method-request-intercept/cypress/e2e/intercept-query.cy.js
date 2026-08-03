describe('cy.intercept with the QUERY method', () => {
  it('stubs a QUERY request triggered by the app', () => {
    cy.intercept('QUERY', '/api/search', {
      statusCode: 200,
      body: {
        method: 'QUERY',
        query: { term: 'stubbed' },
        results: [{ id: 99, name: 'stubbed result' }],
      },
    }).as('search')

    cy.visit('/')
    cy.get('#search').click()

    cy.wait('@search').then((interception) => {
      expect(interception.request.method).to.eq('QUERY')
      expect(interception.request.body).to.deep.eq({ term: 'cypress' })
    })

    cy.get('#results').should('contain', 'stubbed result')
  })

  it('spies on a real QUERY request and lets it hit the server', () => {
    cy.intercept('QUERY', '/api/search').as('search')

    cy.visit('/')
    cy.get('#search').click()

    cy.wait('@search').its('response.body.method').should('eq', 'QUERY')
    cy.get('#results').should('contain', 'cypress result A')
  })
})
