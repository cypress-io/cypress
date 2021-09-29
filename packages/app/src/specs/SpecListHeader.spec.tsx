import SpecsListHeader from './SpecsListHeader.vue'

describe('<SpecsListHeader />', () => {
  beforeEach(() => {
    cy.mount(() => (
      <div class="py-4 px-8">
        <SpecsListHeader/>
      </div>
    ))
  })

  it('renders', () => {

  })
})
