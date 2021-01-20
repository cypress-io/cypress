const viewportWidth = 200
const viewportHeight = 100

describe('cypress.json viewport', { viewportWidth, viewportHeight }, () => {
  it('should have the correct dimensions', () => {
    cy.should(() => {
      expect(window.innerWidth).to.eq(viewportWidth)
      expect(window.innerHeight).to.eq(viewportHeight)
    })
  })
})

describe('cy.viewport', () => {
  it('should resize the viewport', () => {
    cy.viewport(viewportWidth, viewportWidth).should(() => {
      expect(window.innerWidth).to.eq(viewportWidth)
      expect(window.innerHeight).to.eq(viewportHeight)
    })
  })
})
