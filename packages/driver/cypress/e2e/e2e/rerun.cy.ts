// NOTE: we could clean up this test a lot
// by probably using preserve:run:state event
// or by using localstorage

// the run count lives on the outer top window so it survives the reload this spec triggers
const topWindow = window.top as Window & { runCount?: number }

// This spec in the driver has some weird reloading that occurs. It triggers a simulation of
// essentially reloading the page in run mode and that effectively wipes away some state that we
// need for protocol. Rather than trying to handle this edge case in a complicated one-off fashion,
// just ensure that the protocol events fire for this one spec.
if (Cypress.config('browser').family === 'chromium') {
  // Copied from:
  // https://github.com/cypress-io/cypress-services/blob/825abbabaaa0a8ecf78e2ad543493a85a01a939f/packages/app-capture-protocol/src/cypress-events/track-cypress-events.ts#L17-L30
  const getCypressProtocolElement = () => {
    let cypressProtocolElement = topWindow.document.getElementById('__cypress-protocol')

    // If element does not exist, create it
    if (!cypressProtocolElement) {
      cypressProtocolElement = document.createElement('div')
      cypressProtocolElement.id = '__cypress-protocol'
      cypressProtocolElement.style.display = 'none'
      topWindow.document.body.appendChild(cypressProtocolElement)
    }

    return cypressProtocolElement
  }

  // Copied from:
  // https://github.com/cypress-io/cypress-services/blob/825abbabaaa0a8ecf78e2ad543493a85a01a939f/packages/app-capture-protocol/src/cypress-events/track-cypress-events.ts#L38-L44
  const attachCypressProtocolTestAfterRun = () => {
    const cypressProtocolElement = getCypressProtocolElement()

    cypressProtocolElement.dataset.cypressProtocolTestAfterRun = JSON.stringify({
      timestamp: performance.now() + performance.timeOrigin,
    })
  }

  // Copied from:
  // https://github.com/cypress-io/cypress-services/blob/825abbabaaa0a8ecf78e2ad543493a85a01a939f/packages/app-capture-protocol/src/cypress-events/track-cypress-events.ts#L110-L112
  Cypress.prependListener('test:after:run:async', () => {
    attachCypressProtocolTestAfterRun()
  })
}

const isTextTerminal = Cypress.config('isTextTerminal')

// `isTextTerminal` is a resolved runtime value rather than a per-test override, so
// the public `config` setter does not accept it
const setIsTextTerminal = (value: boolean) => {
  (Cypress.config as unknown as (key: string, value: unknown) => void)('isTextTerminal', value)
}

describe('rerun state bugs', () => {
  // NOTE: there's probably other ways to cause a re-run
  // event more programatically (like firing it through Cypress)
  // but we get the hashchange coverage for free on this.
  it('stores viewport globally and does not hang on re-runs', () => {
    cy.viewport(500, 500).then(() => {
      topWindow.runCount = (topWindow.runCount ?? 0) + 1
      if (topWindow.runCount === 1) {
        // turn off mocha events for a second
        setIsTextTerminal(false)

        // cause a rerun event to occur by triggering a hash change
        topWindow.dispatchEvent(new Event('test:trigger:rerun'))
      } else if (topWindow.runCount === 2) {
        // Second time, do nothing, with mocha events still disabled
      } else {
        // 3rd time around
        // let the mocha end events fire if they're supposed to
        setIsTextTerminal(isTextTerminal)
      }
    })
  })

  it('does nothing if there is no runner', () => {
    // https://github.com/cypress-io/cypress/issues/7968
    const stop = cy.stub(Cypress.cy, 'stop')
    const runner = Cypress.runner

    Cypress.runner = null

    Cypress.stop()

    const stopWasCalled = stop.called

    Cypress.runner = runner
    stop.restore()

    expect(stopWasCalled).to.be.false
  })
})
