// https://github.com/cypress-io/cypress/issues/3283
describe('issue 3283', () => {
  // rejecting a promise inside a command chain with a value that isn't an error
  // object (e.g. `null` or `undefined`) used to surface the misleading internal
  // error "Cannot read property 'onFail' of null". We should fail gracefully
  // with a clear message instead.
  it('fails gracefully when a .then() callback rejects with null', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('An unknown error has occurred: null')
      expect(err.message).not.to.include('Cannot read prop')

      done()
    })

    cy.wrap(null).then(Cypress.Promise.reject)
  })

  it('fails gracefully when a .then() callback rejects with undefined', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('An unknown error has occurred: undefined')
      expect(err.message).not.to.include('Cannot read prop')

      done()
    })

    cy.wrap(null).then(() => Cypress.Promise.reject())
  })
})
