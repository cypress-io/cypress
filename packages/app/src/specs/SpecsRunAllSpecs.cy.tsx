import SpecsRunAllSpecs from './SpecsRunAllSpecs.vue'

describe('<SpecsRunAllSpecs/>', () => {
  context('Correctly rendered for Specs List', () => {
    beforeEach(() => {
      cy.mount(() => {
        return (
          <div class="flex justify-center">
            <SpecsRunAllSpecs specNumber={25} directory='cypress/e2e' />
          </div>
        )
      })
    })

    it('renders play icon and expected text', () => {
      cy.findByTestId('run-all-specs-for-cypress/e2e').as('button').children().should('have.length', 2)
      cy.get('@button').should('contain.text', 'Run 25 specs')
      cy.findByTestId('play-button').should('be.visible')
    })

    it('Renders styles correctly', () => {
      cy.findByTestId('run-all-specs-for-cypress/e2e').as('button')
      .should('have.css', 'align-items', 'center')
      .should('have.css', 'margin-left', '24px')
      .should('have.css', 'justify-content', 'normal')

      cy.findByTestId('run-all-specs-text')
      .should('have.css', 'font-size', '14px')
      .should('have.css', 'font-weight', '400')
      .should('have.css', 'display', 'inline')
      .should('have.css', 'line-height', '20px')

      cy.get('@button').realHover().then(() => {
        cy.findByTestId('run-all-specs-text').should('have.css', 'color', 'rgb(47, 58, 176)')
        cy.findByTestId('play-button').should('have.css', 'color', 'rgb(47, 58, 176)')
      })
    })
  })
})
