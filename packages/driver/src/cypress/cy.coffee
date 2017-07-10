_ = require("lodash")
$ = require("jquery")
Backbone = require("backbone")
Promise = require("bluebird")

# $Cypress = require("../cypress")
$utils = require("./utils")
$Xhrs = require("../cy/xhrs")
$Agents = require("../cy/agents")
$Errors = require("../cy/errors")
$Asserts = require("../cy/asserts")
$Chainer = require("./chainer")
$Timeouts = require("../cy/timeouts")
$CommandQueue = require("./command_queue")
$SetterGetter = require("./setter_getter")

crossOriginScriptRe = /^script error/i

privateProps = {
  props:    { name: "state", url: true }
  privates: { name: "state", url: false }
}

# window.Cypress ($Cypress)
#
# Cypress.config(...)
#
# Cypress.Server.defaults()
# Cypress.Keyboard.defaults()
# Cypress.Mouse.defaults()
# Cypress.Commands.add("login")
#
# Cypress.on "error"
# Cypress.on "retry"
# Cypress.on "uncaughtException"
#
# cy.on "error"
#
# # Cypress.Log.command()
#
# log = Cypress.log()
#
# log.snapshot().end()
# log.set().get()
#
# cy.log()
#
# cy.foo (Cy)

# { visit, get, find } = cy

create = (specWindow, Cypress, config) ->
  state = $SetterGetter.create({})

  xhrs = $Xhrs.create(state)
  agents = $Agents.create()
  asserts = $Asserts.create(state)
  errors = $Errors.create(Cypress, state, config)
  timeouts = $Timeouts.create(state)

  commandFns = {}
  # commandFnsBackup = {}

  cy = {
    id: _.uniqueId("cy")

    state

    ## command queue instance
    queue: $CommandQueue.create()

    ## assert sync method
    assert: asserts.assert

    ## agent sync methods
    spy: agents.spy
    stub: agents.stub
    agents: agents.agents

    ## timeout sync methods
    timeout: timeouts.timeout
    clearTimeout: timeouts.clearTimeout

    ## xhr sync methods
    getLastXhrByAlias: xhrs.getLastXhrByAlias
    getRequestsByAlias: xhrs.getRequestsByAlias

    # onCommand: (key, fn, type, enforceDom) ->
    #   $utils.throwErrByPath("add.type_missing") if not type
    #
    #   ## allow object signature
    #   if _.isObject(key)
    #     _.each key, (fn, key) =>
    #       cy.onCommand(key, fn, type, enforceDom)
    #     return cy
    #
    #   ## need to pass the options into inject here
    #   cy.add(key, fn, type, enforceDom)

    addCommand: ({key, fn, type, enforceDom}) ->
      commandFns[key] = _.bind(fn, cy)

      prepareSubject = (firstCall, args) =>
        ## if this is the very first call
        ## on the chainer then make the first
        ## argument undefined (we have no subject)
        if firstCall
          @_removeSubject()

        subject = state("subject")

        if enforceDom
          @ensureDom(subject, key)

        args.unshift(subject)

        @trigger("next:subject:prepared", subject, args)

        args

      wrap = (firstCall) =>
        fn = commandFns[key]
        wrapped = wrapByType(fn, firstCall)
        wrapped.originalFn = fn
        wrapped

      wrapByType = (fn, firstCall) ->
        switch type
          when "parent"
            return fn

          when "dual", "utility"
            _.wrap fn, (orig, args...) ->
              ## push the subject into the args
              args = prepareSubject(firstCall, args)

              return orig.apply(@, args)

          when "child", "assertion"
            _.wrap fn, (orig, args...) ->
              if firstCall
                $utils.throwErrByPath("miscellaneous.invoking_child_without_parent", {
                  args: {
                    cmd:  key
                    args: $utils.stringify(args)
                  }
                })

              ## push the subject into the args
              args = prepareSubject(firstCall, args)

              subject = args[0]

              ret = orig.apply(@, args)

              return ret ? subject

      cy[key] = (args...) ->
        if not state("runnable")
          $utils.throwErrByPath("miscellaneous.outside_test")

        ## this is the first call on cypress
        ## so create a new chainer instance
        chain = $Chainer.create(cy, key, args)

        ## store the chain so we can access it later
        state("chain", chain)

        return chain

      ## create a property of this function
      ## which can be invoked immediately
      ## without being enqueued
      cy[key].immediately = (args...) ->
        ## TODO: instead of wrapping this maybe
        ## we just invoke the fn directly here?
        wrap().apply(cy, args)

      ## add this function to our chainer class
      $Chainer.inject key, (chainerId, firstCall, args) ->
        cy.enqueue(key, wrap(firstCall), args, type, chainerId)

    setRunnable: (runnable, hookName) ->
      if _.isFinite(timeout = config("defaultCommandTimeout"))
        runnable.timeout(timeout)

      state("hookName", hookName)

      ## we store runnable as a property because
      ## we can't allow it to be reset with props
      ## since it is long lived (page events continue)
      ## after the tests have finished
      state("runnable", runnable)

    checkForEndedEarly: ->
      ## if our index is above 0 but is below the commands.length
      ## then we know we've ended early due to a done() and
      ## we should throw a very specific error message
      index = state("index")
      if index > 0 and index < queue.length
        errors.endedEarlyErr(index, queue)
  }

  _.each privateProps, (obj, key) =>
    Object.defineProperty(cy, key, {
      get: ->
        $utils.throwErrByPath("miscellaneous.private_property", {
          args: obj
        })
    })

  ## make cy global in the specWindow
  specWindow.cy = cy

  return cy

module.exports = {
  create
}
