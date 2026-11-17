import { TestingPreferencesFragmentDoc } from '../../generated/graphql-test'
import TestingPreferences from './TestingPreferences.vue'

describe('<TestingPreferences />', () => {
  it('renders the title and description', () => {
    cy.mountFragment(TestingPreferencesFragmentDoc, {
      render: (gql) => (<div class="p-[24px]">
        <TestingPreferences gql={gql} />
      </div>),
    })

    cy.findByText('Configure your testing environment with these flags').should('be.visible')
    cy.findByText('Testing preferences').should('be.visible')
  })

  it('displays the results for auto-scroll', () => {
    cy.mountFragment(TestingPreferencesFragmentDoc, {
      onResult (ctx) {
        if (ctx.localSettings?.preferences) {
          ctx.localSettings.preferences.autoScrollingEnabled = false
        }
      },
      render: (gql) => (<div class="p-[24px]">
        <TestingPreferences gql={gql} />
      </div>),
    })

    cy.get(`#autoScrollingToggle[role="switch"]`)
    .should('have.attr', 'aria-checked', 'false')
  })
})
