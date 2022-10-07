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
import { patchFormElementSubmit } from './patches/submit'
import { patchFetch } from './patches/fetch'
import { patchXmlHttpRequest } from './patches/xmlHttpRequest'
import $errUtils from '../cypress/error_utils'
import $Mocha from '../cypress/mocha'

const createCypress = () => {
  // @ts-ignore
  const Cypress = window.Cypress = new $Cypress() as Cypress.Cypress

  Cypress.specBridgeCommunicator.once('initialize:cypress', ({ config, env }) => {
    // eventually, setup will get called again on rerun and cy will get re-created
    setup(config, env)
  })

  Cypress.specBridgeCommunicator.on('attach:to:window', () => {
    // It would be ideal to get a window identifier and attach to that window specifically instead of searching all parent windows.
    // This will be implemented for iFrames.
    const findWindow = () => {
      for (let index = 0; index < window.parent.frames.length; index++) {
        const frame = window.parent.frames[index]

        try {
          // the AUT would be the frame with a matching origin, but not the same exact href.
          if (window.location.origin === frame.location.origin
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
    const currentAutOrigin = cy.state('autLocation').origin
    const requestedSnapshotUrlLocation = $Location.create(snapshotUrl)

    if (requestedSnapshotUrlLocation.origin === currentAutOrigin) {
      // if true, this is the correct spec bridge to take the snapshot and send it back
      const finalSnapshot = cy.createSnapshot(FINAL_SNAPSHOT_NAME)

      Cypress.specBridgeCommunicator.toPrimary('snapshot:final:generated', finalSnapshot)
    }
  })

  Cypress.specBridgeCommunicator.on('snapshot:generate:for:log', ({ name, specBridgeResponseEvent }) => {
    // if the snapshot cannot be taken (in a transitory space), set to an empty object in order to not fail serialization
    let requestedCrossOriginSnapshot = {}

    // don't attempt to take snapshots after the spec bridge has been unloaded. Instead, send an empty snapshot back to the primary
    // to display current state of dom
    if (cy.state('document') !== undefined) {
      requestedCrossOriginSnapshot = cy.createSnapshot(name) || {}
    }

    Cypress.specBridgeCommunicator.toPrimary(specBridgeResponseEvent, requestedCrossOriginSnapshot)
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

  // this is valid inside the cy.origin() callback, but it should be replaced
  // by the webpack preprocessor with an actual require() before the spec code
  // is run in the browser. if it's not, it means the user isn't using the
  // webpack preprocessor or is using an older version of it. this error guides
  // them to use webpack preprocessor on the latest version.
  Cypress.require = () => {
    $errUtils.throwErrByPath('require.invalid_inside_origin')
  }

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

  attachToWindow(autWindow)
}

const attachToWindow = (autWindow: Window) => {
  autWindow.Cypress = Cypress

  const cy = Cypress.cy

  Cypress.state('window', autWindow)
  Cypress.state('document', autWindow.document)

  if (Cypress && Cypress.config('experimentalModifyObstructiveThirdPartyCode')) {
    patchFormElementSubmit(autWindow)
  }

  Cypress.removeAllListeners('app:timers:reset')
  Cypress.removeAllListeners('app:timers:pause')

  // @ts-expect-error - the injected code adds the cypressTimersReset function to window
  Cypress.on('app:timers:reset', autWindow.cypressTimersReset)
  // @ts-ignore - the injected code adds the cypressTimersPause function to window
  Cypress.on('app:timers:pause', autWindow.cypressTimersPause)

  cy.urlNavigationEvent('before:load')

  cy.overrides.wrapNativeMethods(autWindow)

  // place after override incase fetch is polyfilled in the AUT injection
  // this can be in the beforeLoad code as we only want to patch fetch/xmlHttpRequest
  // when the cy.origin block is active to track credential use
  patchFetch(Cypress, autWindow)
  patchXmlHttpRequest(Cypress, autWindow)
  // also patch it in the spec bridge as well
  patchFetch(Cypress, window)
  patchXmlHttpRequest(Cypress, window)

  // TODO: DRY this up with the mostly-the-same code in src/cypress/cy.js
  // https://github.com/cypress-io/cypress/issues/20972
  bindToListeners(autWindow, {
    onError: handleErrorEvent(cy, 'app'),
    onHistoryNav () {},
    onSubmit (e) {
      return Cypress.action('app:form:submitted', e)
    },
    onBeforeUnload (e) {
      // The before unload event is propagated to primary through code injected into the AUT.

      cy.isStable(false, 'beforeunload')

      // NOTE: we intentionally do not set the cy.Cookies.setInitial() inside the spec bridge as we are not doing full injection and this leads to cookie side effects

      cy.resetTimer()

      Cypress.action('app:window:before:unload', e)

      // return undefined so our beforeunload handler
      // doesn't trigger a confirmation dialog
      return undefined
    },
    onLoad () {
      cy.urlNavigationEvent('load')

      const remoteLocation = cy.getRemoteLocation()

      cy.state('autLocation', remoteLocation)

      Cypress.action('app:window:load', autWindow, remoteLocation.href)

      Cypress.specBridgeCommunicator.toPrimary('window:load', { url: remoteLocation.href })
      cy.isStable(true, 'load')
    },
    onUnload (e) {
      cy.state('window', undefined)
      cy.state('document', undefined)

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
