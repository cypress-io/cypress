top.count = top.count || 0

// the reporter renders inside a same-origin iframe (#reporter-frame)
const reporterDocument = () => {
  return top.document.querySelector('#reporter-frame').contentDocument
}

// the restart button replaces the stop button only after the reporter
// re-renders, and a stopped test cannot queue more Cypress commands, so
// this polls outside of the command queue
const clickRestartWhenRendered = () => {
  const restartButton = reporterDocument().querySelector('button.restart')

  if (restartButton) {
    return restartButton.click()
  }

  setTimeout(clickRestartWhenRendered, 20)
}

describe('runner reload', () => {
  before(() => {

  })

  beforeEach(() => {

  })

  it('dummy test 1')

  it('can reload with hooks', () => {
    if (!top.count) {
      top.count++

      // this simulates interactive/open mode
      // so that the run does not complete until after reload
      Cypress.config().isTextTerminal = false
      Cypress.config().isInteractive = true

      // this simulates user clicking the stop and reload button
      // in the browser reporter gui
      cy.$$('button.stop', reporterDocument()).click()
      setTimeout(clickRestartWhenRendered, 20)
    }
  })

  it('dummy test 2', () => {

  })

  afterEach(() => {

  })
})

after(function () {
})
