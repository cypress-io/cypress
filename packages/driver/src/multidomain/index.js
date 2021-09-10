import $Cypress from '../cypress'
import $Cy from '../cypress/cy'
import $Commands from '../cypress/commands'
import $Log from '../cypress/log'
import $Focused from '../cy/focused'
import $jQuery from '../cy/jquery'
import $Listeners from '../cy/listeners'
import $Snapshots from '../cy/snapshots'
import { create as createOverrides } from '../cy/overrides'

const postMessage = (event, data) => {
  top.postMessage({ event, data }, '*')
}

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
  const cy = $Cy.create(specWindow, Cypress, Cypress.Cookies, Cypress.state, Cypress.config, false)

  window.Cypress = Cypress
  window.cy = cy

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

  const onCommandEnqueued = (commandAttrs) => {
    const { id, name } = commandAttrs

    // it's not strictly necessary to send the name, but it can be useful
    // for debugging purposes
    postMessage('cross:domain:command:enqueued', { id, name })
  }

  const onCommandEnd = (command) => {
    const id = command.get('id')

    postMessage('cross:domain:command:update', { id, end: true })
  }

  const onLogAdded = (attrs) => {
    postMessage('cross:domain:command:update', {
      logAdded: $Log.toSerializedJSON(attrs),
    })
  }

  const onLogChanged = (attrs) => {
    postMessage('cross:domain:command:update', {
      logChanged: $Log.toSerializedJSON(attrs),
    })
  }

  Cypress.on('command:enqueued', onCommandEnqueued)
  Cypress.on('command:end', onCommandEnd)
  Cypress.on('skipped:command:end', onCommandEnd)
  Cypress.on('log:added', onLogAdded)
  Cypress.on('log:changed', onLogChanged)

  const run = (data) => {
    // syncs up the log number with the primary domain
    $Log.setCounter(data.logCounter)

    // TODO: await this if it's a promise, or do whatever cy.then does
    window.eval(`(${data.fn})()`)

    postMessage('cross:domain:ran:domain:fn')
  }

  const runCommand = () => {
    const next = state('next')

    if (next) {
      return next()
    }

    // if there's no state('next') for running the next command,
    // the queue hasn't started yet, so run it
    cy.queue.run(false)
    .then(() => {
      postMessage('cross:domain:queue:finished')
    })
  }

  const onMessage = (event) => {
    if (!event.data) return

    switch (event.data.message) {
      case 'run:domain:fn':
        return run(event.data)
      case 'run:command':
        return runCommand()
      default:
        // eslint-disable-next-line no-console
        console.log('Unknown message received in', window.location.origin, ':', event.data)
    }
  }

  // incoming messages from the primary domain
  window.addEventListener('message', onMessage, false)

  autWindow.Cypress = Cypress
  autWindow.cy = cy

  overrides.wrapNativeMethods(autWindow)
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
      postMessage('cross:domain:window:load')
    },
    onUnload (e) {
      window.removeEventListener('message', onMessage)

      Cypress.off('command:enqueued', onCommandEnqueued)
      Cypress.off('command:end', onCommandEnd)
      Cypress.off('skipped:command:end', onCommandEnd)
      Cypress.off('log:added', onLogAdded)
      Cypress.off('log:changed', onLogChanged)

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

  postMessage('cross:domain:window:before:load')
}

window.__onBeforeAppWindowLoad = onBeforeAppWindowLoad

postMessage('cross:domain:bridge:ready')
