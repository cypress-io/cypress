const viewportWidth = 200
const viewportHeight = 100

describe('cypress.json viewport',
  { viewportWidth, viewportHeight },
  () => {
    it('should have the correct dimensions', () => {
      cy.wrap('run a cy command before should')
      // cy.should cannot be the first cy command we run
      cy.should(() => {
        expect(window.innerWidth).to.eq(viewportWidth)
        expect(window.innerHeight).to.eq(viewportHeight)
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
})
