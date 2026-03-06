import Promise from 'bluebird'
import type { ICypress } from '../cypress'
import type { StateFunc } from '../cypress/state'

export const create = (Cypress: ICypress, state: StateFunc) => {
  const whenStableQueue: Array<{
    fn: () => any
    reject: (reason?: any) => void
    resolve: (value?: any) => void
  }> = []

  return {
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

export interface IStability extends ReturnType<typeof create> {}
