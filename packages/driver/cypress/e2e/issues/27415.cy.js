// https://github.com/cypress-io/cypress/issues/27415
describe('issue 27415', () => {
  const dispatchError = (win, message) => {
    win.dispatchEvent(new win.ErrorEvent('error', {
      message,
      error: new win.Error(message),
    }))
  }

  const uncaughtLogs = []

  beforeEach(() => {
    uncaughtLogs.length = 0

    cy.on('uncaught:exception', (err) => !err.message.includes('Fake Error'))

    cy.on('log:added', (attrs, log) => {
      if (attrs.name === 'uncaught exception' && attrs.message.includes('Fake Error')) {
        uncaughtLogs.push(log)
      }
    })

    cy.visit('/fixtures/errors.html')
  })

  // Consecutive identical uncaught exceptions should collapse into one updating log.
  it('collapses repeated identical uncaught exceptions into one updating log', () => {
    const message = 'Fake Error:ResizeObserver loop completed with undelivered notifications.'
    const occurrenceCount = 25

    cy.window().then((win) => {
      for (let i = 0; i < occurrenceCount; i++) {
        dispatchError(win, message)
      }
    })

    cy.wrap(null).should(() => {
      expect(uncaughtLogs, 'deduped uncaught exception logs').to.have.length(1)
      expect(uncaughtLogs[0].get('message')).to.include(`(${occurrenceCount})`)
    })
  })
})
