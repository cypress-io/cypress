import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../../dom'
import $errUtils from '../../cypress/error_utils'
import type { Log } from '../../cypress/log'

interface InternalWrapOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: Log
  timeout: number
}

export default (Commands, Cypress, cy, state) => {
  Commands.add('end', () => null)
  Commands.add('noop', (arg) => arg)

  Commands.add('log', (msg, ...args) => {
    Cypress.log({
      end: true,
      snapshot: true,
      message: [msg, ...args],
      consoleProps: () => ({ message: msg, args }),
    })

    return null
  })

  Commands.addAll({
    wrap (arg, userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const options: InternalWrapOptions = _.defaults({}, userOptions, {
        log: true,
        timeout: Cypress.config('defaultCommandTimeout'),
      })

      // we'll handle the timeout ourselves
      cy.clearTimeout()
      options._log = Cypress.log({
        message: arg,
        hidden: options.log === false,
        timeout: options.timeout,
      })

      if ($dom.isElement(arg)) {
        options._log?.set({ $el: arg })
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
