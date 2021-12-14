import SpecFileItem from './SpecFileItem.vue'

describe('SpecFileItem', () => {
  it('should render SpecFileItem', () => {
    cy.mount(() =>
      (<div class="bg-gray-1000 group">
        <SpecFileItem fileName="Hello" extension=".spec.jsx" selected={false}></SpecFileItem>
      </div>))
  })
})
