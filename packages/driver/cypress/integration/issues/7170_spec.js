describe('issue 7170', () => {
  it('can type in a number field correctly', () => {
    cy.visit('fixtures/issue-7170.html')
    cy.get('button').click()
    cy.get('input')
    .type('2')
    .should('have.value', '12')
  })
})
