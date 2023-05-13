import RunsContainer from './RunsContainer.vue'
import { RunsContainerFragmentDoc } from '../generated/graphql-test'
import { CloudUserStubs } from '@packages/graphql/test/stubCloudTypes'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'

import { defaultMessages } from '@cy/i18n'

describe('<RunsContainer />', { keystrokeDelay: 0 }, () => {
  const cloudViewer = {
    ...CloudUserStubs.me,
    organizations: null,
    firstOrganization: {
      nodes: [],
    },
  }

  context('when the user is logged in', () => {
    beforeEach(() => {
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setUserFlag('isLoggedIn', true)
    })

    it('renders with expected runs if there is a cloud project id', () => {
      cy.mountFragment(RunsContainerFragmentDoc, {
        onResult: (result) => {
          result.cloudViewer = cloudViewer
        },
        render (gqlVal) {
          return <RunsContainer gql={gqlVal} online />
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
          return <RunsContainer gql={gqlVal} online />
        },
      })

      const text = defaultMessages.runs.connect

      cy.contains(text.title).should('be.visible')
      cy.contains(text.buttonProject).should('be.visible')
      cy.percySnapshot()
    })
  })

  context('when the user is logged out', () => {
    it('renders instructions and login button', () => {
      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          return <RunsContainer gql={gqlVal} online />
        },
      })

      const text = defaultMessages.runs.connect

      cy.contains(text.title).should('be.visible')
      cy.contains(text.buttonUser).should('be.visible')
      cy.percySnapshot()
    })
  })

  context('when the user has no recorded runs', () => {
    it('renders instructions and record prompt', () => {
      cy.mountFragment(RunsContainerFragmentDoc, {
        onResult (gql) {
          gql.cloudViewer = cloudViewer
          if (gql.currentProject?.cloudProject?.__typename === 'CloudProject') {
            gql.currentProject.cloudProject.runs = {
              __typename: 'CloudRunConnection',
              pageInfo: null as any,
              nodes: [],
            }
          }
        },
        render (gqlVal) {
          return <RunsContainer gql={gqlVal} online />
        },
      })

      const text = defaultMessages.runs.empty

      cy.contains(text.title).should('be.visible')
      cy.percySnapshot()
    })
  })

  context('with errors', () => {
    it('renders connection failed', () => {
      cy.mountFragment(RunsContainerFragmentDoc, {
        onResult (result) {
          result.cloudViewer = cloudViewer
          result.currentProject!.cloudProject = null
        },
        render (gqlVal) {
          return <RunsContainer gql={gqlVal} online onReExecuteRunsQuery={cy.spy().as('reExecuteRunsQuery')}/>
        },
      })

      const { title, description, link, button } = defaultMessages.runs.errors.connectionFailed

      cy.contains(title).should('be.visible')
      cy.contains(description.replace('{0}', link)).should('be.visible')
      cy.contains('a', link).should('have.attr', 'href', 'https://www.cypressstatus.com/')
      cy.contains('button', button).should('be.visible').click()

      cy.get('@reExecuteRunsQuery').should('have.been.called')

      cy.percySnapshot()
    })
  })
})
