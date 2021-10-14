describe('Launchpad: Open Mode', () => {
  beforeEach(() => {
    cy.setupE2E()
    cy.visitLaunchpad()
  })

  it('Shows the open page, with a search bar', () => {
    cy.get('h1').should('contain', 'Cypress')
    cy.get('[type=search]')
  })

  it('allows adding a project', () => {
    cy.withCtx((ctx, o) => {
      ctx.actions.project.setActiveProject(o.projectDir('todos'))
      ctx.emitter.toLaunchpad()
    })

    cy.get('h1').should('contain', 'Welcome')
  })
})
