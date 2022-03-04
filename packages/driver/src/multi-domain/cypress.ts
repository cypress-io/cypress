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
import { handleLogs } from './events/logs'
import { handleSocketEvents } from './events/socket'
import { handleSpecWindowEvents } from './events/spec_window'
import { handleErrorEvent } from './events/errors'
import { handleScreenshots } from './events/screenshots'
import { handleTestEvents } from './events/test'
import { handleMiscEvents } from './events/misc'
import { handleUnsupportedAPIs } from './unsupported_apis'
import $Mocha from '../cypress/mocha'

const specBridgeCommunicator = new SpecBridgeDomainCommunicator()

specBridgeCommunicator.initialize(window)

specBridgeCommunicator.once('initialize:cypress', ({ config, env }) => {
  // eventually, setup will get called again on rerun and cy will
  // get re-created
  setup(config, env)
})

const setup = (cypressConfig: Cypress.Config, env: Cypress.ObjectLike) => {
  // @ts-ignore
  const Cypress = window.Cypress = $Cypress.create({
    ...cypressConfig,
    env,
    __isMultiDomain: true,
    // never turn on video for multi-domain when syncing the config. This is handled in the primary.
    video: false,
    // multi-domain cannot be used in component testing and is only valid for e2e.
    // This value is not synced with the config because it is omitted on big Cypress creation, as well as a few other key properties
    testingType: 'e2e',
  }) as Cypress.Cypress

  // @ts-ignore
  const cy = window.cy = new $Cy(window, Cypress, Cypress.Cookies, Cypress.state, Cypress.config, false)

  // @ts-ignore
  Cypress.log = $Log.create(Cypress, cy, Cypress.state, Cypress.config)

  Cypress.mocha = $Mocha.create(window, Cypress, Cypress.config)

  // @ts-ignore
  Cypress.runner = {
    addLog () {},
  }

  // @ts-ignore
  Cypress.cy = cy
  // @ts-ignore
  Cypress.events.proxyTo(Cypress.cy)

  const { state, config } = Cypress

  // @ts-ignore
  Cypress.Commands = $Commands.create(Cypress, cy, state, config)
  // @ts-ignore
  Cypress.isCy = cy.isCy

  handleDomainFn(Cypress, cy, specBridgeCommunicator)
  handleLogs(Cypress, specBridgeCommunicator)
  handleSocketEvents(Cypress)
  handleSpecWindowEvents(cy)
  handleMiscEvents(Cypress, cy, specBridgeCommunicator)
  handleScreenshots(Cypress, specBridgeCommunicator)
  handleTestEvents(Cypress, specBridgeCommunicator)
  handleUnsupportedAPIs(Cypress, cy)

  cy.onBeforeAppWindowLoad = onBeforeAppWindowLoad(Cypress, cy)

  return cy
}

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
const onBeforeAppWindowLoad = (Cypress: Cypress.Cypress, cy: $Cy) => (autWindow: Window) => {
  autWindow.Cypress = Cypress

  Cypress.state('window', autWindow)
  Cypress.state('document', autWindow.document)

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

      cy.Cookies.setInitial()

      cy.resetTimer()

      Cypress.action('app:window:before:unload', e)

      // return undefined so our beforeunload handler
      // doesn't trigger a confirmation dialog
      return undefined
    },
    onLoad () {
      // This is typically called by the cy function `urlNavigationEvent` but it is private. For the primary domain this is called on 'load'.
      Cypress.action('app:navigation:changed', 'page navigation event (\'load\')')
      // This is also call on the on 'load' event in cy
      Cypress.action('app:window:load', autWindow)

      specBridgeCommunicator.toPrimary('window:load', { url: cy.getRemoteLocation('href') })
      cy.isStable(true, 'load')
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

specBridgeCommunicator.toPrimary('bridge:ready')
