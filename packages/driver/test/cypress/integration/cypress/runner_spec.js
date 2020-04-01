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

      done()
    })

    cy.wrap({})
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

describe('async timeouts', () => {
  it('does not timeout during cypress command', (done) => {
    cy.timeout(100)
    cy.wait(200)
    cy.then(() => done())
  })
})
