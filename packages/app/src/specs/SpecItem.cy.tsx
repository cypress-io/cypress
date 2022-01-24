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

          cy.wrap(highlightedElementColor).should('not.equal', parentColor)
        })
      })

      // the next next letter, s, should match the parent color
      cy.contains('span', 's').should(($el) => {
        if (!$el || typeof $el !== 'object') {
          return
        }

        const parentColor = getComputedStyle($el.parent()[0]).color
        const highlightedElementColor = getComputedStyle($el[0]).color

        cy.wrap(highlightedElementColor).should('equal', parentColor)
      })
    })

    cy.percySnapshot()
  })
})
