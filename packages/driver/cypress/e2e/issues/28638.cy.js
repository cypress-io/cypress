// https://github.com/cypress-io/cypress/issues/28638
describe('issue 28638', () => {
  before(() => {
    cy
    .viewport(400, 400)
    .visit('/fixtures/issue-28638.html')
  })

  it('can click with parent position absolute', () => {
    cy.get('#visible-button').click()
  })
})
