import { RunCardFragmentDoc } from '../generated/graphql'
import RunCard from './RunCard.vue'

describe('<RunCard />', { viewportHeight: 400 }, () => {
  it('playground', () => {
    cy.mountFragment(RunCardFragmentDoc, {
      type: (ctx) => {
        return {
          createdAt: new Date().toString(),
          completedAt: new Date().toString(),
          status: 'PASSED' as const,
          id: '1',
          commit: {
            message: 'Updating the hover state for the button component',
            authorName: 'Ryan',
            authorEmail: 'ryan@cypress.io',
            branch: 'develop',
            sha: 'shashasha',
            url: 'https://github.com',
          },
          totalDuration: 1000,
          totalPassed: 5,
          totalFailed: 0,
          totalSkipped: 0,
          totalPending: 4,
        }
      },
      render: (gqlVal) => {
        return (
          <div class="bg-gray-100 h-screen p-3">
            <RunCard gql={gqlVal} />
          </div>
        )
      },
    })
  })
})
