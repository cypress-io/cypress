describe('baseUrl', () => {
  it('should show baseUrl warning if Cypress cannot connect to provided baseUrl', () => {
    cy.scaffoldProject('config-with-base-url-warning')
    cy.openProject('config-with-base-url-warning')
    cy.visitLaunchpad()

    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.get('[data-cy="alert"]').contains('Warning: Cannot Connect Base Url Warning')

    cy.withCtx((ctx) => {
      ctx._apis.projectApi.isListening = sinon.stub().resolves(null)
    })

    cy.contains('button', 'Retry').click()
    cy.get('[data-cy="alert"]').should('not.exist')
  })

  it('should clear baseUrl warning if Cypress can connect to provided baseUrl', () => {
    cy.scaffoldProject('config-with-base-url-warning')
    cy.openProject('config-with-base-url-warning')
    cy.visitLaunchpad()

    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.get('[data-cy="alert"]').contains('Warning: Cannot Connect Base Url Warning')

    cy.withCtx((ctx) => {
      ctx.actions.file.writeFileInProject('cypress.config.js', `
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

    cy.withCtx((ctx) => {
      ctx.actions.file.writeFileInProject('cypress.config.js', `
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
})
