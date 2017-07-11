$ = require("jquery")
_ = require("lodash")

$utils = require("../cypress/utils")

## TODO
## bTagOpen + bTagClosed
## are duplicated in assertions.coffee
butRe = /,? but\b/
bTagOpen = /\*\*/g
bTagClosed = /\*\*/g

## Rules:
## 1. always remove value
## 2. if value is a jquery object set a subject
## 3. if actual is undefined or its not expected remove both actual + expected
parseValueActualAndExpected = (value, actual, expected) ->
  obj = {actual: actual, expected: expected}

  if $utils.isInstanceOf(value, $)
    obj.subject = value

    if _.isUndefined(actual) or actual isnt expected
      delete obj.actual
      delete obj.expected

  obj

create = (state) ->
  return {
    assert: (passed, message, value, actual, expected, error, verifying = false) ->
      ## slice off everything after a ', but' or ' but ' for passing assertions, because
      ## otherwise it doesn't make sense:
      ## "expected <div> to have a an attribute 'href', but it was 'href'"
      if message and passed and butRe.test(message)
        message = message.substring(0, message.search(butRe))

      obj = parseValueActualAndExpected(value, actual, expected)

      if $utils.hasElement(value)
        obj.$el = value

      functionHadArguments = (current) ->
        fn = current and current.get("args") and current.get("args")[0]
        fn and _.isFunction(fn) and fn.length > 0

      isAssertionType = (cmd) ->
        cmd and cmd.is("assertion")

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

          _.extend obj, parseValueActualAndExpected(value, actual, expected)

          _.extend obj,
            Message: message.replace(bTagOpen, "").replace(bTagClosed, "")

      ## think about completely gutting the whole object toString
      ## which chai does by default, its so ugly and worthless

      if error
        error.onFail = (err) ->

      Cypress.log(obj)

      return null
  }


module.exports = {
  create
}
