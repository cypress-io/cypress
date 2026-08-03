describe('cy.request with the QUERY method', () => {
  it('sends a QUERY request with a body and reads the response', () => {
    cy.request({
      method: 'QUERY',
      url: '/api/search',
      body: { term: 'cypress' },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.method).to.eq('QUERY')
      expect(response.body.results).to.have.length(2)
      expect(response.body.results[0].name).to.eq('cypress result A')
    })
  })
})
