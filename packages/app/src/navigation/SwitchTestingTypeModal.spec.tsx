import SwitchTestingTypeModal from './SwitchTestingTypeModal.vue'
import { SwitchTestingTypeModalFragmentDoc } from '../generated/graphql-test'

describe('SidebarNavigationRow', () => {
  it('renders something', () => {
    cy.mountFragment(SwitchTestingTypeModalFragmentDoc, {
      onResult (result) {
        result.isCTConfigured = true
        result.isE2EConfigured = false
      },
      render: (gql) => {
        return <SwitchTestingTypeModal gql={gql} show />
      },
    })
  })
})
