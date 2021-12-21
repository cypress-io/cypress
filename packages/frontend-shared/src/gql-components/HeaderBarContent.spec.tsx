import { HeaderBar_HeaderBarContentFragmentDoc } from '../generated/graphql-test'
import HeaderBarContent from './HeaderBarContent.vue'
import { defaultMessages } from '@cy/i18n'

const text = defaultMessages.topNav

describe('<HeaderBarContent />', { viewportWidth: 1000, viewportHeight: 750 }, () => {
  it('renders with functional browser menu when show-browsers prop is true', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBarContent gql={gqlVal} show-browsers={true} /></div>,
    })

    cy.get('[data-cy="top-nav-active-browser"]')
    .should('be.visible')
    .click()

    cy.contains('Edge Canary')
    .should('be.visible')
  }),

  it('renders without browser menu by default and other items work', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      render: (gqlVal) => (
        <div class="resize overflow-auto border-current border-1 h-700px">
          <HeaderBarContent gql={gqlVal} />
        </div>
      ),
    })

    cy.contains('Projects').should('be.visible')
    cy.get('[data-cy="top-nav-active-browser"]').should('not.exist')
    cy.contains('button', text.docsMenu.docsHeading).click()
    cy.contains('a', text.docsMenu.firstTest).should('be.visible')
    cy.get('body').click()
    cy.contains('a', text.docsMenu.firstTest).should('not.exist')
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
        <div class="resize overflow-auto border-current border-1 h-700px">
          <HeaderBarContent gql={gqlVal} />
        </div>
      ),
    })

    cy.contains('a', '8.7.0').should('be.visible').and('have.attr', 'href', 'https://github.com/cypress-io/cypress/releases/tag/v8.7.0')
  })

  it('shows hint and modal to upgrade to latest version of cypress', () => {
    cy.mountFragment(HeaderBar_HeaderBarContentFragmentDoc, {
      onResult: (result) => {
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
        <div class="resize overflow-auto border-current border-1 h-700px">
          <HeaderBarContent gql={gqlVal} />
        </div>
      ),
    })

    cy.contains('v8.6.0 • Upgrade').click()
    cy.get('[data-cy="latest-version"]').contains('8.7.0')
    cy.get('[data-cy="current-version"]').contains('8.6.0')
    cy.get('[data-cy="update-hint"]').should('be.visible')
    cy.contains('button', 'Update to').click()

    cy.contains(`${defaultMessages.topNav.updateCypress.title} 8.7.0`).should('be.visible')
    cy.contains('test-project').should('be.visible')
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
        result.isAuthBrowserOpened = true
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
})
