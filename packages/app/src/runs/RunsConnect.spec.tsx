import RunsConnect from './RunsConnect.vue'
import { RunsConnectFragmentDoc } from '../generated/graphql-test'

describe('<RunsConnect />', () => {
  it('show user connect if not connected', () => {
    cy.mountFragment(RunsConnectFragmentDoc, {
      onResult: (result) => {
        result.cloudViewer = null
      },
      render (gqlVal) {
        return <RunsConnect gql={gqlVal} />
      },
    })

    cy.contains('button', 'Log in').should('be.visible')
  })

  it('show project connect if not connected', () => {
    const cloudViewer = {
      __typename: 'CloudUser',
      id: '1',
      email: 'test@test.test',
      fullName: 'Tester Test',
    } as const

    cy.mountFragment(RunsConnectFragmentDoc, {
      onResult: (result) => {
        result.cloudViewer = cloudViewer
      },
      render (gqlVal) {
        return <RunsConnect gql={gqlVal} />
      },
    })

    cy.contains('button', 'Connect your project').should('be.visible')
  })
})
