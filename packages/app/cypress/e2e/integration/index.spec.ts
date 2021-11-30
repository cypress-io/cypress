import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Index', () => {
  beforeEach(() => {
    cy.setupE2E('component-tests')
    cy.initializeApp()
  })

  context('with no specs', () => {
    beforeEach(() => {
      cy.visitApp()
    })

    it('shows "Create your first spec" title if default specPattern is present in config', () => {
      cy.withCtx((ctx, o) => {
        ctx.actions.file.removeFileInProject('cypress/integration/integration-spec.js')
        ctx.currentProject?.config
      })

      cy.contains(defaultMessages.createSpec.page.defaultPatternNoSpecs.title).should('be.visible')
    })

    it('shows "No specs found" title if custom specPattern is present in config', () => {
      cy.withCtx((ctx, o) => {
        ctx.actions.file.removeFileInProject('cypress/integration/integration-spec.js')
      })

      cy.contains(defaultMessages.createSpec.page.customPatternNoSpecs.title).should('be.visible')
    })
  })
})
