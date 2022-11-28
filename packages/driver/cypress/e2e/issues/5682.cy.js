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

      it('is visible when an element is backface-invisible whose parent is rotated > 90deg', () => {
        cy.get('#a1-3').should('be.visible')
      })

      it('is invisible when an element is rotated 190deg whose parent is rotated 90deg', () => {
        cy.get('#a1-4').should('not.be.visible')
      })
    })

    describe('CASE 2: when direct parents have preserve-3d', () => {
      it('target hidden + parents', () => {
        cy.get('#a2-1-1').should('not.be.visible')
        cy.get('#a2-1-2').should('not.be.visible')
        cy.get('#a2-1-3').should('not.be.visible')
        cy.get('#a2-1-4').should('not.be.visible')
      })

      it('target visible + parent visible', () => {
        cy.get('#a2-2-1').should('be.visible')
        cy.get('#a2-2-2').should('be.visible')
        cy.get('#a2-2-3').should('not.be.visible')
        cy.get('#a2-2-4').should('not.be.visible')
      })

      it('target visible + parent hidden', () => {
        cy.get('#a2-3-1').should('be.visible')
        cy.get('#a2-3-2').should('not.be.visible')
        cy.get('#a2-3-3').should('not.be.visible')
      })
    })

    it('issue case', () => {
      cy.get('.front').should('be.visible')
      cy.get('.back').should('not.be.visible')
      cy.get('.container').click()
      cy.get('.front').should('not.be.visible')
      cy.get('.back').should('be.visible')
    })
  })
})
