import { HeaderBar_HeaderBarContentFragmentDoc } from '../generated/graphql-test'
import HeaderBarContent from './HeaderBarContent.vue'
import { defaultMessages } from '@cy/i18n'

const text = defaultMessages.topNav

describe('<HeaderBarContent />', { viewportWidth: 1000, viewportHeight: 750 }, () => {
  it('renders with functional browser menu when show-browsers prop is true', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      onResult: (result, ctx) => {
        result.app.activeProject = null
      },
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBarContent gql={gqlVal} show-browsers={true} /></div>,
    })

    cy.get('[data-cy="topnav-browser-list"]')
    .should('be.visible')
    .click()

    cy.contains('Edge Canary')
    .should('be.visible')
  }),

  it('renders without browser menu by default and other items work', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBarContent gql={gqlVal} /></div>,
    })

    cy.contains('Projects').should('be.visible')
    cy.get('[data-cy="topnav-browser-list"]').should('not.exist')
    cy.contains('button', text.docsMenu.docsHeading).click()
    cy.contains('a', text.docsMenu.firstTest).should('be.visible')
    cy.get('[data-cy="topnav-version-list"]').click()
    cy.contains('a', text.docsMenu.firstTest).should('not.exist')
    cy.contains('a', text.seeAllReleases).should('be.visible')
  })

  it('displays the active project name', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBarContent gql={gqlVal} /></div>,
    })

    cy.contains('test-project').should('be.visible')
  })

  it('the login modal reaches "opening browser" status', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBarContent gql={gqlVal} /></div>,
    })

    cy.findByRole('button', { name: text.login.actionLogin })
    .click()

    cy.contains('h2', text.login.titleInitial).should('be.visible')

    cy.findByRole('button', { name: text.login.actionLogin })
    .should('be.visible')
    .and('have.focus')

    cy.findByRole('button', { name: defaultMessages.actions.close }).click()

    cy.contains('h2', text.login.titleInitial).should('not.exist')
  })

  it('the logged in state is correctly presented in header', () => {
    const cloudViewer = {
      id: '1',
      email: 'test@test.test',
      fullName: 'Tester Test',
    }

    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      onResult: (result) => {
        result.__typename = 'Query'
        result.app.isAuthBrowserOpened = true
        result.cloudViewer = cloudViewer
        result.cloudViewer.__typename = 'CloudUser'
      },
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBarContent gql={gqlVal} /></div>,
    })

    cy.findByRole('button', { name: text.login.actionLogin }).click()
    cy.contains(cloudViewer.fullName).should('be.visible')
    cy.contains(cloudViewer.email).should('be.visible')
    cy.findByRole('button', { name: text.login.actionLogout }).should('be.visible')
  })

  it('Shows a page name instead of project when a page name is provided', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBarContent gql={gqlVal} pageName="Test Page" /></div>,
    })

    cy.contains('Project').should('not.exist')
    cy.contains('Test Page').should('be.visible')
  })

  describe('prompts', function () {
    describe('the CI prompt', function () {
      context('opens on click', function () {
        beforeEach(function () {
          cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
            render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBarContent gql={gqlVal} show-browsers={true} /></div>,
          })

          cy.contains('Docs').click()
          cy.contains('Set up CI').click()
        })

        it('opens on menu item click', function () {
          cy.contains(defaultMessages.topNav.docsMenu.prompts.ci.description).should('be.visible')
        })

        it('is dismissible from X icon', function () {
          cy.findAllByLabelText('Close').click()
          cy.contains(defaultMessages.topNav.docsMenu.prompts.ci.description).should('not.exist')
        })
      })

      context('opens automatically', function () {
        beforeEach(function () {
          cy.clock(1609891200000)
        })

        it('opens when after 4 days from first open, no projectId, and not already shown', function () {
          cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
            onResult: (result, ctx) => {
              result.app.activeProject.savedState = {
                firstOpened: 1609459200000,
                lastOpened: 1609459200000,
                promptsShown: { },
              }
            },
            render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBarContent gql={gqlVal} show-browsers={true} /></div>,
          })

          cy.contains(defaultMessages.topNav.docsMenu.prompts.ci.description).should('be.visible')
        })

        it('sends correct utm_content when opened', function () {
          this.openProject.resolve({
            ...this.config,
            projectId: null,
            state: {
              ...this.config.state,
              promptsShown: {},
            },
          })

          cy.get('.see-other-guides').click()
          cy.wrap(this.ipc.externalOpen).should('have.been.calledWithMatch', {
            url: 'https://on.cypress.io/setup-ci',
            params: {
              utm_content: 'Automatic',
            },
          })

          cy.get('.prompt-ci1').contains('Learn More').click()
          cy.wrap(this.ipc.externalOpen).should('have.been.calledWithMatch', {
            url: 'https://on.cypress.io/ci',
            params: {
              utm_content: 'Automatic',
            },
          })
        })

        it('does not open when previously shown', function () {
          // fixture marks prompt as shown
          this.openProject.resolve(this.config)

          cy.get('.prompt-ci1').should('not.exist')
        })

        it('does not open when projectId exists', function () {
          // projectId exists in fixture
          this.openProject.resolve(this.config)

          cy.get('.prompt-ci1').should('not.exist')
        })

        it('does not open when another prompt has been shown recently', function () {
          this.openProject.resolve({
            ...this.config,
            projectId: null,
            state: {
              ...this.config.state,
              promptsShown: {
                // within 24 hours before the stubbed current time
                dashboard1: 1609891100000,
              },
            },
          })

          cy.get('.prompt-ci1').should('not.exist')
        })
      })
    })

    describe('the orchestration prompt', function () {
      it('is not open by default', function () {
        cy.get('.prompt-orchestration1').should('not.exist')
      })

      context('opens on click', function () {
        beforeEach(function () {
          this.openProject.resolve(this.config)

          cy.get('.docs-menu').trigger('mouseover')
          cy.get('.docs-dropdown').should('be.visible')
          cy.contains('Run tests faster').click()
        })

        it('opens on menu item click', function () {
          // should open in beforeEach
          cy.get('.prompt-orchestration1').should('be.visible')
          cy.get('.docs-dropdown').should('not.exist')

          cy.percySnapshot()
        })

        it('is dismissible from X icon', function () {
          cy.get('.close').click()
          cy.get('.prompt-orchestration1').should('not.exist')
        })

        it('is dismissible from close button', function () {
          cy.get('.prompt-orchestration1').contains('Close').click()
          cy.get('.prompt-orchestration1').should('not.exist')
        })

        it('links to more information', function () {
          cy.get('.prompt-orchestration1').contains('Learn More').click()
          cy.wrap(this.ipc.externalOpen).should('have.been.calledWithMatch', { url: 'https://on.cypress.io/smart-orchestration' })
        })
      })
    })
  })
})
