import { SpecPatterns_SettingsFragmentDoc } from '../../generated/graphql-test'
import SpecPatterns from './SpecPatterns.vue'

describe('<SpecPatterns />', () => {
  beforeEach(() => {
    cy.viewport(1000, 600)
    cy.mountFragment(SpecPatterns_SettingsFragmentDoc, {
      render: (gql) => (<div class="p-[16px]"><SpecPatterns gql={gql} /></div>),

    })
  })

  it('renders the SpecPatterns', () => {
    cy.contains('h2', 'Spec patterns')
    cy.contains('code', 'specPattern')
    cy.contains('p', 'The globs pointing Cypress to your spec files configured for this project. Learn more')
    cy.get('[data-cy="file-match-indicator"]').contains('50 matches')
    cy.get('[data-cy="spec-pattern"]').contains('cypress/e2e/**/*.cy.{js,jsx,ts,tsx}')
    cy.get('[data-cy="external"]').should('have.attr', 'href').and('eq', 'https://on.cypress.io/test-type-options')
  })
})
