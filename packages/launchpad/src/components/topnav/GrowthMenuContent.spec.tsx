import GrowthMenuContent from './GrowthMenuContent.vue'

describe('<GrowthMenuContent />', { viewportWidth: 500, viewportHeight: 750 }, () => {
  it('renders', () => {
    cy.mount({
      render: () => {
        return (<div class="w-484px border">
          <GrowthMenuContent type="ci"/>
          <hr class="my-32px" />
          <GrowthMenuContent type="orchestration"/>
        </div>)
      },
    })
  })
})
