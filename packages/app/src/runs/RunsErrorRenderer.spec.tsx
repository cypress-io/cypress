// import type { CloudProjectNotFound } from '@packages/graphql/src/gen/cloud-source-types.gen'
import { RunsErrorRendererFragmentDoc } from '../generated/graphql-test'
import RunsErrorRenderer from './RunsErrorRenderer.vue'

describe('<RunsErrorRenderer />', () => {
  it('should show a normal error', () => {
    cy.mountFragment(RunsErrorRendererFragmentDoc, {
      onResult (result) {
        if (result.currentProject) {
          result.currentProject.cloudProject = {
            __typename: 'CloudProjectNotFound',
            message: null,
          } as any
        }
      },
      render (gql) {
        return <RunsErrorRenderer gql={gql} />
      },
    })
  })
})
