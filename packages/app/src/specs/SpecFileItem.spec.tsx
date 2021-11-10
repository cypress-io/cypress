import SpecFileItem from './SpecFileItem.vue'

describe('SpecFileItem', () => {
  it('should render SpecFileItem', () => {
    cy.mount(() =>
      (<div class="bg-gray-1000 group">
        <SpecFileItem fileName="Hello" extension=".spec.jsx" selected={false}></SpecFileItem>
      </div>))
  })

  it('should highlight text when selected', () => {
    const fileName = 'Hello'

    cy.mount(() =>
      (<div class="bg-gray-1000 group">
        <SpecFileItem fileName={fileName} extension=".spec.jsx" selected={true}/>
      </div>))

    cy.findByText(fileName).should('have.class', 'text-white')
    cy.get('svg').should('have.class', 'icon-dark-indigo-300').and('have.class', 'icon-light-indigo-600')
  })
})
