describe('Config files error handling', () => {
  beforeEach(() => {
    cy.setupE2E('pristine-with-config-file')
  })

  it('it handles multiples config files', () => {
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.ts', 'export default {}')
    })

    cy.visitLaunchpad()

    cy.get('[data-cy-testingType=e2e]').click()

    cy.contains('h1', 'Configuration Files').should('be.visible')

    cy.get('button').contains('Continue').click()
    cy.get('body')
    .should('contain.text', 'Cypress Configuration Error')
    .and('contain.text', 'There is both a `cypress.config.js` and a `cypress.config.ts` at the location below')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress.config.ts')
    })

    cy.get('[data-testid=error-retry-button]').click()
    cy.get('body')
    .should('not.contain.text', 'Cypress Configuration Error')
  })

  it('it handles legacy config file', () => {
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.json', '{}')
      await ctx.actions.file.removeFileInProject('cypress.config.js')
    })

    cy.visitLaunchpad()

    cy.get('[data-cy-testingType=e2e]').click()

    cy.get('body').should('contain.text', 'Configuration Files')

    cy.get('button').contains('Continue').click()

    cy.get('body')
    .should('contain.text', 'Cypress Configuration Error')
    .and('contain.text', 'There is a cypress.json file at the location below:')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress.json')
    })

    cy.get('[data-testid=error-retry-button]').click()
    cy.get('body')
    .should('contain.text', 'Cypress Configuration Error')
    .and('contain.text', 'Could not find a Cypress configuration file, exiting.')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {}')
    })

    cy.get('[data-testid=error-retry-button]').click()
    cy.get('body')
    .should('not.contain.text', 'Cypress Configuration Error')
  })

  it('it handles config files with legacy config file in same project', () => {
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.json', '{}')
    })

    cy.visitLaunchpad()

    cy.get('[data-cy-testingType=e2e]').click()

    cy.get('body').should('contain.text', 'Configuration Files')

    cy.get('button').contains('Continue').click()

    cy.get('body')
    .should('contain.text', 'Cypress Configuration Error')
    .and('contain.text', 'There is both a `cypress.config.js` and a cypress.json file at the location below')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress.json')
    })

    cy.get('[data-testid=error-retry-button]').click()
    cy.get('body')
    .should('not.contain.text', 'Cypress Configuration Error')
  })
})
