import Promise from 'bluebird'

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (Cypress, state) => ({
  isStable: (stable: boolean = true, event: string) => {
    if (state('isStable') === stable) {
      return
    }

    const whenStable = state('whenStable')

    if (stable && whenStable) {
      whenStable()
    }

    state('isStable', stable)

    // we notify the outside world because this is what the runner uses to
    // show the 'loading spinner' during an app page loading transition event
    Cypress.action('cy:stability:changed', stable, event)
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

  isAnticipatingMultiDomain (anticipating) {
    if (state('anticipatingMultiDomain') === anticipating) {
      return
    }

    const whenAnticipatingMultiDomain = state('whenAnticipatingMultiDomain')

    if (anticipating && whenAnticipatingMultiDomain) {
      whenAnticipatingMultiDomain()
    }

    state('anticipatingMultiDomain', anticipating)
  },

  whenStableOrAnticipatingMultiDomain (fn) {
    if (state('anticipatingMultiDomain') || state('isStable') !== false) {
      return Promise.try(fn)
    }

    return new Promise((resolve, reject) => {
      let fulfilled = false

      const onSignal = () => {
        if (fulfilled) return

        fulfilled = true

        state('whenStable', null)
        state('whenAnticipatingMultiDomain', null)

        Promise.try(fn)
        .then(resolve)
        .catch(reject)
      }

      state('whenStable', onSignal)
      state('whenAnticipatingMultiDomain', onSignal)
    })
  },
})

export interface IStability extends ReturnType<typeof create> {}
