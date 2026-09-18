// https://github.com/cypress-io/cypress/issues/565
describe('clicking under fixed and sticky headers in a small viewport', () => {
  before(() => {
    cy
    .viewport(400, 400)
    .visit('/fixtures/issue-565.html')
  })

  it('scrolls the first table cell into view and clicks it', () => {
    cy.get('td:first').click()
  })
})
