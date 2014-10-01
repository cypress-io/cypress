## attach to Eclectus global

Eclectus.Assertion = do ($, _, Eclectus) ->

  class Assertion extends Eclectus.Command
    config:
      type: "assertion"

    log: (value, actual, expected, message, passed) ->
      ## if this is a jquery object and its true
      ## then remove all the 'but's and replace with 'and'
      ## also just think about slicing off everything after a comma?
      message = message.split("but").join("and") if message and passed

      if value instanceof $
        ## store the $el
        @$el = value


      obj = @parseValueActualAndExpected(value, actual, expected)

      # console.warn "value: ", value
      # console.warn "actual: ", actual
      # console.warn "expected: ", expected
      # console.warn "message: ", message
      # console.warn "obj: ", obj
      # console.info "----------------------"

      _.extend obj,
        method: "assert"
        message: message
        passed: passed

      ## think about completely gutting the whole object toString
      ## which chai does by default, its so ugly and worthless

      @emit obj

      return @

    ## Rules:
    ## 1. always remove value
    ## 2. if value is a jquery object set a subject
    ## 3. if actual is undefined or its not expected remove both actual + expected
    parseValueActualAndExpected: (value, actual, expected) ->
      obj = {actual: actual, expected: expected}

      if value instanceof $
        obj.subject = value

        if _.isUndefined(actual) or actual isnt expected
          delete obj.actual
          delete obj.expected

      obj

  return Assertion