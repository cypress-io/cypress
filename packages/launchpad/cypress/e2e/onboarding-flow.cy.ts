describe('Launchpad: Onboarding Flow', () => {
  beforeEach(() => {
    cy.scaffoldProject('pristine')
    cy.openProject('pristine')
  })

  it('can setup component testing', () => {
    cy.visitLaunchpad()
    cy.get('[data-cy-testingType=component]').click()
    cy.get('[data-testid=select-framework]').click()
    cy.findByText('Vue.js').click()
    cy.get('[data-testid=select-framework]').should('contain', 'Vue.js')
    cy.get('[data-testid=select-bundler]')
    .findByText(cy.i18n.setupPage.projectSetup.bundlerPlaceholder)
    .click()

    cy.findByText('Webpack').click()
    cy.get('[data-testid=select-bundler]').should('contain', 'Webpack')
    cy.reload()
    cy.get('[data-testid=select-framework]').should('contain', 'Vue.js')
    cy.get('[data-testid=select-bundler]').should('contain', 'Webpack')
    cy.findByText('Next Step').click()
    cy.get('h1').should('contain', 'Dependencies')
    cy.findByText('I\'ve installed them').click()
    cy.findByText('We added the following files to your project.')
    cy.findByText('Continue').click()
    cy.findByText('Choose a Browser', { timeout: 10000 })
  })

  it('can setup e2e testing', () => {
    cy.visitLaunchpad()
    cy.get('[data-cy-testingType=e2e]').click()
    cy.findByText('We added the following files to your project.')
    cy.findByText('Continue').click()
    cy.findByText('Choose a Browser')
  })

  it('can setup e2e testing after component has been setup', () => {
    cy.visitLaunchpad()
    cy.get('[data-cy-testingType=component]').click()
    cy.get('[data-testid=select-framework]').click()
    cy.findByText('Vue.js').click()
    cy.get('[data-testid=select-framework]').should('contain', 'Vue.js')
    cy.get('[data-testid=select-bundler]')
    .findByText(cy.i18n.setupPage.projectSetup.bundlerPlaceholder)
    .click()

    cy.findByText('Webpack').click()
    cy.get('[data-testid=select-bundler]').should('contain', 'Webpack')
    cy.reload()
    cy.get('[data-testid=select-framework]').should('contain', 'Vue.js')
    cy.get('[data-testid=select-bundler]').should('contain', 'Webpack')
    cy.findByText('Next Step').click()
    cy.get('h1').should('contain', 'Dependencies')
    cy.findByText('I\'ve installed them').click()
    cy.findByText('We added the following files to your project.')
    cy.findByText('Continue').click()
    cy.findByText('Choose a Browser', { timeout: 10000 })

    cy.findByText('Back').click()

    cy.visitLaunchpad()
    cy.get('[data-cy-testingType=e2e]').click()
    cy.findByText('We added the following files to your project.')
    cy.get('[data-e2e="changes"]')
    cy.findByText('Continue').closest('button').should('be.disabled')

    cy.withCtx((ctx, o) => {
      const tmpl = `
        const { defineConfig } = require("cypress")
        module.exports = defineConfig({
          component: {
            supportFile: 'cypress/support/component.js',
            devServer: require('@cypress/webpack-dev-server'),
            devServerConfig: {}
          },
          e2e: {
            supportFile: 'cypress/support/e2e.js',
            specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
            viewportHeight: 660,
            viewportWidth: 1000,
            setupNodeEvents(on, config) {
              //
            },
          }
        })
      `

      ctx.actions.file.writeFileInProject('cypress.config.js', tmpl)
    })

    cy.findByText('Continue').closest('button').should('not.be.disabled').click()
    cy.findByText('Choose a Browser', { timeout: 10000 })
  })
})
