import _ from 'lodash'
import fakeTimers from '@sinonjs/fake-timers'

type ClockWithTimers = ReturnType<typeof install> & {
  timers?: Record<string, { callAt: number }>
}

const install = (win, now, methods) => {
  return fakeTimers.withGlobal(win).install({
    now,
    toFake: methods,
  })
}

export const create = (win, now, methods) => {
  let currentWindow = win
  let clock: ClockWithTimers = install(win, now, methods)

  const flushPromises = () => currentWindow.Promise.resolve()

  const getNextTimerCallAt = () => {
    const callAtValues = Object.values(clock.timers ?? {}).map(
      ({ callAt }) => callAt,
    )

    return callAtValues.length ? Math.min(...callAtValues) : undefined
  }

  const tick = (ms) => {
    return clock.tick(ms)
  }

  const tickAsync = async (ms: number) => {
    const finalNow = clock.now + ms

    await flushPromises()

    while (clock.now <= finalNow) {
      const nextTimerCallAt = getNextTimerCallAt()

      if (
        typeof nextTimerCallAt === 'undefined' ||
        nextTimerCallAt > finalNow
      ) {
        return clock.tick(finalNow - clock.now)
      }

      clock.tick(nextTimerCallAt - clock.now)

      await flushPromises()
    }

    return clock.now
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

        if (fn && fn.hadOwnProperty && currentWindow[method]) {
          currentWindow[method].hadOwnProperty = true
        }
      } catch (error) {} // eslint-disable-line no-empty
    })

    return clock.uninstall()
  }

  const bind = (win) => {
    currentWindow = win
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

    tickAsync,

    restore,

    setSystemTime,

    bind,

    details,

  }
}

export type Clock = ReturnType<typeof create>
