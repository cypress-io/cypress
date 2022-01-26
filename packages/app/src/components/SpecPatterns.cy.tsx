import SpecPatterns from './SpecPatterns.vue'
import { SpecPatternsFragmentDoc } from '../generated/graphql-test'

describe('<SpecPatterns />', () => {
  it('renders spec patterns', () => {
    cy.mountFragment(SpecPatternsFragmentDoc, {
      render: (gql) => <div class="p-16px"><SpecPatterns gql={gql} /></div>,
    })

    cy.get('[data-cy="spec-pattern"]').contains('cypress/e2e/**/*.cy.{js,jsx,ts,tsx}')
    cy.get('[data-cy="file-match-indicator"]').contains('200 Matches')

    cy.percySnapshot()
  })

  it('renders component spec pattern', () => {
    cy.mountFragment(SpecPatternsFragmentDoc, {
      onResult: (res) => {
        if (!res) {
          return
        }

        res.currentTestingType = 'component'
        res.specs = res.specs.slice(0, 50) || []
      },
      render: (gql) => <div class="p-16px"><SpecPatterns gql={gql} /></div>,
    })

    cy.get('[data-cy="spec-pattern"]').contains('**/*.cy.{js,jsx,ts,tsx}')
    cy.get('[data-cy="file-match-indicator"]').contains('50 Matches')
  })
})
