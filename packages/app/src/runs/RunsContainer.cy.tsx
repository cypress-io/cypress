import RunsContainer from './RunsContainer.vue'
import { RunsContainerFragmentDoc } from '../generated/graphql-test'
import { CloudUserStubs } from '@packages/frontend-shared/cypress/support/mock-graphql/stubgql-CloudTypes'

import { defaultMessages } from '@cy/i18n'

describe('<RunsContainer />', { keystrokeDelay: 0 }, () => {
  const cloudViewer = {
    ...CloudUserStubs.me,
    organizations: null,
    organizationControl: null,
  }

  context('when the user is logged in', () => {
    it('renders with expected runs if there is a cloud project id', () => {
      cy.mountFragment(RunsContainerFragmentDoc, {
        onResult: (result) => {
          result.cloudViewer = cloudViewer
        },
        render (gqlVal) {
          return <RunsContainer gql={gqlVal} />
        },
      })

      const statuses = ['CANCELLED', 'ERRORED', 'FAILED', 'NOTESTS', 'OVERLIMIT', 'PASSED', 'RUNNING', 'TIMEDOUT']

      cy.wrap(statuses).each((status: string) => {
        cy.contains(`fix: make gql work ${ status}`).should('be.visible')
      })

      cy.percySnapshot()
    })

    it('renders instructions and "connect" link without a project id', () => {
      cy.mountFragment(RunsContainerFragmentDoc, {
        onResult: (result) => {
          result.cloudViewer = cloudViewer
          if (result.currentProject?.projectId) {
            result.currentProject.projectId = ''
          }
        },
        render (gqlVal) {
          return <RunsContainer gql={gqlVal} />
        },
      })

      const text = defaultMessages.runs.connect

      cy.contains(text.title).should('be.visible')
      cy.contains(text.smartText).should('be.visible')
      cy.contains(text.debugText).should('be.visible')
      cy.contains(text.chartText).should('be.visible')
      cy.contains(text.buttonProject).should('be.visible')
      cy.percySnapshot()
    })
  })

  context('when the user is logged out', () => {
    it('renders instructions and login button', () => {
      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          return <RunsContainer gql={gqlVal} />
        },
      })

      const text = defaultMessages.runs.connect

      cy.contains(text.title).should('be.visible')
      cy.contains(text.smartText).should('be.visible')
      cy.contains(text.debugText).should('be.visible')
      cy.contains(text.chartText).should('be.visible')
      cy.contains(text.buttonUser).should('be.visible')
      cy.percySnapshot()
    })
  })
})
