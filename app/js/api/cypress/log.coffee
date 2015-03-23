## adds class methods for command, route, and agent logging
## including the intermediate Log interface
Cypress.Log = do (Cypress, _, Backbone) ->

  class Log
    constructor: (obj = {}) ->
      _.defaults obj,
        state: "pending"

      @attributes = obj

    get: (attr) ->
      @attributes[attr]

    set: (key, val) ->
      if _.isString(key)
        obj = {}
        obj[key] = val
      else
        obj = key

      _.extend @attributes, obj

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

    snapshot: ($el) ->
      @set "snapshot", Cypress.createSnapshot @get("$el")

      return @

    error: (err) ->
      @set "error", err
      @state = "error"

      @trigger "state:change", @state

      return @

    end: ->
      @state = "success"

      @trigger "state:change", @state

      return @

  _.extend Log.prototype, Backbone.Events

  _.extend Cypress,
    command: (obj = {}) ->
      current = @cy.prop("current")

      return if not (@cy and current)

      ## stringify the arguments
      stringify = (array) ->
        _(array).map( (value) -> "" + value).join(", ")

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
        snapshot: true
        onRender: ->
        onConsole: ->
          "Returned": current.subject

      if obj.isCurrent
        _.defaults obj, {message: stringify(current.args)}

      ## allow type to by a dynamic function
      ## so it can conditionally return either
      ## parent or child (useful in assertions)
      if _.isFunction(obj.type)
        obj.type = obj.type.call(@cy, current, @cy.prop("subject"))

      # if obj.snapshot
        # obj._snapshot = @cy.createSnapshot(obj.$el)

      if obj.$el
        obj.highlightAttr = Cypress.highlightAttr
        obj.numElements   = obj.$el.length

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
      getError = (err) ->
        if err.name is "CypressError"
          err.toString()
        else
          err.stack

      _.defaults obj,
        testId:           @cy.prop("runnable").cid
        referencesAlias:  undefined
        alias:            undefined
        message:          undefined
        onRender: ->
        onConsole: ->

      if obj.isCurrent
        _.defaults obj, {alias: @cy.getNextAlias()}

      ## re-wrap onConsole to set Command + Error defaults
      obj.onConsole = _.wrap obj.onConsole, (orig, args...) ->
        ## grab the Command name by default
        consoleObj = {Command: obj.name}

        ## merge in the other properties from onConsole
        _.extend consoleObj, orig.apply(obj, args)

        ## and finally add error if one exists
        if obj.error
          _.defaults consoleObj,
            Error: getError(obj.error)

        return consoleObj

      obj.event = event

      log = new Log(obj)

      @trigger "log", log

      return log

  return Log