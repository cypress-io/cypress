$Cypress.register "Connectors", (Cypress, _, $) ->

  Cypress.Cy.extend
    isCommandFromMocha: (cmd) ->
      not cmd.get("next") and
        cmd.get("args").length is 2 and
          (cmd.get("args")[1].name is "done" or cmd.get("args")[1].length is 1)

  ## thens can return more "thenables" which are not resolved
  ## until they're 'really' resolved, so naturally this API
  ## supports nesting promises
  thenFn = (subject, options, fn) ->
    if _.isFunction(options)
      fn = options
      options = {}

    ## if this is the very last command we know its the 'then'
    ## called by mocha.  in this case, we need to defer its
    ## fn callback else we will not properly finish the run
    ## of our commands, which ends up duplicating multiple commands
    ## downstream.  this is because this fn callback forces mocha
    ## to continue synchronously onto tests (if for instance this
    ## 'then' is called from a hook) - by defering it, we finish
    ## resolving our deferred.
    current = @prop("current")
    if @isCommandFromMocha(current)
      return @prop("next", fn)

    _.defaults options,
      timeout: @_timeout()

    ## clear the timeout since we are handling
    ## it ourselves
    @_clearTimeout()

    remoteSubject = @getRemotejQueryInstance(subject)

    args = remoteSubject or subject
    args = if args?._spreadArray then args else [args]

    ## name could be invoke or its!
    name = @prop("current").get("name")

    getRet = =>
      ret = fn.apply(@private("runnable").ctx, args)
      if (ret is @ or ret is @chain()) then null else ret

    Promise
    .try(getRet)
    .timeout(options.timeout)
    .then (ret) =>
      ## if ret is null or undefined then
      ## resolve with the existing subject
      return ret ? subject
    .catch Promise.TimeoutError, =>
      @throwErr """
        cy.#{name}() timed out after waiting '#{options.timeout}ms'.\n
        Your callback function returned a promise which never resolved.\n
        The callback function was:\n
        #{fn.toString()}
      """, options._log

  invokeFn = (subject, fn, args...) ->
    @ensureParent()
    @ensureSubject()

    options = {}

    options._log = Cypress.Log.command
      $el: if Cypress.Utils.hasElement(subject) then subject else null
      onConsole: ->
        Subject: subject

    ## name could be invoke or its!
    name = @prop("current").get("name")

    if not _.isString(fn)
      @throwErr("cy.#{name}() only accepts a string as the first argument.", options._log)

    getValue = =>
      remoteSubject = @getRemotejQueryInstance(subject)

      prop = (remoteSubject or subject)[fn]

      fail = =>
        @throwErr("cy.#{name}() errored because the property: '#{fn}' does not exist on your subject.", options._log)

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

      invoke = =>
        if _.isFunction(prop)
          if name is "its"
            Cypress.Utils.warning("Calling cy.#{name}() on a function is now deprecated. Use cy.invoke('#{fn}') instead.\n\nThis deprecation notice will become an actual error in the next major release.")

          prop.apply (remoteSubject or subject), args

        else
          if name is "invoke"
            Cypress.Utils.warning("Calling cy.#{name}() on a property is now deprecated. Use cy.its('#{fn}') instead.\n\nThis deprecation notice will become an actual error in the next major release.")

          return prop

      getMessage = ->
        if _.isFunction(prop)
          ".#{fn}(" + Cypress.Utils.stringify(args) + ")"
        else
          ".#{fn}"

      getFormattedElement = ($el) ->
        if Cypress.Utils.hasElement($el)
          Cypress.Utils.getDomElements($el)
        else
          $el

      value = invoke()

      if options._log
        message = getMessage()

        options._log.set
          message: message
          onConsole: ->
            obj = {}

            if _.isFunction(prop)
              obj["Function"] = message
              obj["With Arguments"] = args if args.length
            else
              obj["Property"] = message

            _.extend obj,
              On:       getFormattedElement(remoteSubject or subject)
              Returned: getFormattedElement(value)

            obj

      return value

    ## wrap retrying into its own
    ## separate function
    retryValue = =>
      Promise
      .try(getValue)
      .catch (err) =>
        options.error = err
        @_retry(retryValue, options)

    do resolveValue = =>
      Promise.try(retryValue).then (value) =>
        @verifyUpcomingAssertions(value, options, {
          onRetry: resolveValue
        })

  Cypress.addChildCommand
    spread: (subject, options, fn) ->
      ## if this isnt an array blow up right here
      if not _.isArray(subject)
        @throwErr("cy.spread() requires the existing subject be an array!")

      subject._spreadArray = true

      thenFn.call(@, subject, options, fn)

  Cypress.addDualCommand

    then: ->
      thenFn.apply(@, arguments)

    ## making this a dual command due to child commands
    ## automatically returning their subject when their
    ## return values are undefined.  prob should rethink
    ## this and investigate why that is the default behavior
    ## of child commands
    invoke: ->
      invokeFn.apply(@, arguments)

    its: ->
      invokeFn.apply(@, arguments)