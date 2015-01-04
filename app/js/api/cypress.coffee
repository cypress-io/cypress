## look at https://github.com/angular/angular.js/blob/master/src/ngScenario/browserTrigger.js
## for some references on creating simulated events

## make this a global to allow attaching / overriding
window.Cypress = do ($, _, Backbone) ->

  class Cypress
    highlightAttr: "data-cypress-el"
    queue: []
    sync: {}

    constructor: (@options = {}) ->

    initialize: ->
      Cypress.trigger "initialize"

      @defaults()

      _.defaults @options,
        commandTimeout: 2000
        delay: 0 ## whether there is a delay in between commands

    defaults: ->
      @props = {}

      Cypress.trigger "defaults"

      return @

    prop: (key, val) ->
      if _.isUndefined(val)
        @props[key]
      else
        @props[key] = val

    ensureDom: (subject, method) ->
      subject ?= @_subject()

      method ?= @prop("current").name

      ## think about dropping the 'method' part
      ## and adding exactly what the subject is
      ## if its an object or array, just say Object or Array
      ## but if its a primitive, just print out its value like
      ## true, false, 0, 1, 3, "foo", "bar"
      if not (subject and subject.get and _.isElement(subject.get(0)))
        console.warn("Subject is currently: ", subject)
        @throwErr("Cannot call .#{method}() on a non-DOM subject!")

      return subject

    ## global options applicable to all cy instances
    ## and restores
    options: (options = {}) ->

    isReady: (bool = true, event) ->
      if bool
        ## we set recentlyReady to true
        ## so we dont accidently set isReady
        ## back to false in between commands
        ## which are async
        @log "Ready due to: #{event}", "success"
        @prop("recentlyReady", true)

        if ready = @prop("ready")
          ready.promise.then =>
            @trigger "ready", true

            ## prevent accidential chaining
            ## .this after isReady resolves
            return null

        return ready?.resolve()

      ## if we already have a ready object and
      ## its state is pending just leave it be
      ## and dont touch it
      return if @prop("ready") and @prop("ready").promise.isPending()

      ## else set it to a deferred object
      @log "No longer ready due to: #{event}", "warning"

      @trigger "ready", false

      @prop "ready", Promise.pending()

    run: ->
      ## start at 0 index if we dont have one
      index = @prop("index") ? @prop("index", 0)

      queue = @queue[index]

      runnable = @prop("runnable")

      @group(runnable.group)

      ## if we're at the very end
      if not queue

        ## trigger end event
        @trigger("end")

        ## and we should have a next property which
        ## holds mocha's .then callback fn
        if next = @prop("next")
          next()
          @prop("next", null)

        return @

      ## store the previous timeout
      prevTimeout = runnable.timeout()

      ## prior to running set the runnables
      ## timeout to 30s. this is useful
      ## because we may have to wait to begin
      ## running such as the case in angular
      runnable.timeout(30000)

      run = =>
        ## bail if we've changed runnables by the
        ## time this resolves
        return if @prop("runnable") isnt runnable

        ## reset the timeout to what it used to be
        runnable.timeout(prevTimeout)

        @trigger "command:start", queue

        promise = @set(queue, @queue[index - 1], @queue[index + 1]).then =>
          ## each successful command invocation should
          ## always reset the timeout for the current runnable
          ## unless we already have a state.  if we have a state
          ## then we're already done and resetting would cause a
          ## timeout to happen in a few seconds
          runnable.resetTimeout() if not runnable.state

          ## mutate index by incrementing it
          ## this allows us to keep the proper index
          ## in between different hooks like before + beforeEach
          ## else run will be called again and index would start
          ## over at 0
          @prop("index", index += 1)

          @trigger "command:end", queue

          @defer @run

          ## must have this empty return here else we end up creating
          ## additional .then callbacks due to bluebird chaining
          return null

        .catch Promise.CancellationError, (err) =>
          @cancel(err)

          ## need to signify we're done our promise here
          ## so we cannot chain off of it, or have bluebird
          ## accidentally chain off of the return value
          return err

        .catch (err) =>
          @fail(err)

          return err
        ## signify we are at the end of the chain and do not
        ## continue chaining anymore
        # promise.done()

        @prop "promise", promise

        @trigger "set", queue

      ## automatically defer running each command in succession
      ## so each command is async
      @defer ->
        angular = @sync.window().angular

        if angular and angular.getTestability
          root = @$("[ng-app]").get(0)
          run = _.bind(run, @)
          angular.getTestability(root).whenStable(run)
        else
          run()

    clearTimeout: (id) ->
      clearImmediate(id) if id
      return @

    # get: (name) ->
    #   alias = @aliases[name]
    #   return alias unless _.isUndefined(alias)

    #   ## instead of returning a function here and setting this
    #   ## invoke property, we should just convert this to a deferred
    #   ## and then during the actual save we should find out anystanding
    #   ## 'get' promises that match the name and then resolve them.
    #   ## the problem with this is we still need to run this anonymous
    #   ## function to check to see if we have an alias by that name
    #   ## else our alias will never resolve (if save is never called
    #   ## by this name argument)
    #   fn = =>
    #     @aliases[name] or
    #       @throwErr("No alias was found by the name: #{name}")
    #   fn._invokeImmediately = true
    #   fn

    _storeHref: ->
      ## we are using href and stripping out the hash because
      ## hash changes do not cause full page refreshes
      ## however, i believe this will completely barf when
      ## JS users are using pushstate since there is no hash
      ## TODO. need to listen to pushstate events here which
      ## will act as the isReady() the same way load events do
      location = @sync.location()
      @prop "href", location.href.replace(location.hash, "")

    _hrefChanged: ->
      location = @sync.location()
      @prop("href") isnt location.href.replace(location.hash, "")

    _subject: ->
      subject = @prop("subject")

      if not subject?
        name = @prop("current").name
        @throwErr("Subject is #{subject}!  You cannot call .#{name}() without a subject.")

      return subject

    _timeout: (ms, delta = false) ->
      runnable = @prop("runnable")
      @throwErr("Cannot call .timeout() without a currently running test!") if not runnable
      if ms
        ## if delta is true then we add (or subtract) from the
        ## runnables current timeout instead of blanketingly setting it
        ms = if delta then runnable.timeout() + ms else ms
        runnable.timeout(ms)
        return @
      else
        runnable.timeout()

    set: (obj, prev, next) ->
      obj.prev = prev
      obj.next = next

      @prop("current", obj)

      @invoke2(obj)

    invoke2: (obj, args...) ->
      promise = if @prop("ready")
        Promise.resolve @prop("ready").promise
      else
        Promise.resolve()

      promise.cancellable().then =>
        @trigger "invoke:start", obj

        @log obj

        ## store our current href before invoking the next command
        @_storeHref()

        @prop "nestedIndex", @prop("index")

        ## allow the invoked arguments to be overridden by
        ## passing them in explicitly
        ## else just use the arguments the command was
        ## originally created with
        if args.length then args else obj.args

      ## allow promises to be used in the arguments
      ## and wait until they're all resolved
      .all(args)

      .then (args) =>
        ## if the first argument is a function and it has an _invokeImmediately
        ## property that means we are supposed to immediately invoke
        ## it and use its return value as the argument to our
        ## current command object
        if _.isFunction(args[0]) and args[0]._invokeImmediately
          args[0] = args[0].call(@)

        ## we cannot pass our cypress instance back into
        ## bluebird else it will create a thenable which
        ## is never resolved
        ret = obj.fn.apply(obj.ctx, args)
        if ret is @ then null else ret

      .then (subject, options = {}) =>
        obj.subject = subject

        ## trigger an event here so we know our
        ## command has been successfully applied
        ## and we've potentially altered the subject
        @trigger "invoke:subject", subject, obj

        # if we havent become recently ready and unless we've
        # explicitly disabled checking for location changes
        # and if our href has changed in between running the commands then
        # then we're no longer ready to proceed with the next command
        if @prop("recentlyReady") is null
          @isReady(false, "href changed") if @_hrefChanged()

        ## reset the nestedIndex back to null
        @prop("nestedIndex", null)

        ## also reset recentlyReady back to null
        @prop("recentlyReady", null)

        ## return the prop subject
        @prop("subject", subject)

        @trigger "invoke:end", obj

        return subject

    throwErr: (err) ->
      if _.isString(err)
        err = new Error(err)

      throw err

    cancel: (err) ->
      obj = @prop("current")
      @log {name: "Cancelled: #{obj.name}", args: err.message}, "danger"
      @trigger "cancel", obj

    fail: (err) ->
      obj = @prop("current")
      @log {name: "Failed: #{obj.name}", args: err.message}, "danger"
      @runner.uncaught(err)
      @trigger "fail", err

    _retry: (fn, options) ->
      ## remove the runnables timeout because we are now in retry
      ## mode and should be handling timing out ourselves and dont
      ## want to accidentally time out via mocha
      if not options.runnableTimeout
        prevTimeout = @_timeout()
        @_timeout(1e9)

      _.defaults options,
        runnableTimeout: prevTimeout
        start: new Date
        interval: 50

      ## we always want to make sure we timeout before our runnable does
      ## so take its current timeout, subtract the total time its already
      ## been running
      options.timeout ?= options.runnableTimeout - (new Date - @prop("runnable").startedAt)

      ## we calculate the total time we've been retrying
      ## so we dont exceed the runnables timeout
      options.total = total = (new Date - options.start)

      ## if our total exceeds the timeout OR the total + the interval
      ## exceed the runnables timeout, then bail
      @log "Retrying after: #{options.interval}ms. Total: #{total}, Timeout At: #{options.timeout}, RunnableTimeout: #{options.runnableTimeout}", "warning"

      if total >= options.timeout or (total + options.interval >= options.runnableTimeout)
        @throwErr "Timed out retrying. " + options.error ? "The last command was: " + @prop("current").name

      Promise.delay(options.interval).cancellable().then =>
        @trigger "retry", options

        @log {name: "retry", args: fn}

        ## invoke the passed in retry fn
        fn.call(@)

    ## recursively inserts previous objects
    ## up until it finds a parent command
    _replayFrom: (current, memo = []) ->
      insert = =>
        _.each memo, (obj) =>
          @_insert(obj)

      if current
        memo.unshift current

        if current.type is "parent"
          insert()
        else
          @_replayFrom current.prev, memo
      else
        insert()

    _contains: (el) ->
      $.contains(@sync.document().get(0), el)

    ## the command method is useful for synchronously
    ## calling another command but wrapping it in a
    ## promise
    command: (name, args...) ->
      Promise.resolve @sync[name].apply(@, args)

    createSnapshot: ($el) ->
      ## create a unique selector for this el
      $el.attr(@highlightAttr, true) if $el

      ## clone the body and strip out any script tags
      body = @$("body").clone()
      body.find("script").remove()

      ## here we need to figure out if we're in a remote manual environment
      ## if so we need to stringify the DOM:
      ## 1. grab all inputs / textareas / options and set their value on the element
      ## 2. convert DOM to string: body.prop("outerHTML")
      ## 3. send this string via websocket to our server
      ## 4. server rebroadcasts this to our client and its stored as a property

      ## its also possible for us to store the DOM string completely on the server
      ## without ever sending it back to the browser (until its requests).
      ## we could just store it in memory and wipe it out intelligently.
      ## this would also prevent having to store the DOM structure on the client,
      ## which would reduce memory, and some CPU operations

      ## now remove it after we clone
      $el.removeAttr(@highlightAttr) if $el

      return body

    defer: (fn) ->
      @clearTimeout(@prop("timerId"))
      # @prop "timerId", _.defer _.bind(fn, @)
      @prop "timerId", setImmediate _.bind(fn, @)

    hook: (name) ->
      return if not @prop("inspect")

      return console.groupEnd() if not name

      console.group(name)

    group: (name) ->
      ## bail if we're not in inspect mode
      return if not @prop("inspect") or _.isUndefined(name)

      ## end the group if name is explicitly false
      return console.groupEnd() if name is false

      ## bail if we already have a _group set
      return if @_group

      ## set the _group
      @_group = name

      ## start a group by the name
      console.group(name)

    enqueue: (key, fn, args, type) ->
      @clearTimeout @prop("runId")

      obj = {name: key, ctx: @, fn: fn, args: args, type: type}

      @trigger "enqueue", obj

      @_insert(obj)

    _insert: (obj) ->
      ## if we have a nestedIndex it means we're processing
      ## nested commands and need to splice them into the
      ## index past the current index as opposed to
      ## pushing them to the end we also dont want to
      ## reset the run defer because splicing means we're
      ## already in a run loop and dont want to create another!
      ## we also reset the .next property to properly reference
      ## our new obj
      if nestedIndex = @prop("nestedIndex")
        @queue[nestedIndex].next = obj
        @queue.splice (@prop("nestedIndex", nestedIndex += 1)), 0, obj
      else
        @queue.push(obj)
        @prop "runId", @defer(@run)

      return @

    $: (selector, context) ->
      context ?= @sync.document()
      new $.fn.init selector, context

    _: _

    @extend = (key, fn) ->
      ## allow object signature
      if _.isObject(key)
        _.each key, (fn, name) =>
          @extend(name, fn)
        return @

      Cypress.prototype[key] = fn
      return @

    @addChildCommand = (key, fn) ->
      @add(key, fn, "child")

    @addParentCommand = (key, fn) ->
      @add(key, fn, "parent")

    @addDualCommand = (key, fn) ->
      @add(key, fn, "dual")

    @add = (key, fn, type) ->
      throw new Error("Cypress.add(key, fn, type) must include a type!") if not type

      ## allow object signature
      if _.isObject(key)
        _.each key, (fn, name) =>
          @add(name, fn, type)
        return @

      ## need to pass the options into inject here
      @inject(key, fn, type)
      return @

    @inject = (key, fn, type) ->
      prepareSubject = (subject, args) ->
        ## if we already have a subject
        ## then replace the first argument
        ## with the new subject.
        ## i think this is now deprecated
        ## based on the way args are passed
        ## it will always be a new array of arguments
        ## and therefore we dont have to deal with
        ## the edge case of mutating args with subject
        ## later.  however theres not enough tests
        ## around this so we'll leave it in place for now.
        if args.hasSubject
          args.splice(0, 1, subject)
        else
          args.unshift(subject)

        args.hasSubject or= true
        args

      wrap = (fn) ->
        switch type
          when "parent"
            return fn

          when "dual"
            _.wrap fn, (orig, args...) ->
              subject = @prop("subject")
              args = prepareSubject(subject, args)

              return orig.apply(@, args)

          when "child"
            _.wrap fn, (orig, args...) ->
              @throwErr("cy.#{key}() is a child command which operates on an existing subject.  Child commands must be called after a parent command!") if not @prop("current").prev

              ## push the subject into the args
              subject = @prop("subject")
              args = prepareSubject(subject, args)

              ret = orig.apply(@, args)
              return ret ? subject

      Cypress.prototype[key] = (args...) ->
        @enqueue(key, wrap(fn), args, type)

      ## reference a synchronous version of this function
      Cypress.prototype.sync[key] = (args...) ->
        wrap(fn).apply(Cypress.cy, args)

    @abort = ->
      Cypress.trigger "abort"

      @cy.$remoteIframe?.off("submit unload load")
      @cy.isReady(false, "abort")
      @cy.prop("runnable")?.clearTimeout()

      promise = @cy.prop("promise")
      promise?.cancel()

      Promise.resolve(promise).then => @restore()

    ## restores cypress after each test run by
    ## removing the queue from the proto and
    ## removing additional own instance properties
    @restore = ->
      @cy.clearTimeout @cy.prop("runId")
      @cy.clearTimeout @cy.prop("timerId")

      ## reset the queue to an empty array
      Cypress.prototype.queue = []

      ## remove any outstanding groups
      ## for any open hooks and runnables
      @cy.group(false)
      @cy.group(false)

      Cypress.trigger "after:run"

      ## remove any event listeners
      @cy.off()
      @cy.stopListening()

      ## removes any registered props from the
      ## instance
      @cy.defaults()

      return @

    ## removes remoteIframe, contentWindow
    ## from the cypress instance
    @stop = ->
      @abort().then =>
        Cypress.trigger "destroy"

        _.extend @cy,
          runner:        null
          remoteIframe:  null
          config:        null

        window.cy = @cy = null

    ## sets the runnable onto the cy instance
    @set = (runnable, hook) ->
      runnable.startedAt = new Date
      @cy.hook(hook)
      @cy.prop("runnable", runnable)

    ## patches the cypress instance with contentWindow
    ## remoteIframe and config
    ## this should be moved to an instance method and
    @setup = (runner, $remoteIframe, config) ->
      ## we listen for the unload + submit events on
      ## the window, because when we receive them we
      ## tell cy its not ready and this prevents any
      ## additional invocations of any commands until
      ## its ready again (which happens after the load
      ## event)
      bindEvents = ->
        win = $($remoteIframe.prop("contentWindow"))
        win.off("submit").on "submit", (e) =>
          ## if we've prevented the default submit action
          ## without stopping propagation, we will still
          ## receive this event even though the form
          ## did not submit
          return if e.isDefaultPrevented()

          @cy.isReady(false, "submit")

        win.off("unload").on "unload", =>
          ## put cy in a waiting state now that
          ## we've unloaded
          @cy.isReady(false, "unload")

        win.get(0).confirm = (message) ->
          console.info "Confirming 'true' to: ", message
          return true

      $remoteIframe.on "load", =>
        bindEvents()
        @cy.isReady(true, "load")

      _.extend @cy,
        runner:        runner
        $remoteIframe: $remoteIframe
        config:        config

      Cypress.trigger "before:run"

      ## anytime setup is called we immediately
      ## set cy to be ready to invoke commands
      ## this prevents a bug where we go into not
      ## ready mode due to the unload event when
      ## our tests are re-run
      @cy.isReady(true, "setup")

    @start = ->
      window.cy = @cy = new Cypress

      @cy.initialize()

      ## return the class as opposed to the
      ## instance so we dont have to worry about
      ## accidentally chaining the 'then' method
      ## during tests
      return @

    @on = (event, fn) ->
      return if not _.isFunction(fn)

      @_events ?= []
      @_events.push {name: event, fn: fn}

    @trigger = (event, args...) ->
      return if not @_events

      _.chain(@_events)
        .where({name: event})
          .each (event) =>
            event.fn.apply(@cy, args)

      return @

    @log = (obj = {}) ->
      ## throw an error here?
      current = @cy.prop("current")

      return if not (@cy and current)

      _.defaults obj, _(current).pick("name", "type")

      _.defaults obj,
        snapshot: true
        testId:   @cy.prop("runnable").cid
        message:  _(current.args).invoke("toString").join(", ")
        _args:    current.args
        onRender: ->
        onConsole: ->
          "Command":  current.name
          "Returned": current.subject

      if obj.snapshot
        obj._snapshot = @cy.createSnapshot(obj.$el)

      if obj.$el
        obj.numElements = obj.$el.length

      @trigger "log", obj

    _.extend Cypress.prototype, Backbone.Events

  return Cypress
