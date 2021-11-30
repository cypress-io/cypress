import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Index', () => {
  beforeEach(() => {
    cy.setupE2E('component-tests')
    cy.initializeApp()

    cy.withCtx((ctx, { testState }) => {
      testState.newFilePath = 'cypress/integration/new-file-spec.js'

      return ctx.actions.file.removeFileInProject(testState.newFilePath)
    })
  })

  context('with specs', () => {
    it('refreshes spec list on spec changes', () => {
      cy.visitApp()

      cy.withCtx((ctx, { testState }) => {
        const addedSpec = ctx.specStore?.specFiles.find((spec) => spec.absolute.includes(testState.newFilePath))

        expect(addedSpec).be.equal(undefined)
      })

      cy.get('[data-cy="spec-item"]').should('have.length', 1)

      cy.withCtx((ctx, { testState }) => {
        return ctx.actions.file.writeFileInProject(testState.newFilePath, '')
      })

      // ctx.emitter.toApp is not triggering a requery, so we can't test against UI (yet)
      cy.wait(200)
      cy.withCtx((ctx, { testState }) => {
        expect(ctx.specStore?.specFiles).have.length(2)

        const addedSpec = ctx.specStore?.specFiles.find((spec) => spec.absolute.includes(testState.newFilePath))

        expect(addedSpec).not.be.equal(undefined)
      })
    })
  })

  context('with no specs', () => {
    beforeEach(() => {
      cy.visitApp()
      cy.withCtx((ctx, o) => {
        ctx.actions.file.removeFileInProject('cypress/integration/integration-spec.js')
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
  })
})
