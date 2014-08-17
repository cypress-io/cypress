## attach to Eclectus global

Eclectus.Assertion = do ($, _, Eclectus) ->
  class Assertion extends Eclectus.Command
    constructor: (@document, @channel, @runnable) ->
      @instanceId = _.uniqueId("instance")

    log: (passed, message, value, actual, expected) ->
      ## clone the body and strip out any script tags
      body = @$("body").clone(true, true)
      body.find("script").remove()

      ## figure out if this passed / failed by comparing expected to actual

      @channel.trigger "assertion", @runnable,
        dom:        body
        method:     "assert"
        value:      value
        message:    message
        actual:     actual
        expected:   expected
        passed:     passed
        instanceId: @instanceId


  return Assertion