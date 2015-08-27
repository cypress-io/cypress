$Cypress.register "Assertions", (Cypress, _, $, Promise) ->

  bRe            = /(\[b\])(.+)(\[\\b\])/
  bTagOpen       = /\[b\]/g
  bTagClosed     = /\[\\b\]/g
  allButs        = /\bbut\b/g
  reExistance    = /exist/
  reEvHaveLength = /eventually.+length/
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

    if reEvHaveLength.test(chainers)
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
      ## if we're not doing existance assertions
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
    verifyUpcomingAssertions: (subject) ->
      cmds = @getUpcomingAssertions()

      ## bail if we have no assertions
      return Promise.resolve(subject) if not cmds.length

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
          cmd.fn = -> return subject
          cmd.fn.originalFn = orig

      assertions = (memo, fn) =>
        fn(memo).then (subject) ->
          subjects.push(subject)
          subject

      Promise
        .reduce(fns, assertions, subject)
        .then ->
          memoizeSubjectReturnValue()
        .cancellable()
        .catch Promise.CancellationError, ->
          debugger

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

      _.extend obj,
        name:     "assert"
        end:      true
        snapshot: true
        message:  message
        passed:   passed
        selector: value?.selector
        error:    error
        type: (current, subject) ->
          ## if our current command has arguments assume
          ## we are an assertion that's involving the current
          ## subject or our value is the current subject
          if value is subject or functionHadArguments(current)
            "child"
          else
            "parent"

        onRender: ($row) =>
          klass = if passed then "passed" else "failed"
          $row.addClass "command-assertion-#{klass}"

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