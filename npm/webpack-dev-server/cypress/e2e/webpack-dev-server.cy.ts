/// <reference path="../support/e2e.ts" />

describe('Config options', () => {
  it('supports supportFile = false', () => {
    cy.scaffoldProject('webpack5_wds4-react')
    cy.openProject('webpack5_wds4-react', ['--config-file', 'cypress-webpack-no-support.config.ts'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.contains('App.cy.jsx').click()
    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 1)
  })

  it('supports @cypress/webpack-dev-server', () => {
    cy.scaffoldProject('webpack5_wds4-react')
    cy.openProject('webpack5_wds4-react', ['--config-file', 'cypress-webpack-dev-server-function.config.ts'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.contains('App.cy.jsx').click()
    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 1)
  })

  it('supports live-reloading component-index.html', () => {
    cy.scaffoldProject('webpack5_wds4-react')
    cy.openProject('webpack5_wds4-react', ['--config-file', 'cypress-webpack.config.ts'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.contains('LiveReloadIndexHtml.cy.jsx').click()
    cy.waitForSpecToFinish()
    cy.get('.failed > .num').should('contain', 1)

    cy.withCtx(async (ctx) => {
      const indexHtmlFilePath = ctx.path.join('cypress', 'support', 'component-index.html')
      const indexHtmlContent = await ctx.file.readFileInProject(indexHtmlFilePath)
      const indexHtmlWithStyles = indexHtmlContent.replace(/<\/head>/, `<style>body { background-color: red; }</style></head>`)

      await ctx.actions.file.writeFileInProject(indexHtmlFilePath, indexHtmlWithStyles)
    })

    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 1)
  })
})
