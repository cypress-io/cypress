import SpecItem from './SpecItem.vue'

describe('SpecItem', () => {
  it('renders a SpecItem', () => {
    cy.mount(() => (
      <div>
        <SpecItem fileName="Render" extension=".cy.tsx"></SpecItem>
        <SpecItem fileName="FirstThreeHighlighted" extension=".cy.tsx" indexes={[0, 1, 2]}></SpecItem>
      </div>))

    cy.contains('Render.cy.tsx').should('be.visible')

    cy.contains('FirstThreeHighlighted.cy.tsx').within(() => {
      // due to the indexes provided ([0, 1, 2]) the first 3 letters should not
      // match the color inherited from the parent
      cy.wrap(['F', 'i', 'r']).each((letter: string) => {
        cy.contains('span', letter).should(($el) => {
          if (!$el || typeof $el !== 'object') {
            return
          }

          const parentColor = getComputedStyle($el.parent()[0]).color
          const highlightedElementColor = getComputedStyle($el[0]).color

          expect(highlightedElementColor).not.to.equal(parentColor)
        })
      })

      // the next next letter, s, should match the parent color
      cy.contains('span', 's').should(($el) => {
        if (!$el || typeof $el !== 'object') {
          return
        }

        const parentColor = getComputedStyle($el.parent()[0]).color
        const highlightedElementColor = getComputedStyle($el[0]).color

        expect(highlightedElementColor).to.equal(parentColor)
      })
    })
  }),
  it('truncates spec name if it exceeds container width and provides title for full spec name', () => {
    const specFileName = `${'Long'.repeat(20)}Name`

    // Shrink viewport width so spec name is truncated
    cy.viewport(400, 850)

    cy.mount(() => (
      <div>
        <SpecItem fileName={specFileName} extension=".cy.tsx"></SpecItem>
      </div>))

    // We should be able to see at least the first 20 characters of the spec name
    // It should have a title attribute that is equal to the full file name
    cy.contains(specFileName.substring(0, 20)).should('be.visible').parent().should('have.attr', 'title', `${specFileName}.cy.tsx`)

    // The file extension shouldn't be visible because it is past the truncation point
    cy.contains('.cy.tsx').should('not.be.visible')
  })
})
