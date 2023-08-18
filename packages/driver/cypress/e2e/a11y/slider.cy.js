describe('a11y - slider', () => {
  beforeEach(() => {
    cy.visit('/fixtures/a11y/slider.html')
  })

  context('slider - handles activation', () => {
    it('semantic', () => {
      cy.get('#test-a11y-semantic-slider')
    })

    it('styled div', () => {
      cy.get('#test-a11y-styled-slider')
    })

    it('role', () => {
      cy.get('#test-a11y-role-slider')
    })
  })
})
