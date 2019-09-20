_ = require("lodash")

$Cypress = require("../cypress")

class $Chainer
  constructor: (@invocationStack, @specWindow) ->
    @chainerId = _.uniqueId("chainer")
    @firstCall = true

  @remove = (key) ->
    delete $Chainer.prototype[key]

  @add = (key, fn) ->
    ## when our instance methods are invoked
    ## we know we are chaining on an existing series
    $Chainer.prototype[key] = (args...) ->
      invocationStack = if @useInitialStack
        @invocationStack
      else
        (new @specWindow.Error("command invocation stack")).stack

      ## call back the original function with our new args
      ## pass args an as array and not a destructured invocation
      if fn(@, invocationStack, args)
        ## no longer the first call
        @firstCall = false

      ## return the chainer so additional calls
      ## are slurped up by the chainer instead of cy
      return @

  ## creates a new chainer instance
  @create = (key, invocationStack, specWindow, args) ->
    chainer = new $Chainer(invocationStack, specWindow)

    ## this is the first command chained off of cy, so we use
    ## the stack passed in from that call instead of the stack
    ## from this invocation
    chainer.useInitialStack = true
    ## since this is the first function invocation
    ## we need to pass through onto our instance methods
    chain = chainer[key].apply(chainer, args)

    chainer.useInitialStack = false

    return chain

module.exports = $Chainer
