require("setimmediate")

_ = require("lodash")
$ = require("jquery")
Backbone = require("backbone")
Promise = require("bluebird")

utils = require("./utils")
$Cypress = require("../cypress")
$Chainer = require("./chainer")
$CommandQueue = require("./command_queue")

crossOriginScriptRe = /^script error/i

privateProps = {
  props:    { name: "state",        url: true }
  privates: { name: "privateState", url: false }
}

class $Cy
  constructor: (@Cypress, specWindow) ->
    @id = _.uniqueId("cy")

    @defaults()
    @listeners()

    @privates = {}
    @_privateState = {}

    @_commandFns       = {}
    @_commandFnsBackup = {}

    @queue = $CommandQueue.create()

    _.each privateProps, (obj, key) =>
      Object.defineProperty(@, key, {
        get: ->
          utils.throwErrByPath("miscellaneous.private_property", {
            args: obj
          })
      })

    specWindow.cy = @

  onCommand: (key, fn, type, enforceDom) ->
    utils.throwErrByPath("add.type_missing") if not type

    ## allow object signature
    if _.isObject(key)
      _.each key, (fn, key) =>
        @onCommand(key, fn, type, enforceDom)
      return @

    ## need to pass the options into inject here
    @add(key, fn, type, enforceDom)

  onOverwrite: (key, fn) ->
    ## grab the original function if its been backed up
    ## or grab it from the commandState
    original = @_commandFnsBackup[key] or @_commandFns[key]

    if not original
      utils.throwErrByPath("miscellaneous.invalid_overwrite", {
        args: {
          name: key
        }
      })

    ## store the backup again now
    @_commandFnsBackup[key] = original

    @_commandFns[key] = _.wrap original, ->
      fn.apply(@, arguments)

  add: (key, fn, type, enforceDom) ->
    @_commandFns[key] = _.bind(fn, @)

    prepareSubject = (firstCall, args) =>
      ## if this is the very first call
      ## on the chainer then make the first
      ## argument undefined (we have no subject)
      if firstCall
        @_removeSubject()

      subject = @state("subject")

      if enforceDom
        @ensureDom(subject, key)

      args.unshift(subject)

      @trigger("next:subject:prepared", subject, args)

      args

    wrap = (firstCall) =>
      fn = @_commandFns[key]
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
              utils.throwErrByPath("miscellaneous.invoking_child_without_parent", {
                args: {
                  cmd:  key
                  args: utils.stringify(args)
                }
              })

            ## push the subject into the args
            args = prepareSubject(firstCall, args)

            subject = args[0]

            ret = orig.apply(@, args)

            return ret ? subject

    @[key] = (args...) ->
      if not @privateState("runnable")
        utils.throwErrByPath("miscellaneous.outside_test")

      ## this is the first call on cypress
      ## so create a new chainer instance
      chain = $Chainer.create(@, key, args)

      ## store the chain so we can access it later
      @state("chain", chain)

      return chain

    ## create a property of this function
    ## which can be invoked immediately
    ## without being enqueued
    @[key].immediately = (args...) ->
      ## TODO: instead of wrapping this maybe
      ## we just invoke the fn directly here?
      wrap().apply(@, args)

    ## add this function to our chainer class
    $Chainer.inject key, (chainerId, firstCall, args) ->
      @enqueue(key, wrap(firstCall), args, type, chainerId)

  initialize: (obj) ->
    @defaults()

    {$remoteIframe} = obj

    @privateState("$remoteIframe", $remoteIframe)

    @_setRemoteIframeProps($remoteIframe)

    $remoteIframe.on "load", =>
      ## if setting iframe props failed
      ## dont do anything else because
      ## we are in trouble
      if @_setWindowDocumentProps($remoteIframe.prop("contentWindow"))

        @urlChanged(null, {log: false})
        @pageLoading(false)

        ## we reapply window listeners on load even though we
        ## applied them already during onBeforeLoad. the reason
        ## is that after load javascript has finished being evaluated
        ## and we may need to override things like alert + confirm again
        @bindWindowListeners @privateState("window")
        @isReady(true, "load")
        @Cypress.trigger("load")

    ## anytime initialize is called we immediately
    ## set cy to be ready to invoke commands
    ## this prevents a bug where we go into not
    ## ready mode due to the unload event when
    ## our tests are re-run
    @isReady(true, "initialize")

  defaults: ->
    @_state = {}

    return @

  silenceConsole: (contentWindow) ->
    if c = contentWindow.console
      c.log = ->
      c.warn = ->
      c.info = ->

  listeners: ->
    @listenTo @Cypress, "initialize", (obj) =>
      @initialize(obj)

    ## why arent we listening to "defaults" here?
    ## instead we are manually hard coding them
    @listenTo @Cypress, "stop",       => @stop()
    @listenTo @Cypress, "restore",    => @restore()
    @listenTo @Cypress, "abort",      => @abort()
    @listenTo @Cypress, "test:after:hooks", (test) => @checkTestErr(test)

  abort: ->
    @offWindowListeners()
    @offIframeListeners(@privateState("$remoteIframe"))
    @isReady(false, "abort")
    @privateState("runnable")?.clearTimeout()

    promise = @state("promise")
    promise?.cancel()

    @_aborted = true

    ## ready can potentially be cancellable
    ## so we need cancel it (if it is)
    ready = @state("ready")
    if ready and readyPromise = ready.promise
      if readyPromise.isCancellable()
        readyPromise.cancel()

    Promise.resolve(promise)

  stop: ->
    delete window.cy

    @stopListening()

    @offWindowListeners()
    @offIframeListeners(@privateState("$remoteIframe"))

    @_privateState = {}

    @Cypress.cy = null

  restore: ->
    @clearTimeout @state("timerId")

    ## reset the commands to an empty array
    ## by mutating it. we do this because
    ## commands is the context in promises
    ## which ends up holding a reference
    ## to the old array and keeps objects
    ## in memory longer than we want them
    @queue.reset()

    ## remove any event listeners
    @off()

    ## removes any registered props from the
    ## instance
    @defaults()

    return @

  ## global options applicable to all cy instances
  ## and restores
  options: (options = {}) ->

  checkForEndedEarly: ->
    ## if our index is above 0 but is below the commands.length
    ## then we know we've ended early due to a done() and
    ## we should throw a very specific error message
    index = @state("index")
    if index > 0 and index < @queue.length
      @endedEarlyErr(index)

  _removeSubject: ->
    @state("subject", undefined)

    return @

  _eventHasReturnValue: (e) ->
    val = e.originalEvent.returnValue

    ## return false if val is an empty string
    ## of if its undinefed
    return false if val is "" or _.isUndefined(val)

    ## else return true
    return true

  isReady: (bool = true, event) ->
    if bool
      ## we set recentlyReady to true
      ## so we dont accidently set isReady
      ## back to false in between commands
      ## which are async
      @state("recentlyReady", true)

      if ready = @state("ready")
        if ready.promise.isPending()
          ready.promise.then =>
            @trigger "ready", true

            ## prevent accidential chaining
            ## .this after isReady resolves
            return null

      return ready?.resolve()

    ## if we already have a ready object and
    ## its state is pending just leave it be
    ## and dont touch it
    return if @state("ready") and @state("ready").promise.isPending()

    ## else set it to a deferred object
    @trigger "ready", false

    @state "ready", Promise.pending()

  run: ->
    ## start at 0 index if we dont have one
    index = @state("index") ? @state("index", 0)

    command = @queue.at(index)

    ## if the command should be skipped
    ## just bail and increment index
    ## and set the subject
    ## TODO DRY THIS LOGIC UP
    if command and command.get("skip")
      ## must set prev + next since other
      ## operations depend on this state being correct
      command.set({prev: @queue.at(index - 1), next: @queue.at(index + 1)})
      @state("index", index + 1)
      @state("subject", command.get("subject"))
      return @run()

    runnable = @privateState("runnable")

    ## if we're at the very end
    if not command

      ## trigger end event
      @trigger("end")

      ## and we should have a next property which
      ## holds mocha's .then callback fn
      if next = @state("next")
        next()
        @state("next", null)

      return @

    ## store the previous timeout
    prevTimeout = @_timeout()

    ## prior to running set the runnables
    ## timeout to 30s. this is useful
    ## because we may have to wait to begin
    ## running such as the case in angular
    @_timeout(30000)

    run = =>
      ## bail if we've been told to abort in case
      ## an old command continues to run after
      if @_aborted
        return

      ## bail if we've changed runnables by the
      ## time this resolves
      return if @privateState("runnable") isnt runnable

      ## reset the timeout to what it used to be
      @_timeout(prevTimeout)

      @trigger "command:start", command

      promise = @set(command)
      .then =>
        ## each successful command invocation should
        ## always reset the timeout for the current runnable
        ## unless it already has a state.  if it has a state
        ## and we reset the timeout again, it will always
        ## cause a timeout later no matter what.  by this time
        ## mocha expects the test to be done
        @_timeout(prevTimeout) if not runnable.state

        ## mutate index by incrementing it
        ## this allows us to keep the proper index
        ## in between different hooks like before + beforeEach
        ## else run will be called again and index would start
        ## over at 0
        @state("index", index += 1)

        @trigger "command:end", command

        if fn = @state("onPaused")
          fn.call(@, @run)
        else
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
        @onFail(err)

      ## signify we are at the end of the chain and do not
      ## continue chaining anymore
      # promise.done()

      @state "promise", promise

      @trigger "set", command

    ## automatically defer running each command in succession
    ## so each command is async
    @defer(run)

  onUncaughtException: (msg, source, lineno, colno, err) ->
    current = @state("current")

    ## reset the msg on a cross origin script error
    ## since no details are accessible
    if crossOriginScriptRe.test(msg)
      msg = utils.errMessageByPath("uncaught.cross_origin_script")

    createErrFromMsg = ->
      new Error utils.errMessageByPath("uncaught.error", { msg, source, lineno })

    ## if we have the 5th argument it means we're in a super
    ## modern browser making this super simple to work with.
    err ?= createErrFromMsg()

    err.name = "Uncaught " + err.name

    err.onFail = ->
      if log = current and current.getLastLog()
        log.error(err)

    @onFail(err)
    ## TODO: if this is a hook then we know mocha
    ## will abort everything on uncaught exceptions
    ## so we need to explain that to the user

    ## per the onerror docs
    ## https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
    ## When the function returns true, this prevents the firing of the default event handler.
    return true

  onFail: (err) ->
    @fail(err)

    ## reset the nestedIndex back to null
    @state("nestedIndex", null)

    ## also reset recentlyReady back to null
    @state("recentlyReady", null)

    ## and forcibly move the index needle to the
    ## end in case we have after / afterEach hooks
    ## which need to run
    @state("index", @queue.length)

    return err

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
  #       ## TODO: update this to utils.throwErrByPath if this code gets uncommented
  #       utils.throwErr("No alias was found by the name: #{name}")
  #   fn._invokeImmediately = true
  #   fn

  set: (command) ->
    @state("current", command)

    promise = if @state("ready")
      Promise.resolve @state("ready").promise
    else
      Promise.resolve()

    promise.cancellable().then =>
      @trigger "invoke:start", command

      @state "nestedIndex", @state("index")

      command.get("args")

    ## allow promises to be used in the arguments
    ## and wait until they're all resolved
    .all()

    .then (args) =>
      ## if the first argument is a function and it has an _invokeImmediately
      ## property that means we are supposed to immediately invoke
      ## it and use its return value as the argument to our
      ## current command object
      if _.isFunction(args[0]) and args[0]._invokeImmediately
        args[0] = args[0].call(@)

      ## rewrap all functions by checking
      ## the chainer id before running its fn
      @_checkForNewChain command.get("chainerId")

      ## run the command's fn
      ret = command.get("fn").apply(command.get("ctx"), args)

      ## allow us to immediately tap into
      ## return value of our command
      @trigger "command:returned:value", command, ret

      ## we cannot pass our cypress instance or our chainer
      ## back into bluebird else it will create a thenable
      ## which is never resolved
      if @isCy(ret) then null else ret

    .then (subject) =>
      ## if ret is a DOM element and its not an instance of our jQuery
      if subject and utils.hasElement(subject) and not utils.isInstanceOf(subject, $)
        ## set it back to our own jquery object
        ## to prevent it from being passed downstream
        subject = @$$(subject)

      command.set({subject: subject})

      ## end / snapshot our logs
      ## if they need it
      command.finishLogs()

      ## trigger an event here so we know our
      ## command has been successfully applied
      ## and we've potentially altered the subject
      @trigger "invoke:subject", subject, command

      ## reset the nestedIndex back to null
      @state("nestedIndex", null)

      ## also reset recentlyReady back to null
      @state("recentlyReady", null)

      @state("subject", subject)

      @trigger "invoke:end", command

      ## we must look back at the ready property
      ## at the end of resolving our command because
      ## its possible it has become "unready" such
      ## as beforeunload firing. in that case before
      ## resolving we need to ensure it finishes first
      if ready = @state("ready")
        if ready.promise.isPending()
          return ready.promise
          .then =>
            ## if we became unready when a command
            ## was being resolved then we need to
            ## null out the subject here and additionally
            ## check for child commands and error if found
            ## only if this is a DOM subject
            ##
            ## since we delay the resolving
            ## of our command subjects, they may have
            ## caused a page load / form submit so
            ## if our subject has been nulled we need
            ## to keep it nulled
            if @state("pageChangeEvent")
              @state("pageChangeEvent", false)

              ## if we currently have a DOM subject and its not longer
              ## in the document then we need to null out our subject because
              ## a page change has happened and we want to discontinue chaining
              if utils.hasElement(subject) and not @_contains(subject)
                ## additionally check for errors here
                ## so we can notify the user if they're trying
                ## to chain child commands off of this null subject
                @_removeSubject()

              return @state("subject")
          .catch (err) ->

      return @state("subject")

  cancel: (err) ->
    @trigger "cancel", @state("current")

  enqueue: (key, fn, args, type, chainerId) ->
    @clearTimeout @state("timerId")

    obj = {name: key, ctx: @, fn: fn, args: args, type: type, chainerId: chainerId}

    @trigger "enqueue", obj
    @Cypress.trigger "enqueue", obj

    @insertCommand(obj)

  insertCommand: (obj) ->
    ## if we have a nestedIndex it means we're processing
    ## nested commands and need to splice them into the
    ## index past the current index as opposed to
    ## pushing them to the end we also dont want to
    ## reset the run defer because splicing means we're
    ## already in a run loop and dont want to create another!
    ## we also reset the .next property to properly reference
    ## our new obj

    ## we had a bug that would bomb on custom commands when it was the
    ## first command. this was due to nestedIndex being undefined at that
    ## time. so we have to ensure to check that its any kind of number (even 0)
    ## in order to know to splice into the existing array.
    nestedIndex = @state("nestedIndex")

    ## if this is a number then we know
    ## we're about to splice this into our commands
    ## and need to reset next + increment the index
    if _.isNumber(nestedIndex)
      @state("nestedIndex", nestedIndex += 1)

    ## we look at whether or not nestedIndex is a number, because if it
    ## is then we need to splice inside of our commands, else just push
    ## it onto the end of the queu
    index = if _.isNumber(nestedIndex) then nestedIndex else @queue.length

    @queue.splice(index, 0, obj)

    ## if nestedIndex is either undefined or 0
    ## then we know we're processing regular commands
    ## and not splicing in the middle of our commands
    if not nestedIndex
      @defer(@run)

    return @

  _contains: ($el) ->
    doc = @privateState("document")

    contains = (el) ->
      $.contains(doc, el)

    ## either see if the raw element itself
    ## is contained in the document
    if _.isElement($el)
      contains($el)
    else
      return false if $el.length is 0

      ## or all the elements in the collection
      _.every $el.toArray(), contains

  _checkForNewChain: (chainerId) ->
    ## dont do anything if this isnt even defined
    return if _.isUndefined(chainerId)

    @state("chainerId", chainerId)

    # ## if we dont have a current chainerId
    # ## then set one
    # if not id = @state("chainerId")
    #   @state("chainerId", chainerId)
    # else
    #   ## else if we have one currently and
    #   ## it doesnt match then nuke our subject
    #   ## since we've started a new chain
    #   ## and reset our chainerId
    #   if id isnt chainerId
    #     @state("chainerId", chainerId)
    #     @_removeSubject()

  ## the command method is useful for immediately
  ## executing another command without enqueing it
  execute: (name, args...) ->
    fn = @[name]

    Promise.resolve(
      fn.immediately.apply(@, args)
    )
    .cancellable()

  defer: (fn) ->
    @clearTimeout(@state("timerId"))

    ## do not queue up any new commands if
    ## we've already been aborted!
    return if @_aborted

    @state "timerId", setImmediate _.bind(fn, @)

  hook: (name) ->
    @privateState("hookName", name)

  ## returns the current chain so you can continue
  ## chaining off of cy without breaking the current
  ## subject
  chain: ->
    utils.throwErrByPath("chain.removed")

  ## figures out if the object is cy like
  isCy: (obj) ->
    utils.isInstanceOf(obj, $Cy) or utils.isInstanceOf(obj, $Chainer)

  _setWindowDocumentProps: (contentWindow) ->
    try
      @privateState("window",   contentWindow)
      @privateState("document", contentWindow.document)
    catch e
      ## catch errors associated to cross origin iframes
      if ready = @state("ready")
        ready.reject(e)
      else
        @fail(e)

      ## indicate setting window/doc props failed
      return false

    return true

  _setRemoteIframeProps: ($iframe) ->
    @privateState("$remoteIframe", $iframe)

    return @_setWindowDocumentProps($iframe.prop("contentWindow"))

  _setRunnable: (runnable, hookName) ->
    runnable.startedAt = new Date

    if _.isFinite(timeout = @Cypress.config("defaultCommandTimeout"))
      runnable.timeout timeout

    @hook(hookName)

    ## we store runnable as a property because
    ## we can't allow it to be reset with props
    ## since it is long lived (page events continue)
    ## after the tests have finished
    @privateState("runnable", runnable)

    return @

  $$: (selector, context) ->
    context ?= @privateState("document")
    new $.fn.init selector, context

  _.extend $Cy.prototype, Backbone.Events

  ["_", "$", "Promise", "Blob", "moment"].forEach (lib) ->
    Object.defineProperty $Cy.prototype, lib, {
      get: ->
        utils.warning("cy.#{lib} is now deprecated.\n\nThis object is now attached to 'Cypress' and not 'cy'.\n\nPlease update and use: Cypress.#{lib}")
        Cypress = @Cypress ? $Cypress.prototype

        if lib is "$"
          ## rebind the context of $
          ## to Cypress else it will be called
          ## with our cy instance
          _.bind(Cypress[lib], Cypress)
        else
          Cypress[lib]
    }

  @extend = (key, val) ->
    if _.isObject(key)
      obj = key
    else
      obj = {}
      obj[key] = val

    _.extend @prototype, obj

  @set = (Cypress, runnable, hookName) ->
    return if not cy = Cypress.cy

    cy._setRunnable(runnable, hookName)

  @create = (Cypress, specWindow) ->
    ## clear out existing listeners
    ## if we already exist!
    if existing = Cypress.cy
      existing.stopListening()

    Cypress.cy = window.cy = new $Cy Cypress, specWindow

require("./cy/aliases")($Cy)
require("./cy/coordinates")($Cy)
require("./cy/ensure")($Cy)
require("./cy/errors")($Cy)
require("./cy/jquery")($Cy)
require("./cy/listeners")($Cy)
require("./cy/props")($Cy)
require("./cy/retry")($Cy)
require("./cy/timeout")($Cy)
require("./cy/url")($Cy)

module.exports = $Cy
