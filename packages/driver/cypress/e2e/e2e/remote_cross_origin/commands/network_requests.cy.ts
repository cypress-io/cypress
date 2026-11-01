describe('remote driver: network requests in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="request-link"]').click()
  })

  it('.request() to the AUT\'s origin', () => {
    cy.request('http://www.foobar.com:3500/fixtures/example.json').should((response) => {
      expect(response.status).to.equal(200)
      expect(response.allRequestResponses[0]['Request URL']).to.equal('http://www.foobar.com:3500/fixtures/example.json')
    })
  })

  it('.request() resolves a relative path against baseUrl, not the AUT\'s origin', () => {
    cy.request('/fixtures/example.json').should((response) => {
      expect(response.status).to.equal(200)
      expect(response.allRequestResponses[0]['Request URL']).to.equal('http://localhost:3500/fixtures/example.json')
    })
  })

  it('.request() to the baseUrl origin', () => {
    cy.request('http://localhost:3500/fixtures/example.json').should((response) => {
      expect(response.status).to.equal(200)
      expect(response.allRequestResponses[0]['Request URL']).to.equal('http://localhost:3500/fixtures/example.json')
    })
  })
})
