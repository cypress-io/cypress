describe('Config options', () => {
  it('supports supportFile = false', () => {
    cy.scaffoldProject('webpack5_wds4-react')
    cy.openProject('webpack5_wds4-react', ['--config-file', 'cypress-webpack-no-support.config.ts'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.contains('App.cy.jsx').click()
    cy.get('.passed > .num').should('contain', 1)
  })

  // https://cypress-io.atlassian.net/browse/UNIFY-1697
  it('filters missing spec files from loader during pre-compilation', () => {
    cy.scaffoldProject('webpack5_wds4-react')
    cy.openProject('webpack5_wds4-react', ['--config-file', 'cypress-webpack.config.ts'])
    cy.startAppServer('component')

    cy.visitApp()

    // 1. assert spec executes successfully
    cy.contains('App.cy.jsx').click()
    cy.get('.passed > .num').should('contain', 1)

    // 2. remove file from file system
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject(`src/App.cy.jsx`)
    })

    // 3. assert redirect back to #/specs with alert presented
    cy.contains('[data-cy="alert"]', 'Spec not found')

    // 4. recreate spec, with same name as removed spec
    cy.findByTestId('new-spec-button').click()
    cy.findByRole('dialog').within(() => {
      cy.get('input').clear().type('src/App.cy.jsx')
      cy.contains('button', 'Create Spec').click()
    })

    cy.findByRole('dialog').within(() => {
      cy.contains('button', 'Okay, run the spec').click()
    })

    // 5. assert recreated spec executes successfully
    cy.get('.passed > .num').should('contain', 1)
  })
})
