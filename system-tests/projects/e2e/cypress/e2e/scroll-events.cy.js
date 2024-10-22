describe('handles scroll events as expected', () => {
  it('waits for javascript to finish', () => {
    cy.visit('/scroll-events.html')
    cy.contains('stage:1')
    cy.contains('stage:2')
    cy.contains('stage:3')
    cy.contains('done')
    cy.get('#number-of-scrolls').should('have.text', '4')
  })
})
