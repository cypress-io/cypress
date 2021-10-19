import defaultMessages from '../../../../frontend-shared/src/locales/en-US.json'

describe('Launchpad: Open Mode', () => {
  beforeEach(() => {
    cy.setupE2E()
    cy.visitLaunchpad()
  })

  it('Shows the open page', () => {
    cy.get('h1').should('contain', defaultMessages.globalPage.empty.title)
    cy.contains(defaultMessages.globalPage.empty.helper).should('be.visible')
  })

  it('allows adding a project', () => {
    cy.withCtx(async (ctx, o) => {
      await ctx.actions.project.setActiveProject(o.projectDir('todos'))
      ctx.emitter.toLaunchpad()
    })

    // we should be taken to the Welcome page for the project
    cy.get('h1').should('contain', 'Welcome to Cypress!')
    cy.findByText('Choose which method of testing you would like to get started with for this project.')
  })
})
