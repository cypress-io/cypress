describe('plugins config extras', () => {
  it('has correct projectRoot', () => {
    cy.env(['projectRoot']).then(({ projectRoot }) => {
      cy.task('get:config:value', 'projectRoot')
      .should('not.be.undefined')
      .and('equal', projectRoot)
    })
  })

  it('has correct configFile', () => {
    cy.env(['configFile']).then(({ configFile }) => {
      cy.task('get:config:value', 'configFile')
      .should('not.be.undefined')
      .and('equal', configFile)
    })
  })
})
