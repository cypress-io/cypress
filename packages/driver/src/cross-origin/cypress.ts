import 'setimmediate'

import '../config/bluebird'
import '../config/jquery'
import '../config/lodash'

import $Cypress from '../cypress'
import { $Cy } from '../cypress/cy'
import { $Location } from '../cypress/location'
import $Commands from '../cypress/commands'
import { create as createLog } from '../cypress/log'
import { bindToListeners } from '../cy/listeners'
import { handleOriginFn } from './origin_fn'
import { FINAL_SNAPSHOT_NAME } from '../cy/snapshots'
import { handleLogs } from './events/logs'
import { handleSocketEvents } from './events/socket'
import { handleSpecWindowEvents } from './events/spec_window'
import { handleErrorEvent } from './events/errors'
import { handleScreenshots } from './events/screenshots'
import { handleTestEvents } from './events/test'
import { handleMiscEvents } from './events/misc'
import { handleUnsupportedAPIs } from './unsupported_apis'
import { patchDocumentCookie } from './patches/cookies'
import { patchFormElementSubmit } from './patches/submit'
import { patchElementIntegrity } from './patches/setAttribute'
import $Mocha from '../cypress/mocha'
import * as cors from '@packages/network/lib/cors'

const createCypress = () => {
  // @ts-ignore
  const Cypress = window.Cypress = new $Cypress() as Cypress.Cypress

  Cypress.specBridgeCommunicator.once('initialize:cypress', ({ config, env }) => {
    // eventually, setup will get called again on rerun and cy will get re-created
    setup(config, env)
  })

  Cypress.specBridgeCommunicator.on('attach:to:window', () => {
    // It would be ideal to get a window identifier and attach to that window specifically instead of searching all parent windows.
    const findWindow = () => {
      for (let index = 0; index < window.parent.frames.length; index++) {
        const frame = window.parent.frames[index]

        try {
          const frameHostRegex = new RegExp(`(^|\\.)${ window.location.host.replace(/\./g, '\\.') }$`)

          // Compare host, protocol and test that the window's host ends with the frame's host.
          // This works because the spec bridge's host is always created without a sub domain.
          if (window.location.port === frame.location.port
              && window.location.protocol === frame.location.protocol
              && frameHostRegex.test(frame.location.host)
              && window.location.href !== frame.location.href) {
            return frame
          }
        } catch (error) {
          // Catch DOMException: Blocked a frame from accessing a cross-origin frame.
          if (error.name !== 'SecurityError') {
            throw error
          }
        }
      }

      return undefined
    }

    const autWindow = findWindow()

    if (autWindow) {
      attachToWindow(autWindow)
    }
  })

  Cypress.specBridgeCommunicator.on('generate:final:snapshot', (snapshotUrl: string) => {
    const currentAutOriginPolicy = cy.state('autOrigin')
    const requestedSnapshotUrlLocation = $Location.create(snapshotUrl)

    if (requestedSnapshotUrlLocation.originPolicy === currentAutOriginPolicy) {
      // if true, this is the correct specbridge to take the snapshot and send it back
      const finalSnapshot = cy.createSnapshot(FINAL_SNAPSHOT_NAME)

      Cypress.specBridgeCommunicator.toPrimary('final:snapshot:generated', finalSnapshot)
    }
  })

  Cypress.specBridgeCommunicator.toPrimary('bridge:ready')
}

