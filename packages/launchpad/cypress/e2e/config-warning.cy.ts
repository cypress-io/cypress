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

    cy.get('h1').should('contain', 'Choose a Browser')
    cy.get('[data-cy="alert"]').should('not.exist')
  })

  it('should add baseUrl warning when going from good to bad config', () => {
    cy.scaffoldProject('config-with-js')
    cy.openProject('config-with-js')
    cy.visitLaunchpad()

    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.get('h1').should('contain', 'Choose a Browser')
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
    cy.get('h1').should('contain', 'Choose a Browser')
    cy.get('[data-cy="alert"]').contains('Warning: Cannot Connect Base Url Warning')
  })
})

describe('experimentalStudio', () => {
  it('should show experimentalStudio warning if Cypress detects experimentalStudio config has been set', () => {
    cy.scaffoldProject('experimental-studio')
    cy.openProject('experimental-studio')
    cy.visitLaunchpad()

    cy.get('[data-cy="warning-alert"]').contains('Warning: Experimental Studio Removed')
    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.get('[data-cy="warning-alert"]').contains('Warning: Experimental Studio Removed')
  })

  it('should not continually show experimentalStudio warning in the same project', () => {
    cy.scaffoldProject('experimental-studio')
    cy.openProject('experimental-studio')
    cy.visitLaunchpad()

    cy.get('[data-cy="warning-alert"]').contains('Warning: Experimental Studio Removed')
    cy.findAllByLabelText(cy.i18n.components.modal.dismiss).first().click()
    cy.get('[data-cy="warning-alert"]').should('not.exist')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', await ctx.actions.file.readFileInProject('cypress.config.js'))
    })

    cy.get('[data-cy="loading-spinner"]')
    cy.get('h1').should('contain', 'Welcome to Cypress!')
    cy.get('[data-cy="warning-alert"]').should('not.exist')
  })

  it('should show experimentalStudio warning when opening project and going back', () => {
    cy.scaffoldProject('experimental-studio')
    cy.addProject('experimental-studio')
    cy.openGlobalMode()
    cy.visitLaunchpad()
    cy.contains('experimental-studio').click()
    cy.get('[data-cy="warning-alert"]').contains('Warning: Experimental Studio Removed')
    cy.findAllByLabelText(cy.i18n.components.modal.dismiss).first().click()
    cy.get('[data-cy="warning-alert"]').should('not.exist')
    cy.get('a').contains('Projects').click()
    cy.contains('[data-cy="project-card"]', 'experimental-studio').click()

    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.get('[data-cy="warning-alert"]').contains('Warning: Experimental Studio Removed')
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
    cy.get('a').contains('Projects').click()
    cy.get('[data-cy-testingtype="component"]').click()
    cy.get('[data-cy="warning-alert"]').should('exist')
    .should('contain.text', 'Warning: Component Testing Mismatched Dependencies')
    .should('contain.text', 'vite. Expected ^=2.0.0 || ^=3.0.0, found 2.0.0-beta.70')
    .should('contain.text', 'react. Expected ^=16.0.0 || ^=17.0.0 || ^=18.0.0, found 15.6.2.')
    .should('contain.text', 'react-dom. Expected ^=16.0.0 || ^=17.0.0 || ^=18.0.0 but dependency was not found.')

    cy.get('.warning-markdown').find('li').should('have.length', 3)
  })

  it('warns against outdated @vue/cli dependency', () => {
    cy.scaffoldProject('outdated-deps-vuecli3')
    cy.addProject('outdated-deps-vuecli3')
    cy.openGlobalMode()
    cy.visitLaunchpad()
    cy.contains('outdated-deps-vuecli3').click()
    cy.get('[data-cy="warning-alert"]').should('not.exist')
    cy.get('a').contains('Projects').click()
    cy.get('[data-cy-testingtype="component"]').click()
    cy.get('[data-cy="warning-alert"]').should('exist')
    .should('contain.text', 'Warning: Component Testing Mismatched Dependencies')
    .should('contain.text', '@vue/cli-service. Expected ^=4.0.0 || ^=5.0.0, found 3.12.1.')
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
    cy.get('[data-cy-testingtype="component"]').click()

    // Wait until launch browser screen and assert warning does not exist
    cy.contains('Choose a Browser')
    cy.get('[data-cy="warning-alert"]').should('not.exist')
  })
})
