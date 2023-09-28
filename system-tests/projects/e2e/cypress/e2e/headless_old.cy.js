describe('e2e headless old spec', function () {
  it('has expected launch args', function () {
    cy.task('get:browser:args').should('contain', '--headless=old')
  })
})
