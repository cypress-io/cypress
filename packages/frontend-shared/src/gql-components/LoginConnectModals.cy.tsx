import { LoginConnectModalsFragmentDoc } from '../generated/graphql-test'
import LoginConnectModals from './LoginConnectModals.vue'
import { CloudUserStubs } from '@packages/graphql/test/stubCloudTypes'

import { useLoginConnectStore } from '../store/login-connect-store'

describe('<LoginConnectModals />', () => {
  context('when user is logged out', () => {
    it('shows login modal', () => {
      const { setIsLoginConnectOpen } = useLoginConnectStore()

      cy.mountFragment(LoginConnectModalsFragmentDoc, {
        onResult: (result) => {
          result.cloudViewer = null
        },
        render: (gqlVal) => {
          return <LoginConnectModals gql={gqlVal} />
        },
      })

      cy.contains('Log in to Cypress')
      .should('not.exist')
      .then(() => {
        setIsLoginConnectOpen(true)

        cy.contains('Log in to Cypress').should('be.visible')
      })
    })
  })

  context('when user is logged in', () => {
    it('shows correct "connect" state if project is not set up', () => {
      const { setIsLoginConnectOpen } = useLoginConnectStore()

      cy.mountFragment(LoginConnectModalsFragmentDoc, {
        onResult: (result) => {
          result.cloudViewer = {
            ...CloudUserStubs.me,
            firstOrganization: {
              __typename: 'CloudOrganizationConnection',
              nodes: [],
            },
          }
        },
        render: (gqlVal) => {
          return <LoginConnectModals gql={gqlVal} />
        },
      })

      setIsLoginConnectOpen(true)
      cy.contains('logged in')
    })
  })
})
