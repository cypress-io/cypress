import _ from 'lodash'
import fakeTimers from '@sinonjs/fake-timers'

const install = (win, now, methods) => {
  return fakeTimers.withGlobal(win).install({
    now,
    toFake: methods,
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
