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

    describe('CASE 2: No transform after preserve-3d', () => {
      it('is invisible when target is not transformed but parent is rotated > 90deg', () => {
        cy.get('#a2-1-1').should('not.be.visible')
        cy.get('#a2-1-2').should('not.be.visible')
      })

      it('is always visible when target is transformed in identity and visible', () => {
        cy.get('#a2-2-1').should('be.visible')
        cy.get('#a2-2-2').should('be.visible')
        cy.get('#a2-2-3').should('be.visible')
        cy.get('#a2-2-4').should('be.visible')
      })

      it('is invisible when an element is backface-invisible whose parent is rotated > 90deg', () => {
        cy.get('#a2-5').should('not.be.visible')
      })

      it('is invisible when an element is rotated 45deg and its parent is 45deg', () => {
        cy.get('#a2-6').should('not.be.visible')
      })

      it('is visible when target 30deg + parent 30deg + grandparent 30deg', () => {
        cy.get('#a2-7').should('be.visible')
      })

      it('is visible when an element is rotated 190deg whose parent is roated 90deg', () => {
        cy.get('#a2-8').should('be.visible')
      })
    })
  })
})
