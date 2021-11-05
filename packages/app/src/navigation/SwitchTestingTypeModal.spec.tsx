import SwitchTestingTypeModal from './SwitchTestingTypeModal.vue'
import { SwitchTestingTypeModalFragmentDoc } from '../generated/graphql-test'

describe('SidebarNavigationRow', () => {
  it('renders something', () => {
    cy.mountFragment(SwitchTestingTypeModalFragmentDoc, {
      render: (gql) => {
        return (<div>
          <SwitchTestingTypeModal gql={gql} show />
          <div id="tooltip-target"/>
        </div>)
      },
    })
  })
})
