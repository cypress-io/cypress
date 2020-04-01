const Promise = require('bluebird')

// promisify this function
const tryFn = (fn) => {
  return Promise.try(fn)
}

const create = function (Cypress, state) {
  const isStable = function (stable = true, event) {
    let whenStable = state('whenStable')

    if (state('isStable') === stable) {
      return
    }

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

  const whenStable = function (fn) {
    // if we are not stable
    if (state('isStable') === false) {
      // then when we become stable
      return new Promise((resolve, reject) => {
        return state('whenStable', async () => {
        // reset this callback function
          state('whenStable', null)

          // and invoke the original function
          try {
            const thenableOrResult = await tryFn(fn)

            return resolve(thenableOrResult)
          } catch (error) {
            return reject(error)
          }
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
