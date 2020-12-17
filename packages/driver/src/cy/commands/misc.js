const _ = require('lodash')
const Promise = require('bluebird')

const $dom = require('../../dom')
const $errUtils = require('../../cypress/error_utils')

module.exports = (Commands, Cypress, cy, state) => {
  Commands.addAll({ prevSubject: 'optional' }, {
    end () {
      return null
    },
  })

  Commands.addAll({
    noop (arg) {
      return arg
    },

    log (msg, args) {
      // https://github.com/cypress-io/cypress/issues/8084
      // The return value of cy.log() corrupts the command stack, so cy.then() returned the wrong value
      // when cy.log() is used inside it.
      // The code below restore the stack when cy.log() is injected in cy.then().
      if (state('current').get('injected')) {
        const restoreCmdIndex = state('index') + 1

        cy.queue.splice(restoreCmdIndex, 0, {
          args: [state('subject')],
          name: 'log-restore',
          fn: (subject) => subject,
        })

        state('index', restoreCmdIndex)
      }

      Cypress.log({
        end: true,
        snapshot: true,
        message: [msg, args],
        consoleProps () {
          return {
            message: msg,
            args,
          }
        },
      })

      return null
    },

    wrap (arg, options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, {
        log: true,
        timeout: Cypress.config('defaultCommandTimeout'),
      })

      // we'll handle the timeout ourselves
      cy.clearTimeout()

      if (options.log !== false) {
        options._log = Cypress.log({
          message: arg,
          timeout: options.timeout,
        })

        if ($dom.isElement(arg)) {
          options._log.set({ $el: arg })
        }
      }

      return Promise.resolve(arg)
      .timeout(options.timeout)
      .catch(Promise.TimeoutError, () => {
        $errUtils.throwErrByPath('wrap.timed_out', {
          args: { timeout: options.timeout },
        })
      })
      .catch((err) => {
        $errUtils.throwErr(err, {
          onFail: options._log,
        })
      })
      .then((subject) => {
        const resolveWrap = () => {
          return cy.verifyUpcomingAssertions(subject, options, {
            onRetry: resolveWrap,
          })
          .return(subject)
        }

        return resolveWrap()
      })
    },
  })
}
