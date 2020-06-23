// https://github.com/cypress-io/cypress/issues/565
describe('issue 565', () => {
  before(() => {
    cy
    .viewport(400, 400)
    .visit('/fixtures/issue-565.html')
  })

  it('can click the first tr', () => {
    cy.get('td:first').click()
  })
})
