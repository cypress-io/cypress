describe('Config options', () => {
  it('supports supportFile = false', () => {
    cy.scaffoldProject('vite2.9.1-react')
    cy.openProject('vite2.9.1-react', ['--config-file', 'cypress-vite-no-support.config.ts'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.contains('App.cy.jsx').click()
    cy.get('.passed > .num').should('contain', 1)
  })
})
