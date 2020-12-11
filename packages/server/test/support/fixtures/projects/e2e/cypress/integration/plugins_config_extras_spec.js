describe('plugins config extras', () => {
  it('has correct isInteractive', () => {
    cy.task('get:config:value', 'isInteractive')
    .should('not.be.undefined')
    .and('be.false')
  })

  it('has correct projectRoot', () => {
    cy.task('get:config:value', 'projectRoot')
    .should('not.be.undefined')
    .and('equal', Cypress.env('projectRoot'))
  })

  it('has correct configFile', () => {
    cy.task('get:config:value', 'configFile')
    .should('not.be.undefined')
    .and('equal', Cypress.env('configFile'))
  })
})
