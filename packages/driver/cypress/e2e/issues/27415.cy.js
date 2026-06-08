// https://github.com/cypress-io/cypress/issues/27415
describe('issue 27415', () => {
  const dispatchError = (win, message) => {
    win.dispatchEvent(new win.ErrorEvent('error', {
      message,
      error: new win.Error(message),
    }))
  }

  // An application that repeatedly throws the SAME uncaught exception (e.g. a
  // benign "ResizeObserver loop ..." notification fired on every animation
  // frame) used to create a new command-log entry — and, when unhandled, a new
  // retained DOM snapshot — for every occurrence. That churn could exhaust
  // renderer memory and crash the browser. Consecutive identical uncaught
  // exceptions within a test should now collapse into a single, updating log.
  it('collapses repeated identical uncaught exceptions into one updating log', () => {
    const message = 'issue-27415 ResizeObserver loop completed with undelivered notifications.'

    // suppress the error so the repeated occurrences do not fail the test
    cy.on('uncaught:exception', (err) => !err.message.includes('issue-27415'))

    const uncaughtLogs = []

    cy.on('log:added', (attrs, log) => {
      if (attrs.name === 'uncaught exception' && attrs.message.includes('issue-27415')) {
        uncaughtLogs.push(log)
      }
    })

    cy.visit('/fixtures/errors.html')

    cy.window().then((win) => {
      // simulate a tight resize loop throwing the same error every frame
      for (let i = 0; i < 25; i++) {
        dispatchError(win, message)
      }
    })

    cy.wrap(null).should(() => {
      // all 25 occurrences collapse into a single 'uncaught exception' log
      // instead of accumulating 25 logs (and, when unhandled, 25 DOM snapshots)
      expect(uncaughtLogs, 'deduped uncaught exception logs').to.have.length(1)
      // the single log updates in place with the occurrence count
      expect(uncaughtLogs[0].get('message')).to.match(/\(\d+\)$/)
    })
  })

  // distinct uncaught error messages should each still create their own log
  it('does not collapse uncaught exceptions with different messages', () => {
    cy.on('uncaught:exception', (err) => !err.message.includes('issue-27415'))

    const uncaughtLogs = []

    cy.on('log:added', (attrs, log) => {
      if (attrs.name === 'uncaught exception' && attrs.message.includes('issue-27415')) {
        uncaughtLogs.push(log)
      }
    })

    cy.visit('/fixtures/errors.html')

    cy.window().then((win) => {
      dispatchError(win, 'issue-27415 first')
      dispatchError(win, 'issue-27415 second')
    })

    cy.wrap(null).should(() => {
      expect(uncaughtLogs, 'distinct uncaught exception logs').to.have.length(2)
    })
  })
})
