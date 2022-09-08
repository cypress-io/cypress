import { LoginConnectModalsContentFragmentDoc } from '../generated/graphql-test'
import LoginConnectModalsContent from './LoginConnectModalsContent.vue'
import { CloudUserStubs } from '@packages/graphql/test/stubCloudTypes'

import { useLoginConnectStore } from '../store/login-connect-store'

describe('<LoginConnectModalsContent />', () => {
  context('when user is logged out', () => {
    it('shows login modal', () => {
      const { openLoginConnectModal } = useLoginConnectStore()

      cy.mountFragment(LoginConnectModalsContentFragmentDoc, {
        onResult: (result) => {
          result.cloudViewer = null
        },
        render: (gqlVal) => {
          return <LoginConnectModalsContent gql={gqlVal} />
        },
      })

      cy.contains('Log in to Cypress')
      .should('not.exist')
      .then(() => {
        openLoginConnectModal({ utmMedium: 'testing' })

        cy.contains('Log in to Cypress').should('be.visible')
      })
    })
  })

  context('when user is logged in', () => {
    it('reaches correct "Create Project" state if project is not set up', () => {
      const { openLoginConnectModal } = useLoginConnectStore()

      cy.mountFragment(LoginConnectModalsContentFragmentDoc, {
        onResult: (result) => {
          // FIXME: not sure why I needed to add organizations and firstOrganization in such detail for TS
          result.cloudViewer = { ...CloudUserStubs.me,
            organizations: {
              __typename: 'CloudOrganizationConnection',
              nodes: [{
                __typename: 'CloudOrganization',
                name: `Cypress Test Account`,
                id: '122',
                projects: {
                  nodes: [],
                },
              }],
            },
            firstOrganization: {
              __typename: 'CloudOrganizationConnection',
              nodes: [{ __typename: 'CloudOrganization', id: '123' }],
            },
          }

          result.currentProject = null
        },
        render: (gqlVal) => {
          return <LoginConnectModalsContent gql={gqlVal} />
        },
      })

      cy.contains('Create project')
      .should('not.exist')
      .then(() => {
        openLoginConnectModal({ utmMedium: 'testing' })

        cy.contains('Connect project').click()
      })
    })
  })
})
