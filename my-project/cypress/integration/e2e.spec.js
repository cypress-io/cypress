describe('e2e', () => {
  it('increments', () => {
    cy.visit('http://localhost:8080')
    cy.get('div').contains('Count is 0')
    cy.get('button').click()
    cy.get('div').contains('Count is 1')
  })
})
