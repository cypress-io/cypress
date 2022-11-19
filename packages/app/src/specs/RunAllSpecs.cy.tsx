import RunAllSpecs from './RunAllSpecs.vue'

describe('<RunAllSpecs/>', () => {
  context('Correctly rendered for Specs List', () => {
    beforeEach(() => {
      cy.mount(() => {
        return (
          <div class="flex justify-center">
            <RunAllSpecs specNumber={25}/>
          </div>
        )
      })
    })

    it('renders play icon and expected text', () => {
      cy.findByTestId('run-all-specs-button').children().should('have.length', 2)
      cy.findByTestId('run-all-specs-button').should('contain.text', 'Run 25 specs')
      cy.findByTestId('play-button').should('be.visible')
    })

    it('Renders styles correctly', () => {
      cy.findByTestId('run-all-specs-button')
      .should('have.css', 'align-items', 'center')
      .should('have.css', 'margin-left', '28px')
      .should('have.css', 'justify-content', 'normal')

      cy.findByTestId('run-all-specs-text')
      .should('have.css', 'font-size', '14px')
      .should('have.css', 'font-weight', '400')
      .should('have.css', 'display', 'inline')
      .should('have.css', 'line-height', '20px')

      cy.findByTestId('run-all-specs-button').realHover().then(() => {
        cy.findByTestId('run-all-specs-text').should('have.css', 'color', 'rgb(47, 58, 176)')
        cy.findByTestId('play-button').should('have.css', 'color', 'rgb(47, 58, 176)')
      })
    })
  }),
  context('Correctly rendered for Inline Specs list', () => {
    beforeEach(() => {
      cy.mount(() => {
        return (
          <div class="flex justify-center">
            <RunAllSpecs specNumber={40} runner={true}/>
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
