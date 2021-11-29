import CreateCloudOrgModal from './CreateCloudOrgModal.vue'

describe('<CreateCloudOrgModal />', () => {
  it('should show a normal error', () => {
    cy.mount({
      name: 'CreateCloudOrgModal',
      render () {
        return (<div class="h-screen">
          <CreateCloudOrgModal show />
        </div>)
      },
    })
  })
})
