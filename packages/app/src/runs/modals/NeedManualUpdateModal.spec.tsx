import { NeedManualUpdateModalFragmentDoc } from '../../generated/graphql-test'
import NeedManualUpdateModal from './NeedManualUpdateModal.vue'

describe('<NeedManualUpdateModal />', () => {
  it('should show a normal error', () => {
    cy.mountFragment(NeedManualUpdateModalFragmentDoc, {
      onResult: (result) => {
        result.projectId = null
      },
      render (gql) {
        return (<div class="h-screen">
          <NeedManualUpdateModal gql={gql} newProjectId='123456'/>
        </div>)
      },
    })

    cy.contains('123456').should('be.visible')
  })
})
