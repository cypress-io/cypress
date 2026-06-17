import Promise from 'bluebird'
import Debug from 'debug'
import type { ICypress } from '../cypress'
import type { StateFunc } from '../cypress/state'

const debug = Debug('cypress:driver:stability')

export const create = (Cypress: ICypress, state: StateFunc) => {
  const whenStableQueue: Array<{
    fn: () => any
    reject: (reason?: any) => void
    resolve: (value?: any) => void
  }> = []

  const reset = () => {
    const pending = whenStableQueue.splice(0)

    if (pending.length) {
      debug('rejecting %d stability waiter(s) still queued at reset', pending.length)
    }

    // reject each waiter so they don't run in the next test
    for (const waiter of pending) {
      waiter.reject(new Error('Stability waiters cleared due to test reset'))
    }
  }

  return {
    reset,
    isStable: (stable: boolean = true, event: string) => {
      // if the state is already in the desired state, return
      if (state('isStable') === stable) {
        return
      }

      // set the state to the desired state
      state('isStable', stable)

      // we notify the outside world because this is what the runner uses to
      // show the 'loading spinner' during an app page loading transition event
      Cypress.action('cy:stability:changed', stable, event)

      // if the state is unstable, return
      if (!stable) {
        return
      }

      // release the when stable queue
      Cypress.action('cy:before:stability:release')
      .then(async () => {
        // get the waiters to release
        const waitersToRelease = whenStableQueue.splice(0)

        // if there are no waiters to release, return
        if (!waitersToRelease.length) {
          return
        }

        // detect the race where the page became unstable again between the
        // stability change and this asynchronous release - the waiters are
        // released anyway, so their commands may run while the page is
        // transitioning
        if (state('isStable') === false) {
          debug('releasing %d stability waiter(s) while state(\'isStable\') is false', waitersToRelease.length)
        }

        // release the waiters
        await Promise.all(waitersToRelease.map((waiter) => {
          return Promise.try(waiter.fn)
          .then(waiter.resolve)
          .catch(waiter.reject)
        }))
      })
    },

    whenStable: (fn: () => any) => {
      // if the state is stable, call the function immediately
      if (state('isStable') !== false) {
        return Promise.try(fn)
      }

      // otherwise, queue the function to be called when stable
      return new Promise((resolve, reject) => {
        // queue one waiter per caller while unstable so no registrations can overwrite each other
        whenStableQueue.push({ fn, resolve, reject })
      })
    },
  }
}

// Omit 'reset' so $Cy can implement IStability without conflicting with its own reset(test) method.
// Stability reset is exposed on the cy instance as resetStability.
export interface IStability extends Omit<ReturnType<typeof create>, 'reset'> {}
