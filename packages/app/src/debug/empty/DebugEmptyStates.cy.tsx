import DebugNotLoggedIn from './DebugNotLoggedIn.vue'
import DebugNoProject from './DebugNoProject.vue'
import DebugNoRuns from './DebugNoRuns.vue'
import DebugLoading from './DebugLoading.vue'
import DebugError from './DebugError.vue'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'

describe('Debug page empty states', () => {
  context('not logged in', () => {
    it('renders', () => {
      const loginConnectStore = useLoginConnectStore()

      // We need to set isLoggedIn so that CloudConnectButton shows the correct state
      loginConnectStore.setUserFlag('isLoggedIn', false)

      cy.mount(<DebugNotLoggedIn />)

      cy.findByRole('link', { name: 'Learn about debugging CI failures in Cypress' }).should('have.attr', 'href', 'https://on.cypress.io/debug-page?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')

      cy.percySnapshot()
    })
  })

  context('no project', () => {
    it('renders', () => {
      const loginConnectStore = useLoginConnectStore()

      // We need to set isLoggedIn so that CloudConnectButton shows the correct state
      loginConnectStore.setUserFlag('isLoggedIn', true)

      cy.mount(<DebugNoProject />)

      cy.findByRole('link', { name: 'Learn about project setup in Cypress' }).should('have.attr', 'href', 'https://on.cypress.io/adding-new-project?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')

      cy.percySnapshot()

      cy.viewport(600, 600)

      cy.percySnapshot('responsive')
    })
  })

  context('no runs', () => {
    it('renders', () => {
      cy.mount(<DebugNoRuns />)

      cy.findByRole('link', { name: 'Learn about recording a run to Cypress Cloud' }).should('have.attr', 'href', 'https://on.cypress.io/cypress-run-record-key?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')

      cy.percySnapshot()
    })
  })

  context('loading', () => {
    it('renders', () => {
      cy.mount(<DebugLoading />)

      cy.percySnapshot()
    })
  })

  context('error', () => {
    it('renders', () => {
      cy.mount(<DebugError />)

      cy.findByRole('link', { name: 'Learn about debugging CI failures in Cypress' }).should('have.attr', 'href', 'https://on.cypress.io/debug-page?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')

      cy.percySnapshot()
    })
  })
})
