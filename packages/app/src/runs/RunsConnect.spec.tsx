import RunsConnect from './RunsConnect.vue'
import { RunsConnectFragmentDoc } from '../generated/graphql-test'
import { CloudUserStubs } from '@packages/frontend-shared/cypress/support/mock-graphql/stubgql-CloudTypes'

describe('<RunsConnect />', () => {
  it('show user connect if not connected', () => {
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

  const cloudViewer = {
    ...CloudUserStubs.me,
    organizationControl: null,
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
    cy.mountFragment(RunsConnectFragmentDoc, {
      onResult: (result) => {
        result.cloudViewer = cloudViewer
      },
      render (gqlVal) {
        return <div class="h-screen"><RunsConnect gql={gqlVal} /></div>
      },
    })

    cy.contains('button', 'Connect your project').should('be.visible')
  })

  it('shows connect project dialog', () => {
    cy.mountFragment(RunsConnectFragmentDoc, {
      onResult: (result) => {
        result.cloudViewer = cloudViewer
      },
      render (gqlVal) {
        return <div class="h-screen"><RunsConnect gql={gqlVal} /></div>
      },
    })

    cy.contains('button', 'Connect your project').click()
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('[role="dialog"] h2').should('contain', 'Connect Project')
  })
})
