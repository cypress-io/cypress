_ = require("lodash")
Promise = require("bluebird")

$dom = require("../dom")
$utils = require("../cypress/utils")
JsDiff = require('diff')
mochaUtils = require('mocha/lib/utils')

## TODO
## bTagOpen + bTagClosed
## are duplicated in assertions.coffee
butRe = /,? but\b/
bTagOpen = /\*\*/g
bTagClosed = /\*\*/g
stackTracesRe = / at .*\n/gm

IS_DOM_TYPES = [$dom.isElement, $dom.isDocument, $dom.isWindow]

invokeWith = (value) ->
  return (fn) ->
    fn(value)

functionHadArguments = (current) ->
  fn = current and current.get("args") and current.get("args")[0]
  fn and _.isFunction(fn) and fn.length > 0

isAssertionType = (cmd) ->
  cmd and cmd.is("assertion")

isDomSubjectAndMatchesValue = (value, subject) ->
  allElsAreTheSame = ->
    els1 = $dom.getElements(value)
    els2 = $dom.getElements(subject)

    ## no difference
    _.difference(els1, els2).length is 0

  ## iterate through each dom type until we
  ## find the function for this particular value
  if isDomTypeFn = _.find(IS_DOM_TYPES, invokeWith(value))
    ## then check that subject also matches this
    ## and that all the els are the same
    return isDomTypeFn(subject) and allElsAreTheSame()

## Rules:
## 1. always remove value
## 2. if value is a jquery object set a subject
## 3. if actual is undefined or its not expected remove both actual + expected
parseValueActualAndExpected = (value, actual, expected) ->
  obj = {actual: actual, expected: expected}

  if $dom.isJquery(value)
    obj.subject = value

    if _.isUndefined(actual) or actual isnt expected
      delete obj.actual
      delete obj.expected

  obj

prepareObjsForDiff = (err) ->
  if _.isString(err.actual) || _.isString(err.expected)
    return err
  ret = {}
  ret.actual = mochaUtils.stringify(err.actual)
  ret.expected = mochaUtils.stringify(err.expected)
  return ret

objToString = Object.prototype.toString

_sameType = (a, b) ->
  return objToString.call(a) is objToString.call(b)

showDiff = (err) ->
  return (
    err &&
    err.showDiff isnt false &&
    _sameType(err.actual, err.expected) &&
    err.expected isnt undefined
  )

