import _ from 'lodash'

import $utils from '../../cypress/utils'
import type { Log } from '../../cypress/log'

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

const getNextQueuedCommand = (queue) => {
  const search = (i) => {
    const cmd = queue.at(i)

    if (cmd && cmd.state === 'skipped') {
      return search(i + 1)
    }

    return cmd
  }

  return search(queue.index)
}

interface InternalPauseOptions extends Partial<Cypress.Loggable> {
  _log?: Log
}

interface InternalDebugOptions extends Partial<Cypress.Loggable> {
  _log?: Log
}

export default (Commands, Cypress, cy, state, config) => {
  Cypress.on('resume:next', () => {
    return resume(state, false)
  })

  Cypress.on('resume:all', () => {
    return resume(state)
  })

  Commands.addAll({ type: 'utility', prevSubject: 'optional' }, {
    // pause should indefinitely pause until the user
    // presses a key or clicks in the UI to continue
    pause (subject, userOptions: Partial<Cypress.Loggable> = {}) {
      // bail if we're in run mode, unless --headed and --no-exit flags are passed
      if (!config('isInteractive') && (!config('browser').isHeaded || config('exit'))) {
        return subject
      }

      const options: InternalPauseOptions = _.defaults({}, userOptions, { log: true })

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

            if (options._log) {
              options._log!.end()
            }
          }

          // restore timeout
          cy.timeout(timeout)

          // invoke callback fn
          return fn()
        })
      }

      state('onPaused', (fn) => {
        const next = getNextQueuedCommand(cy.queue)

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

    debug (subject, userOptions: Partial<Cypress.Loggable> = {}) {
      const options: InternalDebugOptions = _.defaults({}, userOptions, {
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
