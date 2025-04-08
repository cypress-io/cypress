/// <reference path="../support/e2e.ts" />

describe('Config options', () => {
  it('supports supportFile = false', () => {
    cy.scaffoldProject('webpack5_wds4-react')
    cy.openProject('webpack5_wds4-react', ['--config-file', 'cypress-webpack-no-support.config.ts', '--component'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('App.cy.jsx').click()
    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 1)
  })

  it('supports nested config', () => {
    cy.scaffoldProject('webpack-react-nested-config')
    cy.openProject('webpack-react-nested-config', ['--config-file', 'cypress/cypress.config.js', '--component'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('foo.cy.js').click()
    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 1)
  })

  it('supports @cypress/webpack-dev-server', () => {
    cy.scaffoldProject('webpack5_wds4-react')
    cy.openProject('webpack5_wds4-react', ['--config-file', 'cypress-webpack-dev-server-function.config.ts', '--component'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('App.cy.jsx').click()
    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 1)
  })

  it('supports webpackConfig as an async function', () => {
    cy.scaffoldProject('webpack5_wds4-react')
    cy.openProject('webpack5_wds4-react', ['--config-file', 'cypress-webpack-dev-server-async-config.config.ts', '--component'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('App.cy.jsx').click()
    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 2)

    cy.withCtx(async (ctx) => {
      const verifyFile = await ctx.file.readFileInProject('wrote-to-file')

      expect(verifyFile).to.eq('OK')
    })
  })

  it('recompiles with new spec and custom indexHtmlFile', () => {
    cy.scaffoldProject('webpack5_wds4-react')
    cy.openProject('webpack5_wds4-react', ['--config-file', 'cypress-webpack-dev-server-custom-index.config.ts', '--component'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.specsPageIsVisible()

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject(
        ctx.path.join('src', 'New.cy.js'),
        await ctx.file.readFileInProject(ctx.path.join('src', 'App.cy.jsx')),
      )
    })

    cy.contains('New.cy.js').click()
    cy.waitForSpecToFinish({ passCount: 2 })
  })

  it('supports loading assets via relative urls', () => {
    cy.scaffoldProject('webpack-dev-server-relative')
    cy.openProject('webpack-dev-server-relative', ['--component'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('relative-url.cy.jsx').click()
    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 1)
  })
})
