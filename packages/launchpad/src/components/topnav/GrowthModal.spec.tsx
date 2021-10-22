import GrowthModals from './GrowthModals.vue'

describe('<GrowthModals />', { viewportWidth: 1000, viewportHeight: 750 }, () => {
  it('renders', () => {
    cy.mount({
      render: () => <div><GrowthModals type="ci"/></div>,
    })
  })
})