const setup = (cypressConfig: Cypress.Config, env: Cypress.ObjectLike) => {
  const Cypress = window.Cypress

  Cypress.configure({
    ...cypressConfig,
    env,
    // never turn on video for a spec bridge when syncing the config. This is handled in the primary.
    video: false,
    isCrossOriginSpecBridge: true,
    // cross origin spec bridges cannot be used in component testing and is only valid for e2e.
    // This value is not synced with the config because it is omitted on big Cypress creation, as well as a few other key properties
    testingType: 'e2e',
  })

  // @ts-ignore
  const cy = window.cy = new $Cy(window, Cypress, Cypress.Cookies, Cypress.state, Cypress.config, false)

  // @ts-ignore
  Cypress.log = createLog(Cypress, cy, Cypress.state, Cypress.config)

  Cypress.mocha = $Mocha.create(window, Cypress, Cypress.config)

  // @ts-ignore
  Cypress.runner = {
    addLog () {},
  }

  Cypress.cy = cy
  // @ts-ignore
  Cypress.events.proxyTo(Cypress.cy)

  const { state, config } = Cypress

  // @ts-ignore
  Cypress.Commands = $Commands.create(Cypress, cy, state, config)
  // @ts-ignore
  Cypress.isCy = cy.isCy

  handleOriginFn(Cypress, cy)
  handleLogs(Cypress)
  handleSocketEvents(Cypress)
  handleSpecWindowEvents(cy)
  handleMiscEvents(Cypress, cy)
  handleScreenshots(Cypress)
  handleTestEvents(Cypress)
  handleUnsupportedAPIs(Cypress, cy)

  cy.onBeforeAppWindowLoad = onBeforeAppWindowLoad(Cypress, cy)
}

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
const onBeforeAppWindowLoad = (Cypress: Cypress.Cypress, cy: $Cy) => (autWindow: Window) => {
  autWindow.Cypress = Cypress
  // This is typically called by the cy function `urlNavigationEvent` but it is private. For the primary origin this is called in 'onBeforeAppWindowLoad'.
  Cypress.action('app:navigation:changed', 'page navigation event (\'before:load\')')
  attachToWindow(autWindow)
}

const attachToWindow = (autWindow: Window) => {
  autWindow.Cypress = Cypress

  const cy = Cypress.cy

  Cypress.state('window', autWindow)
  Cypress.state('document', autWindow.document)

  if (Cypress && Cypress.config('experimentalModifyObstructiveThirdPartyCode')) {
    patchFormElementSubmit(autWindow)
    patchElementIntegrity(autWindow)
  }

  patchDocumentCookie(Cypress, autWindow)

  // This is typically called by the cy function `urlNavigationEvent` but it is private. For the primary origin this is called in 'onBeforeAppWindowLoad'.
  Cypress.action('app:navigation:changed', 'page navigation event (\'before:load\')')

  cy.overrides.wrapNativeMethods(autWindow)

  const onWindowLoadPrimary = ({ url }) => {
    cy.isStable(true, 'primary onload')

    cy.state('autOrigin', cors.getOriginPolicy(url))
    Cypress.emit('internal:window:load', { type: 'same:origin', url })
  }

  // TODO: DRY this up with the mostly-the-same code in src/cypress/cy.js
  // https://github.com/cypress-io/cypress/issues/20972
  bindToListeners(autWindow, {
    onError: handleErrorEvent(cy, 'app'),
    onHistoryNav () {},
    onSubmit (e) {
      return Cypress.action('app:form:submitted', e)
    },
    async onBeforeUnload (e) {
      Cypress.specBridgeCommunicator.toPrimary('before:unload')

      // We need to sync this state value prior to changing stability otherwise we will erroneously log a loading event.
      const duringUserTestExecution = await Cypress.specBridgeCommunicator.toPrimaryPromise('sync:duringUserTestExecution')

      cy.state('duringUserTestExecution', duringUserTestExecution)

      cy.isStable(false, 'beforeunload')

      cy.Cookies.setInitial()

      cy.resetTimer()

      Cypress.action('app:window:before:unload', e)

      // return undefined so our beforeunload handler
      // doesn't trigger a confirmation dialog
      return undefined
    },
    onLoad () {
      // This is typically called by the cy function `urlNavigationEvent` but it is private. For the primary origin this is called on 'load'.
      Cypress.action('app:navigation:changed', 'page navigation event (\'load\')')

      const remoteLocation = cy.getRemoteLocation()

      // This is also call on the on 'load' event in cy
      Cypress.action('app:window:load', autWindow, remoteLocation.href)

      cy.state('autOrigin', remoteLocation.originPolicy)

      Cypress.specBridgeCommunicator.toPrimary('window:load', { url: remoteLocation.href })
      cy.isStable(true, 'load')

      // If load happened in this spec bridge stop listening.
      Cypress.specBridgeCommunicator.off('window:load', onWindowLoadPrimary)
    },
    onUnload (e) {
      cy.state('window', undefined)
      cy.state('document', undefined)
      // We only need to listen to this if we've started an unload event and the load happens in another spec bridge.
      Cypress.specBridgeCommunicator.once('window:load', onWindowLoadPrimary)

      return Cypress.action('app:window:unload', e)
    },
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

// only bind the message handler one time when the spec bridge is created
window.addEventListener('message', ({ data }) => {
  Cypress?.specBridgeCommunicator.onMessage({ data })
}, false)

createCypress()
