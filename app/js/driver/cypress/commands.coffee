do ($Cypress, _) ->

  class $Command
    constructor: (obj = {}) ->
      @reset()

      @set(obj)

    set: (key, val) ->
      if _.isString(key)
        obj = {}
        obj[key] = val
      else
        obj = key

      _.extend @attributes, obj

      return @

    finishLogs: ->
      ## finish each of the logs we have
      _.invoke @get("logs"), "finish"

    log: (log) ->
      ## always set the chainerId of the log to ourselves
      ## so it can be queried on later
      log.set("chainerId", @get("chainerId"))

      @get("logs").push(log)

      return @

    getLastLog: ->
      ## return the last non-event log
      logs = @get("logs")
      if logs.length
        for log in logs by -1
          if log.get("event") is false
            return log
      else
        undefined

    hasPreviouslyLinkedCommand: ->
      prev = @get("prev")

      !!(prev and prev.get("chainerId") is @get("chainerId"))

    is: (str) ->
      @get("type") is str

    get: (attr) ->
      @attributes[attr]

    toJSON: ->
      @attributes

    _removeNonPrimitives: (args) ->
      ## if the obj has options and
      ## log is false, set it to true
      for arg, i in args by -1
        if _.isObject(arg)
          ## filter out any properties which arent primitives
          ## to prevent accidental mutations
          opts = _(arg).omit(_.isObject)

          ## force command to log
          opts.log = true

          args[i] = opts
          return

    skip: ->
      @set("skip", true)

    stringify: ->
      {name, args} = @attributes

      args = _.reduce args, (memo, arg) ->
        arg = if _.isString(arg) then _.truncate(arg, 20) else "..."
        memo.push(arg)
        memo
      , []

      args = args.join(", ")

      "cy.#{name}('#{args}')"

    clone: ->
      @_removeNonPrimitives @get("args")
      $Command.create _.clone(@attributes)

    reset: ->
      @attributes = {}
      @attributes.logs = []

      return @

    @create = (obj) ->
      new $Command(obj)

  class $Commands
    constructor: (cmds = []) ->
      @commands = cmds

    logs: (filters) ->
      logs = _.flatten @invoke("get", "logs")

      if filters
        matchesFilters = _.matches(filters)

        logs = _(logs).filter (log) ->
          matchesFilters(log.attributes)

      return logs

    add: (obj) ->
      if $Cypress.Utils.isInstanceOf(obj, $Command)
        return obj
      else
        $Command.create(obj)

    get: ->
      @commands

    names: ->
      @invoke("get", "name")

    splice: (start, end, obj) ->
      cmd = @add(obj)
      @commands.splice(start, end, cmd)

      return cmd

    slice: ->
      cmds = @commands.slice.apply(@commands, arguments)
      $Commands.create(cmds)

    at: (index) ->
      @commands[index]

    _filterByAttrs: (attrs, method) ->
      matchesAttrs = _.matches(attrs)

      @[method] (command) ->
        matchesAttrs(command.attributes)

    where: (attrs) ->
      @_filterByAttrs(attrs, "filter")

    findWhere: (attrs) ->
      @_filterByAttrs(attrs, "find")

    toJSON: ->
      @invoke("toJSON")

    reset: ->
      @commands.splice(0, @commands.length)

      return @

    @create = (cmds) ->
      new $Commands(cmds)

  Object.defineProperty $Commands.prototype, "length", {
    get: -> @commands.length
  }

  ## mixin underscore methods
  _.each ["pick"], (method) ->
    $Command.prototype[method] = (args...) ->
      args.unshift(@attributes)
      _[method].apply(_, args)

  ## mixin underscore methods
  _.each ["invoke", "map", "pluck", "first", "reduce", "find", "filter", "reject", "last", "indexOf", "each"], (method) ->
    $Commands.prototype[method] = (args...) ->
      args.unshift(@commands)
      _[method].apply(_, args)

  $Cypress.Command  = $Command
  $Cypress.Commands = $Commands

  $Cypress.extend
    addChildCommand: (key, fn) ->
      @add(key, fn, "child")

    addParentCommand: (key, fn) ->
      @add(key, fn, "parent")

    addDualCommand: (key, fn) ->
      @add(key, fn, "dual")

    addAssertionCommand: (key, fn) ->
      @add(key, fn, "assertion")

    addUtilityCommand: (key, fn) ->
      @add(key, fn, "utility")

    ## think about adding this for
    ## custom cy extensions as well
    ## that we want to rollback afterwards
    ## (Cypress.Cy.extend)
    prepareForCustomCommands: ->
      ## remove any existing custom commands
      @removeCustomCommands()

      ## backup old inject
      @_inject = @inject

      _this = @

      @_customCommands = []

      ## override inject to hold onto a copy of all custom commands
      @inject = _.wrap @inject, (orig, key, fn, type) ->
        _this._customCommands.push(key)

        orig.call(@, key, fn, type)

    removeCustomCommands: ->
      ## restore old inject
      @inject = @_inject if @_inject

      _.each @_customCommands ? [], (key) ->
        delete $Cypress.Cy.prototype[key]
        delete $Cypress.Cy.prototype.sync[key]
        $Cypress.Chainer.remove(key)

    add: (key, fn, type) ->
      $Cypress.Utils.throwErrByPath("add.type_missing") if not type

      ## allow object signature
      if _.isObject(key)
        _.each key, (fn, name) =>
          @add(name, fn, type)
        return @

      ## need to pass the options into inject here
      @inject(key, fn, type)
      return @

    inject: (key, fn, type) ->
      _this = @

      prepareSubject = (subject, args) ->
        ## if we already have a subject
        ## then replace the first argument
        ## with the new subject.
        ## i think this is now deprecated
        ## based on the way args are passed
        ## it will always be a new array of arguments
        ## and therefore we dont have to deal with
        ## the edge case of mutating args with subject
        ## later.  however theres not enough tests
        ## around this so we'll leave it in place for now.
        if args.hasSubject
          args.splice(0, 1, subject)
        else
          args.unshift(subject)

        args.hasSubject or= true
        args

      wrap = (fn) ->
        wrapped = wrapByType(fn)
        wrapped.originalFn = fn
        wrapped

      wrapByType = (fn) ->
        switch type
          when "parent"
            return fn

          when "dual", "utility"
            _.wrap fn, (orig, args...) ->
              subject = @prop("subject")
              args = prepareSubject(subject, args)

              return orig.apply(@, args)

          when "child", "assertion"
            _.wrap fn, (orig, args...) ->
              @ensureParent()

              ## push the subject into the args
              subject = @prop("subject")
              args = prepareSubject(subject, args)

              ret = orig.apply(@, args)
              return ret ? subject

      $Cypress.Cy.prototype[key] = (args...) ->
        if not @private("runnable")
          $Cypress.Utils.throwErrByPath("miscellaneous.outside_test")

        ## this is the first call on cypress
        ## so create a new chainer instance
        chain = $Cypress.Chainer.create(@, key, args)

        ## store the chain so we can access it later
        @prop("chain", chain)

        return chain

      ## reference a synchronous version of this function
      ## fix this for synchronous chainer version!
      $Cypress.Cy.prototype.sync[key] = (args...) ->
        wrap(fn).apply(_this.cy, args)

      ## add this function to our chainer class
      $Cypress.Chainer.inject key, (chainerId, args) ->
        @enqueue(key, wrap.call(@, fn), args, type, chainerId)
