// https://github.com/cypress-io/cypress/issues/3847
describe('cy.get with an invalid selector', () => {
  // global variable
  let queryKey = '\'input\''

  // like Sizzle throw error
  let error = new Error(`Syntax error, unrecognized expression: ${queryKey}`)

  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  it('fails with the selector syntax error when log is true', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.eql(error.message)
      expect(err.name).to.eql(error.name)
      done()

      return false
    })

    // get 'input'
    cy.get(queryKey)
  })

  // Unhandled rejection TypeError: Cannot read property 'error' of undefined
  it('fails with the selector syntax error instead of an unhandled rejection when log is false', (done) => {
    // error should seem like { log: true }
    cy.on('fail', (err) => {
      expect(err.message).to.eql(error.message)
      expect(err.name).to.eql(error.name)
      expect(err.message).not.to.match(/Unhandled\srejection\sTypeError/)
      done()

      return false
    })

    // get 'input'
    cy.get(queryKey, { log: false })
  })
})
