const { Promise } = Cypress

describe('src/cy/commands/cookies', () => {
  beforeEach(() => {
    // call through normally on everything
    cy.stub(Cypress, 'automation').rejects(new Error('Cypress.automation was not stubbed'))

    cy.visit('http://localhost:3500/fixtures/generic.html')
  })

  context('test:before:run:async', () => {
    it('clears cookies before each test run', () => {
      Cypress.automation
      .withArgs('get:cookies', { domain: 'localhost' })
      .resolves([{ name: 'foo' }])
      .withArgs('clear:cookies', [{ domain: 'localhost', name: 'foo' }])
      .resolves([])

      Cypress.emitThen('test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      })
      .then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'get:cookies',
          { domain: 'localhost' },
        )

        expect(Cypress.automation).to.be.calledWith(
          'clear:cookies',
          [{ domain: 'localhost', name: 'foo' }],
        )
      })
    })

    it('does not call clear:cookies when get:cookies returns empty array', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      Cypress.emitThen('test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      })
      .then(() => {
        expect(Cypress.automation).not.to.be.calledWith(
          'clear:cookies',
        )
      })
    })

    it('does not attempt to time out', () => {
      Cypress.automation
      .withArgs('get:cookies', { domain: 'localhost' })
      .resolves([{ name: 'foo' }])
      .withArgs('clear:cookies', [{ domain: 'localhost', name: 'foo' }])
      .resolves([])

      const timeout = cy.spy(Promise.prototype, 'timeout')

      Cypress.emitThen('test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      })
      .then(() => {
        expect(timeout).not.to.be.called
      })
    })
  })
})
