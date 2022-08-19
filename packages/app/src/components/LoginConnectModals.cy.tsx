// import { SpecPatternModalFragmentDoc } from '../generated/graphql-test'
import LoginConnectModals from './LoginConnectModals.vue'

import { useLoginConnectStore } from '../store'

describe('<LoginConnectModals />', () => {
  it('should reflect store state on mount and update after', () => {
    const { setIsLoginConnectOpen, setUserStatus } = useLoginConnectStore()

    setIsLoginConnectOpen(true)
    setUserStatus('loggedOut')
    cy.mount(<LoginConnectModals />)

    cy.contains('loggedOut').then(() => {
      setUserStatus('needsAccess')
    })

    cy.contains('needsAccess').then(() => {
      setUserStatus('notConnected')
    })

    cy.contains('notConnected').then(() => {
      setIsLoginConnectOpen(false)
    })

    cy.contains('notConnected').should('not.exist')
  })
})
