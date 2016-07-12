## adds class methods for command, route, and agent logging
## including the intermediate $Log interface
$Cypress.Log = do ($Cypress, _, Backbone) ->

  CypressErrorRe  = /(AssertionError|CypressError)/
  parentOrChildRe = /parent|child/
  ERROR_PROPS     = "message type name stack fileName lineNumber columnNumber host uncaught actual expected showDiff".split(" ")

  counter = 0

  triggerEvent = (Cypress, log, event) ->
    ## bail if we never fired our initial log event
    return if not log._hasInitiallyLogged

    attrs = log.toJSON()

    ## only trigger this event if our last stored
    ## emitted attrs do not match the current toJSON
    if not _.isEqual(log._emittedAttrs, attrs)
      log._emittedAttrs = attrs

      Cypress.trigger(event, attrs, log)

  triggerInitial = (Cypress, log) ->
    log._hasInitiallyLogged = true

    triggerEvent(Cypress, log, "log")

  klassMethods = {
    agent: (Cypress, cy, obj = {}) ->
      _.defaults obj,
        name: "agent"

      @log("agent", obj)

    route: (Cypress, cy, obj = {}) ->
      _.defaults obj,
        name: "route"

      @log("route", obj)

    command: (Cypress, cy, obj = {}) ->
      current = cy.prop("current")

      _.defaults obj, current?.pick("name", "type")

      ## force duals to become either parents or childs
      ## normally this would be handled by the command itself
      ## but in cases where the command purposely does not log
      ## then it could still be logged during a failure, which
      ## is why we normalize its type value
      if not parentOrChildRe.test(obj.type)
        ## does this command have a previously linked command
        ## by chainer id
        obj.type = if current.hasPreviouslyLinkedCommand() then "child" else "parent"

      _.defaults obj,
        event: false
        renderProps: -> {}
        consoleProps: ->
          ret = if $Cypress.Utils.hasElement(current.get("subject"))
            $Cypress.Utils.getDomElements(current.get("subject"))
          else
            current.get("subject")

          "Returned": ret

      # if obj.isCurrent
        ## stringify the obj.message (if it exists) or current.get("args")
      obj.message = $Cypress.Utils.stringify(obj.message ? current.get("args"))

      ## allow type to by a dynamic function
      ## so it can conditionally return either
      ## parent or child (useful in assertions)
      if _.isFunction(obj.type)
        obj.type = obj.type.call(cy, current, cy.prop("subject"))

      @log("command", obj)

    log: (Cypress, cy, instrument, obj) ->
      _.defaults obj,
        url:              cy.private("url")
        hookName:         cy.private("hookName")
        testId:           cy.private("runnable").id
        viewportWidth:    Cypress.config("viewportWidth")
        viewportHeight:   Cypress.config("viewportHeight")
        referencesAlias:  undefined
        alias:            undefined
        aliasType:        undefined
        message:          undefined
        renderProps: -> {}
        consoleProps: -> {}

      obj.instrument = instrument

      log = new $Log Cypress, obj
      log.wrapConsoleProps()

      onBeforeLog = cy.prop("onBeforeLog")

      ## dont trigger log if this function
      ## explicitly returns false
      if _.isFunction(onBeforeLog)
        return if onBeforeLog.call(cy, log) is false

      ## set the log on the command
      cy.prop("current")?.log(log)

      triggerInitial(Cypress, log)

      return log
  }

  class $Log
    constructor: (@Cypress, obj = {}) ->
      _.defaults obj,
        id: (counter += 1)
        state: "pending"

      trigger = =>
        triggerEvent(@Cypress, @, "log:state:changed")

      ## only fire the log:state:changed event
      ## as fast as every 16ms
      @fireChangeEvent = _.debounce(trigger, 16)

      @set(obj)

      ## if snapshot was passed
      ## in, go ahead and snapshot
      @snapshot() if @get("snapshot")

      ## if end was passed in
      ## go ahead and end
      @end({silent: true}) if @get("end")

      if err = @get("error")
        @error(err, {silent: true})

    get: (attr) ->
      @attributes[attr]

    unset: (key) ->
      @set(key, undefined)

    invoke: (fn) ->
      ## ensure this is a callable function
      ## and set its default to empty object literal
      @get(fn)?() ? {}

    serializeError: ->
      if err = @get("error")
        _.reduce ERROR_PROPS, (memo, prop) ->
          if _.has(err, prop) or err[prop]
            memo[prop] = err[prop]

          memo
        , {}
      else
        null

    toJSON: ->
      _(@attributes)
      .chain()
      .omit("error")
      .omit(_.isFunction)
      .extend({ err: @serializeError() })
      .extend({ url: (@get("url") or "").toString() })
      .extend({ consoleProps: @invoke("consoleProps")  })
      .extend({ renderProps:  @invoke("renderProps") })
      .value()

    set: (key, val) ->
      if _.isString(key)
        obj = {}
        obj[key] = val
      else
        obj = key

      ## convert onConsole to consoleProps
      ## for backwards compatibility
      if oc = obj.onConsole
        obj.consoleProps = oc

      ## if we have an alias automatically
      ## figure out what type of alias it is
      if obj.alias
        _.defaults obj, {aliasType: if obj.$el then "dom" else "primitive"}

      ## ensure attributes are an empty {}
      @attributes ?= {}

      ## dont ever allow existing id's to be mutated
      if @attributes.id
        delete obj.id

      _.extend @attributes, obj

      ## if we have an consoleProps function
      ## then re-wrap it
      if obj and _.isFunction(obj.consoleProps)
        @wrapConsoleProps()

      if obj and obj.$el
        @setElAttrs()

      @fireChangeEvent()

      return @

    pick: (args...) ->
      args.unshift(@attributes)
      _.pick.apply(_, args)

    publicInterface: ->
      {
        get:        _.bind(@get, @)
        on:         _.bind(@on, @)
        off:        _.bind(@off, @)
        pick:       _.bind(@pick, @)
        attributes: @attributes
      }

    snapshot: (name, options = {}) ->
      _.defaults options,
        at: null
        next: null

      obj = {name: name, state: @Cypress.createSnapshot @get("$el")}

      snapshots = @get("snapshots") ? []

      ## insert at index 'at' or whatever is the next position
      snapshots[options.at or snapshots.length] = obj

      @set("snapshots", snapshots)

      if next = options.next
        fn = @snapshot
        @snapshot = ->
          ## restore the fn
          delete @snapshot

          ## call orig fn with next as name
          fn.call(@, next)

      return @

    error: (err) ->
      @set({
        error: err
        state: "failed"
      })

      return @

    end: ->
      @set({
        end: true
        state: "passed"
      })

      return @

    getError: (err) ->
      ## dont log stack traces on cypress errors
      ## or assertion errors
      if CypressErrorRe.test(err.name)
        err.toString()
      else
        err.stack

    setElAttrs: ->
      $el = @get("$el")

      return if not $el

      if _.isElement($el)
        ## wrap the element in jquery
        ## if its just a plain element
        return @set("$el", $($el), {silent: true})

      ## make sure all $el elements are visible!
      obj = {
        highlightAttr: @Cypress.highlightAttr
        numElements:   $el.length
        visible:       $el.length is $el.filter(":visible").length
      }

      @set(obj, {silent: true})

    merge: (log) ->
      ## merges another logs attributes into
      ## ours by also removing / adding any properties
      ## on the original

      ## 1. calculate which properties to unset
      unsets = _.chain(@attributes).keys().without(_(log.attributes).keys()...).value()

      _.each unsets, (unset) =>
        @unset(unset)

      ## 2. merge in any other properties
      @set(log.attributes)

    reduceMemory: ->
      @off()
      @attributes = _.omit @attributes, _.isObject

    _shouldAutoEnd: ->
      ## must be autoEnd
      ## and not already ended
      ## and not an event
      ## and a command
      @get("autoEnd") isnt false and
        @get("end") isnt true and
          @get("event") is false and
            @get("instrument") is "command"

    finish: ->
      ## end our command since our subject
      ## has been resolved at this point
      ## unless its already been 'ended'
      ## or has been specifically told not to auto resolve
      if @_shouldAutoEnd()
        @snapshot().end()

    wrapConsoleProps: ->
      _this = @

      ## re-wrap consoleProps to set Command + Error defaults
      @attributes.consoleProps = _.wrap @attributes.consoleProps, (orig, args...) ->

        key = if _this.get("event") then "Event" else "Command"

        consoleObj = {}
        consoleObj[key] = _this.get("name")

        ## merge in the other properties from consoleProps
        _.extend consoleObj, orig.apply(@, args)

        ## TODO: right here we need to automatically
        ## merge in "Returned + Elemented" if there is an $el

        ## and finally add error if one exists
        if err = _this.get("error")
          _.defaults consoleObj,
            Error: _this.getError(err)

        ## add note if no snapshot exists on command instruments
        if _this.get("instrument") is "command" and not @snapshots
          consoleObj.Snapshot = "The snapshot is missing. Displaying current state of the DOM."
        else
          delete consoleObj.Snapshot

        return consoleObj

    @countLogsByTests = (tests = {}) ->
      _.chain(tests)
      .map (test, key) ->
        [].concat(test.agents, test.routes, test.commands)
      .flatten()
      .compact()
      .pluck("id")
      .max()
      .value()

    @setCounter = (num) ->
      counter = num

    @create = (Cypress, cy) ->
      _.each klassMethods, (fn, key) ->
        $Log[key] = _.partial(fn, Cypress, cy)

  _.extend $Log.prototype, Backbone.Events

  $Cypress.extend
    command: (obj = {}) ->
      $Cypress.Utils.warning "Cypress.command() is deprecated. Please update and use: Cypress.Log.command()"

      $Log.command(obj)

  return $Log
