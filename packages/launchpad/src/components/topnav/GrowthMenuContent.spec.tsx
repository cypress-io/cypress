import GrowthMenuContent from './GrowthMenuContent.vue'

describe('<GrowthMenuContent />', { viewportWidth: 1000, viewportHeight: 750 }, () => {
  it('renders', () => {
    cy.mount({
      render: () => {
        return (<div>
          <GrowthMenuContent type="ci"/>
          <GrowthMenuContent type="orchestration"/>
        </div>)
      },
    })
  })
})
