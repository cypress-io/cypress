describe('issue #5682 - backface visibility', () => {
  beforeEach(() => {
    cy.visit('/fixtures/issue-5682.html')
  })

  describe('basic cases', () => {
    it('is visible when there is no transform', () => {
      cy.get('#b-1').should('be.visible')
    })

    it('is visible when an element is rotated < 90 degrees', () => {
      cy.get('#b-2').should('be.visible')
      cy.get('#b-3').should('be.visible')
    })

    it('is invisible when an element is rotated > 90 degrees', () => {
      cy.get('#b-4').should('not.be.visible')
      cy.get('#b-5').should('not.be.visible')
    })

    it('is invisible when an element is rotated in exact 90 degrees', () => {
      cy.get('#b-6').should('not.be.visible')
      cy.get('#b-7').should('not.be.visible')
    })

    it('is visible when an element is not backface-visibility: hidden but rotated > 90 degrees', () => {
      cy.get('#b-8').should('be.visible')
    })
  })

  describe('affected by ancestors', () => {
    describe('CASE 1: all transform-style: flat', () => {
      it('is invisible when parent is hidden', () => {
        cy.get('#a1-1').should('not.be.visible')
      })

      it('is visible when parent is visible', () => {
        cy.get('#a1-2').should('be.visible')
      })

      it('is visible when parent is rotated > 90 degrees with an element backface-visibility: hidden', () => {
        cy.get('#a1-3').should('be.visible')
      })
    })
  })
})
