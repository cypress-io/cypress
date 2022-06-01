describe('network error 304 handling', function () {
  it('does not retry on 304 not modified', function () {
    cy.visit('/load-304.html')
    cy.visit('/load-304.html')
  })
})
