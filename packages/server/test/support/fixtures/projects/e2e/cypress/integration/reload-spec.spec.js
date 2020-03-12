top.count = top.count || 0

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
      cy.$$('button.stop', top.document).click()
      cy.$$('button.restart', top.document).click()
    }
  })

  it('dummy test 2', () => {

  })

  afterEach(() => {

  })
})

after(function () {
})
