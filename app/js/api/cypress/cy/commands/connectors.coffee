$Cypress.register "Connectors", (Cypress, _, $) ->

  remoteJQueryisNotSameAsGlobal = (remoteJQuery) ->
    remoteJQuery and (remoteJQuery isnt $)

  Cypress.addChildCommand
    spread: (subject, fn) ->
      ## if this isnt an array blow up right here
      if not _.isArray(subject)
        @throwErr("cy.spread() requires the existing subject be an array!")

      subject._spreadArray = true

      @sync.then.call(@, fn)

  Cypress.addDualCommand

    ## thens can return more "thenables" which are not resolved
    ## until they're 'really' resolved, so naturally this API
    ## supports nesting promises
    then: (subject, fn) ->
      ## if this is the very last command we know its the 'then'
      ## called by mocha.  in this case, we need to defer its
      ## fn callback else we will not properly finish the run
      ## of our commands, which ends up duplicating multiple commands
      ## downstream.  this is because this fn callback forces mocha
      ## to continue synchronously onto tests (if for instance this
      ## 'then' is called from a hook) - by defering it, we finish
      ## resolving our deferred.
      current = @prop("current")

      if not current.next and current.args.length is 2 and (current.args[1].name is "done" or current.args[1].length is 1)
        return @prop("next", fn)

      remoteJQuery = @_getRemoteJQuery()
      if Cypress.Utils.hasElement(subject) and remoteJQueryisNotSameAsGlobal(remoteJQuery)
        remoteSubject = remoteJQuery(subject)
        Cypress.Utils.setCypressNamespace(remoteSubject, subject)

      ## we need to wrap this in a try-catch still (even though we're
      ## using bluebird) because we want to handle the return by
      ## allow the 'then' to change the subject to the return value
      ## if its a non null/undefined value else to return the subject
      try

        args = remoteSubject or subject
        args = if args?._spreadArray then args else [args]

        ret = fn.apply @prop("runnable").ctx, args

        ## if ret is a DOM element
        ## and its an instance of the remoteJQuery
        if ret and Cypress.Utils.hasElement(ret) and remoteJQueryisNotSameAsGlobal(remoteJQuery) and Cypress.Utils.isInstanceOf(ret, remoteJQuery)
          ## set it back to our own jquery object
          ## to prevent it from being passed downstream
          ret = Cypress.cy.$(ret)

        ## then will resolve with the fn's
        ## return or just pass along the subject
        return ret ? subject
      catch e
        throw e

    ## making this a dual command due to child commands
    ## automatically returning their subject when their
    ## return values are undefined.  prob should rethink
    ## this and investigate why that is the default behavior
    ## of child commands
    invoke: (subject, fn, args...) ->
      @ensureParent()
      @ensureSubject()

      command = Cypress.command()

      ## name could be invoke or its!
      name = @prop("current").name

      if not _.isString(fn)
        @throwErr("cy.#{name}() only accepts a string as the first argument.", command)

      remoteJQuery = @_getRemoteJQuery()
      if Cypress.Utils.hasElement(subject) and remoteJQueryisNotSameAsGlobal(remoteJQuery)
        remoteSubject = remoteJQuery(subject)
        Cypress.Utils.setCypressNamespace(remoteSubject, subject)

      prop = (remoteSubject or subject)[fn]

      fail = =>
        @throwErr("cy.#{name}() errored because the property: '#{fn}' does not exist on your subject.", command)

      ## if the property does not EXIST on the subject
      ## then throw a specific error message
      try
        fail() if fn not of (remoteSubject or subject)
      catch e
        # if not Object.prototype.hasOwnProperty.call((remoteSubject or subject), fn)
        ## fallback to a second attempt at finding the property on the subject
        ## in case our subject isnt object-like
        ## think about using the hasOwnProperty
        fail() if _.isUndefined(prop)

      invoke = ->
        if _.isFunction(prop)
          ret = prop.apply (remoteSubject or subject), args

          if ret and Cypress.Utils.hasElement(ret) and remoteJQueryisNotSameAsGlobal(remoteJQuery) and Cypress.Utils.isInstanceOf(ret, remoteJQuery)
            return Cypress.cy.$(ret)

          return ret

        else
          prop

      getMessage = ->
        if _.isFunction(prop)
          ".#{fn}(" + Cypress.Utils.stringify(args) + ")"
        else
          ".#{fn}"

      value = invoke()

      if command
        message = getMessage()

        command.set
          message: message
          onConsole: ->
            obj = {}

            if _.isFunction(prop)
              obj["Function"] = message
              obj["With Arguments"] = args if args.length
            else
              obj["Property"] = message

            _.extend obj,
              On: remoteSubject or subject
              Returned: value

            obj

        command.snapshot().end()

      return value

    its: (subject, fn, args...) ->
      args.unshift(fn)
      @sync.invoke.apply(@, args)