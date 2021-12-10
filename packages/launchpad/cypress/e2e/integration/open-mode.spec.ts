import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Launchpad: Open Mode', () => {
  describe('global mode', () => {
    beforeEach(() => {
      cy.openGlobalMode()
      cy.visitLaunchpad()
    })

    it('shows Add Project when no projects have been added', () => {
      cy.get('h1').should('contain', defaultMessages.globalPage.empty.title)
    })

    it('shows the projects page when a project is not specified', () => {
      cy.addProject('todos')
      cy.visitLaunchpad()
      cy.contains(defaultMessages.globalPage.recentProjectsHeader)
    })
  })

  it('goes directly to e2e tests when launched with --e2e', () => {
    cy.scaffoldProject('todos')
    cy.openProject('todos', ['--e2e'])
    cy.visitLaunchpad()

    cy.withCtx(async (ctx, o) => {
      ctx.emitter.toLaunchpad()
    })

    // e2e testing is configured for the todo project, so we don't expect an error.
    cy.get('h1').should('contain', 'Configuration Files')
  })

  it('goes directly to component tests when launched with --component', () => {
    cy.scaffoldProject('launchpad')
    cy.openProject('launchpad', ['--component'])
    cy.visitLaunchpad()

    cy.withCtx(async (ctx, o) => {
      ctx.emitter.toLaunchpad()
    })

    // Component testing is not configured for the todo project
    cy.get('h1').should('contain', 'Project Setup')
  })

  it('auto-selects the browser when launched with --browser', () => {
    cy.scaffoldProject('launchpad')
    cy.openProject('launchpad', ['--browser', 'firefox', '--e2e'])
    cy.visitLaunchpad()

    // Need to visit after args have been configured, todo: fix in #18776
    // cy.visitLaunchpad()

    cy.contains('Continue').click()
    cy.contains('Next Step').click()
    cy.get('h1').should('contain', 'Choose a Browser')
    cy.contains('Firefox').parent().should('have.class', 'border-jade-300')
    cy.get('button[data-testid=launch-button]').invoke('text').should('include', 'Launch Firefox')
  })

  describe('when there is a list of projects', () => {
    it('goes to an active project if one is added', () => {
      cy.openProject('todos')
      cy.visitLaunchpad()

      cy.withCtx(async (ctx, o) => {
        ctx.emitter.toLaunchpad()
      })

      cy.get('h1').should('contain', 'Welcome to Cypress!')
    })
  })

  describe('when a user interacts with the header', () => {
    it('the Docs menu opens when clicked', () => {
      cy.openProject('todos')
      cy.visitLaunchpad()

      cy.contains('Projects').should('be.visible')
      cy.contains('button', 'Docs').click()
      cy.contains(defaultMessages.topNav.docsMenu.gettingStartedTitle).should('be.visible')
    })
  })

  describe('open in ide', () => {
    it('configures an editor if one is not configured', () => {
      cy.openProject('todos')
      cy.withCtx(async (ctx, o) => {
        ctx.coreData.localSettings.preferences.preferredEditorBinary = undefined
        ctx.coreData.localSettings.availableEditors = [
          // don't rely on CI machines to have specific editors installed
          // so just adding one here
          {
            id: 'well-known-editor',
            binary: '/usr/bin/well-known',
            name: 'Well known editor',
          },
        ]

        ctx.coreData.app.projects = [{ projectRoot: '/some/project' }]
      })

      cy.visitLaunchpad()
      cy.get('a').contains('Projects').click()
      cy.findByTestId('project-card')
      cy.get('[aria-label="Project Actions"]').click()
      cy.get('button').contains('Open In IDE').click()

      cy.get('[data-cy="choose-editor-modal"]').as('modal')

      cy.intercept('POST', 'mutation-ChooseExternalEditorModal_SetPreferredEditorBinary').as('SetPreferred')
      cy.get('@modal').contains('Choose your editor...').click()
      cy.get('@modal').contains('Well known editor').click()
      cy.get('@modal').contains('Done').click()
      cy.wait('@SetPreferred').its('request.body.variables.value').should('include', '/usr/bin/well-known')
    })

    it('opens using finder', () => {
      cy.openProject('todos')
      cy.withCtx(async (ctx, o) => {
        ctx.coreData.app.projects = [{ projectRoot: '/some/project' }]
      })

      cy.visitLaunchpad()
      cy.get('a').contains('Projects').click()
      cy.findByTestId('project-card')
      cy.get('[aria-label="Project Actions"]').click()

      cy.intercept('POST', 'mutation-GlobalPage_OpenInFinder').as('OpenInFinder')
      cy.get('button').contains('Open In Finder').click()

      cy.wait('@OpenInFinder')
    })
  })
})
