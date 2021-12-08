import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import type { Interception } from '@packages/net-stubbing/lib/external-types'
import type { FoundSpec } from '@packages/types/src'

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
        ctx.actions.file.removeFileInProject('cypress/integration/1-getting-started')
        ctx.actions.file.removeFileInProject('cypress/integration/2-advanced-examples')
      })
    })

    it('shows "Create spec" title', () => {
      // TODO: we need more e2e tests around this, but it requires changes to how we set up config in our
      // gql mock, which would likely conflict with other ongoing changes.
      // In the meantime, the Create Spec vs No Specs Found differences are covered in component tests,
      // we just can't mock config values in GQL yet.
      cy.visitApp()
      cy.contains(defaultMessages.createSpec.page.defaultPatternNoSpecs.title).should('be.visible')
    })

    it('routes to settings spec-pattern section', () => {
      cy.contains(defaultMessages.createSpec.viewSpecPatternButton).scrollIntoView().click()
      cy.get('[data-cy="Project Settings"]').within(() => {
        cy.get('[data-cy="collapsible-header"]').should('have.attr', 'aria-expanded', 'true')
        cy.contains(defaultMessages.settingsPage.specPattern.title).should('be.visible')
      })
    })
  })

  context('scaffold example specs', () => {
    let createdSpecs: FoundSpec[]

    beforeEach(() => {
      cy.visitApp()
      cy.withCtx((ctx) => {
        ctx.actions.file.removeFileInProject('cypress/integration/integration-spec.js')
      })
    })

    const assertSpecs = () => cy.wrap(createdSpecs).each((spec: FoundSpec) => cy.contains(spec.baseName).scrollIntoView().should('be.visible'))

    it('should generate example specs', () => {
      cy.visitApp()

      cy.withCtx((ctx) => {
        ['cypress/integration/1-getting-started', 'cypress/integration/2-advanced-examples'].forEach((file) => ctx.actions.file.removeFileInProject(file))
      })

      cy.intercept('mutation-ScaffoldGeneratorStepOne_scaffoldIntegration').as('scaffoldIntegration')
      cy.contains(defaultMessages.createSpec.e2e.importFromScaffold.header).click()
      cy.wait('@scaffoldIntegration').then((interception: Interception) => {
        createdSpecs = interception.response?.body.data.scaffoldIntegration.map((res) => res.fileParts)

        expect(createdSpecs).lengthOf.above(0)

        cy.contains(defaultMessages.createSpec.e2e.importFromScaffold.specsAddedHeader).should('be.visible')
        assertSpecs()
      })

      cy.contains(defaultMessages.createSpec.e2e.importFromScaffold.specsAddedButton).click()
    })

    // TODO(ZachW): Move test to test above once live spec refresh and e2e requery bug is fixed
    it('should show generated example specs', () => {
      cy.visitApp()

      assertSpecs()
    })
  })
})
