context('multi-domain network requests', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="request-link"]').click()
  })

  it('.request() to secondary domain', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.request('http://www.foobar.com:3500/fixtures/example.json').should((response) => {
        expect(response.status).to.equal(200)
        expect(response.allRequestResponses[0]['Request URL']).to.equal('http://www.foobar.com:3500/fixtures/example.json')
      })
    })
  })

  it('.request() to secondary domain with relative path', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.request('/fixtures/example.json').should((response) => {
        expect(response.status).to.equal(200)
        expect(response.allRequestResponses[0]['Request URL']).to.equal('http://www.foobar.com:3500/fixtures/example.json')
      })
    })
  })

  it('.request() to primary domain', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.request('http://localhost:3500/fixtures/example.json').should((response) => {
        expect(response.status).to.equal(200)
        expect(response.allRequestResponses[0]['Request URL']).to.equal('http://localhost:3500/fixtures/example.json')
      })
    })
  })
})
