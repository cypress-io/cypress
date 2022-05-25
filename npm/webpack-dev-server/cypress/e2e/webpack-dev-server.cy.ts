describe('Config options', () => {
  it('supports supportFile = false', () => {
    cy.scaffoldProject('webpack5_wds4-react')
    cy.openProject('webpack5_wds4-react', ['--config-file', 'cypress-webpack-no-support.config.ts'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.contains('App.cy.jsx').click()
    cy.get('.passed > .num').should('contain', 1)
  })
})
