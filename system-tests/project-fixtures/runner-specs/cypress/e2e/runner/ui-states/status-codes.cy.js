describe('Status Codes', () => {
  it('Request Statuses', () => {
    cy.request('/status-code-test/200')
    cy.request('/status-code-test/304')

    cy.request({
      url: '/status-code-test/400',
      failOnStatusCode: false,
    })

    cy.request({
      url: '/status-code-test/502',
      failOnStatusCode: false,
    })

    cy.request({
      url: '/status-code-test/103',
      timeout: 2000,
    })
  })
})
