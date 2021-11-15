import UpdateCypressModal from './UpdateCypressModal.vue'

describe('<UpdateCypressModal />', { viewportWidth: 1000, viewportHeight: 750 }, () => {
  it('renders', () => {
    cy.mount(UpdateCypressModal, {
      props: {
        installedVersion: '8.2.0',
        latestVersion: '10.0.0',
      },
    })

    cy.contains('Paste the command')
  })
})
