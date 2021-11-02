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
    cy.contains('a', text.docsMenu.firstTest).should('not.be.visible')
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

        it('opens on menu item click', () => {
          cy.contains(defaultMessages.topNav.docsMenu.prompts.ci.description).should('be.visible')
        })

        it('is dismissible from X icon', () => {
          cy.findAllByLabelText('Close').click()
          cy.contains(defaultMessages.topNav.docsMenu.prompts.ci.description).should('not.exist')
        })
      })

      context('opens automatically', () => {
        beforeEach(() => {
          cy.clock(1609891200000)
        })

        function mountWithSavedState (state?: object) {
          return cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
            onResult: (result) => {
              if (!result.app.activeProject) {
                return
              }

              result.app.activeProject.savedState = {
                firstOpened: 1609459200000,
                lastOpened: 1609459200000,
                promptsShown: {},
                ...state,
              }
            },
            render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBarContent gql={gqlVal} show-browsers={true} allowAutomaticPromptOpen={true} /></div>,
          })
        }

        it('opens when after 4 days from first open, no projectId, and not already shown', () => {
          mountWithSavedState()
          cy.contains(defaultMessages.topNav.docsMenu.prompts.ci.description).should('be.visible')
        })

        it('links have correct utm_content param', () => {
          mountWithSavedState()

          cy.contains(
            'a[href="https://on.cypress.io/setup-ci?utm_medium=CI+Prompt+1&utm_campaign=Other&utm_content=Automatic"]',
            defaultMessages.topNav.docsMenu.prompts.ci.seeOtherGuides,
          ).should('be.visible')

          cy.contains(
            'a[href="https://on.cypress.io/ci?utm_medium=CI+Prompt+1&utm_campaign=Learn+More"]',
            defaultMessages.topNav.docsMenu.prompts.ci.intro,
          ).should('be.visible')
        })

        it('does not open when previously shown', () => {
          mountWithSavedState({ promptsShown: { 'ci1': 1609459200000, 'orchestration1': 1609459200000 } })
          it('does not open when projectId exists', () => {
            mountWithSavedState()

            cy.contains(defaultMessages.topNav.docsMenu.prompts.ci.description).should('not.exist')
          })

          it('does not open when another prompt has been shown recently', () => {
            mountWithSavedState({ promptsShown: { dashboard1: 1609891100000 } })

            cy.contains(defaultMessages.topNav.docsMenu.prompts.ci.description).should('not.exist')
          })
        })

        it('does not open if "allowAutomaticPromptOpen" is not true', () => {
          // we should be sure that, eg, in launchpad, this would not open up after a testing type is configured
          cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
            onResult: (result) => {
              if (!result.app.activeProject) {
                return
              }

              result.app.activeProject.savedState = {
                firstOpened: 1609459200000,
                lastOpened: 1609459200000,
                promptsShown: {},
              }
            },
            render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBarContent gql={gqlVal} show-browsers={true} /></div>,
          })

          cy.contains(defaultMessages.topNav.docsMenu.prompts.ci.description).should('not.exist')
        })
      })
    })

    describe('the orchestration prompt', () => {
      it('is not open by default', () => {
        cy.get('.prompt-orchestration1').should('not.exist')
      })

      context('opens on click', () => {
        beforeEach(() => {
          cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
            render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBarContent gql={gqlVal} show-browsers={true} /></div>,
          })

          cy.contains('Docs').click()
          cy.contains('Run tests faster').click()
        })

        it('opens on menu item click', () => {
          cy.contains(defaultMessages.topNav.docsMenu.prompts.orchestration.title).should('be.visible')
          cy.contains('Getting Started').should('not.exist')
        })

        it('is dismissible from X icon', () => {
          cy.findAllByLabelText('Close').click()
          cy.contains(defaultMessages.topNav.docsMenu.prompts.orchestration.title).should('not.exist')
        })

        it('links to more information with expected utm params', () => {
          cy.contains(
            'a[href="https://on.cypress.io/smart-orchestration?utm_medium=CI+Prompt+1&utm_campaign=Learn+More"]',
            defaultMessages.topNav.docsMenu.prompts.orchestration.learnMore,
          )
          .should('be.visible')
        })
      })
    })
  })
})
