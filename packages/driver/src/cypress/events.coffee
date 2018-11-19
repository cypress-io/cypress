_ = require("lodash")
EE = require("eventemitter2")
log = require("debug")("cypress:driver")
Promise = require("bluebird")

$utils = require("./utils")

proxyFunctions = "emit emitThen emitMap".split(" ")

withoutFunctions = (arr) ->
  _.reject(arr, _.isFunction)

logEmit = true

module.exports = {
  extend: (obj) ->
    events = new EE

    events.setMaxListeners(Infinity)

    events.proxyTo = (child) ->
      parent = obj

      for fn in proxyFunctions
        ## create a closure
        do (fn) ->
          original = parent[fn]

          ## whenever our parent parent are emitting
          ## proxy those to the child obj
          parent[fn] = ->
            ret1 = original.apply(parent, arguments)

            ## dont let our child emits also log
            logEmit = false

            ret2 = child[fn].apply(child, arguments)

            logEmit = true

            ## aggregate the results of the parent
            ## and child
            switch fn
              when "emit"
                ## boolean
                ret1 or ret2
              when "emitMap"
                ## array of results
                ret1.concat(ret2)
              when "emitThen"
                Promise.join ret1, ret2, (a, a2) ->
                  ## array of results
                  a.concat(a2)

      return null

    events.emitMap = (eventName, args...) ->
      listeners = obj.listeners(eventName)

      ## is our log enabled and have we not silenced
      ## this specific object?
      if log.enabled and logEmit
        log("emitted: '%s' to '%d' listeners - with args: %o", eventName, listeners.length, args...)

      listener = (fn) ->
        fn.apply(obj, args)

      ## collect the results from the listeners
      _.map(listeners, listener)

    events.emitThen = (eventName, args...) ->
      listeners = obj.listeners(eventName)

      ## is our log enabled and have we not silenced
      ## this specific object?
      if log.enabled and logEmit
        log("emitted: '%s' to '%d' listeners - with args: %o", eventName, listeners.length, args...)

      listener = (fn) ->
        fn.apply(obj, args)

      Promise.map(listeners, listener)

    ## is our log enabled and have we not silenced
    ## this specific object?
    if log.enabled
      emit = events.emit

      events.emit = (eventName, args...) ->
        ret = emit.apply(obj, [eventName].concat(args))

        ## bail early if we have turned
        ## off logging temporarily
        if logEmit is false
          return ret

        if args.length
          log("emitted: '%s' - with args: %o", eventName, withoutFunctions(args)...)
        else
          log("emitted: '%s'", eventName)

        return ret

    events.emitToBackend = (eventName, args...) ->
      args = _.reject(args, _.isFunction)
      Cypress.backend("driver:event", eventName, args...)

    _.extend(obj, events)

    ## return the events object
    return events

  throwOnRenamedEvent: (eventEmitter, name) ->
    renamedEvents = {
      "command:queue:before:end": "before:command:queue:end"
      "fail": "test:fail"
      "runnable:after:run:async": "after:runnable:run:async"
      "scrolled": "internal:scrolled"
      "test:after:run": "test:run:end"
      "test:before:run": "test:run:start"
      "test:before:run:async": "test:run:start:async"
      "url:changed": "page:url:changed"
      "window:alert": "page:alert"
      "window:before:load": "page:start"
      "window:before:unload": "before:window:unload"
      "window:confirm": "page:confirm"
      "window:unload": "page:end"
    }

    methods = "addListener on once prependListener prependOnceListener".split(" ")

    _.each methods, (method) ->
      eventEmitter[method] = _.wrap eventEmitter[method], (original, eventName, listener) ->
        if renamedEvents[eventName]
          $utils.throwErrByPath("events.renamed_event", {
            args: {
              oldEvent: eventName
              newEvent: renamedEvents[eventName]
              object: name
              method: method
            }
            from: "cypress"
          })
        else
          original.call(@, eventName, listener)
}
