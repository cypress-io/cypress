import { RunsErrorRendererFragmentDoc } from '../generated/graphql-test'
import RunsErrorRenderer from './RunsErrorRenderer.vue'
import { defaultMessages } from '@cy/i18n'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'

const text = defaultMessages.runs.errors

describe('<RunsErrorRenderer />', () => {
  it('should show a "connection failed" error', () => {
    cy.mountFragment(RunsErrorRendererFragmentDoc, {
      onResult (result) {
        result.currentProject = null
      },
      render (gql) {
        return <RunsErrorRenderer gql={gql} />
      },
    })

    cy.percySnapshot()
  })

  it('should show a "not found" error and opens reconnect modal', () => {
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

    const loginConnectStore = useLoginConnectStore()

    cy.spy(loginConnectStore, 'openLoginConnectModal').as('loginConnectSpy')

    cy.contains(text.notFound.title).should('be.visible')
    cy.contains(text.notFound.description.replace('{0}', 'projectId: "test-project-id"')).should('be.visible')
    cy.contains('button', text.notFound.button).click()

    cy.get('@loginConnectSpy').should('have.been.calledWith', { utmMedium: 'Runs Tab' })
    cy.percySnapshot()
  })

  describe('unauthorized', () => {
    it('should display a "request access" error', () => {
      cy.mountFragment(RunsErrorRendererFragmentDoc, {
        onResult (result) {
          if (result.currentProject) {
            result.currentProject.cloudProject = {
              __typename: 'CloudProjectUnauthorized',
              message: null,
            } as any
          }
        },
        render (gql) {
          return <RunsErrorRenderer gql={gql} />
        },
      })

      cy.percySnapshot()
    })

    it('should display an "access requested" error', () => {
      cy.mountFragment(RunsErrorRendererFragmentDoc, {
        onResult (result) {
          if (result.currentProject) {
            result.currentProject.cloudProject = {
              __typename: 'CloudProjectUnauthorized',
              message: null,
              hasRequestedAccess: true,
            } as any
          }
        },
        render (gql) {
          return <RunsErrorRenderer gql={gql} />
        },
      })

      cy.percySnapshot()
    })
  })
})
