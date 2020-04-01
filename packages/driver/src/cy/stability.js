Promise = require("bluebird")

tryFn = (fn) ->
  ## promisify this function
  Promise.try(fn)

create = (Cypress, state) ->
  isStable = (stable = true, event) ->
    return if state("isStable") is stable

    ## if we are going back to stable and we have
    ## a whenStable callback
    if stable and whenStable = state("whenStable")
      ## invoke it
      whenStable()

    state("isStable", stable)

    ## we notify the outside world because this is what the runner uses to
    ## show the 'loading spinner' during an app page loading transition event
    Cypress.action("cy:stability:changed", stable, event)

  whenStable = (fn) ->
    ## if we are not stable
    if state("isStable") is false
      return new Promise (resolve, reject) ->
        ## then when we become stable
        state "whenStable", ->
          ## reset this callback function
          state("whenStable", null)

          ## and invoke the original function
          tryFn(fn)
          .then(resolve)
          .catch(reject)

    ## else invoke it right now
    return tryFn(fn)

  return {
    isStable

    whenStable
  }

module.exports = {
  create
}
