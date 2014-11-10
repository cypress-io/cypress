## make this a global to allow attaching / overriding
## we just need to set the patchEcl properties instead
## of using a partial
window.Cypress = do ($, _) ->

  commands =
    url: (partial) ->
      partial.$remoteIframe.prop("contentWindow").location.toString()

    then: (partial, fn) ->
      ## to figure out whether or not to invoke then we just
      ## see if its the very last command, and its been passed
      ## two arguments, the second of which is called done
      ## if so its been added by mocha
      fn.call(@, @subject)

    find: (partial, selector) ->
      new $.fn.init(selector, partial.$remoteIframe.prop("contentWindow").document)

    type: (partial, sequence, options = {}) ->
      throw new Error("Cannot call .type() without first finding an element") unless @subject and _.isElement(@subject[0])

      _.extend options,
        sequence: sequence

      @subject.simulate "key-sequence", options

    wait: (partial, fn, options = {}) ->
      _.defaults options,
        wait: 50
        df: $.Deferred()

      try
        ## invoke fn and make sure its truthy
        fn.call(@, @subject) and options.df.resolve(@subject)
      catch e
        ## this should prob match the runnable's timeout here
        ## we should reset the runnables timeout every time
        ## a command successfully runs and expose that as
        ## a configuration variable
        ## total timeout vs each individuals command timeout
        return e if options.wait >= 2000

        _.delay =>
          options.wait += 50

          @invoke(@current.prev).done =>
            @invoke(@current, partial, fn, options)
        , 50

      return options.df

  class Cypress
    queue: []

    constructor: (@subject = null, @lastCommand = null) ->

    run: (index = 0) ->
      queue = @queue[index]

      ## if we're at the very end just return our instance
      return @ if not queue

      df = @set queue, @queue[index - 1], @queue[index + 1]
      df.done =>
        @run index + 1

    clearTimeout: (id) ->
      clearTimeout(id) if id
      return @

    set: (obj, prev, next) ->
      obj.prev = prev
      obj.next = next

      @current = obj

      @invoke(obj)

    invoke: (obj, args...) ->
      ## allow the invoked arguments to be overridden by
      ## passing them in explicitly
      ## else just use the arguments the command was
      ## originally created with
      args = if args.length then args else obj.args

      ## if the last argument is a function then instead of
      ## expecting this to be resolved we wait for that function
      ## to be invoked
      $.when(obj.fn.apply(obj.ctx, args)).done (subject) =>
        @subject = subject
      # @trigger "set", subject

    retry: (command, args...) ->

    _should: (df, wait = 10) ->
      df ?= $.Deferred()

      try
        chai.expect(@subject.length).to.eq(1)

        df.resolve(@subject)
      catch e
        ## this should prob match the runnable's timeout here
        ## we should reset the runnables timeout every time
        ## a command successfully runs and expose that as
        ## a configuration variable
        ## total timeout vs each individuals command timeout
        return e if wait >= 2000

        _.delay =>
          wait += 50

          @invoke(@current.prev).done =>
            @_should.call(@, df, wait)
        , 50

      return df

    enqueue: (key, fn, args, obj) ->
      @clearTimeout(@runId)
      args.unshift(obj) if obj
      @queue.push {name: key, ctx: @, fn: fn, args: args}
      @runId = _.defer _(@run).bind(@)
      return @

    ## class method patch
    ## loops through each method and partials
    ## the runnable onto our prototype
    @patch = (obj, fns) ->

      ## we want to be able to pass in specific functions to patch here
      ## else use the default commands object
      _.each (fns or commands), (fn, key) ->
        Cypress.prototype[key] = (args...) ->
          @enqueue(key, fn, args, obj)

      ## whenever we see should that automatically should trigger us
      ## to build up a new chai.Assertion instance and proxy the methods
      ## to it
      # _.each ["should", "have", "be"], (chainable) ->
      #   Object.defineProperty Cypress.prototype, chainable,
      #     get: ->
      #       @enqueue chainable, @["_" + chainable], []

      return @

    ## remove all of the partialed functions from Cypress prototype
    @unpatch = (fns) ->
      fns = _(commands).keys().concat("hook", "sandbox")
      _.each (fns), (fn, obj) ->
        delete Cypress.prototype[fn]

    @hook = (name) ->
      ## simply store the current hook on our prototype
      Cypress.prototype.hook = name

    ## restores the queue after each test run
    @restore = ->
      Cypress.prototype.queue = []

  return Cypress
