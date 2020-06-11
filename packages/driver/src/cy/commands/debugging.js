const _ = require('lodash')

const $utils = require('../../cypress/utils')

const resume = (state, resumeAll = true) => {
  const onResume = state('onResume')

  // dont do anything if this isnt a fn
  if (!_.isFunction(onResume)) {
    return
  }

  // nuke this out so it can only
  // be called a maximum of 1 time
  state('onResume', null)

  // call the fn
  return onResume(resumeAll)
}

const getNextQueuedCommand = (state, queue) => {
  const search = (i) => {
    const cmd = queue.at(i)

    if (cmd && cmd.get('skip')) {
      return search(i + 1)
    }

    return cmd
  }

  return search(state('index'))
}

module.exports = (Commands, Cypress, cy, state, config) => {
  Cypress.on('resume:next', () => {
    return resume(state, false)
  })

  Cypress.on('resume:all', () => {
    return resume(state)
  })

  Commands.addAll({ type: 'utility', prevSubject: 'optional' }, {
    // pause should indefinitely pause until the user
    // presses a key or clicks in the UI to continue
    pause (subject, options = {}) {
      // bail if we're headless
      if (!config('isInteractive')) {
        return subject
      }

      const userOptions = options

      options = _.defaults({}, userOptions, { log: true })

      if (options.log) {
        options._log = Cypress.log({
          snapshot: true,
          autoEnd: false,
          timeout: 0,
        })
      }

      const onResume = (fn, timeout) => {
        return state('onResume', (resumeAll) => {
          if (resumeAll) {
          // nuke onPause only if
          // we've been told to resume
          // all the commands, else
          // pause on the very next one
            state('onPaused', null)

            if (options.log) {
              options._log.end()
            }
          }

          // restore timeout
          cy.timeout(timeout)

          // invoke callback fn
          return fn()
        })
      }

      state('onPaused', (fn) => {
        const next = getNextQueuedCommand(state, cy.queue)

        // backup the current timeout
        const timeout = cy.timeout()

        // clear out the current timeout
        cy.clearTimeout()

        // set onResume function
        onResume(fn, timeout)

        Cypress.action('cy:paused', next && next.get('name'))
      })

      return subject
    },

    debug (subject, options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, {
        log: true,
      })

      if (options.log) {
        options._log = Cypress.log({
          snapshot: true,
          end: true,
          timeout: 0,
        })
      }

      const previous = state('current').get('prev')

      $utils.log('\n%c------------------------ Debug Info ------------------------', 'font-weight: bold;')
      $utils.log('Command Name:    ', previous && previous.get('name'))
      $utils.log('Command Args:    ', previous && previous.get('args'))
      $utils.log('Current Subject: ', subject)

      ////// HOVER OVER TO INSPECT THE CURRENT SUBJECT //////
      subject
      ///////////////////////////////////////////////////////

      debugger // eslint-disable-line no-debugger

      return subject
    },
  })
}
