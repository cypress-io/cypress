describe('a11y - slider', () => {
  beforeEach(() => {
    cy.visit('/fixtures/a11y/slider.html')
  })

  context('slider - handles activation', () => {
    it('semantic', () => {
      cy.get('#test-a11y-semantic-slider').as('range')
      .focus()
      .invoke('val', 1)
      .trigger('change')
      .should('have.value', '1')
    })

    it('styled div', () => {
      cy.get('#test-a11y-styled-slider-container').click(20, 4)
    })

    it('role', () => {
      cy.get('#test-a11y-role-slider-container')
      .click(20, 4)
      .should('have.attr', 'aria-valuenow')
      .and('equal', '1')

      cy.get('#test-a11y-role-slider-container')
      .type('{rightArrow}')
      .should('have.attr', 'aria-valuenow')
      .and('equal', '2')
    })
  })
})
