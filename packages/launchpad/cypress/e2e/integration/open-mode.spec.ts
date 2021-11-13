import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Launchpad: Open Mode', () => {
  describe('global mode', () => {
    it('shows Add Project when no projects have been added', () => {
      cy.openMode()
      cy.visitLaunchpad()
      cy.get('h1').should('contain', defaultMessages.globalPage.empty.title)
    })

    it('shows the projects page when a project is not specified', () => {
      cy.addProject('todos')
      cy.openMode()
      cy.visitLaunchpad()
      cy.contains(defaultMessages.globalPage.recentProjectsHeader)
    })
  })

  it('goes directly to e2e tests when launched with --e2e', () => {
    cy.openModeSystemTest('todos', ['--e2e'])
    cy.visitLaunchpad()

    // e2e testing is configured for the todo project, so we don't expect an error.
    cy.get('h1').should('contain', 'Configuration Files')
  })

  it('goes directly to component tests when launched with --component', () => {
    cy.openModeSystemTest('todos', ['--component'])
    cy.visitLaunchpad()

    // Component testing is not configured for the todo project
    cy.get('h1').should('contain', 'Project Setup')
  })

  it('auto-selects the browser when launched with --browser', () => {
    cy.openModeSystemTest('launchpad', ['--e2e', '--browser', 'firefox'])

    // Need to visit after args have been configured, todo: fix in #18776
    cy.visitLaunchpad()

    cy.get('h1').should('contain', 'Choose a Browser')
    cy.contains('Firefox').parent().should('have.class', 'border-jade-300')
    cy.get('button[data-testid=launch-button]').invoke('text').should('include', 'Launch Firefox')
  })

  describe('when there is a list of projects', () => {
    it('goes to an active project if one is added', () => {
      cy.openMode()
      cy.visitLaunchpad()
      cy.get('h1').should('contain', 'Add Project')
      cy.addProject('todos', true)

      cy.get('h1').should('contain', 'Welcome to Cypress!')
    })
  })

  describe('when a user interacts with the header', () => {
    it('the Docs menu opens when clicked', () => {
      cy.openModeSystemTest('todos')
      cy.visitLaunchpad()

      cy.contains('Projects').should('be.visible')
      cy.contains('button', 'Docs').click()
      cy.contains(defaultMessages.topNav.docsMenu.gettingStartedTitle).should('be.visible')
    })
  })
})
