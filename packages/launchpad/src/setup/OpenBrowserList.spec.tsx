import { OpenBrowserListFragmentDoc } from '../generated/graphql-test'
import OpenBrowserList from './OpenBrowserList.vue'
import { longBrowsersList } from '@packages/frontend-shared/cypress/support/mock-graphql/stubgql-App'

const launchButtonSelector = 'button[data-testid=launch-button]'

describe('<OpenBrowserList />', () => {
  beforeEach(() => {
    cy.viewport(1000, 750)
  })

  it('renders a long list of found browsers correctly', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      onResult: (result) => {
        result.selectedBrowser = null
      },
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1"><OpenBrowserList gql={gqlVal} /></div>,
    })

    longBrowsersList.forEach((browser) => {
      cy.contains('label', browser.displayName).should('be.visible')
    })

    // no selected browser so launch buttun should not exist
    cy.get(launchButtonSelector).should('not.exist')
  })

  it('renders launch button when a browser is selected', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1"><OpenBrowserList gql={gqlVal} /></div>,
    })

    cy.get(launchButtonSelector).should('be.visible').and('have.text', 'Launch Electron')
    cy.contains('button', 'different browser').should('not.exist')
  })

  it('renders browser error if there is one', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      onResult: (result) => {
        result.browserErrorMessage = 'There was an error'
      },
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1"><OpenBrowserList gql={gqlVal} /></div>,
    })

    cy.contains('There was an error').should('be.visible')
  })

  it('does not render browser error if there is not one', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1"><OpenBrowserList gql={gqlVal} /></div>,
    })

    cy.contains('[data-test-id="browser-error-message"]').should('not.exist')
  })
})
