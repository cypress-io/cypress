import Promise from 'bluebird'

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (Cypress, state) => ({
  isStable: (stable: boolean = true, event: string) => {
    if (state('isStable') === stable) {
      return
    }

    const whenStable = state('whenStable')

    // if we are going back to stable and we have
    // a whenStable callback
    if (stable && whenStable) {
      // invoke it
      whenStable()
    }

    state('isStable', stable)

    // we notify the outside world because this is what the runner uses to
    // show the 'loading spinner' during an app page loading transition event
    return Cypress.action('cy:stability:changed', stable, event)
  },

  whenStable: (fn: () => any) => {
    // if we are not stable
    if (state('isStable') === false) {
      return new Promise((resolve, reject) => {
        // then when we become stable
        return state('whenStable', () => {
          // reset this callback function
          state('whenStable', null)

          // and invoke the original function
          return Promise.try(fn)
          .then(resolve)
          .catch(reject)
        })
      })
    }

    // else invoke it right now
    return Promise.try(fn)
  },
})

export interface IStability extends ReturnType<typeof create> {}
