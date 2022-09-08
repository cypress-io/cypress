import CloudConnectButton from './CloudConnectButton.vue'
import { CloudConnectButtonFragmentDoc } from '../generated/graphql-test'
import { CloudUserStubs } from '@packages/graphql/test/stubCloudTypes'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'

describe('<CloudConnectButton />', { viewportHeight: 60, viewportWidth: 400 }, () => {
  it('show user connect if not connected', () => {
    cy.mountFragment(CloudConnectButtonFragmentDoc, {
      onResult: (result) => {
        result.cloudViewer = null
      },
      render (gqlVal) {
        return <div class="h-screen"><CloudConnectButton gql={gqlVal} /></div>
      },
    })

    cy.contains('button', 'Log in').should('be.visible')
  })

  const cloudViewer = {
    ...CloudUserStubs.me,
    organizations: {
      __typename: 'CloudOrganizationConnection' as const,
      nodes: [
        {
          __typename: 'CloudOrganization' as const,
          id: '1',
          name: 'Test Org',
          projects: {
            __typename: 'CloudProjectConnection' as const,
            nodes: [
              {
                __typename: 'CloudProject' as const,
                id: '1',
                name: 'Test Project',
                slug: 'test-project',
              },
            ],
          },
        },
        {
          __typename: 'CloudOrganization' as const,
          id: '2',
          name: 'Test Org 2',
          projects: {
            __typename: 'CloudProjectConnection' as const,
            nodes: [],
          },
        },
      ],
    },
  }

  it('show project connect if not connected', () => {
    cy.mountFragment(CloudConnectButtonFragmentDoc, {
      onResult: (result) => {
        result.cloudViewer = cloudViewer
      },
      render (gqlVal) {
        return <div class="h-screen"><CloudConnectButton gql={gqlVal} /></div>
      },
    })

    cy.contains('button', 'Connect your project').should('be.visible')
  })

  it('uses the store to open the Login Connect modal', () => {
    const loginConnectStore = useLoginConnectStore()

    loginConnectStore.openLoginConnectModal = cy.spy().as('openLoginConnectModal')
    cy.mountFragment(CloudConnectButtonFragmentDoc, {
      onResult: (result) => {
        result.cloudViewer = cloudViewer
      },
      render (gqlVal) {
        return <div class="h-screen"><CloudConnectButton gql={gqlVal} utmMedium="test"/></div>
      },
    })

    cy.contains('button', 'Connect your project').click()

    cy.get('@openLoginConnectModal').should('have.been.calledWith', { utmMedium: 'test' })
  })
})
