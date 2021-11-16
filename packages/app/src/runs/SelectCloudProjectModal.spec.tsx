import SelectCloudProjectModal from './SelectCloudProjectModal.vue'

describe('<SelectCloudProjectModal />', () => {
  it('playground', () => {
    cy.mount({
      name: 'SelectCloudProjectModal',
      render () {
        return (<div class="h-screen">
          <SelectCloudProjectModal show />
        </div>)
      },
    })

    cy.contains('Create new').click()
  })
})
