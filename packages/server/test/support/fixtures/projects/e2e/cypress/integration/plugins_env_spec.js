describe('plugins env', () => {
  it('has correct projectRoot', () => {
    cy.task('get:env:value', 'projectRoot')
    .should('not.be.undefined')
    .and('equal', Cypress.env('projectRoot'))
  })

  it('has correct configFile', () => {
    cy.task('get:env:value', 'configFile')
    .should('not.be.undefined')
    .and('equal', Cypress.env('configFile'))
  })
})
