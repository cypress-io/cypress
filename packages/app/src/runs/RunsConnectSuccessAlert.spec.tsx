import { RunsConnectSuccessAlertFragmentDoc } from '../generated/graphql-test'
import RunsConnectSuccessAlert from './RunsConnectSuccessAlert.vue'

describe('<RunConnectSuccessAlert />', { viewportHeight: 400 }, () => {
  it('playground', () => {
    cy.mountFragment(RunsConnectSuccessAlertFragmentDoc, {
      render: (gqlVal) => {
        return (
          <div class="bg-gray-100 h-screen p-3">
            <RunsConnectSuccessAlert gql={gqlVal} />
          </div>
        )
      },
    })
  })
})
