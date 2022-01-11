import { CloudRunStubs } from '@packages/frontend-shared/cypress/support/mock-graphql/stubgql-CloudTypes'
import { RunCardFragmentDoc } from '../generated/graphql-test'
import RunCard from './RunCard.vue'

describe('<RunCard />', { viewportHeight: 400 }, () => {
  it('displays last commit info', () => {
    cy.mountFragment(RunCardFragmentDoc, {
      onResult (result) {
        Object.keys(result).forEach((key) => {
          result[key] = CloudRunStubs.allPassing[key]
        })
      },
      render: (gqlVal) => {
        return (
          <div class="h-screen bg-gray-100 p-3">
            <RunCard gql={gqlVal} />
          </div>
        )
      },
    })

    cy.contains(CloudRunStubs.allPassing.commitInfo?.authorName || '')
    cy.contains(CloudRunStubs.allPassing.commitInfo?.summary || '')
    cy.contains(CloudRunStubs.allPassing.commitInfo?.branch || '')
  })
})
