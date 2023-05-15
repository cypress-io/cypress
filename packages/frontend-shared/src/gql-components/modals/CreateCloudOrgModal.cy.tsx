import { CreateCloudOrgModalFragmentDoc } from '../../generated/graphql-test'
import CreateCloudOrgModal from './CreateCloudOrgModal.vue'

describe('<CreateCloudOrgModal />', () => {
  context('when an organization needs to be created', () => {
    it('should show a normal error', () => {
      cy.mountFragment(CreateCloudOrgModalFragmentDoc, {
        render (gql) {
          return (<div class="h-screen">
            <CreateCloudOrgModal gql={gql}/>
          </div>)
        },
      })

      cy.findByTestId('create-org-link').should('be.visible')
      cy.findByTestId('refetch-button').should('be.visible')
    })
  })

  context('when creating an organization', () => {
    it('should show a "pending" button', () => {
      cy.mountFragment(CreateCloudOrgModalFragmentDoc, {
        render (gql) {
          return (<div class="h-screen">
            <CreateCloudOrgModal gql={gql}/>
          </div>)
        },
      })

      cy.findByTestId('create-org-link').click()

      cy.findByTestId('waiting-button').should('be.visible')
    })
  })
})
