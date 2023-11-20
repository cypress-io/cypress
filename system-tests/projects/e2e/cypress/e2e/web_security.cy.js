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

  it('finds the correct spec bridge even if a previous spec bridge host is a subset of the current host', { defaultCommandTimeout: 4000 }, () => {
    // Establish a spec bridge with a 'bar.com' host prior to loading 'foobar.com'
    cy.origin('http://www.bar.com:4466', () => undefined)

    cy.origin('http://www.app.foobar.com:4466', () => {
      cy.visit('/link')
    })
  })
})
