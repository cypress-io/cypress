import { RunsErrorRendererFragmentDoc } from '../generated/graphql-test'
import RunsErrorRenderer from './RunsErrorRenderer.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'

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

    cy.contains('h2', 'Cannot connect to Cypress Cloud')
    cy.contains('p', 'The request times out when trying to retrieve the recorded runs from Cypress Cloud. Please refresh the page to try again and visit out Support page if this behavior continues.')
    cy.findByTestId('external').contains('Support page').should('have.attr', 'href', 'https://www.cypressstatus.com/')
    cy.contains('button', 'Try again')
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

    const userProjectStatusStore = useUserProjectStatusStore()

    cy.spy(userProjectStatusStore, 'openLoginConnectModal').as('loginConnectSpy')

    cy.contains(text.notFound.title).should('be.visible')
    cy.contains(text.notFound.description.replace('{0}', 'projectId: "test-project-id"')).should('be.visible')
    cy.contains('button', text.notFound.button).click()

    cy.get('@loginConnectSpy').should('have.been.calledWith', { utmMedium: 'Runs Tab' })
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

      cy.contains('h2', 'Request access to view the recorded runs')
      cy.contains('p', 'This is a private project that you do not currently have access to. Please request access from the project owner in order to view the list of runs.')
      cy.contains('button', 'Request access')
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

      cy.contains('h2', 'Your access request for this project has been sent.')
      cy.contains('p', 'The owner of this project has been notified of your request. We\'ll notify you via email when your access request has been granted.')
      cy.contains('button', 'Request Sent').should('be.disabled')
    })
  })
})
