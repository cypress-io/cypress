import defaultMessages from '../../../../frontend-shared/src/locales/en-US.json'

describe('Launchpad: Open Mode', () => {
  beforeEach(() => {
    cy.setupE2E()
    cy.visitLaunchpad()
  })

  it('shows the open page when testingType is not specified', () => {
    cy.get('h1').should('contain', defaultMessages.globalPage.empty.title)
  })

  it('goes directly to e2e tests when launched with --e2e', () => {
    cy.withCtx(async (ctx) => {
      // Though the data context is previously initialized,
      // we re-initialize it here so that it reflects the new launchArg
      ctx.launchArgs.testingType = 'e2e'
      await ctx.initializeData()
    })

    cy.withCtx(async (ctx, o) => {
      await ctx.actions.project.setActiveProject(o.projectDir('todos'))
      ctx.emitter.toLaunchpad()
    })

    // e2e testing is configured for the todo project, so we don't expect an error.
    cy.get('h1').should('contain', 'Initializing Config...')
  })

  it('goes directly to component tests when launched with --component', () => {
    cy.withCtx(async (ctx) => {
      // Though the data context is previously initialized,
      // we re-initialize it here so that it reflects the new launchArg
      ctx.launchArgs.testingType = 'component'
      await ctx.initializeData()
    })

    cy.withCtx(async (ctx, o) => {
      await ctx.actions.project.setActiveProject(o.projectDir('todos'))
      ctx.emitter.toLaunchpad()
    })

    // Component testing is not configured for the todo project
    cy.get('h1').should('contain', 'Cypress Configuration Error')
  })

  describe('when there is a list of projects', () => {
    it('goes to an active project if one is added', () => {
      cy.withCtx(async (ctx, o) => {
        await ctx.actions.project.setActiveProject(o.projectDir('todos'))
        ctx.emitter.toLaunchpad()
      })

      cy.get('h1').should('contain', 'Welcome to Cypress!')
    })
  })

  describe('when a user interacts with the header', () => {
    it('the Docs menu opens when clicked', () => {
      cy.contains('Projects').should('be.visible')
      cy.contains('button', 'Docs').click()
      cy.contains(defaultMessages.topNav.docsMenu.gettingStartedTitle).should('be.visible')
    })
  })
})
