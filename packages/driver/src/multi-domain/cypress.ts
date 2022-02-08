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
import { handleSocketEvents } from './socket'
import { handleSpecWindowEvents } from './spec_window_events'
import { handleErrorEvent } from './errors'

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
    defaultCommandTimeout: 4000,
    execTimeout: 60000,
    taskTimeout: 60000,
    pageLoadTimeout: 60000,
    requestTimeout: 5000,
    responseTimeout: 30000,
    // Set defaults to avoid warnings
    waitForAnimations: true,
    animationDistanceThreshold: 5,
  }) as Cypress.Cypress

  // @ts-ignore
  const cy = window.cy = new $Cy(window, Cypress, Cypress.Cookies, Cypress.state, Cypress.config, false)

  // @ts-ignore
  Cypress.log = $Log.create(Cypress, cy, Cypress.state, Cypress.config)
  // @ts-ignore
  Cypress.runner = {
    addLog () {},
  }

  // @ts-ignore
  Cypress.cy = cy
  // @ts-ignore
  Cypress.events.proxyTo(Cypress.cy)

  const { state, config } = Cypress

  $Commands.create(Cypress, cy, state, config)

  handleDomainFn(cy, specBridgeCommunicator)
  handleCommands(Cypress, cy, specBridgeCommunicator)
  handleLogs(Cypress, specBridgeCommunicator)
  handleSocketEvents(Cypress)
  handleSpecWindowEvents(cy)

  cy.onBeforeAppWindowLoad = onBeforeAppWindowLoad(Cypress, cy)

  specBridgeCommunicator.initialize(window)

  return cy
}

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
const onBeforeAppWindowLoad = (Cypress: Cypress.Cypress, cy: $Cy) => (autWindow: Window) => {
  autWindow.Cypress = Cypress

  Cypress.state('window', autWindow)
  Cypress.state('document', autWindow.document)

  // Can we assume this is always true within the switchToDomain command? I'm not sure thats always true. Should we always defer to the primary domain for this value?
  // This is needed to be able to continue through the 'stabilityChanged' function to log the loading state for the page.
  cy.state('duringUserTestExecution', true)
  // Should we start this count fresh on each window load? Should we sync this from the primary domain? Normally this is set/reset on the 'test:before:run:async' event
  // This is needs to be valued for the 'stabilityChanged' function to not error.
  cy.state('redirectionCount', {})

  // This is typically called by the cy function `urlNavigationEvent` but it is private. For the primary domain this is called in 'onBeforeAppWindowLoad'.
  Cypress.action('app:navigation:changed', 'page navigation event (\'before:load\')')

  cy.overrides.wrapNativeMethods(autWindow)
  // TODO: DRY this up with the mostly-the-same code in src/cypress/cy.js
  bindToListeners(autWindow, {
    onError: handleErrorEvent(cy, 'app'),
    onHistoryNav () {},
    onSubmit (e) {
      return Cypress.action('app:form:submitted', e)
    },
    onBeforeUnload (e) {
      cy.isStable(false, 'beforeunload')

      // TODO: implement these commented out bits
      // Cookies.setInitial()

      // timers.reset()

      Cypress.action('app:window:before:unload', e)

      // return undefined so our beforeunload handler
      // doesn't trigger a confirmation dialog
      return undefined
    },
    onLoad () {
      // This is also call on the on 'load' event in cy. In cy the call a function to call it. I'm not sure if that is intentional, but i've replicated it here.
      const signalStable = () => {
        cy.isStable(true, 'load')
      }

      // This is typically called by the cy function `urlNavigationEvent` but it is private. For the primary domain this is called on 'load'.
      Cypress.action('app:navigation:changed', 'page navigation event (\'load\')')
      // This is also call on the on 'load' event in cy
      Cypress.action('app:window:load', autWindow)

      specBridgeCommunicator.toPrimary('window:load')
      signalStable()
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
}

// eventually, setup will get called again on rerun and cy will
// get re-created
setup()

specBridgeCommunicator.toPrimary('bridge:ready')
