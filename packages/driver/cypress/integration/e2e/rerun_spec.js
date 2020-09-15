// NOTE: we could clean up this test a lot
// by probably using preserve:run:state event
// or by using localstorage

// store these on our outer top window
// so they are globally preserved
if (window.top.hasRunOnce == null) {
  window.top.hasRunOnce = false
}

if (window.top.previousHash == null) {
  window.top.previousHash = window.top.location.hash
}

const isTextTerminal = Cypress.config('isTextTerminal')

describe('rerun state bugs', () => {
  // NOTE: there's probably other ways to cause a re-run
  // event more programatically (like firing it through Cypress)
  // but we get the hashchange coverage for free on this.
  it('stores viewport globally and does not hang on re-runs', () => {
    cy.viewport(500, 500).then(() => {
      if (!window.top.hasRunOnce) {
        // turn off mocha events for a second
        Cypress.config('isTextTerminal', false)

        // 1st time around
        window.top.hasRunOnce = true

        // cause a rerun event to occur
        // by changing the hash
        let { hash } = window.top.location

        window.top.location.hash = `${hash}?rerun`
      } else {
        if (window.top.location.hash === window.top.previousHash) {
          // 3rd time around
          // let the mocha end events fire if they're supposed to
          Cypress.config('isTextTerminal', isTextTerminal)
        }

        window.top.location.hash = window.top.previousHash
      }
    })
  })

  it('does nothing if there is no runner', () => {
    // https://github.com/cypress-io/cypress/issues/7968
    cy.stub(Cypress.cy, 'stop')
    const runner = Cypress.runner

    Cypress.runner = null

    Cypress.stop()

    const stopWasCalled = Cypress.cy.stop.called

    Cypress.runner = runner
    Cypress.cy.stop.restore()

    expect(stopWasCalled).to.be.false
  })
})
