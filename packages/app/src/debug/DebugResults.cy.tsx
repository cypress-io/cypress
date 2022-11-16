import DebugResults from './DebugResults.vue'
import { CloudRunStubs } from '@packages/graphql/test/stubCloudTypes'

describe('<DebugResults />', {
  viewportHeight: 1000,
  viewportWidth: 1032,
},
() => {
  it('mounts the debug header component', () => {
    const cloudRuns = Object.values(CloudRunStubs)

    cy.mount(() => cloudRuns.map((cloudRun, i) => (<DebugResults data-cy={`run-result-${i}`} gql={cloudRun} />)))
  })
})
