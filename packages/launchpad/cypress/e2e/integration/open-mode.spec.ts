import defaultMessages from '../../../../frontend-shared/src/locales/en-US.json'

describe('Launchpad: Open Mode', () => {
  it('Shows the open page', () => {
    cy.setupE2E()
    cy.visitLaunchpad()
    cy.get('h1').should('contain', defaultMessages.globalPage.empty.title)
  })

  it('allows adding a project', () => {
    cy.withCtx(async (ctx, o) => {
      await ctx.actions.project.setActiveProject(o.projectDir('todos'))
      ctx.emitter.toLaunchpad()
    })

    // we should be taken to the Welcome page for the project
    // checkWelcomePage()
  })

  it('shows a list of projects', () => {
    setUpWithProjects()

    cy.wait(5000)
    cy.contains('component-tests').click()

    checkWelcomePage()

    cy.contains('[data-testid=header-bar]', 'component-tests')
  })

  it('the file dropzone appears and works correctly', () => {
    setUpWithProjects()
    cy.visitLaunchpad()

    cy.contains('button', 'Add Project').click()
    cy.contains('button', 'browse manually').should('be.visible')

    cy.get('[data-testid=dropzone]').within(() => {
      cy.findByLabelText('Close', { selector: 'button' }).click()
      cy.contains('button', 'browse manually').should('not.exist')
    })
  })

  function checkWelcomePage () {
    cy.get('h1').should('contain', 'Welcome to Cypress!')
    cy.findByText('Choose which method of testing you would like to get started with for this project.')
  }

  function setUpWithProjects () {
    cy.setupE2E()
    cy.visitLaunchpad()
    cy.withCtx((ctx) => {
      ctx.coreData.app.projects = [
        { projectRoot: 'packages/server/test/support/fixtures/projects/component-tests' },
      ]

      ctx.emitter.toLaunchpad()
    })
  }
})
