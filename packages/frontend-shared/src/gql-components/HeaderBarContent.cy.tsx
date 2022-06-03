import { HeaderBar_HeaderBarContentFragmentDoc } from '../generated/graphql-test'
import HeaderBarContent from './HeaderBarContent.vue'
import { defaultMessages } from '@cy/i18n'

const text = defaultMessages.topNav

describe('<HeaderBarContent />', { viewportWidth: 1000, viewportHeight: 750 }, () => {
  it('renders with functional browser menu when show-browsers prop is true', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      render: (gqlVal) => <div class="border-current border-1 h-700px resize overflow-auto"><HeaderBarContent gql={gqlVal} show-browsers={true} /></div>,
    })

    cy.percySnapshot('before browsers open')

    cy.get('[data-cy="top-nav-active-browser"]')
    .should('be.visible')
    .click()

    cy.percySnapshot('after browsers open')

    cy.contains('Edge Canary')
    .should('be.visible')
    .closest('[data-cy="top-nav-browser-list-item"]')
    .within(() => {
      cy.get('[data-cy="unsupported-browser-tooltip-trigger"]')
      .should('not.exist')
    })

    cy.get('[data-cy="top-nav-browser-list-item"]')
    .last().should('not.be.visible')
    .scrollIntoView().should('be.visible')

    cy.contains('Version unsupported')
    .scrollIntoView()
    .should('be.visible')
    .closest('[data-cy="top-nav-browser-list-item"]')
    .within(() => {
      cy.get('[data-cy="unsupported-browser-tooltip-trigger"]')
      .should('exist')
      .trigger('mouseenter')
    })

    cy.contains('Unsupported browser')

    cy.percySnapshot('unsupported browser tooltip')
  }),

  it('renders without browser menu by default and other items work', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {

      render: (gqlVal) => (
        <div class="border-current border-1 h-700px resize overflow-auto">
          <HeaderBarContent gql={gqlVal} />
        </div>
      ),
    })

    cy.contains('Projects').should('be.visible')
    cy.get('[data-cy="top-nav-active-browser"]').should('not.exist')
    cy.percySnapshot()
    cy.contains('button', text.docsMenu.docsHeading).click()

    cy.wrap(Object.values(text.docsMenu)).each((menuItem) => {
      if (typeof menuItem === 'string') {
        cy.contains(menuItem).should('be.visible')
      }
    })

    cy.percySnapshot()
    cy.get('body').click()
    cy.contains('a', text.docsMenu.firstTest).should('not.be.visible')
  })

  it('docs menu has expected links with no current project', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      onResult: (result) => {
        result.currentProject = null
      },
      render: (gqlVal) => (
        <div class="border-current border-1 h-700px resize overflow-auto">
          <HeaderBarContent gql={gqlVal} />
        </div>
      ),
    })

    // we render without a current project to validate ciSetup and fasterTests links
    // because outside of global mode, those are buttons that trigger popups
    // so this way we can assert all links at once.
    const expectedDocsLinks = {
      [text.docsMenu.firstTest]: 'https://on.cypress.io/writing-first-test?utm_medium=Docs+Menu&utm_content=First+Test&utm_source=Binary%3A+Launchpad',
      [text.docsMenu.testingApp]: 'https://on.cypress.io/testing-your-app?utm_medium=Docs+Menu&utm_content=Testing+Your+App&utm_source=Binary%3A+Launchpad',
      [text.docsMenu.organizingTests]: 'https://on.cypress.io/writing-and-organizing-tests?utm_medium=Docs+Menu&utm_content=Organizing+Tests&utm_source=Binary%3A+Launchpad',
      [text.docsMenu.bestPractices]: 'https://on.cypress.io/best-practices?utm_medium=Docs+Menu&utm_content=Best+Practices&utm_source=Binary%3A+Launchpad',
      [text.docsMenu.configuration]: 'https://on.cypress.io/configuration?utm_medium=Docs+Menu&utm_content=Configuration&utm_source=Binary%3A+Launchpad',
      [text.docsMenu.api]: 'https://on.cypress.io/api?utm_medium=Docs+Menu&utm_content=API&utm_source=Binary%3A+Launchpad',
      [text.docsMenu.ciSetup]: 'https://on.cypress.io/ci?utm_medium=Docs+Menu&utm_content=Set+Up+CI&utm_source=Binary%3A+Launchpad',
      [text.docsMenu.fasterTests]: 'https://on.cypress.io/parallelization?utm_medium=Docs+Menu&utm_content=Parallelization&utm_source=Binary%3A+Launchpad',
    }

    cy.contains('button', text.docsMenu.docsHeading).click()

    cy.wrap(Object.keys(expectedDocsLinks)).each((linkName: string) => {
      cy.contains('a', linkName).should('have.attr', 'href', expectedDocsLinks[linkName])
    })
  })

  it('does not show hint when on latest version of Cypress', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      onResult: (result) => {
        result.versions = {
          __typename: 'VersionData',
          latest: {
            __typename: 'Version',
            id: '8.7.0',
            version: '8.7.0',
            released: '2021-10-25T21:00:00.000Z',
          },
          current: {
            __typename: 'Version',
            id: '8.7.0',
            version: '8.7.0',
            released: '2021-10-25T21:00:00.000Z',
          },
        }
      },
      render: (gqlVal) => (
        <div class="border-current border-1 h-700px resize overflow-auto">
          <HeaderBarContent gql={gqlVal} />
        </div>
      ),
    })

    cy.contains('a', '8.7.0').should('be.visible').and('have.attr', 'href', 'https://on.cypress.io/changelog#8-7-0')
    cy.percySnapshot()
  })

  it('shows hint and modal to upgrade to latest version of cypress', () => {
    // Set the clock to ensure that our percy snapshots always have the same relative time frame
    //
    // With this value they are:
    //
    // 8.7.0 - Released 7 months ago
    // 8.6.0 - Released last year
    cy.clock(Date.UTC(2022, 4, 26), ['Date'])

    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      onResult: (result) => {
        if (result.currentProject) {
          result.currentProject.packageManager = 'yarn'
        }

        result.versions = {
          __typename: 'VersionData',
          current: {
            __typename: 'Version',
            id: '8.6.0',
            version: '8.6.0',
            released: '2021-06-25T21:00:00.000Z',
          },
          latest: {
            __typename: 'Version',
            id: '8.7.0',
            version: '8.7.0',
            released: '2021-10-25T21:00:00.000Z',
          },
        }
      },
      render: (gqlVal) => (
        <div class="border-current border-1 h-700px resize overflow-auto">
          <HeaderBarContent gql={gqlVal} />
        </div>
      ),
    })

    cy.contains('v8.6.0 • Upgrade').should('be.visible')
    cy.percySnapshot('before upgrade click')
    cy.contains('v8.6.0 • Upgrade').click()
    cy.get('[data-cy="latest-version"]').contains('8.7.0')
    cy.get('[data-cy="current-version"]').contains('8.6.0')
    cy.get('[data-cy="update-hint"]').should('be.visible')
    cy.percySnapshot('after upgrade click')
    cy.contains('button', 'Update to').click()

    cy.contains(`${defaultMessages.topNav.updateCypress.title} 8.7.0`).should('be.visible')
    cy.contains('test-project').should('be.visible')
    cy.contains('code', 'yarn add -D cypress').should('be.visible')
    cy.percySnapshot('after upgrade modal open')

    cy.get('body').type('{esc}') // dismiss modal with keyboard
    cy.contains(`${defaultMessages.topNav.updateCypress.title} 8.7.0`).should('not.exist')
  })

  it('displays the active project name and testing type', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      render: (gqlVal) => <div class="border-current border-1 h-700px resize overflow-auto"><HeaderBarContent gql={gqlVal} /></div>,
    })

    cy.contains('test-project').should('be.visible')
    cy.contains('e2e testing', { matchCase: false }).should('be.visible')
  })

  it('displays the branch name', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      onResult: (result) => {
        if (!result.currentProject) {
          return
        }

        result.currentProject.branch = 'develop'
      },
      render: (gqlVal) => (
        <div class="border-current border-1 h-700px resize overflow-auto">
          <HeaderBarContent gql={gqlVal} />
        </div>
      ),
    })

    cy.contains('develop').should('be.visible')
  })

  it('truncates the branch name if it is long', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      onResult: (result) => {
        if (!result.currentProject) {
          return
        }

        result.currentProject.branch = 'application-program/hard-drive-parse'
      },
      render: (gqlVal) => (
        <div class="border-current border-1 h-700px resize overflow-auto">
          <HeaderBarContent gql={gqlVal} />
        </div>
      ),
    })

    cy.get('.truncate').contains('application-program/hard-drive-parse').should('be.visible')

    cy.percySnapshot()

    cy.get('.truncate').realHover()
    cy.get('.v-popper__popper--shown').contains('application-program/hard-drive-parse')
  })

  it('the login modal reaches "opening browser" status', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      render: (gqlVal) => <div class="border-current border-1 h-700px resize overflow-auto"><HeaderBarContent gql={gqlVal} /></div>,
    })

    cy.findByRole('button', { name: text.login.actionLogin })
    .click()

    cy.contains('h2', text.login.titleInitial).should('be.visible')
    cy.percySnapshot()

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
        result.authState.browserOpened = true
        result.cloudViewer = cloudViewer
        result.cloudViewer.__typename = 'CloudUser'
      },
      render: (gqlVal) => <div class="border-current border-1 h-700px resize overflow-auto"><HeaderBarContent gql={gqlVal} /></div>,
    })

    cy.findByRole('button', { name: text.login.profileMenuLabel }).click()
    cy.contains(cloudViewer.fullName).should('be.visible')
    cy.contains(cloudViewer.email).should('be.visible')
    cy.findByRole('button', { name: text.login.actionLogout }).should('be.visible')
    cy.percySnapshot()
  })

  it('Shows a page name instead of project when a page name is provided', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      render: (gqlVal) => <div class="border-current border-1 h-700px resize overflow-auto"><HeaderBarContent gql={gqlVal} pageName="Test Page" /></div>,
    })

    cy.contains('Project').should('not.exist')
    cy.contains('Test Page').should('be.visible')
  })

  describe('prompts', () => {
    describe('the CI prompt', () => {
      context('opens on click', () => {
        beforeEach(() => {
          cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
            render: (gqlVal) => <div class="border-current border-1 h-700px resize overflow-auto"><HeaderBarContent gql={gqlVal} show-browsers={true} /></div>,
          })

          cy.contains('Docs').click()
          cy.contains('Set up CI').click()
        })

        it('opens on menu item click', () => {
          cy.contains(defaultMessages.topNav.docsMenu.prompts.ci1.description).should('be.visible')
          cy.percySnapshot()
        })

        it('is dismissible from X icon', () => {
          cy.findAllByLabelText('Close').click()
          cy.contains(defaultMessages.topNav.docsMenu.prompts.ci1.description).should('not.exist')
        })
      })

      context('opens automatically', () => {
        beforeEach(() => {
          cy.clock(1609891200000)
        })

        function mountWithSavedState (options?: {state?: object, projectId?: string }) {
          return cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
            onResult: (result) => {
              if (!result.currentProject) {
                return
              }

              result.currentProject.savedState = {
                firstOpened: 1609459200000,
                lastOpened: 1609459200000,
                promptsShown: {},
                ...(options?.state ?? {}),
              }

              const projectId = result.currentProject.config.find((item: {field: string, value: string}) => item.field = 'projectId')

              if (projectId) {
                projectId.value = options?.projectId
              }
            },
            render: (gqlVal) => <div class="border-current border-1 h-700px resize overflow-auto"><HeaderBarContent gql={gqlVal} show-browsers={true} allowAutomaticPromptOpen={true} /></div>,
          })
        }

        it('opens when after 4 days from first open, no projectId, and not already shown', () => {
          mountWithSavedState()

          cy.contains(defaultMessages.topNav.docsMenu.prompts.ci1.description).should('be.visible')
        })

        it('links have correct utm_content param', () => {
          mountWithSavedState()

          cy.contains(
            'a[href="https://on.cypress.io/setup-ci?utm_medium=CI+Prompt+1&utm_campaign=Other&utm_content=Automatic&utm_source=Binary%3A+Launchpad"]',
            defaultMessages.topNav.docsMenu.prompts.ci1.seeOtherGuides,
          ).should('be.visible')

          cy.contains(
            'a[href="https://on.cypress.io/ci?utm_medium=CI+Prompt+1&utm_campaign=Learn+More&utm_source=Binary%3A+Launchpad"]',
            defaultMessages.topNav.docsMenu.prompts.ci1.intro,
          ).should('be.visible')
        })

        it('does not open when projectId exists', () => {
          mountWithSavedState({ projectId: 'testid' })

          cy.contains(defaultMessages.topNav.docsMenu.prompts.ci1.description).should('not.exist')
        })

        it('does not open when previously shown', () => {
          mountWithSavedState({ state: { promptsShown: { 'ci1': 1609459200000, 'orchestration1': 1609459200000 } } })

          cy.contains(defaultMessages.topNav.docsMenu.prompts.ci1.description).should('not.exist')
        })

        it('does not open when another prompt has been shown recently', () => {
          mountWithSavedState({ state: { promptsShown: { dashboard1: 1609891100000 } } })

          cy.contains(defaultMessages.topNav.docsMenu.prompts.ci1.description).should('not.exist')
        })

        it('does not open if "allowAutomaticPromptOpen" prop is not true', () => {
          // we should be sure that, eg, in launchpad, this would not open up after a testing type is configured
          cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
            onResult: (result) => {
              if (!result.currentProject) {
                return
              }

              result.currentProject.savedState = {
                firstOpened: 1609459200000,
                lastOpened: 1609459200000,
                promptsShown: {},
              }
            },
            render: (gqlVal) => <div class="border-current border-1 h-700px resize overflow-auto"><HeaderBarContent gql={gqlVal} show-browsers={true} /></div>,
          })

          cy.contains(defaultMessages.topNav.docsMenu.prompts.ci1.description).should('not.exist')
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
            render: (gqlVal) => <div class="border-current border-1 h-700px resize overflow-auto"><HeaderBarContent gql={gqlVal} show-browsers={true} /></div>,
          })

          cy.contains('Docs').click()
          cy.contains('Run tests faster').click()
        })

        it('opens on menu item click', () => {
          cy.percySnapshot()
          cy.contains(defaultMessages.topNav.docsMenu.prompts.orchestration1.title).should('be.visible')
          cy.contains('Getting Started').should('not.exist')
        })

        it('is dismissible from X icon', () => {
          cy.findAllByLabelText('Close').click()
          cy.contains(defaultMessages.topNav.docsMenu.prompts.orchestration1.title).should('not.exist')
        })

        it('links to more information with expected utm params', () => {
          cy.contains(
            'a[href="https://on.cypress.io/smart-orchestration?utm_medium=CI+Prompt+1&utm_campaign=Learn+More&utm_source=Binary%3A+Launchpad"]',
            defaultMessages.topNav.docsMenu.prompts.orchestration1.learnMore,
          )
          .should('be.visible')
        })
      })
    })
  })
})
