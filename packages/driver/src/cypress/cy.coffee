require("setimmediate")

_ = require("lodash")
$ = require("jquery")
Backbone = require("backbone")
Promise = require("bluebird")

# $Cypress = require("../cypress")
# $Chainer = require("./chainer")
$utils = require("./utils")
$Agents = require("../cy/agents")
$Chainer = require("./chainer")
$CommandQueue = require("./command_queue")
$SetterGetter = require("./setter_getter")

crossOriginScriptRe = /^script error/i

privateProps = {
  props:    { name: "state",        url: true }
  privates: { name: "state", url: false }
}

create = (specWindow, ee, config) ->
  state = $SetterGetter.create({})

  agents = $Agents.create()

  commandFns = {}
  # commandFnsBackup = {}

  cy = {
    id: _.uniqueId("cy")

    state

    ## command queue instance
    queue: $CommandQueue.create()

    ## agent sync methods
    spy: agents.spy
    stub: agents.stub
    agents: agents.agents

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

  }

  _.each privateProps, (obj, key) =>
    Object.defineProperty(cy, key, {
      get: ->
        $utils.throwErrByPath("miscellaneous.private_property", {
          args: obj
        })
    })

  specWindow.cy = cy

  return cy

module.exports = {
  create
}
