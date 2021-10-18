import defaultMessages from '../../../../frontend-shared/src/locales/en-US.json'

describe('Launchpad: Open Mode', () => {
  beforeEach(() => {
    cy.setupE2E()
    cy.visitLaunchpad()
  })

  it('Shows the open page', () => {
    cy.get('h1').should('contain', 'Cypress')
  })

  it('allows adding a project', () => {
    cy.withCtx(async (ctx, o) => {
      await ctx.actions.project.setActiveProject(o.projectDir('todos'))
      ctx.emitter.toLaunchpad()
    })

    cy.get('h1').should('contain', defaultMessages.globalPage.empty.title)
    cy.findByText(defaultMessages.globalPage.empty.helper)
  })
})
