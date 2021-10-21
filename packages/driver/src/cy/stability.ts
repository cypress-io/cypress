import Promise from 'bluebird'

const tryFn = (fn) => {
  // promisify this function
  return Promise.try(fn)
}

export default {
  create: (Cypress, state) => {
    const isStable = (stable = true, event) => {
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
    }

    const whenStable = (fn) => {
      if (state('isStable') !== false) {
        return tryFn(fn)
      }

      return new Promise((resolve, reject) => {
        state('whenStable', () => {
          state('whenStable', null)

          tryFn(fn)
          .then(resolve)
          .catch(reject)
        })
      })
    }

    const isAnticipatingMultidomain = (anticipating) => {
      if (state('anticipatingMultidomain') === anticipating) {
        return
      }

      const whenAnticipatingMultidomain = state('whenAnticipatingMultidomain')

      if (anticipating && whenAnticipatingMultidomain) {
        whenAnticipatingMultidomain()
      }

      state('anticipatingMultidomain', anticipating)
    }

    const whenStableOrAnticipatingMultidomain = (fn) => {
      if (state('anticipatingMultidomain') || state('isStable') !== false) {
        return tryFn(fn)
      }

      return new Promise((resolve, reject) => {
        let fulfilled = false

        const onSignal = () => {
          if (fulfilled) return

          fulfilled = true

          state('whenStable', null)
          state('whenAnticipatingMultidomain', null)

          tryFn(fn)
          .then(resolve)
          .catch(reject)
        }

        state('whenStable', onSignal)
        state('whenAnticipatingMultidomain', onSignal)
      })
    }

    return {
      isStable,
      whenStable,
      isAnticipatingMultidomain,
      whenStableOrAnticipatingMultidomain,
    }
  },
}
