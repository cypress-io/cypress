import SpecPatterns from './SpecPatterns.vue'
import { SpecPatternsFragmentDoc } from '../generated/graphql-test'

describe('<SpecPatterns />', () => {
  it('renders spec patterns', () => {
    cy.mountFragment(SpecPatternsFragmentDoc, {
      render: (gql) => <div class="p-[16px]"><SpecPatterns gql={gql} /></div>,
    })

    cy.get('[data-cy="spec-pattern"]').contains('cypress/e2e/**/*.cy.{js,jsx,ts,tsx}')
    cy.get('[data-cy="file-match-indicator"]').contains('50 matches')
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
      render: (gql) => <div class="p-[16px]"><SpecPatterns gql={gql} /></div>,
    })

    cy.get('[data-cy="spec-pattern"]').contains('**/*.cy.{js,jsx,ts,tsx}')
    cy.get('[data-cy="file-match-indicator"]').contains('50 matches')
  })

  it('renders component spec pattern should not show matches verbiage', () => {
    cy.mountFragment(SpecPatternsFragmentDoc, {
      onResult: (res) => {
        if (!res) {
          return
        }

        res.currentTestingType = 'component'
        res.specs = res.specs.slice(0, 50) || []
      },
      render: (gql) => <div class="p-[16px]"><SpecPatterns gql={gql} variant='info' /></div>,
    })

    cy.get('[data-cy="spec-pattern"]').contains('**/*.cy.{js,jsx,ts,tsx}')
    cy.get('[data-cy="file-match-indicator"]').should('contain', 'specPattern')
  })

  it('displays `No matches` when specs are empty', () => {
    cy.mountFragment(SpecPatternsFragmentDoc, {
      onResult: (res) => {
        if (!res) {
          return
        }

        res.currentTestingType = 'component'
        res.specs = []
      },
      render: (gql) => <div class="p-[16px]"><SpecPatterns gql={gql}/></div>,
    })

    cy.get('[data-cy="file-match-indicator"]').contains('No matches')
  })

  it('displays `1 Match` when specs has 1 element', () => {
    cy.mountFragment(SpecPatternsFragmentDoc, {
      onResult: (res) => {
        if (!res) {
          return
        }

        res.currentTestingType = 'component'
        res.specs = res.specs.slice(0, 1) || []
      },
      render: (gql) => <div class="p-[16px]"><SpecPatterns gql={gql}/></div>,
    })

    cy.get('[data-cy="file-match-indicator"]').contains('1 match')
  })
})
