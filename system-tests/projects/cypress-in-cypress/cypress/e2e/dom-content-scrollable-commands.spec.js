describe('Dom Content - Scrollable Assertions', () => {
  beforeEach(() => {
    cy.visit('cypress/e2e/dom-content.html')
  })

  // create enough commands in the command log to enable scrolling
  ;[...Array(25).keys()].forEach((idx) => {
    it(`checks for list items to exist - iteration #${idx + 1}`, () => {
      cy.get('li').contains('Item 1').should('exist')
      cy.get('li').contains('Item 2').should('exist')
      cy.get('li').contains('Item 3').should('exist')
    })
  })

  // allow the cy-in-cy test to perform user interaction during this long test
  it('waits for an arbitrary amount of time', () => {
    cy.wait((50000))
  })
})
