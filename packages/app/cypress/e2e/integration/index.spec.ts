import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Index', () => {
  beforeEach(() => {
    cy.setupE2E('component-tests')
    cy.initializeApp()
  })

  context('with no specs', () => {
    beforeEach(() => {
      cy.visitApp()
      cy.withCtx((ctx, o) => {
        ctx.actions.file.removeFileInProject('cypress/integration/integration-spec.js')
      })
    })

    it('shows "Create your first spec" title', () => {
    // after removing the default scaffolded spec, we should be prompted to create a first spec
      cy.visitApp()
      cy.contains(defaultMessages.createSpec.page.title).should('be.visible')
    })
  })
})
