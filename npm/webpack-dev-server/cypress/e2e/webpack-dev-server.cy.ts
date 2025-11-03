/// <reference path="../support/e2e.ts" />

import dedent from 'dedent'

describe('Config options', () => {
  it('supports supportFile = false', () => {
    cy.scaffoldProject('webpack5_wds5-react')
    cy.openProject('webpack5_wds5-react', ['--config-file', 'cypress-webpack-no-support.config.ts', '--component'])
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
    cy.scaffoldProject('webpack5_wds5-react')
    cy.openProject('webpack5_wds5-react', ['--config-file', 'cypress-webpack-dev-server-function.config.ts', '--component'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('App.cy.jsx').click()
    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 1)
  })

  it('supports webpackConfig as an async function', () => {
    cy.scaffoldProject('webpack5_wds5-react')
    cy.openProject('webpack5_wds5-react', ['--config-file', 'cypress-webpack-dev-server-async-config.config.ts', '--component'])
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
    cy.scaffoldProject('webpack5_wds5-react')
    cy.openProject('webpack5_wds5-react', ['--config-file', 'cypress-webpack-dev-server-custom-index.config.ts', '--component'])
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

describe('sourcemaps', () => {
  it('should be provided for JS and transpiled files', () => {
    const testContent = dedent`
      describe('spec file with import', () => {
        it('should generate uncaught error', () => {
          throw new Error('uncaught')
        })
      
        it('should generate failed command', () => {
          cy.get('#does-not-exist', { timeout: 100 })
        })
      })
    `

    cy.scaffoldProject('webpack5_wds5-react')
    cy.openProject('webpack5_wds5-react', ['--config-file', 'cypress-webpack-no-support.config.ts', '--component'])
    cy.startAppServer('component')

    cy.withCtx(async (ctx, o) => {
      await ctx.actions.file.writeFileInProject(
        'src/JsErrorSpec.cy.js',
        o.testContent,
      )

      await ctx.actions.file.writeFileInProject(
        'src/JsWithImportErrorSpec.cy.js',
        `import React from 'react';\n\n${o.testContent}`,
      )

      await ctx.actions.file.writeFileInProject(
        'src/JsxErrorSpec.cy.jsx',
        o.testContent,
      )
    }, { testContent })

    const verifySourcemap = (specName: string, line: number, column: number) => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains(specName).click()
      cy.waitForSpecToFinish()
      cy.get('.failed > .num').should('contain', 2)
      cy.window().then((win) => {
        // @ts-expect-error
        cy.stub(win.getEventManager(), 'emit').as('emit')
      })

      cy.get('.runnable-err-file-path', { timeout: 250 }).eq(1).as('filePath')
      cy.get('@filePath').should('contain', `${specName}:${line}:${column}`)
      cy.get('@filePath').then(($el) => {
        $el.find('span').trigger('click')
      })

      cy.get('@emit').should('have.been.calledWithMatch', 'open:file', {
        absoluteFile: Cypress.sinon.match(new RegExp(`cy-projects/webpack5_wds5-react/src/${specName}$`)),
        line,
        column,
      })
    }

    verifySourcemap('JsErrorSpec.cy.js', 7, 8)

    verifySourcemap('JsWithImportErrorSpec.cy.js', 9, 8)

    verifySourcemap('JsxErrorSpec.cy.jsx', 7, 8)
  })
})
