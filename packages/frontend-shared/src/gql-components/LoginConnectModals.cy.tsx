// import { SpecPatternModalFragmentDoc } from '../generated/graphql-test'
import LoginConnectModals from './LoginConnectModals.vue'

import { useLoginConnectStore } from '../store/login-connect-store'

describe('<LoginConnectModals />', () => {
  it('should reflect store state on mount and update after', () => {
    const { setIsLoginConnectOpen } = useLoginConnectStore()

    cy.mount(LoginConnectModals)
    setIsLoginConnectOpen(true)
  })
})
