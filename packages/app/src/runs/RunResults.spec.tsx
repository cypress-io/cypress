import { CloudRunStubs } from '@packages/frontend-shared/cypress/support/mock-graphql/stubgql-CloudTypes'
import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import { RunCardFragmentDoc } from '../generated/graphql-test'
import RunResults from './RunResults.vue'

describe('<RunResults />', { viewportHeight: 70, viewportWidth: 300 }, () => {
  it('show number of passed tests', () => {
    cy.mountFragment(RunCardFragmentDoc, {
      onResult (result) {
        Object.keys(result).forEach((key) => {
          result[key] = CloudRunStubs.allPassing[key]
        })
      },
      render (gql) {
        return <RunResults gql={gql} />
      },
    })

    cy.get(`[title=${defaultMessages.runs.results.passed}]`).should('have.text', CloudRunStubs.allPassing.totalPassed)
  })
})
