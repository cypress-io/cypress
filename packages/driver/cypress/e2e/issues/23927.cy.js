// https://github.com/cypress-io/cypress/issues/23927
describe('cy.origin page that throws undefined', { browser: '!webkit' }, () => {
  it('fails gracefully with an unknown error message', () => {
    cy.visit('http://barbaz.com:3500/fixtures/generic.html')
    cy.origin('http://foobar.com:3500', () => {
      Cypress.on('uncaught:exception', (err, runnable) => {
        expect(err.message).to.contain('An unknown error has occurred: undefined')

        return false
      })

      cy.visit('http://foobar.com:3500/fixtures/throws-undefined.html')
    })
  })
})
