import _ from 'lodash'

import { create as createClock, Clock } from '../../cypress/clock'
import $errUtils from '../../cypress/error_utils'

type CyClock = Clock & {
  tick(ms: number | undefined, options?: Partial<Cypress.Loggable>): number
  tickAsync?(ms: number | undefined, options?: Partial<Cypress.Loggable>): Promise<number>
  restore(options?: Partial<Cypress.Loggable>): void
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

      const { tick, tickAsync } = clock

      const createTickLog = (ms: number | undefined, userOptions: Partial<Cypress.Loggable>) => {
        const tickMs = ms ?? 0

        if (!_.isNumber(tickMs) || Number.isNaN(tickMs)) {
          $errUtils.throwErrByPath('tick.invalid_argument', { args: { arg: JSON.stringify(ms) } })
        }

        const shouldLog = userOptions.log ?? options.log
        const tickLog = log('tick', shouldLog, `${tickMs}ms`, false, {
          'Now': clock!.details().now + tickMs,
          'Ticked': `${tickMs} milliseconds`,
        })

        if (tickLog) {
          tickLog.snapshot('before', { next: 'after' })
        }

        return { tickLog, tickMs }
      }

      const endTickLog = (tickLog: ReturnType<typeof log>) => {
        if (tickLog) {
          tickLog.snapshot().end()
        }
      }

      clock.tick = function (ms: number | undefined, userOptions?: Partial<Cypress.Loggable>) {
        const tickOptions = userOptions ?? {}
        const { tickMs, tickLog } = createTickLog(ms, tickOptions)
        const result = tick.apply(this, [tickMs])

        endTickLog(tickLog)

        return result
      }

      clock.tickAsync = function (ms: number | undefined, userOptions?: Partial<Cypress.Loggable>) {
        const tickOptions = userOptions ?? {}
        const { tickMs, tickLog } = createTickLog(ms, tickOptions)
        const tickResult = tickAsync
          ? tickAsync.apply(this, [tickMs])
          : Promise.resolve().then(() => tick.apply(this, [tickMs]))

        return Promise.resolve(tickResult).finally(() => {
          endTickLog(tickLog)
        })
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

    tick (subject, ms, options?: Partial<Cypress.Loggable>) {
      if (!clock) {
        $errUtils.throwErrByPath('tick.no_clock')
      }

      const tickOptions = options ?? {}
      const tickClock = clock!

      if (!tickClock.tickAsync) {
        tickClock.tick(ms, tickOptions)

        return Promise.resolve(tickClock)
      }

      return tickClock.tickAsync(ms, tickOptions).then(() => {
        return tickClock
      })
    },
  })
}
