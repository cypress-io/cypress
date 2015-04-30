## adds class methods for command, route, and agent logging
## including the intermediate $Log interface
$Cypress.Log = do ($Cypress, _, Backbone) ->

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
        state: "error"

      return @

    end: ->
      @set "state", "success"

      return @

    getError: (err) ->
      if err.name is "CypressError"
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

    wrapOnConsole: ->
      _this = @

      ## re-wrap onConsole to set Command + Error defaults
      @attributes.onConsole = _.wrap @attributes.onConsole, (orig, args...) ->

        ## grab the Command name by default
        consoleObj = {Command: _this.get("name")}

        ## merge in the other properties from onConsole
        _.extend consoleObj, orig.apply(@, args)

        ## and finally add error if one exists
        if err = _this.get("error")
          _.defaults consoleObj,
            Error: _this.getError(err)

        return consoleObj

    @create = (Cypress, obj) ->
      new $Log(Cypress, obj)

  _.extend $Log.prototype, Backbone.Events

  $Cypress.extend
    command: (obj = {}) ->
      current = @cy.prop("current")

      return if not (@cy and current)

      _.defaults obj, _(current).pick("name", "type")

      ## force duals to become either parents or childs
      ## normally this would be handled by the command itself
      ## but in cases where the command purposely does not log
      ## then it could still be logged during a failure, which
      ## is why we normalize its type value
      if obj.type is "dual"
        obj.type = if current.prev then "child" else "parent"

      ## does this object represent the current command cypress
      ## is processing?
      obj.isCurrent = obj.name is current.name

      _.defaults obj,
        onRender: ->
        onConsole: ->
          "Returned": current.subject

      if obj.isCurrent
        ## stringify the obj.message (if it exists) or current.args
        obj.message = $Cypress.Utils.stringify(obj.message ? current.args)

      ## allow type to by a dynamic function
      ## so it can conditionally return either
      ## parent or child (useful in assertions)
      if _.isFunction(obj.type)
        obj.type = obj.type.call(@cy, current, @cy.prop("subject"))

      # if obj.snapshot
        # obj._snapshot = @cy.createSnapshot(obj.$el)

      @log("command", obj)

    route: (obj = {}) ->
      return if not @cy

      _.defaults obj,
        name: "route"

      @log("route", obj)

    agent: (obj = {}) ->
      return if not @cy

      _.defaults obj,
        name: "agent"

      @log("agent", obj)

    log: (event, obj) ->
      _.defaults obj,
        hookName:         @cy.prop("hookName")
        testId:           @cy.prop("runnable").id
        referencesAlias:  undefined
        alias:            undefined
        aliasType:        undefined
        message:          undefined
        onRender: ->
        onConsole: ->

      if obj.isCurrent
        _.defaults obj, alias: @cy.getNextAlias()

      obj.event = event

      log = $Log.create(@, obj)
      log.wrapOnConsole()

      @trigger "log", log

      return log

  return $Log