import { OpenBrowserListFragmentDoc } from '../generated/graphql-test'
import OpenBrowserList from './OpenBrowserList.vue'
import { longBrowsersList } from '@packages/frontend-shared/cypress/support/mock-graphql/longBrowsersList'

const launchButtonSelector = 'button[data-cy=launch-button]'

// Testing Note: because state for this component is maintained on the server and updated via gql mutations,
// this component test can't do interactions that change the chosen browser at the moment. Interactions and states
// are covered in the choose-a-browser.cy.ts e2e tests.

describe('<OpenBrowserList />', () => {
  beforeEach(() => {
    cy.viewport(1000, 750)
  })

  it('renders a long list of found browsers correctly', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      onResult: (result) => {
        result.currentBrowser = null
      },
      render: (gqlVal) => <div class="border-current border-1 resize overflow-auto"><OpenBrowserList gql={gqlVal} /></div>,
    })

    longBrowsersList.forEach((browser) => {
      cy.contains('label', browser.displayName).should('be.visible')
    })

    // no selected browser so launch buttun should not exist
    cy.get(launchButtonSelector).should('not.exist')
  })

  it('renders launch button when a browser is selected', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      render: (gqlVal) => <div class="border-current border-1 resize overflow-auto"><OpenBrowserList gql={gqlVal} /></div>,
    })

    cy.get(launchButtonSelector).should('be.visible').and('have.text', 'Launch Electron')
    cy.contains('button', 'different browser').should('not.exist')
  })
})
