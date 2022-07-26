import { RunsErrorRendererFragmentDoc } from '../generated/graphql-test'
import RunsErrorRenderer from './RunsErrorRenderer.vue'

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

  it('should show a "not found" error', () => {
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
