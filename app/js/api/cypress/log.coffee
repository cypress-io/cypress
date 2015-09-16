## adds class methods for command, route, and agent logging
## including the intermediate $Log interface
$Cypress.Log = do ($Cypress, _, Backbone) ->

  CypressErrorRe = /(AssertionError|CypressError)/

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
      if obj.type is "dual"
        obj.type = if current.get("prev") then "child" else "parent"

      _.defaults obj,
        event: false
        onRender: ->
        onConsole: ->
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
        viewportWidth:    cy.private("viewportWidth")
        viewportHeight:   cy.private("viewportHeight")
        referencesAlias:  undefined
        alias:            undefined
        aliasType:        undefined
        message:          undefined
        onRender: ->
        onConsole: ->

      obj.instrument = instrument

      log = new $Log Cypress, obj
      log.wrapOnConsole()

      ## dont trigger log if any return value from
      ## our before:log is false
      return if _.any Cypress.invoke("before:log", log), (ret) ->
        ret is false

      ## set the log on the command
      cy.prop("current")?.log(log)

      Cypress.trigger "log", log

      return log
  }

  class $Log
    constructor: (@Cypress, obj = {}) ->
      _.defaults obj,
        state: "pending"

      @set(obj)

      ## if snapshot was passed
      ## in, go ahead and snapshot
      @snapshot() if @get("snapshot")

      ## if end was passed in
      ## go ahead and end
      @end() if @get("end")

      if err = @get("error")
        @error(err)

    get: (attr) ->
      @attributes[attr]

    unset: (key) ->
      @set key, undefined

    set: (key, val) ->
      if _.isString(key)
        obj = {}
        obj[key] = val
      else
        obj = key

      ## if we have an alias automatically
      ## figure out what type of alias it is
      if obj.alias
        _.defaults obj, {aliasType: if obj.$el then "dom" else "primitive"}

      ## ensure attributes are an empty {}
      @attributes ?= {}

      _.extend @attributes, obj

      ## if we have an onConsole function
      ## then re-wrap it
      if obj and _.isFunction(obj.onConsole)
        @wrapOnConsole()

      if obj and obj.$el
        @setElAttrs()

      @trigger "attrs:changed", @attributes

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

    snapshot: ->
      @set "snapshot", @Cypress.createSnapshot @get("$el")

      return @

    error: (err) ->
      @set
        error: err
        state: "failed"

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

      ## make sure all $el elements are visible!
      obj = {
        highlightAttr: @Cypress.highlightAttr
        numElements:   $el.length
        visible:       $el.length is $el.filter(":visible").length
      }

      @set obj

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

    wrapOnConsole: ->
      _this = @

      ## re-wrap onConsole to set Command + Error defaults
      @attributes.onConsole = _.wrap @attributes.onConsole, (orig, args...) ->

        key = if _this.get("event") then "Event" else "Command"

        consoleObj = {}
        consoleObj[key] = _this.get("name")

        ## merge in the other properties from onConsole
        _.extend consoleObj, orig.apply(@, args)

        ## add error if one exists
        if err = _this.get("error")
          _.defaults consoleObj,
            Error: _this.getError(err)

        ## add note if no snapshot exists on command instruments
        if _this.get("instrument") is "command" and not @snapshot
          consoleObj.Snapshot = "The snapshot is missing. Displaying current state of the DOM."
        else
          delete consoleObj.Snapshot

        return consoleObj

    @create = (Cypress, cy) ->
      _.each klassMethods, (fn, key) ->
        $Log[key] = _.partial(fn, Cypress, cy)

  _.extend $Log.prototype, Backbone.Events

  $Cypress.extend
    command: (obj = {}) ->
      console.warn "Cypress.command() is deprecated. Please update and use: Cypress.Log.command()"

      $Log.command(obj)

  return $Log