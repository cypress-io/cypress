describe('src/cy/commands/cookies', () => {
  let automation: sinon.SinonStub

  beforeEach(() => {
    // fail loudly on any automation call a test hasn't stubbed
    automation = cy.stub(Cypress, 'automation').rejects(new Error('Cypress.automation was not stubbed'))

    cy.visit('http://localhost:3500/fixtures/generic.html')
  })

  context('test:before:run:async', () => {
    it('clears cookies before each test run', async () => {
      automation
      .withArgs('get:cookies', {})
      .resolves([{ name: 'foo' }])
      .withArgs('clear:cookies', [{ name: 'foo' }])
      .resolves([])

      await Cypress.action('runner:test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      }, Cypress.state('runnable'))

      expect(automation).to.be.calledWith(
        'get:cookies',
        {},
      )

      expect(automation).to.be.calledWith(
        'clear:cookies',
        [{ name: 'foo' }],
      )
    })

    it('calls clear:cookies with an empty array when get:cookies returns empty array', async () => {
      automation.withArgs('get:cookies').resolves([])
      automation.withArgs('clear:cookies').resolves([])

      await Cypress.action('runner:test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      }, Cypress.state('runnable'))

      expect(automation).to.be.calledWith(
        'clear:cookies',
        [],
      )
    })

    it('does not attempt to time out', async () => {
      automation
      .withArgs('get:cookies', {})
      .resolves([{ name: 'foo' }])
      .withArgs('clear:cookies', [{ name: 'foo' }])
      .resolves([])

      const timeout = cy.spy(Cypress.Promise.prototype, 'timeout')

      await Cypress.action('runner:test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      }, Cypress.state('runnable'))

      expect(timeout).not.to.be.called
    })
  })
})
