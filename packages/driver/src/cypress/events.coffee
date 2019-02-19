_ = require("lodash")
EE = require("eventemitter2")
log = require("debug")("cypress:driver")
Promise = require("bluebird")

$utils = require("./utils")

proxyFunctions = "emit emitThen emitMap".split(" ")
listenerOnMethods = "addListener on once prependListener prependOnceListener".split(" ")
listenerOffMethods = "removeListener off".split(" ")

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

  handleWindowEvents: (Cypress, eventEmitter, unbindOnTestEnd) ->
    windowEvents = []
    pageStarted = false
    pageWindow = null

    onWindowEvent = (eventName, listener) ->
      windowEvents.push({ eventName, listener })
      ## any calls to Cypress.on("window:*") after page:start need to be
      ## bound now. otherwise they'll be bound when page:start is fired
      if pageStarted and pageWindow
        pageWindow.addEventListener(eventName, listener)

    offWindowEvent = (eventName, listener) ->
      windowEvents = windowEvents.filter (eventProps) ->
        eventProps.eventName is eventName and eventProps.listener is listener
      if pageStarted and pageWindow
        pageWindow.removeEventListener(eventName, listener)

    wrapEmitterMethods = (methods, handler) ->
      _.each methods, (method) ->
        eventEmitter[method] = _.wrap eventEmitter[method], (original, eventName, listener) ->
          if _.startsWith(eventName, "window:")
            handler(eventName.replace("window:", ""), listener)
          else
            original.call(@, eventName, listener)

    wrapEmitterMethods(listenerOnMethods, onWindowEvent)
    wrapEmitterMethods(listenerOffMethods, offWindowEvent)

    Cypress.on "page:start", ({ win }) ->
      pageWindow = win
      _.each windowEvents, ({ eventName, listener }) ->
        win.addEventListener(eventName, listener)
      pageStarted = true

    Cypress.on "page:end", ->
      pageStarted = false

    Cypress.on "test:end", ->
      if unbindOnTestEnd
        _.each windowEvents, ({ eventName, listener }) ->
          if pageWindow
            pageWindow.removeEventListener(eventName, listener)

      windowEvents = []
      pageStarted = false
      pageWindow = null

  throwOnRenamedEvent: (eventEmitter, name) ->
    renamedEvents = {
      "command:end": "internal:commandEnd"
      "command:enqueued": "internal:commandEnqueued"
      "command:queue:before:end": "before:command:queue:end"
      "command:retry": "internal:commandRetry"
      "command:start": "internal:commandStart"
      "fail": "test:fail"
      "runnable:after:run:async": "after:runnable:run:async"
      "scrolled": "internal:scrolled"
      "test:after:run": "test:end"
      "test:before:run": "test:start"
      "test:before:run:async": "test:start:async"
      "url:changed": "page:url:changed"
      "viewport:changed": "viewport:change"
      "window:alert": "page:alert"
      "window:confirm": "page:confirm"
      "window:before:unload": "window:beforeunload"
    }

    renamedEventsWithWinChangedtoDetails = {
      "window:before:load": "page:start"
      "window:load": "page:ready"
    }

    _.each listenerOnMethods, (method) ->
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
        else if renamedEventsWithWinChangedtoDetails[eventName]
          $utils.throwErrByPath("events.renamed_event_win_to_details", {
            args: {
              oldEvent: eventName
              newEvent: renamedEventsWithWinChangedtoDetails[eventName]
              object: name
              method: method
            }
            from: "cypress"
          })
        else
          original.call(@, eventName, listener)
}
