// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { TestingPreferencesFragmentDoc } from '../../generated/graphql-test'
import TestingPreferences from './TestingPreferences.vue'

describe('<TestingPreferences />', () => {
  it('renders the title and description', () => {
    const testingPreferences = defaultMessages.settingsPage.testingPreferences

    cy.mountFragment(TestingPreferencesFragmentDoc, {
      render: (gql) => (<div class="p-[24px]">
        <TestingPreferences gql={gql} />
      </div>),
    })

    cy.findByText(testingPreferences.description).should('be.visible')
    cy.findByText(testingPreferences.title).should('be.visible')
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
