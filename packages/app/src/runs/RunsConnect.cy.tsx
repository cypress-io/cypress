import RunsConnect from './RunsConnect.vue'
import { RunsConnectFragmentDoc } from '../generated/graphql-test'

describe('<RunsConnect />', () => {
  it('show connect button', () => {
    cy.mountFragment(RunsConnectFragmentDoc, {
      onResult: (result) => {
        result.cloudViewer = null
      },
      render (gqlVal) {
        return <div class="h-screen"><RunsConnect gql={gqlVal} /></div>
      },
    })

    cy.contains('button', 'Log in').should('be.visible')
  })
})
