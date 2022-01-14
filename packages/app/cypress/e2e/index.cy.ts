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

    it('routes to settings spec-pattern section', () => {
      cy.contains(defaultMessages.createSpec.viewSpecPatternButton).scrollIntoView().click()
      cy.get('[data-cy="Project Settings"]').within(() => {
        cy.get('[data-cy="collapsible-header"]').should('have.attr', 'aria-expanded', 'true')
        cy.contains(defaultMessages.settingsPage.specPattern.title).should('be.visible')
      })
    })
  })

  context('with specs', () => {
    it('refreshes spec list on spec changes', () => {
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

  context('scaffold empty spec', () => {
    it('should generate empty spec', () => {
      cy.visitApp()

      const openEmptySpecModal = () => {
        cy.contains('h2', defaultMessages.createSpec.e2e.importEmptySpec.header).click()
        cy.get('[data-cy="create-spec-modal"]').within(() => {
          cy.contains('h2', defaultMessages.createSpec.e2e.importEmptySpec.header)
        })
      }

      // Verify the modal can be closed
      openEmptySpecModal()
      cy.get('body').click(0, 0)
      cy.get('[data-cy="create-spec-modal"]').should('not.exist')
      openEmptySpecModal()
      cy.get('[aria-label="Close"]').click()
      cy.get('[data-cy="create-spec-modal"]').should('not.exist')
      openEmptySpecModal()
      cy.contains('button', defaultMessages.components.button.cancel).click()
      cy.get('[data-cy="create-spec-modal"]').within(() => {
        cy.get('[data-cy="card"]').contains(defaultMessages.createSpec.e2e.importEmptySpec.header).click()
      })

      // Shows entered file does not match spec pattern
      cy.get('input').type('cypress/e2e/no-match')
      cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.invalidSpecWarning)
      cy.contains('button', defaultMessages.createSpec.createSpec).should('be.disabled')

      //Shows extension warning
      cy.get('input').clear().type('cypress/e2e/MyTest.spec.j')
      cy.intercept('mutation-EmptyGeneratorCardStepOne_MatchSpecFile', (req) => {
        if (req.body.variables.specFile === 'cypress/e2e/MyTest.spec.jx') {
          req.on('before:response', (res) => {
            res.body.data.matchesSpecPattern = true
          })
        }
      })

      cy.get('input').type('x')
      cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.specExtensionWarning)
      cy.contains('span', '{filename}.cy.jx')

      // Create spec
      cy.get('input').clear().type('cypress/e2e/MyTest.cy.js')
      cy.contains('button', defaultMessages.createSpec.createSpec).should('not.be.disabled').click()
      cy.contains('h2', defaultMessages.createSpec.successPage.header)
      cy.get('[data-cy="file-row"]').contains('cypress/e2e/MyTest.cy.js').click()
      cy.contains('code', 'describe(\'MyTest.cy.js\'')
      cy.get('[aria-label="Close"]').click()

      cy.visitApp().get('[data-testid="specs-list-row"]').contains('MyTest.cy.js')
    })
  })
})
