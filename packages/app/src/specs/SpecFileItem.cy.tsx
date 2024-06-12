import SpecFileItem from './SpecFileItem.vue'

describe('SpecFileItem', () => {
  it('renders a SpecFileItem with the base filename and extension having different highlights when not selected', () => {
    cy.mount(() =>
      (<div class="bg-gray-1000 group">
        <SpecFileItem fileName="Hello" extension=".spec.jsx" selected={false}></SpecFileItem>
      </div>))

    cy.contains('Hello.spec.jsx').should('be.visible')
  })

  it('renders a SpecFileItem with the base filename and extension when selected', () => {
    cy.mount(() =>
      (<div class="bg-gray-1000 group">
        <SpecFileItem fileName="Hello" extension=".spec.jsx" selected={true}></SpecFileItem>
      </div>))

    cy.contains('Hello.spec.jsx').should('be.visible')
  })

  it('truncates spec name if it exceeds container width and provides title for full spec name', () => {
    const specFileName = `${'Long'.repeat(20)}Name`

    // Shrink viewport width so spec name is truncated
    cy.viewport(400, 850)

    cy.mount(() => (
      <div>
        <SpecFileItem fileName={specFileName} extension=".cy.tsx"></SpecFileItem>
      </div>))

    // We should be able to see at least the first 20 characters of the spec name
    // It should have a title attribute that is equal to the full file name
    cy.contains(specFileName.substring(0, 20)).should('be.visible').parent().should('have.attr', 'title', `${specFileName}.cy.tsx`)

    // The file extension shouldn't be visible because it is past the truncation point
    cy.contains('.cy.tsx').should('not.be.visible')
  })
})
