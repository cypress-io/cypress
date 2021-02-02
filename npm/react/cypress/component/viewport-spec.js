const viewportWidth = 200
const viewportHeight = 100

describe('cypress.json viewport',
  { viewportWidth, viewportHeight },
  () => {
    it('should have the correct dimensions', () => {
      // cy.should cannot be the first cy command we run
      cy.window().should((w) => {
        expect(w.innerWidth).to.eq(viewportWidth)
        expect(w.innerHeight).to.eq(viewportHeight)
      })
    })
  })

describe('cy.viewport', () => {
  it('should resize the viewport', () => {
    cy.viewport(viewportWidth, viewportHeight).should(() => {
      expect(window.innerWidth).to.eq(viewportWidth)
      expect(window.innerHeight).to.eq(viewportHeight)
    })
  })

  it('should make it scale down when overflowing', () => {
    cy.viewport(20000, 200).should(() => {
      expect(getComputedStyle(window.parent.document.querySelector('iframe').parentElement).transform).not.to.contain('matrix(1')
    })
  })
})
