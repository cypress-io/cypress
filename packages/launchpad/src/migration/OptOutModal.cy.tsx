import OptOutModal from './OptOutModal.vue'

describe('<OptOutModal/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    cy.mount(OptOutModal)
  })
})
