import 'setimmediate'

import '../config/bluebird'
import '../config/jquery'
import '../config/lodash'

import $Cypress from '../cypress'
import { $Cy } from '../cypress/cy'
import $Commands from '../cypress/commands'
import $Log from '../cypress/log'
import { bindToListeners } from '../cy/listeners'
import { SpecBridgeDomainCommunicator } from './communicator'
import { handleDomainFn } from './domain_fn'
import { handleCommands } from './commands'
import { handleLogs } from './logs'

const specBridgeCommunicator = new SpecBridgeDomainCommunicator()

const setup = () => {
  // @ts-ignore
  const Cypress = window.Cypress = $Cypress.create({
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
  }) as Cypress.Cypress

  // @ts-ignore
  const cy = window.cy = new $Cy(window, Cypress, Cypress.Cookies, Cypress.state, Cypress.config, false)

  // @ts-ignore
  Cypress.log = $Log.create(Cypress, cy, Cypress.state, Cypress.config)
  // @ts-ignore
  Cypress.runner = {
    addLog () {},
  }

  const { state, config } = Cypress

  $Commands.create(Cypress, cy, state, config)

  handleDomainFn(cy, specBridgeCommunicator)
  handleCommands(Cypress, cy, specBridgeCommunicator)
  handleLogs(Cypress, specBridgeCommunicator)

  cy.onBeforeAppWindowLoad = onBeforeAppWindowLoad(Cypress, cy)

  specBridgeCommunicator.initialize(window)

  return cy
}

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
const onBeforeAppWindowLoad = (Cypress: Cypress.Cypress, cy: $Cy) => (autWindow: Window) => {
  autWindow.Cypress = Cypress

  Cypress.state('window', autWindow)
  Cypress.state('document', autWindow.document)

  cy.overrides.wrapNativeMethods(autWindow)
  // TODO: DRY this up with the mostly-the-same code in src/cypress/cy.js
  bindToListeners(autWindow, {
    // TODO: implement this once there's a better way to forward
    // messages to the top frame
    onError: () => () => undefined,
    onHistoryNav () {},
    onSubmit (e) {
      return Cypress.action('app:form:submitted', e)
    },
    onBeforeUnload (e) {
      // TODO: implement these commented out bits
      // stability.isStable(false, 'beforeunload')

      // Cookies.setInitial()

      // timers.reset()

      Cypress.action('app:window:before:unload', e)

      // return undefined so our beforeunload handler
      // doesn't trigger a confirmation dialog
      return undefined
    },
    onLoad () {
      specBridgeCommunicator.toPrimary('window:load')
    },
    onUnload (e) {
      return Cypress.action('app:window:unload', e)
    },
    // TODO: this currently only works on hashchange, but needs work
    // for other navigation events
    onNavigation (...args) {
      return Cypress.action('app:navigation:changed', ...args)
    },
    onAlert (str) {
      return Cypress.action('app:window:alert', str)
    },
    onConfirm (str) {
      const results = Cypress.action('app:window:confirm', str) as any[]

      // return false if ANY results are false
      const ret = !results.some((result) => result === false)

      Cypress.action('app:window:confirmed', str, ret)

      return ret
    },
  })

  specBridgeCommunicator.toPrimary('window:before:load')
}

// eventually, setup will get called again on rerun and cy will
// get re-created
const cy = setup()

// @ts-ignore
window.__onBeforeAppWindowLoad = (autWindow: Window) => {
  cy.onBeforeAppWindowLoad(autWindow)
}

specBridgeCommunicator.toPrimary('bridge:ready')
