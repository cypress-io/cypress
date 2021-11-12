import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Launchpad: Open Mode', () => {
  beforeEach(() => {
    cy.openE2E()
    cy.visitLaunchpad()
    // Forcing reload, need to sync with @brian-mann to debug behavior here
    cy.reload({ log: false })
  })

  it('shows Add Project when no projects have been added', () => {
    cy.get('h1').should('contain', defaultMessages.globalPage.empty.title)
  })

  it('shows Add Project when no projects have been added', () => {
    cy.get('h1').should('contain', defaultMessages.globalPage.empty.title)
  })

  it('shows the projects page when a project is not specified', () => {
    cy.addProject('todos')
    cy.visitLaunchpad()
    cy.contains(defaultMessages.globalPage.recentProjectsHeader)
  })

  it('goes directly to e2e tests when launched with --e2e', () => {
    cy.openE2E('todos')

    cy.withCtx(async (ctx) => {
      // Though the data context is previously initialized,
      // we re-initialize it here so that it reflects the new launchArg
      ctx.launchArgs.testingType = 'e2e'
      await ctx.initializeData()
    })

    cy.withCtx(async (ctx, o) => {
      ctx.emitter.toLaunchpad()
    })

    // e2e testing is configured for the todo project, so we don't expect an error.
    cy.get('h1').should('contain', 'Configuration Files')
  })

  it('goes directly to component tests when launched with --component', () => {
    cy.openE2E('todos')

    cy.withCtx(async (ctx) => {
      // Though the data context is previously initialized,
      // we re-initialize it here so that it reflects the new launchArg
      ctx.launchArgs.testingType = 'component'
      await ctx.initializeData()
    })

    cy.withCtx(async (ctx, o) => {
      ctx.emitter.toLaunchpad()
    })

    // Component testing is not configured for the todo project
    cy.get('h1').should('contain', 'Project Setup')
  })

  it('auto-selects the browser when launched with --browser', () => {
    cy.openE2E('launchpad')

    cy.withCtx(async (ctx) => {
      ctx.launchArgs.testingType = 'e2e'
      ctx.launchArgs.browser = 'firefox'

      await ctx.initializeData()
    })

    // Need to visit after args have been configured, todo: fix in #18776
    cy.visitLaunchpad()

    cy.contains('Continue').click()
    cy.contains('Next Step').click()
    cy.get('h1').should('contain', 'Choose a Browser')
    cy.contains('Firefox').parent().should('have.class', 'border-jade-300')
    cy.get('button[data-testid=launch-button]').invoke('text').should('include', 'Launch Firefox')
  })

  describe('when there is a list of projects', () => {
    it('goes to an active project if one is added', () => {
      cy.openE2E('todos')

      cy.withCtx(async (ctx, o) => {
        ctx.emitter.toLaunchpad()
      })

      cy.get('h1').should('contain', 'Welcome to Cypress!')
    })
  })

  describe('when a user interacts with the header', () => {
    it('the Docs menu opens when clicked', () => {
      cy.openE2E('todos')
      cy.visitLaunchpad()

      cy.contains('Projects').should('be.visible')
      cy.contains('button', 'Docs').click()
      cy.contains(defaultMessages.topNav.docsMenu.gettingStartedTitle).should('be.visible')
    })
  })
})
