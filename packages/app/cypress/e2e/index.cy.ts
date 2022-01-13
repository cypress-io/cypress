import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import type { Interception } from '@packages/net-stubbing/lib/external-types'
import type { FoundSpec } from '@packages/types/src'

describe('App: Index', () => {
  beforeEach(() => {
    cy.scaffoldProject('non-existent-spec')
    cy.openProject('non-existent-spec')
    cy.withCtx(async (ctx, { testState }) => {
      testState.newFilePath = 'cypress/e2e/new-file.cy.js'

      await ctx.actions.file.removeFileInProject(testState.newFilePath)
    })

    cy.startAppServer()
  })

  context('with no specs', () => {
    it('shows "Create spec" title', () => {
      cy.visitApp()

      // TODO: we need more e2e tests around this, but it requires changes to how we set up config in our
      // gql mock, which would likely conflict with other ongoing changes.
      // In the meantime, the Create Spec vs No Specs Found differences are covered in component tests,
      // we just can't mock config values in GQL yet.
      cy.contains(defaultMessages.createSpec.page.defaultPatternNoSpecs.title).should('be.visible')
    })

    it('routes to settings spec-pattern section', () => {
      cy.visitApp()

      cy.contains(defaultMessages.createSpec.viewSpecPatternButton).scrollIntoView().click()
      cy.get('[data-cy="Project Settings"]').within(() => {
        cy.get('[data-cy="collapsible-header"]').should('have.attr', 'aria-expanded', 'true')
        cy.contains(defaultMessages.settingsPage.specPattern.title).should('be.visible')
      })
    })

    it('shows "No Specs Found" when not using default spec pattern', () => {
      const customSpecPattern = 'cypress/**/*.cy.ts'

      cy.intercept('query-SpecsPageContainer', (req) => {
        req.on('before:response', (res) => {
          res.body.data.currentProject.isDefaultSpecPattern = false
          res.body.data.currentProject.config = res.body.data.currentProject.config.map((x) => {
            if (x.field === 'e2e') {
              return { ...x, value: { ...x.value, specPattern: customSpecPattern } }
            }

            return x
          })
        })
      })

      cy.visitApp()

      cy.contains('h1', defaultMessages.createSpec.page.customPatternNoSpecs.title)

      cy.contains('code', 'specPattern')

      cy.contains('code', customSpecPattern)
    })
  })

  context('with specs', () => {
    it('refreshes spec list on spec changes', () => {
      cy.visitApp()

      cy.get('[data-testid="create-spec-page-title"]').should('be.visible')

      cy.withCtx(async (ctx, { testState }) => {
        await ctx.actions.file.writeFileInProject(testState.newFilePath, '')
      })

      cy.wait(1000)
      cy.withCtx(async (ctx, { testState }) => {
        expect(ctx.project.specs).have.length(1)

        const addedSpec = ctx.project.specs.find((spec) => spec.absolute.includes(testState.newFilePath))

        expect(addedSpec).not.be.equal(undefined)
      })

      // Hack due to ctx.emitter.toApp() not triggering a refresh in e2e test
      // TODO: Figure out why emitter doesn't work in e2e tests
      cy.visitApp()
      cy.findByTestId('spec-item').should('contain', 'new-file')
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
        createdSpecs = interception.response?.body.data.scaffoldIntegration.map((res) => res.file)

        expect(createdSpecs).lengthOf.above(0)

        cy.contains(defaultMessages.createSpec.e2e.importFromScaffold.specsAddedHeader).should('be.visible')
        assertSpecs(createdSpecs)
      })

      cy.contains(defaultMessages.createSpec.e2e.importFromScaffold.specsAddedButton).click()

      cy.visitApp().then(() => assertSpecs(createdSpecs))
    })
  })
})
