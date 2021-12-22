import { OpenBrowserListFragmentDoc } from '../generated/graphql-test'
import OpenBrowserList from './OpenBrowserList.vue'
import { longBrowsersList } from '@packages/frontend-shared/cypress/support/mock-graphql/longBrowsersList'

const launchButtonSelector = 'button[data-cy=launch-button]'

describe('<OpenBrowserList />', () => {
  beforeEach(() => {
    cy.viewport(1000, 750)
  })

  it('renders a long list of found browsers correctly', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      onResult: (result) => {
        result.currentBrowser = null
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
})
