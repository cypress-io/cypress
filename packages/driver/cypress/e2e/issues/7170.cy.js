// TODO(webkit): fix+unskip for experimental webkit - also, maybe move to the correct context in type_spec
// https://github.com/cypress-io/cypress/issues/7170
describe('typing into a focused number input', { browser: '!webkit' }, () => {
  it('appends to the existing value', () => {
    cy.visit('fixtures/issue-7170.html')
    cy.get('button').click()
    cy.get('input')
    .type('2')
    .should('have.value', '12')
  })
})
