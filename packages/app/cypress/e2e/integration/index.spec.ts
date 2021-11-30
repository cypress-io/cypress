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

    it('shows "No specs found" title', () => {
      // TODO: we need more e2e tests around this, but it requires changes to how we set up config in our
      // gql mock, which would likely conflict with other ongoing changes.
      // In the meantime, the Create Spec vs No Specs Found differences are covered in component tests,
      // we just can't mock config values in GQL yet.
      cy.visitApp()
      cy.contains(defaultMessages.createSpec.page.customPatternNoSpecs.title).should('be.visible')
    })
  })
})
