const THIRTY_SECONDS = 1000 * 30

describe('baseUrl', () => {
  it('should show baseUrl warning if Cypress cannot connect to provided baseUrl', () => {
    cy.scaffoldProject('config-with-base-url-warning')
    cy.openProject('config-with-base-url-warning')
    cy.visitLaunchpad()

    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.get('[data-cy="alert"]').contains('Warning: Cannot Connect Base Url Warning')

    cy.withCtx((ctx) => {
      sinon.stub(ctx._apis.projectApi, 'isListening').resolves(undefined)
    })

    cy.contains('button', 'Try again').click()
    cy.get('[data-cy="alert"]').should('not.exist')
  })

  it('should clear baseUrl warning if Cypress can connect to provided baseUrl', () => {
    cy.scaffoldProject('config-with-base-url-warning')
    cy.openProject('config-with-base-url-warning')
    cy.visitLaunchpad()

    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.get('[data-cy="alert"]').contains('Warning: Cannot Connect Base Url Warning')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', `
        module.exports = {
          e2e: {
            supportFile: false,
            baseUrl: 'http://localhost:5555',
          },
        }
      `)
    })

    cy.get('h1').should('contain', 'Choose a browser')
    cy.get('[data-cy="alert"]').should('not.exist')
  })

  it('should add baseUrl warning when going from good to bad config', () => {
    cy.scaffoldProject('config-with-js')
    cy.openProject('config-with-js')
    cy.visitLaunchpad()

    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.get('h1').should('contain', 'Choose a browser')
    cy.get('[data-cy="alert"]').should('not.exist')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', `
        module.exports = {
          pageLoadTimeout: 10000,
          e2e: {
            supportFile: false,
            baseUrl: 'http://localhost:9999',
            defaultCommandTimeout: 500,
            videoCompression: 20,
          },
        }
      `)
    })

    cy.get('[data-cy="loading-spinner"]').should('be.visible')
    cy.get('h1').should('contain', 'Choose a browser')
    cy.get('[data-cy="alert"]').contains('Warning: Cannot Connect Base Url Warning')
  })
})

describe('experimentalSingleTabRunMode', () => {
  it('is a valid config for component testing', () => {
    cy.scaffoldProject('experimentalSingleTabRunMode')
    cy.openProject('experimentalSingleTabRunMode', ['--component', '--config-file', 'cypress-component-only.config.js'])

    cy.visitLaunchpad()

    cy.findByTestId('launchpad-Choose a browser')
    cy.get('h1').contains('Choose a browser')
  })

  it('is not a valid config for e2e testing', () => {
    cy.scaffoldProject('experimentalSingleTabRunMode')
    cy.openProject('experimentalSingleTabRunMode')
    cy.visitLaunchpad()
    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.findByTestId('error-header').contains('Cypress configuration error')
    cy.findByTestId('alert-body').contains('The experimentalSingleTabRunMode experiment is currently only supported for Component Testing.')
  })
})

describe('experimentalStudio', () => {
  it('is not a valid config for component testing', () => {
    cy.scaffoldProject('experimentalSingleTabRunMode')
    cy.openProject('experimentalSingleTabRunMode', ['--config-file', 'cypress-invalid-studio-experiment.config.js'])

    cy.visitLaunchpad()
    cy.get('[data-cy-testingtype="component"]').click()
    cy.findByTestId('error-header')
    cy.contains('The experimentalStudio experiment is currently only supported for End to End Testing.')
  })

  it('is a valid config for e2e testing', { defaultCommandTimeout: THIRTY_SECONDS }, () => {
    cy.scaffoldProject('e2e')
    cy.openProject('e2e')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', `
        const { defineConfig } = require('cypress')

        module.exports = defineConfig({
          experimentalStudio: true,
          e2e: {
            experimentalStudio: true
          },
        })
      `)
    })

    cy.visitLaunchpad()
    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.findByTestId('launchpad-Choose a browser')
    cy.get('h1').contains('Choose a browser')
  })
})

describe('experimentalRunAllSpecs', () => {
  it('is a valid config for e2e testing', { defaultCommandTimeout: THIRTY_SECONDS }, () => {
    cy.scaffoldProject('run-all-specs')
    cy.openProject('run-all-specs')

    cy.visitLaunchpad()
    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.findByTestId('launchpad-Choose a browser')
    cy.get('h1').contains('Choose a browser')
  })

  it('is not a valid config for component testing', () => {
    cy.scaffoldProject('run-all-specs')
    cy.openProject('run-all-specs', ['--config-file', 'cypress-invalid-component.config.js'])

    cy.visitLaunchpad()
    cy.get('[data-cy-testingtype="component"]').click()
    cy.findByTestId('error-header')
    cy.contains('The experimentalRunAllSpecs experiment is currently only supported for End to End Testing')
  })

  it('is not valid config when specified at root', { defaultCommandTimeout: THIRTY_SECONDS }, () => {
    cy.scaffoldProject('run-all-specs')
    cy.openProject('run-all-specs', ['--config-file', 'cypress-invalid-root.config.js'])

    cy.visitLaunchpad()
    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.findByTestId('error-header')
    cy.contains('The experimentalRunAllSpecs experiment is currently only supported for End to End Testing')
  })
})

describe('experimentalOriginDependencies', () => {
  it('is a valid config for e2e testing', () => {
    cy.scaffoldProject('session-and-origin-e2e-specs')
    cy.openProject('session-and-origin-e2e-specs')

    cy.visitLaunchpad()
    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.findByTestId('launchpad-Choose a browser')
    cy.get('h1').contains('Choose a browser')
  })

  it('is not a valid config for component testing', () => {
    cy.scaffoldProject('session-and-origin-e2e-specs')
    // TODO: remove config file from session-and-origin-e2e-specs project once the experimental flag is removed
    cy.openProject('session-and-origin-e2e-specs', ['--config-file', 'cypress-invalid-component.config.js'])

    cy.visitLaunchpad()
    cy.get('[data-cy-testingtype="component"]').click()
    cy.findByTestId('error-header')
    cy.contains('The experimentalOriginDependencies experiment is currently only supported for End to End Testing')
  })

  it('is not valid config when specified at root', () => {
    cy.scaffoldProject('session-and-origin-e2e-specs')
    // TODO: remove config file from session-and-origin-e2e-specs project once the experimental flag is removed
    cy.openProject('session-and-origin-e2e-specs', ['--config-file', 'cypress-invalid-root.config.js'])

    cy.visitLaunchpad()
    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.findByTestId('error-header')
    cy.contains('The experimentalOriginDependencies experiment is currently only supported for End to End Testing')
  })
})

describe('component testing dependency warnings', () => {
  it('warns against outdated react and vite version', () => {
    cy.scaffoldProject('component-testing-outdated-dependencies')
    cy.addProject('component-testing-outdated-dependencies')
    cy.openGlobalMode()
    cy.visitLaunchpad()
    cy.contains('component-testing-outdated-dependencies').click()
    cy.get('[data-cy="warning-alert"]').should('not.exist')
    cy.contains('a', 'Projects').click()
    cy.get('[data-cy-testingtype="component"]').click()
    cy.get('[data-cy="warning-alert"]', { timeout: 12000 }).should('exist')
    .should('contain.text', 'Warning: Component Testing Mismatched Dependencies')
    .should('contain.text', 'vite. Expected ^2.0.0 || ^3.0.0 || ^4.0.0 || ^5.0.0, found 2.0.0-beta.70')
    .should('contain.text', 'react. Expected ^16.0.0 || ^17.0.0 || ^18.0.0, found 15.6.2.')
    .should('contain.text', 'react-dom. Expected ^16.0.0 || ^17.0.0 || ^18.0.0 but dependency was not found.')

    cy.get('.warning-markdown').find('li').should('have.length', 3)
  })

  it('warns against outdated @vue/cli dependency', () => {
    cy.scaffoldProject('outdated-deps-vuecli3')
    cy.addProject('outdated-deps-vuecli3')
    cy.openGlobalMode()
    cy.visitLaunchpad()
    cy.contains('outdated-deps-vuecli3').click()
    cy.get('[data-cy="warning-alert"]').should('not.exist')
    cy.contains('a', 'Projects').click()
    cy.get('[data-cy-testingtype="component"]', { timeout: 12000 }).click()
    cy.get('[data-cy="warning-alert"]', { timeout: 12000 }).should('exist')
    .should('contain.text', 'Warning: Component Testing Mismatched Dependencies')
    .should('contain.text', '@vue/cli-service. Expected ^4.0.0 || ^5.0.0, found 3.12.1.')
    .should('contain.text', 'vue. Expected ^3.0.0, found 2.7.8.')

    cy.get('.warning-markdown').find('li').should('have.length', 2)
  })

  it('does not show warning for project with supported dependencies', () => {
    cy.scaffoldProject('vueclivue3-configured')
    cy.addProject('vueclivue3-configured')
    cy.openGlobalMode()
    cy.visitLaunchpad()
    cy.contains('vueclivue3-configured').click()
    cy.get('[data-cy="warning-alert"]').should('not.exist')
    cy.get('a').contains('Projects').click()
    cy.get('[data-cy-testingtype="component"]', { timeout: 10000 }).click()

    // Wait until launch browser screen and assert warning does not exist
    cy.contains('Choose a browser', { timeout: 12000 })
    cy.get('[data-cy="warning-alert"]').should('not.exist')
  })

  it('does not show warning for project that does not require bundler to be installed', () => {
    cy.scaffoldProject('next-14')
    cy.openProject('next-14', ['--component'])
    cy.visitLaunchpad()
    cy.get('[data-cy="warning-alert"]').should('not.exist')
    cy.contains('Choose a browser', { timeout: 12000 })
    cy.get('[data-cy="warning-alert"]').should('not.exist')
  })
})
