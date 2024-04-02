// https://github.com/cypress-io/cypress/issues/29093
describe('issue 29093', () => {
  before(() => {
    cy
    .viewport('macbook-16')
    .visit('/fixtures/issue-29093.html')
  })

  it('can click selection when rem width used', () => {
    cy.get('#sidebar-left > section').click()
  })
})
