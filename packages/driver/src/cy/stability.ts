import Promise from 'bluebird'
import type { ICypress } from '../cypress'
import type { StateFunc } from '../cypress/state'

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (Cypress: ICypress, state: StateFunc) => ({
  isStable: (stable: boolean = true, event: string) => {
    if (state('isStable') === stable) {
      return
    }

    state('isStable', stable)

    // we notify the outside world because this is what the runner uses to
    // show the 'loading spinner' during an app page loading transition event
    Cypress.action('cy:stability:changed', stable, event)

    if (!stable) {
      return
    }

    Cypress.action('cy:before:stability:release')
    .then(async () => {
      const whenStable = state('whenStable')

      if (whenStable) {
        await whenStable()
      }
    })
  },

  whenStable: (fn: () => any) => {
    if (state('isStable') !== false) {
      return Promise.try(fn)
    }

    return new Promise((resolve, reject) => {
      // then when we become stable
      state('whenStable', () => {
        // reset this callback function
        state('whenStable', null)

        // and invoke the original function
        Promise.try(fn)
        .then(resolve)
        .catch(reject)
      })
    })
  },
})

export interface IStability extends ReturnType<typeof create> {}
