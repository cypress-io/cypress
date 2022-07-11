/// <reference path="../support/e2e.ts" />

describe('Config options', () => {
  it('supports supportFile = false', () => {
    cy.scaffoldProject('vite2.9.1-react')
    cy.openProject('vite2.9.1-react', ['--config-file', 'cypress-vite-no-support.config.ts'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.contains('App.cy.jsx').click()
    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 1)
  })

  it('chooses new port when specified port is in use', () => {
    cy.scaffoldProject('vite2.9.1-react')
    cy.openProject('vite2.9.1-react', ['--config-file', 'cypress-vite-port-in-use.config.ts'])
    cy.startAppServer('component')

    cy.visitApp()

    cy.contains('App.cy.jsx').click()
    cy.get('.passed > .num').should('contain', 1)

    cy.withCtx(async (ctx) => {
      const config = ctx.lifecycleManager.loadedFullConfig

      if (!config) {
        throw new Error('"ctx.lifecycleManager.loadedFullConfig" should be loaded by this point')
      }

      expect(config.baseUrl).to.equal('http://localhost:3001')
    })
  })

  it('supports serving files with whitespace', () => {
    const specWithWhitespace = 'spec with whitespace.cy.jsx'

    cy.scaffoldProject('vite2.9.1-react')
    cy.openProject('vite2.9.1-react', ['--config-file', 'cypress-vite.config.ts'])
    cy.startAppServer('component')

    cy.withCtx(async (ctx, { specWithWhitespace }) => {
      await ctx.actions.file.writeFileInProject(
        ctx.path.join('src', specWithWhitespace),
        await ctx.file.readFileInProject(ctx.path.join('src', 'App.cy.jsx')),
      )
    }, { specWithWhitespace })

    cy.visitApp()
    cy.contains(specWithWhitespace).click()
    cy.get('.passed > .num').should('contain', 1)
  })

  it('supports @cypress/vite-dev-server', () => {
    cy.scaffoldProject('vite2.9.1-react')
    cy.openProject('vite2.9.1-react', ['--config-file', 'cypress-vite-dev-server-function.config.ts'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.contains('App.cy.jsx').click()
    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 1)
  })

  // NOTE: Getting "Maximum update depth exceeded" which doesn't happen outside of cy-in-cy
  it.skip('supports live-reloading component-index.html', () => {
    cy.scaffoldProject('vite2.9.1-react')
    cy.openProject('vite2.9.1-react', ['--config-file', 'cypress-vite.config.ts'])
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
