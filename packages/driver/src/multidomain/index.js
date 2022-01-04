import 'setimmediate'

import '../config/bluebird'
import '../config/jquery'
import '../config/lodash'

import $Cypress from '../cypress'
import { $Cy } from '../cypress/cy'
import $Commands from '../cypress/commands'
import $Log from '../cypress/log'
import $Listeners from '../cy/listeners'
import { SpecBridgeDomainCommunicator } from './communicator'
import { createDeferred } from '../util/deferred'

const specBridgeCommunicator = new SpecBridgeDomainCommunicator()

const onCommandEnqueued = (commandAttrs) => {
  const { id, name } = commandAttrs

  // it's not strictly necessary to send the name, but it can be useful
  // for debugging purposes
  specBridgeCommunicator.toPrimary('command:enqueued', { id, name })
}

const onCommandEnd = (command) => {
  const id = command.get('id')
  const name = command.get('name')

  specBridgeCommunicator.toPrimary('command:update', { id, name, end: true })
}

const onLogAdded = (attrs) => {
  specBridgeCommunicator.toPrimary('command:update', {
    logAdded: $Log.toSerializedJSON(attrs),
  })
}

const onLogChanged = (attrs) => {
  specBridgeCommunicator.toPrimary('command:update', {
    logChanged: $Log.toSerializedJSON(attrs),
  })
}

const setup = () => {
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
  })

  const cy = window.cy = new $Cy(window, Cypress, Cypress.Cookies, Cypress.state, Cypress.config, false)

  Cypress.log = $Log.create(Cypress, cy, Cypress.state, Cypress.config)
  Cypress.runner = {
    addLog () {},
  }

  Cypress.state('runnable', {
    ctx: {},
    clearTimeout () {},
    resetTimeout () {},
    timeout () {},
  })

  const { state, config } = Cypress

  $Commands.create(Cypress, cy, state, config)

  Cypress.on('command:enqueued', onCommandEnqueued)
  Cypress.on('command:end', onCommandEnd)
  Cypress.on('skipped:command:end', onCommandEnd)
  Cypress.on('log:added', onLogAdded)
  Cypress.on('log:changed', onLogChanged)

  specBridgeCommunicator.on('run:domain:fn', async ({ fn, isDoneFnAvailable = false }) => {
    const deferredSwitchToDomain = createDeferred()

    cy.state('switchToDomainDeferred', deferredSwitchToDomain)
    const evalFn = `(${fn})()`

    // await the eval func, whether it is a promise or not
    // we should not need to transpile this as our target browsers support async/await
    // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function for more details
    const asyncWrapper = `(async () => {
      const deferredSwitchToDomain = cy.state('switchToDomainDeferred')

      try {
        await ${evalFn}
        deferredSwitchToDomain.resolve()
      } catch(e){
        deferredSwitchToDomain.reject(e)
      }
    })()`

    if (isDoneFnAvailable) {
      // stub out the 'done' function if available in the primary domain
      // to notify the primary domain if the done() callback is invoked
      // within the spec bridge
      const done = (err = undefined) => {
        // TODO: calling this currently causes some queue issues with subsequent tests. This needs to be explored as to why in the near future
        // cy.doneEarly()

        // signal to the primary domain that done has been called and to signal that the command queue is finished in the secondary domain
        specBridgeCommunicator.toPrimary('done:called', err)
        specBridgeCommunicator.toPrimary('queue:finished')

        return null
      }

      // similar to the primary domain, the done() callback will be stored in state
      // if undefined and a user tries to call done, the same effect is granted
      cy.state('done', done)

      const fnDoneWrapper = `(() => {
        const done = cy.state('done');
        ${asyncWrapper}
      })()`

      window.eval(fnDoneWrapper)
    } else {
      window.eval(asyncWrapper)
    }

    try {
      await deferredSwitchToDomain.promise
      specBridgeCommunicator.toPrimary('run:domain:fn')
    } catch (err) {
      // Native Error types currently cannot be cloned in Firefox when using 'postMessage'.
      // Please see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm for more details
      specBridgeCommunicator.toPrimary('run:domain:fn', {
        name: err.name,
        message: err.message,
        stack: err.stack,
      })
    } finally {
      cy.state('done', undefined)
      cy.state('switchToDomainDeferred', undefined)
    }
  })

  specBridgeCommunicator.on('run:command',
    ({ name }) => {
      const next = state('next')

      if (next) {
        return next()
      }

      // if there's no state('next') for running the next command,
      // the queue hasn't started yet, so run it
      cy.queue.run(false)
      .then(() => {
        specBridgeCommunicator.toPrimary('queue:finished')
      })
    })

  cy.onBeforeAppWindowLoad = onBeforeAppWindowLoad(cy, Cypress)

  specBridgeCommunicator.initialize(window)

  return cy
}

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
const onBeforeAppWindowLoad = (cy, Cypress) => (autWindow) => {
  autWindow.Cypress = Cypress
  autWindow.cy = cy

  Cypress.state('window', autWindow)
  Cypress.state('document', autWindow.document)

  cy.overrides.wrapNativeMethods(autWindow)
  // TODO: DRY this up with the mostly-the-same code in src/cypress/cy.js
  $Listeners.bindTo(autWindow, {
    // TODO: implement this once there's a better way to forward
    // messages to the top frame
    onError () {},
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
      const results = Cypress.action('app:window:confirm', str)

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

window.__onBeforeAppWindowLoad = (autWindow) => {
  cy.onBeforeAppWindowLoad(autWindow)
}

specBridgeCommunicator.toPrimary('bridge:ready')
