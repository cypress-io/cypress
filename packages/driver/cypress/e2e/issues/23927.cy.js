// https://github.com/cypress-io/cypress/issues/23927
describe('issue 23927', { browser: '!webkit' }, () => {
  it('Fails gracefully if origin page throws undefined', () => {
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
