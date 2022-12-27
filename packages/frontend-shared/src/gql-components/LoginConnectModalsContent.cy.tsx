import { LoginConnectModalsContentFragmentDoc } from '../generated/graphql-test'
import LoginConnectModalsContent from './LoginConnectModalsContent.vue'
import { CloudUserStubs } from '@packages/graphql/test/stubCloudTypes'
import { SelectCloudProjectModal_CreateCloudProjectDocument } from '../generated/graphql'

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
    it('shows "Create Project" state if project is not set up', () => {
      const { openLoginConnectModal, setUserFlag, setProjectFlag } = useLoginConnectStore()

      setUserFlag('isLoggedIn', true)
      setUserFlag('isMemberOfOrganization', true)
      setUserFlag('isOrganizationLoaded', true)
      setProjectFlag('isConfigLoaded', true)
      setProjectFlag('isProjectConnected', false)

      cy.mountFragment(LoginConnectModalsContentFragmentDoc, {
        onResult: (result) => {
          result.cloudViewer = { ...CloudUserStubs.me,
            firstOrganization: {
              __typename: 'CloudOrganizationConnection',
              nodes: [{ __typename: 'CloudOrganization', id: '122' }],
            },
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
          }

          result.currentProject = null
        },
        render: (gqlVal) => {
          return <LoginConnectModalsContent gql={gqlVal} />
        },
      })

      const createProjectStub = cy.stub().as('createProjectStub')

      cy.stubMutationResolver(SelectCloudProjectModal_CreateCloudProjectDocument, (defineResult, variables) => {
        createProjectStub(variables)

        return defineResult({} as any)
      })

      cy.contains('Create project')
      .should('not.exist')
      .then(() => {
        openLoginConnectModal({ utmMedium: 'testing' })
      })

      cy.findAllByLabelText('Project name*(You can change this later)').type('test-project')

      cy.contains('button', 'Create project')
      .click()
      .then(() => {
        expect(createProjectStub.lastCall.args[0]).to.deep.eq({
          name: 'test-project',
          orgId: '122',
          medium: 'testing',
          source: 'Binary: Launchpad',
          public: false,
          campaign: 'Create project',
          cohort: '',
        })
      })

      cy.get('@createProjectStub').should('have.been.calledOnce')
    })
  })
})
