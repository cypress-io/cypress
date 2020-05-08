const Promise = require('bluebird')

const tryFn = (fn) => {
  // promisify this function
  return Promise.try(fn)
}

const create = (Cypress, state) => {
  const isStable = (stable = true, event) => {
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
  }

  const whenStable = (fn) => {
    // if we are not stable
    if (state('isStable') === false) {
      return new Promise((resolve, reject) => {
        // then when we become stable
        return state('whenStable', () => {
          // reset this callback function
          state('whenStable', null)

          // and invoke the original function
          return tryFn(fn)
          .then(resolve)
          .catch(reject)
        })
      })
    }

    // else invoke it right now
    return tryFn(fn)
  }

  return {
    isStable,

    whenStable,
  }
}

module.exports = {
  create,
}
