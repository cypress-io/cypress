import { SpecPatterns_SettingsFragmentDoc } from '../../generated/graphql-test'
import SpecPatterns from './SpecPatterns.vue'

describe('<SpecPatterns />', () => {
  beforeEach(() => {
    cy.viewport(1000, 600)
    cy.mountFragment(SpecPatterns_SettingsFragmentDoc, {
      render: (gql) => (<SpecPatterns gql={gql} />),

    })
  })

  it('renders the SpecPatterns', () => {
    cy.get('[data-cy="file-match-indicator"]').should('contain', '200 Matches')

    cy.get('[data-cy="spec-pattern"]').should('contain', 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}')
  })
})
