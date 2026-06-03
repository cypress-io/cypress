// https://github.com/cypress-io/cypress/issues/27183
describe('issue 27183', () => {
  // a promise rejected with `undefined` (e.g. `reject()`) used to surface the
  // misleading internal error "Cannot read property 'message' of undefined".
  // We should fail gracefully and still attribute it to the application code
  // as an unhandled promise rejection.
  it('fails gracefully when the app rejects a promise with undefined', (done) => {
    cy.once('uncaught:exception', (err, runnable, promise) => {
      expect(err.message).to.include('An unknown error has occurred: undefined')
      expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
      expect(err.message).to.include('It was caused by an unhandled promise rejection.')
      expect(err.message).not.to.include('Cannot read property')
      expect(promise).to.be.a('promise')

      done()

      return false
    })

    cy.visit('/fixtures/errors.html')
    cy.get('.trigger-undefined-rejection').click()
  })
})
