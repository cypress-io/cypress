import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Index', () => {
  beforeEach(() => {
    cy.setupE2E('react-project-no-specs')
    cy.initializeApp('component')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('src/Hello.cy.js')
      if (!ctx.currentProject) {
        return
      }

      ctx.currentProject.specs = []
    })

    cy.visitApp()
  })

  it('shows "Create your first spec"', () => {
    cy.visitApp()
    cy.contains('Create your first spec')
  })

  it('creates a spec from a React component', () => {
    cy.visitApp()
    cy.contains('Create from component').click()
    cy.get('[data-testid="file-match-button"]').click()
    cy.get('[data-cy="file-match-input"]').clear().type('**/*.jsx')
    cy.contains('Hello.jsx').click()
    cy.contains('Great! The spec was successfully added')
    cy.get('[aria-label="Close"]').click()
    // TODO: find out why urql is not fetching updates specs automatically
    // Works fine in the live app but not in e2e testing.
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
