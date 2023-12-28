import _ from 'lodash'

import { create as createClock, Clock } from '../../cypress/clock'
import $errUtils from '../../cypress/error_utils'

type CyClock = Clock & {
  tick(ms, options?: any): number
  restore(options?: any): void
}

// create a global clock
let clock: CyClock | null = null

export default function (Commands, Cypress, cy, state) {
  const reset = () => {
    if (clock) {
      clock.restore({ log: false })
    }

    clock = null
  }

  // reset before a run
  reset()

  // remove clock before each test run, so a new one is created
  // when user calls cy.clock()
  //
  // this MUST be prepended else if we are stubbing or spying on
  // global timers they will be reset in agents before this runs
  // its reset function
  Cypress.prependListener('test:before:after:run:async', reset)

  Cypress.on('window:before:load', (contentWindow) => {
    // if a clock has been created before this event (likely before
    // a cy.visit(), then bind that clock to the new window
    if (clock) {
      return clock.bind(contentWindow)
    }

    return
  })

  return Commands.addAll({ type: 'utility' }, {
    clock (subject, now, methods, options: Partial<Cypress.Loggable> = {}) {
      let userOptions = options
      const ctx = state('ctx')

      if (clock) {
        return clock
      }

      if (_.isDate(now)) {
        now = now.getTime()
      }

      if (_.isObject(now)) {
        userOptions = now
        now = undefined
      }

      if (_.isObject(methods) && !_.isArray(methods)) {
        userOptions = methods
        methods = undefined
      }

      if (now != null && !_.isNumber(now)) {
        $errUtils.throwErrByPath('clock.invalid_1st_arg', { args: { arg: JSON.stringify(now) } })
      }

      if (methods != null && !(_.isArray(methods) && _.every(methods, _.isString))) {
        $errUtils.throwErrByPath('clock.invalid_2nd_arg', { args: { arg: JSON.stringify(methods) } })
      }

      options = _.defaults({}, userOptions, {
        log: true,
      })

      const log = (name, shouldLog, message = '', snapshot = true, consoleProps = {}) => {
        const details = clock!.details()
        const logNow = details.now
        const logMethods = details.methods.slice()

        return Cypress.log({
          name,
          message: message ? message : '',
          type: 'parent',
          hidden: shouldLog === false,
          end: true,
          snapshot,
          consoleProps () {
            return _.extend({
              'Now': logNow,
              'Methods replaced': logMethods,
            }, consoleProps)
          },
        })
      }

      clock = createClock(state('window'), now, methods)

      const { tick } = clock

      clock.tick = function (ms, userOptions: Partial<Cypress.Loggable> = {}) {
        if ((ms != null) && !_.isNumber(ms)) {
          $errUtils.throwErrByPath('tick.invalid_argument', { args: { arg: JSON.stringify(ms) } })
        }

        if (ms == null) {
          ms = 0
        }

        userOptions = _.defaults({}, userOptions, {
          log: options.log,
        })

        const theLog = log('tick', userOptions.log, `${ms}ms`, false, {
          'Now': clock!.details().now + ms,
          'Ticked': `${ms} milliseconds`,
        })

        if (theLog) {
          theLog.snapshot('before', { next: 'after' })
        }

        const ret = tick.apply(this, [ms])

        if (theLog) {
          theLog.snapshot().end()
        }

        return ret
      }

      const { restore } = clock

      clock.restore = function (userOptions: Partial<Cypress.Loggable> = {}) {
        const ret = restore.apply(this)

        userOptions = _.defaults({}, userOptions, {
          log: options.log,
        })

        log('restore', userOptions.log)

        ctx.clock = null

        clock = null

        state('clock', clock)

        return ret
      }

      log('clock', options.log)

      state('clock', clock)

      ctx.clock = clock

      return clock
    },

    tick (subject, ms, options: Partial<Cypress.Loggable> = {}) {
      if (!clock) {
        $errUtils.throwErrByPath('tick.no_clock')
      }

      clock!.tick(ms, options)

      return clock
    },
  })
}
