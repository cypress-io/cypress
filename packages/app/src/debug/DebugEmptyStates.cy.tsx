import DebugNotLoggedIn from './DebugNotLoggedIn.vue'
import DebugNoProject from './DebugNoProject.vue'
import DebugNoRuns from './DebugNoRuns.vue'
import DebugLoading from './DebugLoading.vue'
import DebugError from './DebugError.vue'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'

describe('Debug page empty states', () => {
  beforeEach(() => {
    cy.viewport(900, 800)
  })

  context('not logged in', () => {
    it('renders', () => {
      const loginConnectStore = useLoginConnectStore()

      // We need to set isLoggedIn so that CloudConnectButton shows the correct state
      loginConnectStore.setUserFlag('isLoggedIn', false)

      cy.mount(<DebugNotLoggedIn />)

      cy.percySnapshot()
    })
  })

  context('no project', () => {
    it('renders', () => {
      const loginConnectStore = useLoginConnectStore()

      // We need to set isLoggedIn so that CloudConnectButton shows the correct state
      loginConnectStore.setUserFlag('isLoggedIn', true)

      cy.mount(<DebugNoProject />)

      cy.percySnapshot()
    })
  })

  context('no runs', () => {
    it('renders', () => {
      cy.mount(<DebugNoRuns />)

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

      cy.percySnapshot()
    })
  })
})
