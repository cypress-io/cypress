import _ from 'lodash'
import $errUtils from '../cypress/error_utils'
import type { StateFunc } from '../cypress/state'

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (state: StateFunc) => ({
  timeout (ms?: number, delta: boolean = false) {
    const runnable = state('runnable')

    if (!runnable) {
      $errUtils.throwErrByPath('miscellaneous.outside_test')
    }

    if (_.isFinite(ms)) {
      // if delta is true then we add (or subtract) from the
      // runnables current timeout instead of blanketingly setting it
      ms = delta ? runnable.timeout() + ms! : ms
      runnable.timeout(ms!)

      return this
    }

    return runnable.timeout()
  },

  clearTimeout () {
    const runnable = state('runnable')

    if (!runnable) {
      $errUtils.throwErrByPath('miscellaneous.outside_test')
    }

    runnable.clearTimeout()

    return this
  },
})

export interface ITimeouts extends ReturnType<typeof create> { }
