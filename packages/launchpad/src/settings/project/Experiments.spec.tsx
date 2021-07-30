import Experiments from './Experiments.vue'

describe('<Experiments />', () => {
  it('playground', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mount(() => (
      <div class="py-4 px-8">
        <Experiments/>
      </div>
      
    ))
  })
})
