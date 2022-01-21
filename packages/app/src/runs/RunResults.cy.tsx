import { defaultMessages } from '@cy/i18n'
import { CloudRunStubs } from '@packages/frontend-shared/cypress/support/mock-graphql/stubgql-CloudTypes'
import { RunCardFragmentDoc } from '../generated/graphql-test'
import RunResults from './RunResults.vue'

describe('<RunResults />', { viewportHeight: 70, viewportWidth: 300 }, () => {
  it('show number of passed, skipped and failed tests', () => {
    const res = CloudRunStubs.someSkipped

    cy.mountFragment(RunCardFragmentDoc, {
      onResult (result) {
        Object.keys(result).forEach((key) => {
          result[key] = res[key]
        })
      },
      render (gql) {
        return <RunResults gql={gql} />
      },
    })

    cy.get(`[title=${defaultMessages.runs.results.passed}]`).should('contain.text', res.totalPassed)
    cy.get(`[title=${defaultMessages.runs.results.failed}]`).should('contain.text', res.totalFailed)
    cy.get(`[title=${defaultMessages.runs.results.skipped}]`).should('contain.text', res.totalSkipped)
    cy.get(`[title=${defaultMessages.runs.results.pending}`).should('contain.text', res.totalPending)
  })
})
