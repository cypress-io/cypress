import 'setimmediate'
import { client } from '@packages/socket'

import '../config/bluebird'
import '../config/jquery'
import '../config/lodash'

import $Cypress from '../cypress'
import { $Cy } from '../cypress/cy'
import $Commands from '../cypress/commands'
import $Log from '../cypress/log'
import { bindToListeners } from '../cy/listeners'
import { SpecBridgeDomainCommunicator } from './communicator'

const specBridgeCommunicator = new SpecBridgeDomainCommunicator()

const onCommandEnqueued = (commandAttrs: Cypress.EnqueuedCommand) => {
  const { id, name } = commandAttrs

  // it's not strictly necessary to send the name, but it can be useful
  // for debugging purposes
  specBridgeCommunicator.toPrimary('command:enqueued', { id, name })
}

const onCommandEnd = (command: Cypress.CommandQueue) => {
  const id = command.get('id')
  const name = command.get('name')

  specBridgeCommunicator.toPrimary('command:end', { id, name })
}

const onLogAdded = (attrs) => {
  specBridgeCommunicator.toPrimary('log:added', $Log.toSerializedJSON(attrs))
}

const onLogChanged = (attrs) => {
  specBridgeCommunicator.toPrimary('log:changed', $Log.toSerializedJSON(attrs))
}

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

  Cypress.on('command:enqueued', onCommandEnqueued)
  Cypress.on('command:end', onCommandEnd)
  Cypress.on('skipped:command:end', onCommandEnd)
  Cypress.on('log:added', onLogAdded)
  Cypress.on('log:changed', onLogChanged)

  // @ts-ignore
  const ws = client.connect({
    path: '/__socket.io',
    transports: ['websocket'],
  })

  const events = ['backend:request', 'automation:request']

  events.forEach((event) => {
    // @ts-ignore
    Cypress.on(event, (...args) => {
      return ws.emit(event, ...args)
    })
  })

  const doneEarly = () => {
    cy.queue.stop()

    // we only need to worry about doneEarly when
    // it comes from a manual event such as stopping
    // Cypress or when we yield a (done) callback
    // and could arbitrarily call it whenever we want
    const p = cy.state('promise')

    // if our outer promise is pending
    // then cancel outer and inner
    // and set canceled to be true
    if (p && p.isPending()) {
      cy.state('canceled', true)
      cy.state('cancel')()
    }

    // if a command fails then after each commands
    // could also fail unless we clear this out
    cy.state('commandIntermediateValue', undefined)

    // reset the nestedIndex back to null
    cy.state('nestedIndex', null)
  }

  specBridgeCommunicator.on('run:domain:fn', async ({ data, fn, isDoneFnAvailable = false }) => {
    cy.reset({})

    cy.state('runnable', {
      ctx: {},
      clearTimeout () {},
      resetTimeout () {},
      timeout () {},
      isPending () {},
    })

    let fnWrapper = `(${fn})`

    if (isDoneFnAvailable) {
      // stub out the 'done' function if available in the primary domain
      // to notify the primary domain if the done() callback is invoked
      // within the spec bridge
      const done = (err = undefined) => {
        doneEarly()

        // signal to the primary domain that done has been called and to signal that the command queue is finished in the secondary domain
        specBridgeCommunicator.toPrimary('done:called', err)
        specBridgeCommunicator.toPrimary('queue:finished')

        return null
      }

      // similar to the primary domain, the done() callback will be stored in state
      // if undefined and a user tries to call done, the same effect is granted
      cy.state('done', done)

      fnWrapper = `((data) => {
        const done = cy.state('done');
        return ${fnWrapper}(data)
      })`
    }

    try {
      // await the eval func, whether it is a promise or not
      // we should not need to transpile this as our target browsers support async/await
      // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function for more details
      await window.eval(fnWrapper)(data)

      specBridgeCommunicator.toPrimary('ran:domain:fn')
    } catch (err) {
      // Native Error types currently cannot be cloned in Firefox when using 'postMessage'.
      // Please see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm for more details
      // TODO: More standard serialization of Objects/Arrays within the communicator to avoid this type of logic
      if (err instanceof Error) {
        specBridgeCommunicator.toPrimary('ran:domain:fn', {
          name: err.name,
          message: err.message,
          stack: err.stack,
        })
      } else {
        specBridgeCommunicator.toPrimary('ran:domain:fn', err)
      }
    } finally {
      cy.state('done', undefined)
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
const onBeforeAppWindowLoad = (cy: $Cy, Cypress: Cypress.Cypress) => (autWindow: Window) => {
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
