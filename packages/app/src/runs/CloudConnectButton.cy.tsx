import CloudConnectButton from './CloudConnectButton.vue'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'

describe('<CloudConnectButton />', { viewportHeight: 60, viewportWidth: 400 }, () => {
  context('not logged in ', () => {
    it('show user connect if not connected', () => {
      cy.mount(() => <div class="h-screen"><CloudConnectButton utmMedium="testing" /></div>)

      cy.contains('button', 'Log in').should('be.visible')
    })
  })

  context('logged in', () => {
    let loginConnectStore

    beforeEach(() => {
      loginConnectStore = useLoginConnectStore()

      loginConnectStore.setUserFlag('isLoggedIn', true)
    })

    it('show project connect if not connected', () => {
      cy.mount(() => <div class="h-screen"><CloudConnectButton utmMedium="testing" /></div>)

      cy.contains('button', 'Connect your project').should('be.visible')
    })

    it('uses the store to open the Login Connect modal', () => {
      loginConnectStore.openLoginConnectModal = cy.spy().as('openLoginConnectModal')
      cy.mount(() => <div class="h-screen"><CloudConnectButton utmMedium="testing" /></div>)

      cy.contains('button', 'Connect your project').click()

      cy.get('@openLoginConnectModal').should('have.been.calledWith', { utmMedium: 'testing' })
    })
  })
})
