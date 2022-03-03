// @ts-ignore / session support is needed for visiting about:blank between tests
// FIXME: received cross-origin errors
context.skip('multi-domain network requests', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="request-link"]').click()
  })

  it('.request()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.request('/fixtures/example.json').should((response) => {
        expect(response.status).to.equal(200)
      })
    })
  })

  it('.intercept()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.intercept('POST', '/post-only', {
        statusCode: 201,
        body: 'Added',
      }).as('mockRequest')

      cy.get('#request').click()

      cy.wait('@mockRequest')
      cy.get('#result').should('contain', 'Added')
    })
  })
})
