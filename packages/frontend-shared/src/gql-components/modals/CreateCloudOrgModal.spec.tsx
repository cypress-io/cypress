import { CreateCloudOrgModalFragmentDoc } from '../../generated/graphql-test'
import CreateCloudOrgModal from './CreateCloudOrgModal.vue'

describe('<CreateCloudOrgModal />', () => {
  it('should show a normal error', () => {
    cy.mountFragment(CreateCloudOrgModalFragmentDoc, {

      render (gql) {
        return (<div class="h-screen">
          <CreateCloudOrgModal gql={gql}/>
        </div>)
      },
    })
  })
})
