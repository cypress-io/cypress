import NeedManualUpdateModal from './NeedManualUpdateModal.vue'

describe('<NeedManualUpdateModal />', () => {
  it('should show a normal error', () => {
    cy.mount({
      name: 'NeedManualUpdateModal',
      render () {
        return (<div class="h-screen">
          <NeedManualUpdateModal show />
        </div>)
      },
    })
  })
})
