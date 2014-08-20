## attach to Eclectus global

Eclectus.Assertion = do ($, _, Eclectus) ->

  class Assertion extends Eclectus.Command
    config:
      type: "assertion"

    log: (passed, message, value, actual, expected) ->
      ## if this is a jquery object and its true
      ## then remove all the 'but's and replace with 'and'
      ## also just think about slicing off everything after a comma?
      if passed and value instanceof $
        message = message.split("but").join("and")

      ## think about completely gutting the whole object toString
      ## which chai does by default, its so ugly and worthless

      @emit
        method:     "assert"
        message:    message
        value:      value
        actual:     actual
        expected:   expected
        passed:     passed

  return Assertion