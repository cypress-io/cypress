describe('Error handling', () => {
  it('it handles a config error', () => {
    cy.scaffoldProject('unify-plugin-errors')
    cy.openProject('unify-plugin-errors')
    cy.loginUser()

    cy.visitLaunchpad()

    cy.get('[data-cy-testingType=e2e]').click()

    cy.get('body')
    .and('contain.text', 'threw an error from')

    cy.get('[data-cy="collapsible-header"]')
    .should('have.attr', 'aria-expanded', 'true')
    .contains(cy.i18n.launchpadErrors.generic.stackTraceLabel)

    cy.log('Fix error and validate it reloads configuration')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', `module.exports = { e2e: { baseUrl: 'https://cypress.com', supportFile: false } }`)
    })

    cy.findByRole('button', { name: 'Try again' }).click()

    cy.get('body')
    .should('not.contain.text', cy.i18n.launchpadErrors.generic.configErrorTitle)
  })

  it('it handles a configuration file error', () => {
    cy.scaffoldProject('pristine')

    // sets the current project to enable writeFileInProject
    cy.openProject('pristine')

    // write a bad config file
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', 'throw new Error("Error thrown from Config")')
    })

    // reopens the project with the new config file (CircleCI does not react to the addition of a file)
    cy.openProject('pristine')

    cy.visitLaunchpad()

    cy.get('body')
    .should('contain.text', cy.i18n.launchpadErrors.generic.configErrorTitle)
    .and('contain.text', 'Error thrown from Config')

    cy.get('[data-cy="collapsible-header"]')
    .should('have.attr', 'aria-expanded', 'true')
    .contains(cy.i18n.launchpadErrors.generic.stackTraceLabel)

    cy.log('Fix error and validate it reloads configuration')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {}')
    })

    cy.findByRole('button', { name: 'Try again' }).click()

    cy.get('body')
    .should('not.contain.text', cy.i18n.launchpadErrors.generic.configErrorTitle)
  })

  describe('using bundler: "vite" with missing config', () => {
    it('displays informative error about what went wrong and where we looked', () => {
      cy.scaffoldProject('missing-vite-config')
      cy.openProject('missing-vite-config', ['--component'])
      cy.visitLaunchpad()

      ;['vite.config.js', 'vite.config.ts', 'vite.config.mjs', 'vite.config.cjs', 'vite.config.mts', 'vite.config.cts'].forEach((idiomaticConfigFile) => {
        cy.contains(idiomaticConfigFile)
      })

      cy.wait(1000) // ensure the error doesn't get cleared (process.exit)

      cy.contains('You are using vite for your dev server, but a configuration file was not found.')
      cy.contains('Add your vite config at one of the above paths, or import your configuration file and provide it to the devServer config as a viteConfig option.')

      cy.contains('Choose a browser').should('not.exist')

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.config.ts', `
          import { defineConfig } from 'cypress'
          import { defineConfig as viteConfig } from 'vite'
          export default defineConfig({
            component: {
              supportFile: false,
              devServer: {
                framework: 'react',
                bundler: 'vite',
                viteConfig: viteConfig({})
              },
            },
          })
        `)
      })

      cy.contains('Choose a browser').should('not.exist')
    })

    context('has config file in common location', () => {
      it('automatically sources vite.config.js', () => {
        cy.scaffoldProject('react-vite-ts-configured')
        cy.openProject('react-vite-ts-configured', ['--component'])
        cy.visitLaunchpad()

        // should successful start dev server and move to launch screen!
        cy.contains('Choose a browser')
      })
    })
  })

  describe('using bundler: "webpack"', () => {
    context('with missing config', () => {
      it('handles missing webpack.config', () => {
        cy.scaffoldProject('missing-webpack-config')
        cy.openProject('missing-webpack-config', ['--component'])
        cy.visitLaunchpad()

        ;['webpack.config.js', 'webpack.config.ts', 'webpack.config.mjs', 'webpack.config.cjs'].forEach((idiomaticConfigFile) => {
          cy.contains(idiomaticConfigFile)
        })

        cy.wait(1000) // ensure the error doesn't get cleared (process.exit)

        cy.contains('You are using webpack for your dev server, but a configuration file was not found.')
        cy.contains('Add your webpack config at one of the above paths, or import your configuration file and provide it to the devServer config as a webpackConfig option.')
      })
    })

    context('has config file in common location', () => {
      it('automatically sources webpack.config.js', () => {
        cy.scaffoldProject('component-tests')
        cy.openProject('component-tests', ['--component'])
        cy.visitLaunchpad()

        // should successful start dev server and move to launch screen!
        cy.contains('Choose a browser')
      })
    })
  })
})
