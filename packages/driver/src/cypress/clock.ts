import _ from 'lodash'
import fakeTimers from '@sinonjs/fake-timers'

// @sinonjs/fake-timers 13+ fakes every supported time function by default when
// no `toFake` list is provided. Substitute the historical default set — every
// detected timer except `nextTick` and `queueMicrotask` — so cy.clock() fakes
// the same functions as before the upgrade. An empty methods array is treated
// as "no list" here, matching how 11.x already expanded it to that default.
const install = (win, now, methods) => {
  const { timers, install: installClock } = fakeTimers.withGlobal(win)

  const toFake = methods && methods.length
    ? methods
    : Object.keys(timers).filter((name) => name !== 'nextTick' && name !== 'queueMicrotask')

  return installClock({
    now,
    toFake,
  })
}

export const create = (win, now, methods) => {
  let clock = install(win, now, methods)

  const tick = (ms) => {
    return clock.tick(ms)
  }

  const restore = () => {
    _.each(clock.methods, (method) => {
      try {
        // before restoring the clock, we need to
        // reset the hadOwnProperty in case a
        // the application code eradicated the
        // overridden clock method at a later time.
        // this is a property that @sinonjs/fake-timers using internally
        // when restoring the global methods.
        // https://github.com/cypress-io/cypress/issues/2850
        const fn = clock[method]

        if (fn && fn.hadOwnProperty && win[method]) {
          win[method].hadOwnProperty = true
        }
      } catch (error) {} // eslint-disable-line no-empty
    })

    return clock.uninstall()
  }

  const bind = (win) => {
    clock = install(win, now, methods)

    return clock
  }

  const details = () => {
    return _.pick(clock, 'now', 'methods')
  }

  const setSystemTime = (now) => {
    clock.setSystemTime(now)
  }

  return {
    tick,

    restore,

    setSystemTime,

    bind,

    details,

  }
}

export type Clock = ReturnType<typeof create>
