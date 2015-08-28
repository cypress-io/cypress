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

  convertTags = ($row) ->
    html = $row.html()

    ## bail if matches werent found
    return if not bRe.test(html)

    html = html
      .replace(bTagOpen, ": <strong>")
      .replace(bTagClosed, "</strong>")
      .split(" :").join(":")

    $row.html(html)

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

  shouldFn = (subject, chainers, args...) ->
    exp = Cypress.Chai.expect(subject).to

    if reEventually.test(chainers)
      err = @cypressErr("The 'eventually' assertion chainer has been deprecated. This is now the default behavior so you can safely remove this word and everything should work as before.")
      err.retry = false
      throw err

    ## are we doing a length assertion?
    if reHaveLength.test(chainers)
      exp.isCheckingLength = true

    chainers = chainers.split(".")
    lastChainer = _(chainers).last()

    ## backup the original assertion subject
    originalObj = exp._obj

    eventually = false

    options = {}

    applyChainer = (memo, value) ->
      if value is lastChainer
        if _.isFunction(memo[value])
          memo[value].apply(memo, args)
      else
        memo[value]

    applyChainers = =>
      ## if we're not doing existence assertions
      ## then check to ensure the subject exists
      ## in the DOM if its a DOM subject
      ## need to continually apply this check due
      ## to eventually
      if not exp.isCheckingLength
        @ensureDom(subject) if Cypress.Utils.hasElement(subject)

      _.reduce chainers, (memo, value) =>
        if value is "eventually"
          eventually = true
          return memo

        if value not of memo
          @throwErr("The chainer: '#{value}' was not found. Building implicit assertion failed.")

        if eventually
          try
            applyChainer(memo, value)
          catch e
            options.error = e
            @_retry(applyChainers, options)
        else
          applyChainer(memo, value)

      , exp

    Promise.resolve(applyChainers()).then ->
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

      options.assertions ?= []

      onPassFn = =>
        if _.isFunction(callbacks.onPass)
          callbacks.onPass.call(@, cmds)
        else
          {subject: subject, command: options.command}

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
          @ensureElExistance(subject)
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
            @ensureElExistance(subject)
          .then(onPassFn)
          .catch(onFailFn)

      i = 0

      assert = @assert
      @assert = ->
        args = arguments

        do (cmd = cmds[i]) =>
          setCommandLog = (log) =>
            ## our next log may not be an assertion
            ## due to page events so make sure we wait
            ## until we see page events
            return if log.get("name") isnt "assert"

            i += 1

            ## when we do immediately stop listening to unbind
            @stopListening @Cypress, "before:log", setCommandLog

            ## if we already have a command
            ## then just update its attrs from
            ## the new log
            if c = cmd.command
              c.merge(log)

              ## and make sure we return false
              ## which prevents a new log from
              ## being added
              return false
            else
              ## reset our state to pending even if
              ## we have an error
              # log.set("state", "pending")
              cmd.command = log
              options.assertions.push(log)

          @listenTo @Cypress, "before:log", setCommandLog

        assert.apply(@, args)

      fns = @_injectAssertionFns(cmds)

      subjects = []

      ## iterate through each subject
      ## and force the assertion to return
      ## this value so it does not get
      ## invoked again
      memoizeSubjectReturnValue = ->
        _.each subjects, (subject, i) ->
          cmd  = cmds[i]
          orig = cmd.fn.originalFn
          cmd.fn = ->
            return subject
          cmd.fn.originalFn = orig

      assertions = (memo, fn) =>
        fn(memo).then (subject) ->
          subjects.push(subject)
          subject

      restore = =>
        ## no matter what we need to
        ## restore the assertions
        @assert = assert

      Promise
        .reduce(fns, assertions, subject)
        .then(restore)
        .then ->
          memoizeSubjectReturnValue()
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
              @throwErr(err, options.command)
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
        cmd.fn.originalFn.apply @, [subject].concat(cmd.args)

    getUpcomingAssertions: ->
      current = @prop("current")
      index   = @prop("index") + 1

      assertions = []

      ## grab the rest of the queue'd commands
      for cmd in @queue.slice(index)
        ## grab all of the queued commands which are
        ## assertions and match our current chainerId
        if cmd.type is "assertion" and cmd.chainerId is current.chainerId
          assertions.push(cmd)
        else
          break

      assertions

    assert: (passed, message, value, actual, expected, error) ->
      ## if this is a jquery object and its true
      ## then remove all the 'but's and replace with 'and'
      ## also just think about slicing off everything after a comma?
      message = message.split(allButs).join("and") if message and passed

      obj = parseValueActualAndExpected(value, actual, expected)

      if Cypress.Utils.hasElement(value)
        obj.$el = value

      functionHadArguments = (current) ->
        fn = current.args and current.args[0]
        fn and _.isFunction(fn) and fn.length > 0

      current = @prop("current")

      if current.type is "assertion"
        obj.end = true
        obj.snapshot = true
        obj.error = error
      else
        obj._error = error

      isChildLike = (subject, current) ->
        (value is subject) or
          (current.type isnt "assertion") or
            (functionHadArguments(current))

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
          klasses = "command-assertion-failed command-assertion-passed command-assertion-pending"
          $row.removeClass(klasses).addClass("command-assertion-#{@state}")

          ## converts [b] string tags into real elements
          convertTags($row)
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