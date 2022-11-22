import InlineRunAllSpecs from './InlineRunAllSpecs.vue'

describe('<InlineRunAllSpecs/>', () => {
  context('Correctly rendered for Inline Specs list', () => {
    beforeEach(() => {
      cy.mount(() => {
        return (
          <div class="flex justify-center">
            <InlineRunAllSpecs specNumber={40} directory='cypress/e2e' />
          </div>
        )
      })
    })

    it('renders component correctly', () => {
      cy.findByTestId('tooltip').children().should('have.length', 1)
      cy.findByTestId('play-button').should('be.visible')
    })

    it('provides expected tooltip content', () => {
      cy.findByTestId('tooltip-content').should('not.exist')
      cy.findByTestId('tooltip').realHover().then(() => {
        cy.findByTestId('tooltip-content').should('contain.text', 'Run 40 specs')
      })
    })
  })
})
