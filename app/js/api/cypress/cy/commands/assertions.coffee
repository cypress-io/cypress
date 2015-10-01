$Cypress.register "Assertions", (Cypress, _, $, Promise) ->

  bRe            = /(\[b\])(.+)(\[\\b\])/
  bTagOpen       = /\[b\]/g
  bTagClosed     = /\[\\b\]/g
  allButs        = /\bbut\b/g
  reExistance    = /exist/
  reEventually   = /^eventually/
  reHaveLength   = /length/

  Cypress.on "assert", ->
    @assert.apply(@, arguments)

  convertTags = (str) ->
    ## must first escape these characters
    ## since we will be inserting them
    ## as real html
    str = _.escape(str)

    ## bail if matches werent found
    return str if not bRe.test(str)

    str
      .replace(bTagOpen, ": <strong>")
      .replace(bTagClosed, "</strong>")
      .split(" :").join(":")

  convertMessage = ($row, message) ->
    message = convertTags(message)

    $row.find("[data-js=message]").html(message)

  convertRowFontSize = ($row, message) ->
    len = message.length

    ## bail if this isnt a huge message
    return if len < 100

    ## else reduce the font-size down to 85%
    ## and reduce the line height
    $row.css({
      fontSize: "85%"
      lineHeight: "14px"
    })

  ## Rules:
  ## 1. always remove value
  ## 2. if value is a jquery object set a subject
  ## 3. if actual is undefined or its not expected remove both actual + expected
  parseValueActualAndExpected = (value, actual, expected) ->
    obj = {actual: actual, expected: expected}

    if value instanceof $
      obj.subject = value

      if _.isUndefined(actual) or actual isnt expected
        delete obj.actual
        delete obj.expected

    obj

  remoteJQueryisNotSameAsGlobal = (remoteJQuery) ->
    remoteJQuery and (remoteJQuery isnt $)

  shouldFnWithCallback = (subject, fn) ->
    Promise
      .try =>
        remoteJQuery = @_getRemoteJQuery()
        if Cypress.Utils.hasElement(subject) and remoteJQueryisNotSameAsGlobal(remoteJQuery)
          remoteSubject = remoteJQuery(subject)
          Cypress.Utils.setCypressNamespace(remoteSubject, subject)

        fn.call @private("runnable").ctx, remoteSubject ? subject
      .return(subject)

  shouldFn = (subject, chainers, args...) ->
    if _.isFunction(chainers)
      return shouldFnWithCallback.apply(@, arguments)

    exp = Cypress.Chai.expect(subject).to
    originalChainers = chainers

    throwAndLogErr = (err) =>
      ## since we are throwing our own error
      ## without going through the assertion we need
      ## to ensure our .should command gets logged
      current = @prop("current")

      log = Cypress.Log.command({
        name: "should"
        type: "child"
        message: [].concat(originalChainers, args)
        end: true
        snapshot: true
        error: err
      })

      @throwErr(err, log)

    chainers = chainers.split(".")
    lastChainer = _(chainers).last()

    ## backup the original assertion subject
    originalObj = exp._obj

    options = {}

    if reEventually.test(chainers)
      err = @cypressErr("The 'eventually' assertion chainer has been deprecated. This is now the default behavior so you can safely remove this word and everything should work as before.")
      err.retry = false
      throwAndLogErr(err)

    ## are we doing a length assertion?
    if reHaveLength.test(chainers) or reExistance.test(chainers)
      exp.isCheckingExistence = true

    applyChainer = (memo, value) ->
      if value is lastChainer
        if _.isFunction(memo[value])
          try
            memo[value].apply(memo, args)
          catch err
            ## if we made it all the way to the actual
            ## assertion but its set to retry false then
            ## we need to log out this .should since there
            ## was a problem with the actual assertion syntax
            if err.retry is false
              throwAndLogErr(err)
            else
              throw err
      else
        memo[value]

    applyChainers = =>
      ## if we're not doing existence or length assertions
      ## then check to ensure the subject exists
      ## in the DOM if its a DOM subject
      ## because its possible we're asserting about an
      ## element which has left the DOM and we always
      ## want to auto-fail on those
      if not exp.isCheckingExistence and Cypress.Utils.hasElement(subject)
        @ensureDom(subject, "should")

      _.reduce chainers, (memo, value) =>
        if value not of memo
          err = @cypressErr("The chainer: '#{value}' was not found. Could not build assertion.")
          err.retry = false
          throwAndLogErr(err)

        applyChainer(memo, value)

      , exp

    Promise.try(applyChainers).then ->
      ## if the _obj has been mutated then we
      ## are chaining assertion properties and
      ## should return this new subject
      if originalObj isnt exp._obj
        return exp._obj

      return subject

  Cypress.addAssertionCommand
    should: ->
      shouldFn.apply(@, arguments)

    and: ->
      shouldFn.apply(@, arguments)

  Cypress.Cy.extend
    verifyUpcomingAssertions: (subject, options = {}, callbacks = {}) ->
      cmds = @getUpcomingAssertions()

      @prop("upcomingAssertions", cmds)

      options.assertions ?= []

      determineEl = ($el, subject) ->
        ## prefer $el unless it is strickly undefined
        if not _.isUndefined($el) then $el else subject

      onPassFn = =>
        if _.isFunction(callbacks.onPass)
          callbacks.onPass.call(@, cmds)
        else
          subject

      onFailFn = (err) =>
        ## when we fail for whatever reason we need to
        ## check to see if we would firstly fail if
        ## we don't have an el in existence. what this
        ## catches are assertions downstream about an
        ## elements existence but the element never
        ## exists in the first place. this will probably
        ## ensure the error is about existence not about
        ## the downstream assertion.
        try
          @ensureElExistance determineEl(options.$el, subject)
        catch e2
          err = e2

        options.error = err

        throw err if err.retry is false

        onFail  = callbacks.onFail
        onRetry = callbacks.onRetry

        if not onFail and not onRetry
          throw err

        ## if our onFail throws then capture it
        ## and finish the assertions and then throw
        ## it again
        try
          onFail.call(@, err) if _.isFunction(onFail)
        catch e3
          @finishAssertions(options.assertions)
          throw e3

        @_retry(onRetry, options) if _.isFunction(onRetry)

      ## bail if we have no assertions
      if not cmds.length
        return Promise
          .try =>
            @ensureElExistance determineEl(options.$el, subject)
          .then(onPassFn)
          .catch(onFailFn)

      i = 0

      cmdHasFunctionArg = (cmd) ->
        _.isFunction(cmd.get("args")[0])

      assert = @assert
      @assert = (args...) ->
        do (cmd = cmds[i]) =>
          setCommandLog = (log) =>
            ## our next log may not be an assertion
            ## due to page events so make sure we wait
            ## until we see page events
            return if log.get("name") isnt "assert"

            ## when we do immediately stop listening to unbind
            @stopListening @Cypress, "before:log", setCommandLog

            insertNewLog = (log) ->
              cmd.log(log)
              options.assertions.push(log)

            ## its possible a single 'should' will assert multiple
            ## things such as the case with have.property. we can
            ## detect when that is happening because cmd will be null.
            ## if thats the case then just set cmd to be the previous
            ## cmd and do not increase 'i'
            ## this will prevent 2 logs from ever showing up but still
            ## provide errors when the 1st assertion fails.
            if not cmd
              cmd = cmds[i - 1]
            else
              i += 1

            ## if our command has a function argument
            ## then we know it may contain multiple
            ## assertions
            if cmdHasFunctionArg(cmd)
              index      = cmd.get("assertionIndex")
              assertions = cmd.get("assertions")

              incrementIndex = ->
                ## always increase the assertionIndex
                ## so our next assertion matches up
                ## to the correct index
                cmd.set("assertionIndex", index += 1)

              ## if we dont have an assertion at this
              ## index then insert a new log
              if not assertion = assertions[index]
                assertions.push(log)
                incrementIndex()

                return insertNewLog(log)
              else
                ## else just merge this log
                ## into the previous assertion log
                incrementIndex()
                assertion.merge(log)

                ## dont output a new log
                return false

            ## if we already have a log
            ## then just update its attrs from
            ## the new log
            if l = cmd.getLastLog()
              l.merge(log)

              ## and make sure we return false
              ## which prevents a new log from
              ## being added
              return false
            else
              insertNewLog(log)

          @listenTo @Cypress, "before:log", setCommandLog

        ## send verify=true as the last arg
        assert.apply(@, args.concat(true))

      fns = @_injectAssertionFns(cmds)

      subjects = []

      ## iterate through each subject
      ## and force the assertion to return
      ## this value so it does not get
      ## invoked again
      setSubjectAndSkip = ->
        for subject, i in subjects
          cmd  = cmds[i]
          cmd.set("subject", subject)
          cmd.skip()

      assertions = (memo, fn, i) =>
        fn(memo).then (subject) ->
          subjects[i] = subject

      restore = =>
        @prop("upcomingAssertions", [])

        ## no matter what we need to
        ## restore the assertions
        @assert = assert

      Promise
        .reduce(fns, assertions, subject)
        .then(restore)
        .then(setSubjectAndSkip)
        .then =>
          @finishAssertions(options.assertions)
        .then(onPassFn)
        .cancellable()
        .catch Promise.CancellationError, ->
          restore()
        .catch (err) =>
          restore()

          ## when we're told not to retry
          if err.retry is false
            ## finish the assertions
            @finishAssertions(options.assertions)

            ## and then push our command into this err
            try
              @throwErr(err, options._log)
            catch e
              err = e

          throw err
        .catch(onFailFn)

    finishAssertions: (assertions) ->
      _.each assertions, (log) ->
        log.snapshot()

        if e = log.get("_error")
          log.error(e)
        else
          log.end()

    _injectAssertionFns: (cmds) ->
      _.map cmds, _.bind(@_injectAssertion, @)

    _injectAssertion: (cmd) ->
      return (subject) =>
        ## set assertions to itself or empty array
        if not cmd.get("assertions")
          cmd.set("assertions", [])

        ## reset the assertion index back to 0
        ## so we can track assertions and merge
        ## them up with existing ones
        cmd.set("assertionIndex", 0)
        cmd.get("fn").originalFn.apply @, [subject].concat(cmd.get("args"))

    getUpcomingAssertions: ->
      current = @prop("current")
      index   = @prop("index") + 1

      assertions = []

      ## grab the rest of the queue'd commands
      for cmd in @commands.slice(index).get()
        ## don't break on utilities, just skip over them
        if cmd.is("utility")
          continue

        ## grab all of the queued commands which are
        ## assertions and match our current chainerId
        if cmd.is("assertion") and cmd.get("chainerId") is current.get("chainerId")
          assertions.push(cmd)
        else
          break

      assertions

    assert: (passed, message, value, actual, expected, error, verifying = false) ->
      ## if this is a jquery object and its true
      ## then remove all the 'but's and replace with 'and'
      ## also just think about slicing off everything after a comma?
      message = message.split(allButs).join("and") if message and passed

      obj = parseValueActualAndExpected(value, actual, expected)

      if Cypress.Utils.hasElement(value)
        obj.$el = value

      functionHadArguments = (current) ->
        fn = current and current.get("args") and current.get("args")[0]
        fn and _.isFunction(fn) and fn.length > 0

      isAssertionType = (cmd) ->
        cmd and cmd.is("assertion")

      current = @prop("current")

      ## if we are simply verifying the upcoming
      ## assertions then do not immediately end or snapshot
      ## else do
      if verifying
        obj._error = error
      else
        obj.end = true
        obj.snapshot = true
        obj.error = error

      isChildLike = (subject, current) =>
        (value is subject) or
          ## if our current command is an assertion type
          isAssertionType(current) or
            ## are we currently verifying assertions?
            @prop("upcomingAssertions")?.length > 0 or
              ## did the function have arguments
              functionHadArguments(current)

      _.extend obj,
        name:     "assert"
        # end:      true
        # snapshot: true
        message:  message
        passed:   passed
        selector: value?.selector
        type: (current, subject) ->
          ## if our current command has arguments assume
          ## we are an assertion that's involving the current
          ## subject or our value is the current subject
          if isChildLike(subject, current)
            "child"
          else
            "parent"

        onRender: ($row) ->
          ## remove the numElements label
          $row.find("[data-js=numElements]").remove()

          klasses = "command-assertion-failed command-assertion-passed command-assertion-pending"
          $row.removeClass(klasses).addClass("command-assertion-#{@state}")

          ## if our message is too big
          ## then scale the font size down
          convertRowFontSize($row, @message)

          ## converts [b] string tags into real elements
          convertMessage($row, @message)
        onConsole: =>
          obj = {Command: "assert"}

          _.extend obj, parseValueActualAndExpected(value, actual, expected)

          _.extend obj,
            Message: message.replace(bTagOpen, "").replace(bTagClosed, "")

      ## think about completely gutting the whole object toString
      ## which chai does by default, its so ugly and worthless

      if error
        error.onFail = (err) ->

      Cypress.Log.command obj

      return Cypress