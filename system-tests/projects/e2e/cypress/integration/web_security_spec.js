describe('web security', function () {
  it('fails when clicking <a> to another origin', function () {
    cy.visit('http://localhost:4466/link')
    .get('a').click().url().should('eq', 'https://www.foo.com:44665/cross_origin')

    cy.contains('h1', 'cross origin')
  })

  it('fails when submitted a form and being redirected to another origin', function () {
    cy.visit('http://localhost:4466/form')
    .get('input').click().url().should('eq', 'https://www.foo.com:44665/cross_origin')

    cy.contains('h1', 'cross origin')
  })

  it('fails when using a javascript redirect to another origin', function () {
    cy.visit('http://localhost:4466/javascript')
    .get('button').click().url().should('eq', 'https://www.foo.com:44665/cross_origin')

    cy.contains('h1', 'cross origin')
  })

  it('fails when doing a CORS request cross-origin', function () {
    cy.visit('http://localhost:4466/cors')
    .contains('success!', { timeout: 500 })
  })
})
