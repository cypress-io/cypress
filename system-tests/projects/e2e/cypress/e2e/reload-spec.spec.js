top.count = top.count || 0

// the reporter renders inside a same-origin iframe (#reporter-frame)
const reporterDocument = () => {
  return top.document.querySelector('#reporter-frame').contentDocument
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
      cy.$$('button.restart', reporterDocument()).click()
    }
  })

  it('dummy test 2', () => {

  })

  afterEach(() => {

  })
})

after(function () {
})
