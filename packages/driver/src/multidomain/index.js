import $Cypress from '../cypress'
import $Cy from '../cypress/cy'
import $Commands from '../cypress/commands'
import $Log from '../cypress/log'
import $Focused from '../cy/focused'
import $jQuery from '../cy/jquery'
import $Snapshots from '../cy/snapshots'
import { create as createOverrides } from '../cy/overrides'

const onBeforeAppWindowLoad = (autWindow) => {
  const specWindow = {
    Error,
  }
  const Cypress = $Cypress.create({
    browser: {
      channel: 'stable',
      displayName: 'Chrome',
      family: 'chromium',
      isChosen: true,
      isHeaded: true,
      isHeadless: false,
      majorVersion: 90,
      name: 'chrome',
      path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      version: '90.0.4430.212',
    },
  })
  const log = (...args) => {
    return Cypress.log.apply(Cypress, args)
  }
  const cy = $Cy.create(specWindow, Cypress, Cypress.Cookies, Cypress.state, Cypress.config, log)

  Cypress.log = $Log.create(Cypress, cy, Cypress.state, Cypress.config)
  Cypress.runner = {
    addLog () {},
  }

  Cypress.state('window', autWindow)
  Cypress.state('document', autWindow.document)
  Cypress.state('runnable', {
    ctx: {},
    clearTimeout () {},
    resetTimeout () {},
    timeout () {},
  })

  const { state, config } = Cypress
  const jquery = $jQuery.create(state)
  const focused = $Focused.create(state)
  const snapshots = $Snapshots.create(jquery.$$, state)

  const overrides = createOverrides(state, config, focused, snapshots)

  $Commands.create(Cypress, cy, state, config)

  window.addEventListener('message', (event) => {
    if (event.data && event.data.message === 'run:in:domain') {
      const stringifiedTestFn = event.data.data

      autWindow.eval(`(${stringifiedTestFn})()`)
    }
  }, false)

  autWindow.Cypress = Cypress
  autWindow.cy = cy

  overrides.wrapNativeMethods(autWindow)

  top.postMessage('cross:domain:window:before:load', '*')
}

window.__onBeforeAppWindowLoad = onBeforeAppWindowLoad

top.postMessage('cross:domain:bridge:ready', '*')
