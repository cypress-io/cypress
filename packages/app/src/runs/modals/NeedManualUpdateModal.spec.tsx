import { NeedManualUpdateModalFragmentDoc } from '../../generated/graphql-test'
import NeedManualUpdateModal from './NeedManualUpdateModal.vue'

describe('<NeedManualUpdateModal />', () => {
  it('should show a normal error', () => {
    cy.mountFragment(NeedManualUpdateModalFragmentDoc, {
      onResult: (result) => {
        result.projectId = null
        // result.newCloudProject = { projectId: 'asdfgh' }
      },
      render (gql) {
        return (<div class="h-screen">
          <NeedManualUpdateModal gql={gql} />
        </div>)
      },
    })
  })
})
