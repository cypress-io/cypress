import { CloudRunStubs } from '@packages/frontend-shared/cypress/support/mock-graphql/stubgql-CloudTypes'
import { RunCardFragmentDoc } from '../generated/graphql-test'
import RunCard from './RunCard.vue'

describe('<RunCard />', { viewportHeight: 400 }, () => {
  context('when there is full commit info', () => {
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

      if (!CloudRunStubs.allPassing.commitInfo) {
        throw new Error('RunCard spec did not successfully import commit info, so the test cannot be completed')
      }

      cy.contains(CloudRunStubs.allPassing.commitInfo.authorName as string)
      .should('be.visible')

      cy.contains(CloudRunStubs.allPassing.commitInfo.summary as string)
      .should('be.visible')

      cy.contains(CloudRunStubs.allPassing.commitInfo.branch as string)
      .should('be.visible')

      cy.percySnapshot()
    })
  })

  context('when there is missing commit info', () => {
    it('renders without errors', () => {
      cy.mountFragment(RunCardFragmentDoc, {
        onResult (result) {
          Object.keys(result).forEach((key) => {
            result[key] = CloudRunStubs.allPassing[key]
          })

          result.commitInfo = null
        },
        render: (gqlVal) => {
          return (
            <div class="h-screen bg-gray-100 p-3">
              <RunCard gql={gqlVal} />
            </div>
          )
        },
      })

      // this is the human readable commit time from the stub
      cy.contains('3:17:00 AM').should('be.visible')

      cy.percySnapshot()
    })
  })
})
