do ($Cypress, _) ->

  class $Command
    constructor: ->
      @reset()

    set: (key, val) ->
      if _.isString(key)
        obj = {}
        obj[key] = val
      else
        obj = key

      _.extend @attributes, obj

      return @

    get: (attr) ->
      @attributes[attr]

    toJSON: ->
      @attributes

    reset: ->
      @attributes = {}
      @logs       = []

      return @

  class $Commands
    constructor: ->
      @commands = []

    splice: ->
      @commands.splice.apply(@, arguments)

    at: (index) ->
      @commands[index]

    toJSON: ->
      @invoke("toJSON")

    reset: ->
      @invoke("reset")

      @splice(0, @commands.length)

      return @

    @create = ->
      new $Commands

  Object.defineProperty $Commands.prototype, "length", {
    get: -> @commands.length
  }

  ## mixin underscore methods
  _.each ["invoke"], (method) ->
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

    enqueue: (key, fn, args, type, chainerId) ->
      @clearTimeout @prop("runId")

      obj = {name: key, ctx: @, fn: fn, args: args, type: type, chainerId: chainerId, log: null}

      @trigger "enqueue", obj
      @Cypress.trigger "enqueue", obj

      @insertCommand(obj)

    insertCommand: (obj) ->
      ## if we have a nestedIndex it means we're processing
      ## nested commands and need to splice them into the
      ## index past the current index as opposed to
      ## pushing them to the end we also dont want to
      ## reset the run defer because splicing means we're
      ## already in a run loop and dont want to create another!
      ## we also reset the .next property to properly reference
      ## our new obj

      ## we had a bug that would bomb on custom commands when it was the
      ## first command. this was due to nestedIndex being undefined at that
      ## time. so we have to ensure to check that its any kind of number (even 0)
      ## in order to know to splice into the existing array.
      nestedIndex = @prop("nestedIndex")

      ## if this is a number then we know
      ## we're about to splice this into our commands
      ## and need to reset next + increment the index
      if _.isNumber(nestedIndex)
        @commands.at(nestedIndex).set("next", obj)
        @prop("nestedIndex", nestedIndex += 1)

      ## we look at whether or not nestedIndex is a number, because if it
      ## is then we need to splice inside of our commands, else just push
      ## it onto the end of the queu
      index = if _.isNumber(nestedIndex) then nestedIndex else @commands.length

      @commands.splice(index, 0, obj)

      ## if nestedIndex is either undefined or 0
      ## then we know we're processing regular commands
      ## and not splicing in the middle of our commands
      if not nestedIndex
        @prop "runId", @defer(@run)

      return @

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
      throw new Error("Cypress.add(key, fn, type) must include a type!") if not type

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
