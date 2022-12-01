import { DebugSpecsFragmentDoc } from '../generated/graphql-test'
import DebugContainer from './DebugContainer.vue'
import { defaultMessages } from '@cy/i18n'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'

describe('<DebugContainer />', () => {
  context('empty states', () => {
    const validateEmptyState = (expectedMessage: string) => {
      cy.mountFragment(DebugSpecsFragmentDoc, {
        render: (gqlVal) => {
          return (
            <DebugContainer
              gql={gqlVal}
            />
          )
        },
      })

      cy.findByTestId('debug-empty').contains(expectedMessage)
    }

    it('shows not logged in', () => {
      validateEmptyState(defaultMessages.debugPage.notLoggedIn)
    })

    it('is logged in', () => {
      const loginConnectStore = useLoginConnectStore()

      loginConnectStore.setUserFlag('isLoggedIn', true)

      validateEmptyState(defaultMessages.debugPage.notConnected)
    })

    it('has no runs', () => {
      const loginConnectStore = useLoginConnectStore()

      loginConnectStore.setUserFlag('isLoggedIn', true)
      loginConnectStore.setProjectFlag('isProjectConnected', true)
      cy.mountFragment(DebugSpecsFragmentDoc, {
        render: (gqlVal) => {
          return (
            <DebugContainer
              gql={gqlVal}
            />
          )
        },
      })

      cy.findByTestId('debug-empty').contains(defaultMessages.debugPage.noRuns)
    })
  })
})
