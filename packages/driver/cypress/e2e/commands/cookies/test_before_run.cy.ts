const { Promise } = Cypress

export {}

describe('src/cy/commands/cookies', () => {
  let automation: sinon.SinonStub

  beforeEach(() => {
    // call through normally on everything
    automation = cy.stub(Cypress, 'automation').rejects(new Error('Cypress.automation was not stubbed'))

    cy.visit('http://localhost:3500/fixtures/generic.html')
  })

  context('test:before:run:async', () => {
    it('clears cookies before each test run', () => {
      automation
      .withArgs('get:cookies', { domain: 'localhost' })
      .resolves([{ name: 'foo' }])
      .withArgs('clear:cookies', [{ domain: 'localhost', name: 'foo' }])
      .resolves([])

      Cypress.emitThen('test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      })
      // @ts-expect-error - `emitThen` is publicly typed as returning `BluebirdStatic` rather than a promise
      .then(() => {
        expect(automation).to.be.calledWith(
          'get:cookies',
          { domain: 'localhost' },
        )

        expect(automation).to.be.calledWith(
          'clear:cookies',
          [{ domain: 'localhost', name: 'foo' }],
        )
      })
    })

    it('does not call clear:cookies when get:cookies returns empty array', () => {
      automation.withArgs('get:cookies').resolves([])

      Cypress.emitThen('test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      })
      // @ts-expect-error - `emitThen` is publicly typed as returning `BluebirdStatic` rather than a promise
      .then(() => {
        expect(automation).not.to.be.calledWith(
          'clear:cookies',
        )
      })
    })

    it('does not attempt to time out', () => {
      automation
      .withArgs('get:cookies', { domain: 'localhost' })
      .resolves([{ name: 'foo' }])
      .withArgs('clear:cookies', [{ domain: 'localhost', name: 'foo' }])
      .resolves([])

      const timeout = cy.spy(Promise.prototype, 'timeout')

      Cypress.emitThen('test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      })
      // @ts-expect-error - `emitThen` is publicly typed as returning `BluebirdStatic` rather than a promise
      .then(() => {
        expect(timeout).not.to.be.called
      })
    })
  })
})
