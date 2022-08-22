// TODO(webkit): fix+unskip for experimental webkit - also, maybe move to the correct context in type_spec
describe('issue 7170', { browser: '!webkit' }, () => {
  it('can type in a number field correctly', () => {
    cy.visit('fixtures/issue-7170.html')
    cy.get('button').click()
    cy.get('input')
    .type('2')
    .should('have.value', '12')
  })
})
