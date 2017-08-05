Promise = require("bluebird")

tryFn = (fn) ->
  ## promisify this function
  Promise.try(fn)

create = (Cypress, state) ->
  isStable = (bool = true, event) ->
      # if whenReady = state("whenReady")
        # whenReady()

    #   ## we set recentlyReady to true
    #   ## so we dont accidently set isReady
    #   ## back to false in between commands
    #   ## which are async
    #   state("recentlyReady", true)
    #
    #   if ready = state("ready")
    #     if ready.promise.isPending()
    #       ready.promise.then =>
    #         @trigger "ready", true
    #
    #         ## prevent accidential chaining
    #         ## .this after isReady resolves
    #         return null
    #
    #   return ready?.resolve()

    ## if we already have a ready object and
    ## its state is pending just leave it be
    ## and dont touch it
    # return if state("ready") and state("ready").promise.isPending()

    return if state("isStable") is bool

    state("isStable", bool)

    ## we notify the outside world because this is what the runner uses to
    ## show the 'loading spinner' during an app page loading transition event
    Cypress.action("cy:stability:changed", bool, event)

  whenStable = (fn) ->
    ## if we are not stable
    if state("isStable") is false
      debugger
      return new Promise (resolve) ->
        ## then when we become stable
        state "whenStable", ->

          debugger

          ## reset us back to stable
          state("isStable", true)

          ## reset this callback function
          state("whenStable", null)

          ## and invoke the original function
          tryFn(fn)
          .then(resolve)

    ## else invoke it right now
    return tryFn(fn)

  return {
    isStable

    whenStable
  }

module.exports = {
  create
}
