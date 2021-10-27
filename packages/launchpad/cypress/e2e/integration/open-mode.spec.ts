import defaultMessages from '../../../../frontend-shared/src/locales/en-US.json'

describe('Launchpad: Open Mode', () => {
  beforeEach(() => {
    cy.setupE2E()
    cy.visitLaunchpad()
  })

  it('Shows the open page', () => {
    cy.get('h1').should('contain', defaultMessages.globalPage.empty.title)
  })

  it('auto-selects the browser when launched with --browser', () => {
    cy.withCtx(async (ctx) => {
      ctx.launchArgs.testingType = 'e2e'
      ctx.launchArgs.browser = 'firefox'
      await ctx.initializeData()
    })

    cy.withCtx(async (ctx, o) => {
      await ctx.actions.project.setActiveProject(o.projectDir('todos'))
      ctx.emitter.toLaunchpad()
    })

    cy.contains('Next Step').click()
    cy.get('h1').should('contain', 'Choose a Browser')
    cy.contains('Firefox').parent().should('have.class', 'border-jade-300')
    cy.get('button[data-testid=launch-button]').invoke('text').should('include', 'Launch Firefox')
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
})
