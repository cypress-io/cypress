const pending = []

Cypress.on('test:after:run', (test) => {
  if (test.state === 'pending') {
    return pending.push(test)
  }
})

describe('src/cypress/runner', () => {
  it('handles "double quotes" in test name', (done) => {
    cy.once('log:added', (log) => {
      expect(log.hookName).to.equal('test')

      return done()
    })

    return cy.wrap({})
  })

  context('pending tests', () => {
    it('is not pending', () => {})

    it('is pending 1')

    it('is pending 2')

    it('has 2 pending tests', () => {
      expect(pending).to.have.length(2)

      expect(pending[0].title).to.eq('is pending 1')

      expect(pending[1].title).to.eq('is pending 2')
    })
  })
})