create = (state, queue, retryFn) ->
  getUpcomingAssertions = ->
    current = state("current")
    index   = state("index") + 1

    assertions = []

    ## grab the rest of the queue'd commands
    for cmd in queue.slice(index).get()
      ## don't break on utilities, just skip over them
      if cmd.is("utility")
        continue

      ## grab all of the queued commands which are
      ## assertions and match our current chainerId
      if cmd.is("assertion")
        assertions.push(cmd)
      else
        break

    assertions

  injectAssertionFns = (cmds) ->
    _.map(cmds, injectAssertion)

  injectAssertion = (cmd) ->
    return (subject) ->
      ## set assertions to itself or empty array
      if not cmd.get("assertions")
        cmd.set("assertions", [])

      ## reset the assertion index back to 0
      ## so we can track assertions and merge
      ## them up with existing ones
      cmd.set("assertionIndex", 0)

      cmd.get("fn").originalFn.apply(
        state("ctx"),
        [subject].concat(cmd.get("args"))
      )

  finishAssertions = (assertions) ->
    _.each assertions, (log) ->
      log.snapshot()

      if e = log.get("_error")
        log.error(e)
      else
        log.end()

  verifyUpcomingAssertions = (subject, options = {}, callbacks = {}) ->
    cmds = getUpcomingAssertions()

    state("upcomingAssertions", cmds)

    ## we're applying the default assertion in the
    ## case where there are no upcoming assertion commands
    isDefaultAssertionErr = cmds.length is 0

    options.assertions ?= []

    _.defaults callbacks, {
      ensureExistenceFor: "dom"
    }

    ensureExistence = ->
      ## by default, ensure existence for dom subjects,
      ## but not non-dom subjects
      switch callbacks.ensureExistenceFor
        when "dom"
          $el = determineEl(options.$el, subject)
          return if not $dom.isJquery($el)

          cy.ensureElExistence($el)

        when "subject"
          cy.ensureExistence(subject)

    determineEl = ($el, subject) ->
      ## prefer $el unless it is strickly undefined
      if not _.isUndefined($el) then $el else subject

    onPassFn = =>
      if _.isFunction(callbacks.onPass)
        callbacks.onPass.call(@, cmds, options.assertions)
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
        ensureExistence()
      catch e2
        err = e2

      options.error = err

      if err.retry is false
        throw err

      onFail  = callbacks.onFail
      onRetry = callbacks.onRetry

      if not onFail and not onRetry
        throw err

      ## if our onFail throws then capture it
      ## and finish the assertions and then throw
      ## it again
      try
        if _.isFunction(onFail)
          ## pass in the err and the upcoming assertion commands
          onFail.call(@, err, isDefaultAssertionErr, cmds)
      catch e3
        finishAssertions(options.assertions)
        throw e3

      if _.isFunction(onRetry)
        retryFn(onRetry, options)

    ## bail if we have no assertions and apply
    ## the default assertions if applicable
    if not cmds.length
      return Promise
        .try(ensureExistence)
        .then(onPassFn)
        .catch(onFailFn)

    i = 0

    cmdHasFunctionArg = (cmd) ->
      _.isFunction(cmd.get("args")[0])

    overrideAssert = (args...) ->
      do (cmd = cmds[i]) =>
        setCommandLog = (log) =>
          ## our next log may not be an assertion
          ## due to page events so make sure we wait
          ## until we see page events
          return if log.get("name") isnt "assert"

          ## when we do immediately unbind this function
          state("onBeforeLog", null)

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

        state("onBeforeLog", setCommandLog)

      ## send verify=true as the last arg
      assertFn.apply(@, args.concat(true))

    fns = injectAssertionFns(cmds)

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
      ## HACK: bluebird .reduce will not call the callback
      ## if given an undefined initial value, so in order to
      ## support undefined subjects, we wrap the initial value
      ## in an Array and unwrap it if index = 0
      if i is 0
        memo = memo[0]
      fn(memo).then (subject) ->
        subjects[i] = subject

    restore = ->
      state("upcomingAssertions", [])

      ## no matter what we need to
      ## restore the assert fn
      state("overrideAssert", undefined)

    ## store this in case our test ends early
    ## and we reset between tests
    state("overrideAssert", overrideAssert)

    Promise
    .reduce(fns, assertions, [subject])
    .then ->
      restore()

      setSubjectAndSkip()

      finishAssertions(options.assertions)

      onPassFn()
    .catch (err) ->
      restore()

      ## when we're told not to retry
      if err.retry is false
        ## finish the assertions
        finishAssertions(options.assertions)

        ## and then push our command into this err
        try
          $utils.throwErr(err, { onFail: options._log })
        catch e
          err = e

      throw err
    .catch(onFailFn)

  assertFn = (passed, message, value, actual, expected, error, verifying = false) ->
    ## slice off everything after a ', but' or ' but ' for passing assertions, because
    ## otherwise it doesn't make sense:
    ## "expected <div> to have a an attribute 'href', but it was 'href'"
    if message and passed and butRe.test(message)
      message = message.substring(0, message.search(butRe))

    if value?.isSinonProxy
      message = message.replace(stackTracesRe, "\n")

    obj = parseValueActualAndExpected(value, actual, expected)
    if showDiff(error)
      diffObjs = prepareObjsForDiff(obj)
      diff = JsDiff.createPatch('string', diffObjs.actual, diffObjs.expected)

    if $dom.isElement(value)
      obj.$el = $dom.wrap(value)

    current = state("current")

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
        isDomSubjectAndMatchesValue(value, subject) or
          ## if our current command is an assertion type
          isAssertionType(current) or
            ## are we currently verifying assertions?
            state("upcomingAssertions")?.length > 0 or
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

      consoleProps: =>
        obj = {Command: "assert"}
        parsedValues = parseValueActualAndExpected(value, actual, expected)

        _.extend obj, parsedValues
        
        
        _.extend obj, {
          Message: message.replace(bTagOpen, "").replace(bTagClosed, "")
        }

        if diff
          _.extend obj, {
            Diff: diff
          }

        return obj
    ## think about completely gutting the whole object toString
    ## which chai does by default, its so ugly and worthless

    if error
      error.onFail = (err) ->

    Cypress.log(obj)

    return null

  assert = ->
    ## if we've temporarily overriden assertions
    ## then just bail early with this function
    fn = state("overrideAssert") ? assertFn
    fn.apply(@, arguments)

  return {
    finishAssertions

    verifyUpcomingAssertions

    assert
  }

module.exports = {
  create
}
