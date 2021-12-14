import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import type { Interception } from '@packages/net-stubbing/lib/external-types'
import type { FoundSpec } from '@packages/types/src'

describe('App: Index', () => {
  beforeEach(() => {
    cy.scaffoldProject('non-existent-spec')
    cy.openProject('non-existent-spec')
    cy.withCtx(async (ctx, o) => {
      await ctx.actions.file.removeFileInProject('cypress/integration/spec.js')
    })

    cy.startAppServer()
    cy.visitApp()
  })

  context('with no specs', () => {
    it('shows "Create spec" title', () => {
      // TODO: we need more e2e tests around this, but it requires changes to how we set up config in our
      // gql mock, which would likely conflict with other ongoing changes.
      // In the meantime, the Create Spec vs No Specs Found differences are covered in component tests,
      // we just can't mock config values in GQL yet.
      cy.contains(defaultMessages.createSpec.page.defaultPatternNoSpecs.title).should('be.visible')
    })
  })

  context('scaffold example specs', () => {
    const assertSpecs = (createdSpecs: FoundSpec[]) => cy.wrap(createdSpecs).each((spec: FoundSpec) => cy.contains(spec.baseName).scrollIntoView().should('be.visible'))

    it('should generate example specs', () => {
      let createdSpecs: FoundSpec[]

      cy.visitApp()

      cy.intercept('mutation-ScaffoldGeneratorStepOne_scaffoldIntegration').as('scaffoldIntegration')
      cy.contains(defaultMessages.createSpec.e2e.importFromScaffold.header).click()
      cy.wait('@scaffoldIntegration').then((interception: Interception) => {
        createdSpecs = interception.response?.body.data.scaffoldIntegration.map((res) => res.fileParts)

        expect(createdSpecs).lengthOf.above(0)

        cy.contains(defaultMessages.createSpec.e2e.importFromScaffold.specsAddedHeader).should('be.visible')
        assertSpecs(createdSpecs)
      })

      cy.contains(defaultMessages.createSpec.e2e.importFromScaffold.specsAddedButton).click()

      cy.visitApp().then(() => {
        assertSpecs(createdSpecs)
      })
    })
  })
})
