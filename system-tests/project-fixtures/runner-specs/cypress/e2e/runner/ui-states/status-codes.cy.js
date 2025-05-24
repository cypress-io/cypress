describe('Status Codes', () => {
  it('Request Statuses', () => {
    cy.request('https://httpstat.us/200')
    cy.request('https://httpstat.us/304')

    cy.request({
      url: 'https://httpstat.us/400',
      failOnStatusCode: false,
    })

    cy.request({
      url: 'https://httpstat.us/502',
      failOnStatusCode: false,
    })

    cy.request({
      url: 'https://httpstat.us/103',
      timeout: 2000,
    })
  })
})
