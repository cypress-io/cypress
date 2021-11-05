import SwitchTestingTypeModal from './SwitchTestingTypeModal.vue'
import { SwitchTestingTypeModalFragmentDoc } from '../generated/graphql-test'

describe('SidebarNavigationRow', () => {
  it('renders something', () => {
    cy.mountFragment(SwitchTestingTypeModalFragmentDoc, {
      onResult (result) {
        if (result.activeProject) {
          result.activeProject.isCTConfigured = true
          result.activeProject.isE2EConfigured = false
        }
      },
      render: (gql) => {
        return <SwitchTestingTypeModal gql={gql} show />
      },
    })
  })
})
