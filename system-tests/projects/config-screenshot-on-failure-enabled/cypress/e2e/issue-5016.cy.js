// https://github.com/cypress-io/cypress/issues/5016
describe('issue 5016', {
  screenshotOnRunFailure: true,
}, function () {
  it('should take a normal screenshot', function () {
    cy.visit('/cypress/fixtures/issue-5016/index.html').screenshot()
  })

  it('should fail but not timeout while taking the screenshot', function () {
    cy.visit('/cypress/fixtures/issue-5016/index.html')
    cy.get('a').click().should('have.attr', 'foo')
  })

  it('should not timeout taking screenshot when not failing', function () {
    cy.visit('/cypress/fixtures/issue-5016/index.html')
    cy.get('a').click().screenshot()
  })
})
