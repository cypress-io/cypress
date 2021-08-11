import type { RunCommitConfig, RunGroupConfig } from '@packages/graphql/src'
import { RunCardFragmentDoc } from '../generated/graphql'
import RunCard from './RunCard.vue'


describe('<RunCard />', { viewportHeight: 400 }, () => {
  it('playground', () => {
    const commit: Partial<RunCommitConfig> = {
      authorName: 'Ryan',
      branch: 'master',
      message: 'Updating the hover state for the button component'
    }

    const run: Partial<RunGroupConfig> = {
      createdAt: '2016-05-13T02:35:12.748Z',
      totalPassed: 5,
      totalFailed: 0,
      totalPending: 0,
      totalSkipped: 0,
      totalDuration: 16000,
      status: 'failed'
    }

    cy.mountFragment(RunCardFragmentDoc, {
      type: (ctx) => {
        return ctx.app.runGroups({ projectId: 'test-id' })[0]
      },
      render: (gql) => {
        console.log({ gql }) 
        return (
          <RunCard gql={gql[0]} />
        )
      }
    })

    cy.mount(() => (
      <div class="bg-gray-100 h-screen p-3">
        <RunCard
          run={run}
          commit={commit}
        />
        <RunCard
          run={{...run, status: 'passed'}}
          commit={{...commit, message: 'fixing the tests'}}
        />
        <RunCard
          run={{...run, status: 'pending'}}
          commit={{...commit, message: 'adding some information'}}
        />
        <RunCard
          run={{...run, status: 'cancelled'}}
          commit={{...commit, message: 'cancelling this one'}}
        />
      </div>
    ))
  })
})
